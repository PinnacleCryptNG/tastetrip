import type { Candidate } from "../types";
import type { QlooEntity } from "./schemas";

type Rec = Record<string, unknown>;
const rec = (v: unknown): Rec | undefined => (v && typeof v === "object" && !Array.isArray(v) ? (v as Rec) : undefined);
const num = (...vals: unknown[]) => vals.find((v): v is number => typeof v === "number" && Number.isFinite(v));
const str = (...vals: unknown[]) => vals.find((v): v is string => typeof v === "string" && v.trim().length > 0);

export const entityId = (e: QlooEntity) => (e.entity_id ?? e.id ?? "").toString();
export const idKey = (id: string) => id.trim().toLowerCase();

export function normalizeTags(tags: unknown): Candidate["tags"] {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((t) => {
      const r = rec(t);
      if (!r) return null;
      const id = str(r.id, r.tag_id);
      const name = str(r.name, r.value);
      return id && name ? { id, name, type: str(r.type, r.subtype) } : null;
    })
    .filter((t): t is NonNullable<typeof t> => t !== null);
}

// Qloo's per-result explainability lists which input entities (signal.interests.entities)
// contributed and by how much (0–1). We search the block for known seed ids so we
// don't depend on one exact nesting.
export function extractExplain(block: unknown, seedIds: string[]): { entity_id: string; score: number }[] {
  const wanted = new Map(seedIds.map((id) => [idKey(id), id]));
  const out = new Map<string, number>();
  const put = (id: string, score: number) => {
    const orig = wanted.get(idKey(id));
    if (!orig || !(score >= 0) || score > 1.0001) return;
    out.set(orig, Math.max(out.get(orig) ?? 0, score));
  };
  const visit = (n: unknown, depth: number) => {
    if (depth > 7 || n == null) return;
    if (Array.isArray(n)) return n.forEach((x) => visit(x, depth + 1));
    const r = rec(n);
    if (!r) return;
    const idVal = Object.values(r).find((v): v is string => typeof v === "string" && wanted.has(idKey(v)));
    if (idVal) {
      const score = num(r.score, r.value, r.contribution, r.weight, r.impact, r.influence, r.affinity);
      if (score !== undefined) put(idVal, score);
    }
    for (const [k, v] of Object.entries(r)) {
      if (wanted.has(idKey(k)) && typeof v === "number") put(k, v);
      else if (wanted.has(idKey(k)) && rec(v)) {
        const s = num(rec(v)!.score, rec(v)!.value);
        if (s !== undefined) put(k, s);
      } else visit(v, depth + 1);
    }
  };
  visit(block, 0);
  return [...out.entries()].map(([entity_id, score]) => ({ entity_id, score })).sort((a, b) => b.score - a.score);
}

export function normalizePlace(e: QlooEntity, seedIds: string[]): Candidate | null {
  const id = entityId(e);
  if (!id || !e.name) return null;
  const p = rec(e.properties) ?? {};
  const geo = rec(p.geocode) ?? {};
  const loc = rec(e.location) ?? rec(p.location) ?? {};
  const q = rec(e.query) ?? {};
  const lat = num(loc.lat, loc.latitude, geo.lat, geo.latitude, p.lat, (e as Rec).lat);
  const lon = num(loc.lon, loc.lng, loc.longitude, geo.lon, geo.lng, geo.longitude, p.lon, (e as Rec).lon);
  return {
    entity_id: id,
    name: e.name,
    address: str(p.address, (e as Rec).address, e.disambiguation),
    neighborhood: str(p.neighborhood, geo.neighborhood, (e as Rec).neighborhood),
    lat,
    lon,
    tags: normalizeTags(e.tags ?? p.tags),
    affinity: num(q.affinity, (e as Rec).affinity),
    popularity: num(e.popularity, p.popularity),
    price_level: num(p.price_level, (e as Rec).price_level),
    rating: num(p.business_rating, (e as Rec).business_rating),
    website: str(p.website, (e as Rec).website),
    explain: extractExplain(q.explainability, seedIds),
  };
}

export function entityTypeOf(e: QlooEntity): string {
  const t = e.subtype ?? e.types?.[0] ?? e.type ?? "";
  return t.replace("urn:entity:", "");
}

export function entitySubtitle(e: QlooEntity): string | undefined {
  const p = rec(e.properties) ?? {};
  const year = num(p.release_year, p.publication_year);
  return str(e.disambiguation, p.short_description, year ? String(year) : undefined, p.address)?.slice(0, 80);
}

export function entityImage(e: QlooEntity): string | undefined {
  const p = rec(e.properties) ?? {};
  const img = rec(p.image);
  return str(img?.url, (e as Rec).url);
}
