import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./kv";

const limiters = new Map<string, Ratelimit>();
const memHits = new Map<string, number[]>();

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] || req.headers.get("x-real-ip") || "local").trim();
}

export async function rateLimit(
  req: Request,
  bucket: string,
  max: number,
  windowSec: number,
): Promise<{ ok: boolean; retryAfter: number }> {
  const ip = clientIp(req);
  const r = redis();
  if (r) {
    const k = `${bucket}:${max}:${windowSec}`;
    let l = limiters.get(k);
    if (!l) {
      l = new Ratelimit({ redis: r, limiter: Ratelimit.slidingWindow(max, `${windowSec} s`), prefix: `tt:rl:${bucket}` });
      limiters.set(k, l);
    }
    const res = await l.limit(ip);
    return { ok: res.success, retryAfter: Math.max(1, Math.ceil((res.reset - Date.now()) / 1000)) };
  }
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const hits = (memHits.get(key) ?? []).filter((t) => now - t < windowSec * 1000);
  if (hits.length >= max) return { ok: false, retryAfter: Math.ceil((hits[0] + windowSec * 1000 - now) / 1000) };
  hits.push(now);
  memHits.set(key, hits);
  return { ok: true, retryAfter: 0 };
}

export function tooMany(retryAfter: number) {
  return Response.json(
    { error: "Too many requests from your network. Please wait a moment and try again.", retryAfter },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}
