import { z } from "zod";
import { searchEntities, SEARCH_TYPES } from "@/lib/qloo/api";
import { friendlyQlooError } from "@/lib/qloo/client";
import { rateLimit, tooMany } from "@/lib/ratelimit";

const Q = z.object({
  q: z.string().trim().min(2).max(80),
  type: z.enum(SEARCH_TYPES.map((t) => t.replace("urn:entity:", "")) as [string, ...string[]]).optional(),
  take: z.coerce.number().int().min(1).max(10).default(8),
});

export async function GET(req: Request) {
  const rl = await rateLimit(req, "search", 60, 60);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const sp = new URL(req.url).searchParams;
  const parsed = Q.safeParse({ q: sp.get("q") ?? "", type: sp.get("type") || undefined, take: sp.get("take") || undefined });
  if (!parsed.success) return Response.json({ hits: [] });
  try {
    const types = parsed.data.type ? [`urn:entity:${parsed.data.type}`] : undefined;
    const { hits } = await searchEntities(parsed.data.q, types, parsed.data.take);
    return Response.json({ hits });
  } catch (e) {
    const f = friendlyQlooError(e);
    return Response.json({ error: f.msg, hint: f.hint }, { status: f.status });
  }
}
