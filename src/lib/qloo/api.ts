import "server-only";
import type { Candidate } from "../types";
import { qlooGet, QlooError, type QlooParams } from "./client";
import { normalizePlace, entityId, entityTypeOf, entitySubtitle, entityImage, normalizeTags } from "./normalize";
import { InsightsResponseSchema, SearchResponseSchema, TagsResponseSchema, type QlooEntity } from "./schemas";

// Values accepted by the /search `types` parameter (docs.qloo.com/reference/get-search).
export const SEARCH_TYPES = [
  "urn:entity:artist",
  "urn:entity:movie",
  "urn:entity:tv_show",
  "urn:entity:book",
  "urn:entity:brand",
  "urn:entity:place",
  "urn:entity:podcast",
  "urn:entity:videogame",
  "urn:entity:person",
] as const;

export type SearchHit = { entity_id: string; name: string; type: string; subtitle?: string; image?: string };

export async function searchEntities(query: string, types: string[] = [...SEARCH_TYPES], take = 8) {
  const { data, cached } = await qlooGet("/search", { query, types, take });
  const parsed = SearchResponseSchema.safeParse(data);
  if (!parsed.success) throw new QlooError("upstream", "Unexpected /search response shape");
  const list: QlooEntity[] = Array.isArray(parsed.data.results) ? parsed.data.results : parsed.data.results.entities;
  const hits: SearchHit[] = list
    .map((e) => ({ entity_id: entityId(e), name: e.name, type: entityTypeOf(e), subtitle: entitySubtitle(e), image: entityImage(e) }))
    .filter((h) => h.entity_id);
  return { hits, cached };
}

export type FoundTag = { id: string; name: string; type?: string };

// GET /v2/tags uses `filter.query` for the keyword (docs.qloo.com/reference/get-tags-1).
export async function findPlaceTag(query: string): Promise<{ tag: FoundTag | null; cached: boolean; calls: number }> {
  const attempts: QlooParams[] = [
    { "filter.query": query, "filter.tag.types": "urn:tag:genre:place", take: 10 },
    { "filter.query": query, take: 20 },
  ];
  let calls = 0;
  let cachedAll = true;
  for (const params of attempts) {
    const { data, cached } = await qlooGet("/v2/tags", params);
    calls++;
    cachedAll &&= cached;
    const parsed = TagsResponseSchema.safeParse(data);
    if (!parsed.success) continue;
    const raw = Array.isArray(parsed.data.results) ? parsed.data.results : parsed.data.results.tags;
    const tags = normalizeTags(raw).filter((t) => /:place/.test(t.id) || /:place/.test(t.type ?? ""));
    if (!tags.length) continue;
    const q = query.trim().toLowerCase();
    const best =
      tags.find((t) => t.name.toLowerCase() === q) ??
      tags.find((t) => t.id.startsWith("urn:tag:genre:place")) ??
      tags[0];
    return { tag: best, cached: cachedAll, calls };
  }
  return { tag: null, cached: cachedAll, calls };
}

export type PlaceQuery = {
  seedIds: string[];
  city: string;
  tagId?: string;
  weekday?: string;
  priceMax?: number;
  exclude?: string[];
  take?: number;
  relaxed?: boolean;
};

export function insightsParams(q: PlaceQuery): QlooParams {
  return {
    "filter.type": "urn:entity:place",
    "signal.interests.entities": q.seedIds,
    "filter.location.query": q.city,
    "filter.tags": q.tagId,
    "filter.hours": q.weekday,
    "filter.price_level.max": q.priceMax,
    "filter.exclude.entities": q.exclude?.length ? q.exclude : undefined,
    "filter.popularity.min": q.relaxed ? undefined : 0.2,
    "bias.quality": q.relaxed ? undefined : "medium",
    "feature.explainability": true,
    take: Math.min(50, q.take ?? 15),
  };
}

export async function recommendPlaces(q: PlaceQuery): Promise<{
  places: Candidate[];
  matchedCity?: string;
  cached: boolean;
  calls: number;
  relaxed: boolean;
}> {
  let calls = 0;
  let cachedAll = true;
  for (const relaxed of [false, true]) {
    const { data, cached } = await qlooGet("/v2/insights", insightsParams({ ...q, relaxed }));
    calls++;
    cachedAll &&= cached;
    const parsed = InsightsResponseSchema.safeParse(data);
    if (!parsed.success) throw new QlooError("upstream", "Unexpected /v2/insights response shape");
    const places = parsed.data.results.entities
      .map((e) => normalizePlace(e, q.seedIds))
      .filter((c): c is Candidate => c !== null);
    const loc = (parsed.data.query as { locality?: { signal?: { name?: string } } } | undefined)?.locality?.signal;
    if (places.length >= 3 || relaxed) return { places, matchedCity: loc?.name, cached: cachedAll, calls, relaxed };
  }
  return { places: [], cached: cachedAll, calls, relaxed: true };
}
