import "server-only";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { llmJson } from "./llm";
import { QlooError } from "./qloo/client";
import { findPlaceTag, recommendPlaces, type FoundTag } from "./qloo/api";
import { idKey } from "./qloo/normalize";
import { newEditKey, saveTrip } from "./trips";
import {
  FOOD_SLOTS,
  SLOTS,
  SlotSchema,
  type Candidate,
  type Day,
  type PlanEvent,
  type PlanInput,
  type Slot,
  type SlotQuery,
  type Stop,
  type TasteSeed,
  type Trip,
} from "./types";

export type Emit = (ev: PlanEvent) => void;
const newId = customAlphabet("abcdefghijkmnpqrstuvwxyz23456789", 10);

const DEFAULT_QUERY: Record<Slot, string> = {
  breakfast: "cafe",
  morning: "museum",
  lunch: "restaurant",
  afternoon: "art gallery",
  dinner: "restaurant",
  night: "bar",
};

type Ctx = { emit: Emit; qloo: number; llm: number; rejected: number; step: number };
const stepId = (c: Ctx) => `s${++c.step}`;

async function pmap<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k]);
      }
    }),
  );
  return out;
}

export function weekdayFor(startDate: string | undefined, dayIndex: number): string | undefined {
  if (!startDate) return undefined;
  const d = new Date(`${startDate}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return undefined;
  d.setUTCDate(d.getUTCDate() + dayIndex);
  return d.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
}

const seedLabel = (seeds: TasteSeed[]) =>
  seeds.length <= 2 ? seeds.map((s) => s.name).join(" + ") : `${seeds[0].name} + ${seeds[1].name} + ${seeds.length - 2} more`;

function km(a: { lat?: number; lon?: number }, b: { lat?: number; lon?: number }) {
  if (a.lat == null || a.lon == null || b.lat == null || b.lon == null) return 0;
  const r = Math.PI / 180;
  const x = (b.lon - a.lon) * r * Math.cos(((a.lat + b.lat) / 2) * r);
  const y = (b.lat - a.lat) * r;
  return Math.sqrt(x * x + y * y) * 6371;
}

// ---------- (1) LLM: slot categories per day ----------
const DayPlanSchema = z.object({
  days: z
    .array(
      z.object({
        theme: z.string().min(1).max(80),
        slots: z.array(z.object({ slot: SlotSchema, query: z.string().min(2).max(40) })).min(3).max(6),
      }),
    )
    .min(1)
    .max(10),
  themes: z.array(z.string().min(1).max(80)).max(40).optional(),
});
const MAX_TEMPLATES = 4;
const CHUNK_DAYS = 3;
type DaySpec = { theme: string; weekday?: string; slots: { slot: Slot; query: string }[] };

async function planSlots(input: PlanInput, ctx: Ctx): Promise<DaySpec[]> {
  const id = stepId(ctx);
  ctx.emit({ type: "step", id, tool: "llm.plan_slots", status: "run", msg: `Planning ${input.days} day${input.days > 1 ? "s" : ""} of slots for your taste…` });
  const n = Math.min(input.days, MAX_TEMPLATES);
  const long = input.days > n;
  let templates: DaySpec[];
  let themes: string[] = [];
  try {
    ctx.llm++;
    const res = await llmJson(
      DayPlanSchema,
      `You plan the shape of a taste-matched city itinerary. For each day give a short theme (max 6 words) and 4-5 time slots chosen from: ${SLOTS.join(", ")} (chronological, each slot at most once per day).
For each slot give "query": ONE short generic English place category that a tag search can match, e.g. cafe, bakery, brunch, museum, art gallery, park, garden, bookstore, record store, market, vintage, cinema, theater, restaurant, seafood, vegetarian, ramen, tapas, jazz club, live music venue, cocktail bar, wine bar, nightclub, rooftop bar.
Pick categories the given tastes plausibly enjoy, vary them across days, and use a food category for breakfast/lunch/dinner. Never name specific venues.
Return exactly day_templates entries in "days"${long ? ` (they repeat across the ${input.days}-day trip, so make them clearly different from each other), plus "themes": exactly trip_length_days distinct short day themes (max 6 words each) that suit the city and tastes` : ""}, in this shape:
{"days":[{"theme":"Street style and soul food","slots":[{"slot":"morning","query":"vintage"},{"slot":"lunch","query":"ramen"}]}]${long ? ',"themes":["Street style and soul food","Old town and wine bars"]' : ""}}`,
      JSON.stringify({ city: input.city, trip_length_days: input.days, day_templates: n, budget_max_price_level: input.budget ?? null, tastes: input.seeds.map((s) => ({ name: s.name, type: s.type })) }),
      900 + (long ? input.days * 18 : 0),
    );
    themes = (res.themes ?? []).map((x) => x.trim()).filter(Boolean);
    templates = res.days.slice(0, n).map((d) => {
      const seen = new Set<Slot>();
      const slots = d.slots
        .filter((s) => (seen.has(s.slot) ? false : (seen.add(s.slot), true)))
        .sort((a, b) => SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot))
        .map((s) => ({ slot: s.slot, query: s.query.trim().toLowerCase() }));
      return { theme: d.theme.trim(), slots };
    });
  } catch (e) {
    console.warn("[plan] slot planning failed, using default slots", e);
    templates = [];
  }
  while (templates.length < n)
    templates.push({ theme: "", slots: (["morning", "lunch", "afternoon", "dinner", "night"] as Slot[]).map((slot) => ({ slot, query: DEFAULT_QUERY[slot] })) });
  const seenThemes = new Set<string>();
  const days: DaySpec[] = Array.from({ length: input.days }, (_, i) => {
    const tpl = templates[i % n];
    let theme = themes[i] && !seenThemes.has(themes[i].toLowerCase()) ? themes[i] : !tpl.theme ? `Day ${i + 1}` : i < n ? tpl.theme : `${tpl.theme}, take ${Math.floor(i / n) + 1}`;
    if (theme.length > 80) theme = theme.slice(0, 80);
    seenThemes.add(theme.toLowerCase());
    return { theme, weekday: weekdayFor(input.startDate, i), slots: tpl.slots.map((s) => ({ ...s })) };
  });
  ctx.emit({
    type: "step",
    id,
    tool: "llm.plan_slots",
    status: "ok",
    msg: long ? `Day plan ready · ${n} day shapes rotated over ${input.days} days` : "Day plan ready",
    detail: templates.map((d, i) => `${long ? `Shape ${i + 1}` : `Day ${i + 1}`}: ${d.theme} · ${d.slots.map((s) => s.query).join(", ")}`).join("\n"),
  });
  return days;
}

// ---------- (2) Qloo tags ----------
async function resolveTags(queries: string[], ctx: Ctx): Promise<Map<string, FoundTag | null>> {
  const out = new Map<string, FoundTag | null>();
  await pmap([...new Set(queries)], 3, async (q) => {
    const id = stepId(ctx);
    ctx.emit({ type: "step", id, tool: "qloo.find_tags", status: "run", msg: `Looking up Qloo tags for "${q}"` });
    const { tag, calls, cached } = await findPlaceTag(q);
    ctx.qloo += calls;
    out.set(q, tag);
    ctx.emit({ type: "step", id, tool: "qloo.find_tags", status: tag ? "ok" : "warn", msg: tag ? `"${q}" → ${tag.name}` : `No Qloo place tag for "${q}"`, detail: tag ? `GET /v2/tags · ${tag.id}${cached ? " · cached" : ""}` : undefined });
  });
  return out;
}

// ---------- (3) Qloo insights per slot ----------
type PoolKey = string;
type Pool = { query: SlotQuery; places: Candidate[] };
const poolKey = (q: SlotQuery, priceMax?: number) => `${q.tagId ?? "-"}|${q.weekday ?? "-"}|${priceMax ?? "-"}`;

async function fetchPools(
  wanted: { key: PoolKey; query: SlotQuery; priceMax?: number }[],
  seeds: TasteSeed[],
  city: string,
  exclude: string[],
  take: number,
  ctx: Ctx,
  pagesFor?: Map<PoolKey, number>,
): Promise<{ pools: Map<PoolKey, Pool>; matchedCity?: string }> {
  const pools = new Map<PoolKey, Pool>();
  let matchedCity: string | undefined;
  const run = async (w: (typeof wanted)[number]) => {
    const id = stepId(ctx);
    const what = w.query.tagName ?? w.query.label;
    ctx.emit({ type: "step", id, tool: "qloo.recommend_places", status: "run", msg: `Searching Qloo for ${what} in ${city} matched to ${seedLabel(seeds)}${w.query.weekday ? ` (open ${w.query.weekday})` : ""}…` });
    const base = { seedIds: seeds.map((s) => s.entity_id), city, tagId: w.query.tagId, weekday: w.query.weekday, priceMax: w.priceMax, exclude, take };
    const res = await recommendPlaces(base);
    ctx.qloo += res.calls;
    matchedCity ??= res.matchedCity;
    const seen = new Set(res.places.map((c) => idKey(c.entity_id)));
    let last = res.places.length;
    for (let page = 2; page <= (pagesFor?.get(w.key) ?? 1) && last >= take * 0.8; page++) {
      const more = await recommendPlaces({ ...base, page, relaxed: res.relaxed });
      ctx.qloo += more.calls;
      last = more.places.length;
      for (const c of more.places) if (!seen.has(idKey(c.entity_id))) (seen.add(idKey(c.entity_id)), res.places.push(c));
    }
    pools.set(w.key, { query: w.query, places: res.places });
    const top = res.places[0];
    ctx.emit({
      type: "step",
      id,
      tool: "qloo.recommend_places",
      status: res.places.length ? "ok" : "warn",
      msg: res.places.length ? `${res.places.length} ${what} places${top ? ` · top: ${top.name}${top.affinity != null ? ` (${Math.round(top.affinity * 100)}%)` : ""}` : ""}` : `No ${what} places found`,
      detail: `GET /v2/insights · filter.type=urn:entity:place${w.query.tagId ? ` · filter.tags=${w.query.tagId}` : ""}${w.query.weekday ? ` · filter.hours=${w.query.weekday}` : ""}${w.priceMax ? ` · filter.price_level.max=${w.priceMax}` : ""}${exclude.length ? ` · filter.exclude.entities=${exclude.length}` : ""} · feature.explainability=true${res.relaxed ? " · relaxed quality/popularity" : ""}${res.cached ? " · cached" : ""}`,
    });
  };
  if (wanted.length) await run(wanted[0]); // fail fast on unknown city (400)
  await pmap(wanted.slice(1), 3, run);
  return { pools, matchedCity };
}

// ---------- (4) LLM: choose + group by proximity, then validate ----------
const ArrangeSchema = z.object({
  days: z.array(z.object({ day: z.number().int(), stops: z.array(z.object({ slot: SlotSchema, id: z.string() })) })),
});

type Picked = { slot: Slot; cand: Candidate; query: SlotQuery; alternates: Candidate[] };

async function arrange(
  specs: { dayIndex: number; slots: { slot: Slot; pool: Pool }[] }[],
  used: Set<string>,
  ctx: Ctx,
  label?: string,
  altN = 5,
): Promise<Map<number, Picked[]>> {
  const id = stepId(ctx);
  const tag = label ? ` (${label})` : "";
  ctx.emit({ type: "step", id, tool: "llm.arrange", status: "run", msg: `Grouping stops by neighbourhood so each day stays walkable${tag}…` });
  const alias = new Map<string, Candidate>();
  const aliasOf = new Map<string, string>();
  const opts = (pool: Pool) =>
    pool.places.filter((c) => !used.has(idKey(c.entity_id))).slice(0, 8);
  const payload = specs.map((s) => ({
    day: s.dayIndex + 1,
    slots: s.slots.map(({ slot, pool }) => ({
      slot,
      options: opts(pool).map((c) => {
        let a = aliasOf.get(c.entity_id);
        if (!a) {
          a = `p${alias.size + 1}`;
          alias.set(a, c);
          aliasOf.set(c.entity_id, a);
        }
        return { id: a, name: c.name, lat: c.lat != null ? +c.lat.toFixed(4) : null, lon: c.lon != null ? +c.lon.toFixed(4) : null, affinity: c.affinity != null ? +c.affinity.toFixed(3) : null, area: c.neighborhood ?? null };
      }),
    })),
  }));

  let llmChoice = new Map<string, string>();
  try {
    ctx.llm++;
    const res = await llmJson(
      ArrangeSchema,
      `You arrange a city itinerary. For every day and slot pick exactly one option id from that slot's options list.
Rules: never invent ids; never reuse an id anywhere in the trip; keep each day's stops geographically close (use lat/lon) so the day is walkable or a short ride; prefer higher affinity when distances are similar.
Output {"days":[{"day":1,"stops":[{"slot":"morning","id":"p3"}]}]}.`,
      JSON.stringify({ days: payload }),
      1200,
    );
    for (const d of res.days) for (const s of d.stops) llmChoice.set(`${d.day - 1}|${s.slot}`, s.id);
  } catch (e) {
    console.warn("[plan] arrange LLM failed; using greedy proximity", e);
    llmChoice = new Map();
  }

  const taken = new Set(used);
  const out = new Map<number, Picked[]>();
  let rejected = 0;
  for (const s of specs) {
    const picks: Picked[] = [];
    for (const { slot, pool } of s.slots) {
      const options = opts(pool).filter((c) => !taken.has(idKey(c.entity_id)));
      if (!options.length) continue;
      const chosenAlias = llmChoice.get(`${s.dayIndex}|${slot}`);
      let cand = chosenAlias ? alias.get(chosenAlias) : undefined;
      // Validator: the stop must be a Qloo candidate offered for this slot, unused in the trip.
      if (!cand || !options.some((o) => o.entity_id === cand!.entity_id)) {
        if (llmChoice.size) rejected++;
        const placed = picks.map((p) => p.cand).filter((c) => c.lat != null);
        const center = placed.length
          ? { lat: placed.reduce((a, c) => a + c.lat!, 0) / placed.length, lon: placed.reduce((a, c) => a + c.lon!, 0) / placed.length }
          : {};
        cand = [...options].sort((a, b) => (b.affinity ?? 0) - 0.02 * km(center, b) - ((a.affinity ?? 0) - 0.02 * km(center, a)))[0];
      }
      taken.add(idKey(cand.entity_id));
      picks.push({ slot, cand, query: pool.query, alternates: [] });
    }
    out.set(s.dayIndex, picks);
  }
  for (const s of specs)
    for (const p of out.get(s.dayIndex) ?? []) {
      const pool = s.slots.find((x) => x.slot === p.slot)!.pool;
      p.alternates = pool.places.filter((c) => !taken.has(idKey(c.entity_id))).slice(0, altN);
    }
  ctx.rejected += rejected;
  const total = [...out.values()].reduce((a, p) => a + p.length, 0);
  ctx.emit({
    type: "step",
    id,
    tool: "validator",
    status: rejected ? "warn" : "ok",
    msg: `Validated ${total}/${total} stops${tag} are Qloo entities from the candidate set${rejected ? ` · replaced ${rejected} invalid LLM pick${rejected > 1 ? "s" : ""}` : ""}`,
  });
  return out;
}

// ---------- (5) LLM: grounded explanations ----------
const WhySchema = z.object({ items: z.array(z.object({ id: z.string(), why: z.string().min(5).max(400) })) });

function explainFor(c: Candidate, seeds: TasteSeed[]) {
  return c.explain
    .map((e) => {
      const s = seeds.find((x) => idKey(x.entity_id) === idKey(e.entity_id));
      return s ? { seed_name: s.name, entity_id: s.entity_id, score: e.score } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

function templateWhy(c: Candidate, ex: ReturnType<typeof explainFor>) {
  const pct = c.affinity != null ? `${Math.round(c.affinity * 100)}% Qloo affinity` : "a strong Qloo match";
  const drivers = ex.filter((e) => e.score >= 0.1).slice(0, 2).map((e) => e.seed_name);
  const tags = c.tags.slice(0, 2).map((t) => t.name.toLowerCase());
  return `${pct} with your taste${drivers.length ? `, driven most by ${drivers.join(" and ")}` : ""}${tags.length ? `. Tagged ${tags.join(", ")}.` : "."}`;
}

const EXPLAIN_BATCH = 15;

async function explainAll(picks: Picked[], seeds: TasteSeed[], ctx: Ctx): Promise<Map<string, string>> {
  if (picks.length <= EXPLAIN_BATCH + 3) return explain(picks, seeds, ctx);
  const batches = Array.from({ length: Math.ceil(picks.length / EXPLAIN_BATCH) }, (_, i) => picks.slice(i * EXPLAIN_BATCH, (i + 1) * EXPLAIN_BATCH));
  const parts = await pmap(batches, 3, (b) => explain(b, seeds, ctx, `stops ${picks.indexOf(b[0]) + 1}–${picks.indexOf(b[0]) + b.length}`));
  return new Map(parts.flatMap((m) => [...m]));
}

async function explain(picks: Picked[], seeds: TasteSeed[], ctx: Ctx, label?: string): Promise<Map<string, string>> {
  const id = stepId(ctx);
  const tag = label ? ` (${label})` : "";
  ctx.emit({ type: "step", id, tool: "llm.explain", status: "run", msg: `Writing “why this fits you” from Qloo explainability${tag}…` });
  const items = picks.map((p, i) => ({ p, a: `s${i + 1}`, ex: explainFor(p.cand, seeds) }));
  const out = new Map<string, string>();
  try {
    ctx.llm++;
    const res = await llmJson(
      WhySchema,
      `Write one short "why this fits you" line (18-30 words) per stop, addressed to the traveller ("you"). Name the top taste driver(s) from explain and weave in one or two of the stop's tags so each line is specific.
Ground it ONLY in the given fields: name, slot, tags, Qloo affinity, and explain (which of the traveller's tastes drove Qloo's match, with 0-1 scores).
Mention only taste names that appear in that stop's explain list (the highest-scoring first). Do not invent dishes, history, awards or facts not in the tags.
Phrase affinity as aggregate ("fans of X tend to love…"), never as a fact about the person.
Output {"items":[{"id":"s1","why":"..."}]}.`,
      JSON.stringify(
        items.map(({ p, a, ex }) => ({
          id: a,
          name: p.cand.name,
          slot: p.slot,
          category: p.query.tagName ?? p.query.label,
          tags: p.cand.tags.slice(0, 8).map((t) => t.name),
          affinity: p.cand.affinity != null ? Math.round(p.cand.affinity * 100) : null,
          explain: ex.slice(0, 3).map((e) => ({ taste: e.seed_name, score: +e.score.toFixed(2) })),
        })),
      ),
      1600,
    );
    for (const it of res.items) out.set(it.id, it.why.trim());
  } catch (e) {
    console.warn("[plan] explain LLM failed; using templates", e);
  }
  const result = new Map<string, string>();
  let templated = 0;
  for (const { p, a, ex } of items) {
    let why = out.get(a);
    const allowed = new Set(ex.filter((e) => e.score >= 0.05).map((e) => e.seed_name.toLowerCase()));
    const mentionsUngrounded = why && seeds.some((s) => !allowed.has(s.name.toLowerCase()) && why!.toLowerCase().includes(s.name.toLowerCase()));
    if (!why || (ex.length > 0 && mentionsUngrounded)) {
      why = templateWhy(p.cand, ex);
      templated++;
    }
    result.set(p.cand.entity_id, why);
  }
  ctx.emit({ type: "step", id, tool: "llm.explain", status: templated ? "warn" : "ok", msg: templated ? `Explanations ready${tag} (${templated} grounded from Qloo fields directly)` : `Explanations ready${tag}` });
  return result;
}

function toStop(p: Picked, seeds: TasteSeed[], why: string): Stop {
  const c = p.cand;
  return {
    slot: p.slot,
    entity_id: c.entity_id,
    name: c.name,
    address: c.address,
    neighborhood: c.neighborhood,
    lat: c.lat,
    lon: c.lon,
    tags: c.tags.slice(0, 6).map((t) => t.name),
    affinity: c.affinity,
    price_level: c.price_level,
    rating: c.rating,
    website: c.website,
    explain: explainFor(c, seeds),
    why,
    alternates: p.alternates.map((a) => a.entity_id),
    query: p.query,
  };
}

function slotQuery(slot: Slot, query: string, tags: Map<string, FoundTag | null>, weekday?: string): SlotQuery {
  const tag = tags.get(query) ?? tags.get(DEFAULT_QUERY[slot]) ?? null;
  return { label: tag ? query : DEFAULT_QUERY[slot], tagId: tag?.id, tagName: tag?.name, weekday };
}

// ---------- public: plan / swap / regenerate ----------
export async function planTrip(input: PlanInput, emit: Emit): Promise<{ trip: Trip; editKey: string }> {
  const ctx: Ctx = { emit, qloo: 0, llm: 0, rejected: 0, step: 0 };
  emit({ type: "step", id: stepId(ctx), status: "ok", msg: `Taste: ${input.seeds.map((s) => `${s.name} (${s.type})`).join(", ")}`, detail: "Resolved via Qloo /search autocomplete" });

  const days = await planSlots(input, ctx);
  const queries = days.flatMap((d) => d.slots.map((s) => s.query));
  const tags = await resolveTags(queries, ctx);
  const missingDefaults = days.flatMap((d) => d.slots).filter((s) => !tags.get(s.query)).map((s) => DEFAULT_QUERY[s.slot]).filter((q) => !tags.has(q));
  if (missingDefaults.length) for (const [k, v] of await resolveTags(missingDefaults, ctx)) tags.set(k, v);

  // Past a week, one pool per weekday would multiply Qloo calls by 7, so the opening-day filter is dropped.
  const useHours = input.days <= 7;
  if (input.startDate && !useHours)
    emit({ type: "step", id: stepId(ctx), status: "warn", msg: "Long trip: skipping the opening-day filter to keep Qloo calls reasonable" });
  const wanted = new Map<PoolKey, { key: PoolKey; query: SlotQuery; priceMax?: number }>();
  const uses = new Map<PoolKey, number>();
  const slotKeys = days.map((d) =>
    d.slots.map((s) => {
      const q = slotQuery(s.slot, s.query, tags, useHours ? d.weekday : undefined);
      const priceMax = FOOD_SLOTS.includes(s.slot) ? input.budget : undefined;
      const key = poolKey(q, priceMax);
      if (!wanted.has(key)) wanted.set(key, { key, query: q, priceMax });
      uses.set(key, (uses.get(key) ?? 0) + 1);
      return { slot: s.slot, key };
    }),
  );
  const long = input.days > CHUNK_DAYS;
  const take = long ? 50 : Math.min(50, input.days * 4 + 8);
  const pagesFor = new Map([...uses].map(([k, u]) => [k, long ? Math.min(3, Math.ceil((u * 2 + 6) / take)) : 1]));
  for (let total = [...pagesFor.values()].reduce((a, b) => a + b, 0); total > 30; total--) {
    const [k, v] = [...pagesFor].sort((a, b) => b[1] - a[1])[0];
    if (v <= 1) break;
    pagesFor.set(k, v - 1);
  }
  const { pools, matchedCity } = await fetchPools([...wanted.values()], input.seeds, input.city, [], take, ctx, pagesFor);
  if (![...pools.values()].some((p) => p.places.length))
    throw new QlooError("empty", `Qloo returned no places for this taste in ${input.city}.`);

  const specs = days.map((d, i) => ({ dayIndex: i, slots: slotKeys[i].map((s) => ({ slot: s.slot, key: s.key })) }));
  let picked: Map<number, Picked[]>;
  if (!long) {
    picked = await arrange(specs.map((s) => ({ dayIndex: s.dayIndex, slots: s.slots.map((x) => ({ slot: x.slot, pool: pools.get(x.key)! })) })), new Set(), ctx);
  } else {
    // Split each pool between the 3-day chunks that use it so chunks can be arranged in parallel without repeats.
    const chunks = Array.from({ length: Math.ceil(specs.length / CHUNK_DAYS) }, (_, i) => specs.slice(i * CHUNK_DAYS, (i + 1) * CHUNK_DAYS));
    const share = new Map<PoolKey, Pool[]>();
    for (const [key, pool] of pools) {
      const users = chunks.map((c, i) => (c.some((d) => d.slots.some((s) => s.key === key)) ? i : -1)).filter((i) => i >= 0);
      const parts = chunks.map(() => ({ query: pool.query, places: [] as Candidate[] }));
      pool.places.forEach((c, i) => parts[users[i % users.length]]?.places.push(c));
      share.set(key, parts);
    }
    const results = await pmap(chunks, 3, (chunk) => {
      const ci = chunks.indexOf(chunk);
      const a = chunk[0].dayIndex + 1, b = chunk[chunk.length - 1].dayIndex + 1;
      return arrange(chunk.map((s) => ({ dayIndex: s.dayIndex, slots: s.slots.map((x) => ({ slot: x.slot, pool: share.get(x.key)![ci] })) })), new Set(), ctx, a === b ? `day ${a}` : `days ${a}–${b}`, 3);
    });
    picked = new Map(results.flatMap((m) => [...m]));
  }
  const all = days.flatMap((_, i) => picked.get(i) ?? []);
  if (!all.length) throw new QlooError("empty", `Qloo returned no places for this taste in ${input.city}.`);
  const whys = await explainAll(all, input.seeds, ctx);

  const candidates: Record<string, Candidate> = {};
  for (const p of all) for (const a of p.alternates) candidates[a.entity_id] = a;
  const itinerary: Day[] = days.map((d, i) => ({
    index: i,
    theme: d.theme,
    weekday: d.weekday,
    stops: (picked.get(i) ?? []).map((p) => toStop(p, input.seeds, whys.get(p.cand.entity_id)!)),
  }));
  const trip: Trip = {
    id: newId(),
    city: input.city,
    matchedCity,
    days: input.days,
    budget: input.budget,
    startDate: input.startDate,
    seeds: input.seeds,
    itinerary,
    candidates,
    seen: [],
    createdAt: new Date().toISOString(),
    stats: { qlooCalls: ctx.qloo, llmCalls: ctx.llm, rejected: ctx.rejected },
  };
  const editKey = newEditKey();
  await saveTrip(trip, editKey);
  emit({ type: "step", id: stepId(ctx), status: "ok", msg: `Saved your trip · ${ctx.qloo} Qloo calls, ${ctx.llm} LLM calls` });
  return { trip, editKey };
}

const tripIds = (t: Trip) => [...t.itinerary.flatMap((d) => d.stops.map((s) => s.entity_id)), ...t.seen];
const noop: Emit = () => {};

export async function swapStop(trip: Trip, dayIndex: number, stopIndex: number): Promise<Trip> {
  const day = trip.itinerary[dayIndex];
  const stop = day?.stops[stopIndex];
  if (!stop) throw new Error("Stop not found");
  const ctx: Ctx = { emit: noop, qloo: 0, llm: 0, rejected: 0, step: 0 };
  const exclude = [...new Set(tripIds(trip))].slice(-50);
  const priceMax = FOOD_SLOTS.includes(stop.slot) ? trip.budget : undefined;
  const res = await recommendPlaces({ seedIds: trip.seeds.map((s) => s.entity_id), city: trip.city, tagId: stop.query.tagId, weekday: stop.query.weekday, priceMax, exclude, take: 10 });
  ctx.qloo += res.calls;
  const used = new Set(tripIds(trip).map(idKey));
  let options = res.places.filter((c) => !used.has(idKey(c.entity_id)));
  if (!options.length) options = stop.alternates.map((id) => trip.candidates[id]).filter((c): c is Candidate => !!c && !used.has(idKey(c.entity_id)));
  if (!options.length) throw new QlooError("empty", "Qloo has no more matches for this slot. Try regenerating the day.");

  const others = day.stops.filter((_, i) => i !== stopIndex && day.stops[i].lat != null);
  const center = others.length ? { lat: others.reduce((a, s) => a + s.lat!, 0) / others.length, lon: others.reduce((a, s) => a + s.lon!, 0) / others.length } : {};
  const cand = [...options].sort((a, b) => (b.affinity ?? 0) - 0.02 * km(center, b) - ((a.affinity ?? 0) - 0.02 * km(center, a)))[0];
  const rest = options.filter((o) => o.entity_id !== cand.entity_id).slice(0, 5);
  const p: Picked = { slot: stop.slot, cand, query: stop.query, alternates: rest };
  const whys = await explain([p], trip.seeds, ctx);
  for (const a of rest) trip.candidates[a.entity_id] = a;
  trip.seen = [...trip.seen, stop.entity_id];
  day.stops[stopIndex] = toStop(p, trip.seeds, whys.get(cand.entity_id)!);
  trip.stats.qlooCalls += ctx.qloo;
  trip.stats.llmCalls += ctx.llm;
  trip.updatedAt = new Date().toISOString();
  return trip;
}

export async function regenerateDay(trip: Trip, dayIndex: number): Promise<Trip> {
  const day = trip.itinerary[dayIndex];
  if (!day) throw new Error("Day not found");
  const ctx: Ctx = { emit: noop, qloo: 0, llm: 0, rejected: 0, step: 0 };
  const exclude = [...new Set(tripIds(trip))].slice(-50);
  const wanted = new Map<PoolKey, { key: PoolKey; query: SlotQuery; priceMax?: number }>();
  const slots = day.stops.map((s) => {
    const priceMax = FOOD_SLOTS.includes(s.slot) ? trip.budget : undefined;
    const key = poolKey(s.query, priceMax);
    if (!wanted.has(key)) wanted.set(key, { key, query: s.query, priceMax });
    return { slot: s.slot, key };
  });
  const { pools } = await fetchPools([...wanted.values()], trip.seeds, trip.city, exclude, 12, ctx);
  const otherIds = new Set(trip.itinerary.filter((_, i) => i !== dayIndex).flatMap((d) => d.stops.map((s) => idKey(s.entity_id))));
  for (const id of day.stops.map((s) => idKey(s.entity_id))) otherIds.add(id);
  const picked = await arrange([{ dayIndex, slots: slots.map((s) => ({ slot: s.slot, pool: pools.get(s.key)! })) }], otherIds, ctx);
  const picks = picked.get(dayIndex) ?? [];
  if (!picks.length) throw new QlooError("empty", "Qloo has no fresh places left for this day. Try a bigger city or fewer filters.");
  const whys = await explain(picks, trip.seeds, ctx);
  for (const p of picks) for (const a of p.alternates) trip.candidates[a.entity_id] = a;
  trip.seen = [...trip.seen, ...day.stops.map((s) => s.entity_id)];
  trip.itinerary[dayIndex] = { ...day, stops: picks.map((p) => toStop(p, trip.seeds, whys.get(p.cand.entity_id)!)) };
  trip.stats.qlooCalls += ctx.qloo;
  trip.stats.llmCalls += ctx.llm;
  trip.stats.rejected += ctx.rejected;
  trip.updatedAt = new Date().toISOString();
  return trip;
}
