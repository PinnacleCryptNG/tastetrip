import "server-only";
import { createHash } from "node:crypto";
import { env } from "../env";
import { kvGet, kvSet } from "../kv";
import { mockQloo } from "./mock";

export type QlooPath = "/search" | "/v2/tags" | "/v2/insights";
export type QlooParams = Record<string, string | number | boolean | undefined | null | string[]>;

export type QlooErrorKind =
  | "config"
  | "city_not_found"
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "rate_limited"
  | "upstream"
  | "empty";

export class QlooError extends Error {
  constructor(
    public kind: QlooErrorKind,
    message: string,
    public status?: number,
  ) {
    super(message);
  }
}

const CACHE_TTL = 60 * 60 * 24;
const RETRY_DELAYS = [500, 1500];

export function buildQuery(params: QlooParams): string {
  const sp = new URLSearchParams();
  for (const key of Object.keys(params).sort()) {
    const v = params[key];
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v)) {
      if (v.length) sp.set(key, v.join(","));
    } else sp.set(key, String(v));
  }
  return sp.toString();
}

function shape(v: unknown, depth = 0): unknown {
  if (depth > 4) return "…";
  if (Array.isArray(v)) return v.length ? [shape(v[0], depth + 1), `(${v.length})`] : [];
  if (v && typeof v === "object")
    return Object.fromEntries(Object.entries(v).slice(0, 30).map(([k, x]) => [k, shape(x, depth + 1)]));
  return typeof v;
}

async function classify(res: Response, path: QlooPath, qs: string): Promise<QlooError> {
  const text = (await res.text().catch(() => "")).slice(0, 500);
  const s = res.status;
  if (s === 400) {
    if (path === "/v2/insights" && /locat|localit/i.test(text) && qs.includes("filter.location.query"))
      return new QlooError("city_not_found", text, s);
    return new QlooError("bad_request", text, s);
  }
  if (s === 401) return new QlooError("unauthorized", text, s);
  if (s === 403) return new QlooError("forbidden", text, s);
  if (s === 429) return new QlooError("rate_limited", text, s);
  return new QlooError("upstream", `Qloo ${s}: ${text}`, s);
}

export async function qlooGet<T = unknown>(
  path: QlooPath,
  params: QlooParams,
): Promise<{ data: T; cached: boolean; url: string }> {
  const qs = buildQuery(params);
  const url = `${path}?${qs}`;
  const cacheKey = `tt:qloo:v1:${createHash("sha256").update(url).digest("hex").slice(0, 40)}`;

  const hit = await kvGet<T>(cacheKey).catch(() => null);
  if (hit) return { data: hit, cached: true, url };

  if (env.qlooMock()) {
    const data = mockQloo(path, params) as T;
    return { data, cached: false, url };
  }

  const key = env.qlooKey();
  if (!key) throw new QlooError("config", "QLOO_API_KEY is not set");

  let lastErr: QlooError | null = null;
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    const t0 = Date.now();
    try {
      const res = await fetch(`${env.qlooBase()}${url}`, {
        headers: { "X-Api-Key": key, Accept: "application/json" },
        signal: AbortSignal.timeout(15000),
        cache: "no-store",
      });
      console.log(`[qloo] GET ${path} ${res.status} ${Date.now() - t0}ms attempt=${attempt}`);
      if (res.ok) {
        const data = (await res.json()) as T;
        if (process.env.QLOO_LOG_SHAPE === "1") console.log(`[qloo] shape ${path}`, JSON.stringify(shape(data)));
        await kvSet(cacheKey, data, CACHE_TTL).catch((e) => console.warn("[qloo] cache write failed", e));
        return { data, cached: false, url };
      }
      lastErr = await classify(res, path, qs);
      if (lastErr.kind !== "rate_limited" && lastErr.kind !== "upstream") throw lastErr;
    } catch (e) {
      if (e instanceof QlooError && e.kind !== "rate_limited" && e.kind !== "upstream") throw e;
      lastErr = e instanceof QlooError ? e : new QlooError("upstream", `Qloo request failed: ${(e as Error).message}`);
    }
    if (attempt < RETRY_DELAYS.length) await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
  }
  throw lastErr ?? new QlooError("upstream", "Qloo request failed");
}

export function friendlyQlooError(e: unknown, city?: string): { msg: string; hint?: string; status: number } {
  if (!(e instanceof QlooError)) return { msg: "Something went wrong while talking to Qloo.", status: 500 };
  switch (e.kind) {
    case "config":
      return { msg: "Qloo isn't configured on this server yet.", hint: "The QLOO_API_KEY environment variable is missing.", status: 503 };
    case "city_not_found":
      return {
        msg: `Qloo couldn't find a city called "${city ?? ""}".`,
        hint: "Try the full name, e.g. \"Lisbon\" or \"Lagos, Nigeria\".",
        status: 400,
      };
    case "bad_request":
      return { msg: "Qloo rejected the request.", hint: "Try fewer or different tastes.", status: 400 };
    case "unauthorized":
      return { msg: "Qloo rejected this server's API key (401).", hint: "Check QLOO_API_KEY and QLOO_BASE_URL.", status: 502 };
    case "forbidden":
      return { msg: "This Qloo key isn't allowed to use that entity type (403).", status: 502 };
    case "rate_limited":
      return { msg: "Qloo is rate-limiting us right now.", hint: "Wait a minute and try again.", status: 503 };
    case "empty":
      return {
        msg: e.message || `Qloo returned no places for this taste in ${city ?? "that city"}.`,
        hint: "Try a bigger nearby city, fewer tastes, or no budget filter.",
        status: 404,
      };
    default:
      return { msg: "Qloo is unavailable right now.", hint: "Try again in a minute.", status: 502 };
  }
}
