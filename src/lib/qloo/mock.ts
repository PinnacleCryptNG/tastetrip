// DEV-ONLY synthetic responses so the UI can be built before a Qloo key exists.
// Enabled with QLOO_MOCK=1, and refused in production / on Vercel (see env.qlooMock).
// Names are deliberately fake ("Mock …"); nothing here is Qloo data.
import type { QlooParams } from "./client";

function rnd(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) % 10000) / 10000;
}

export function mockQloo(path: string, params: QlooParams): unknown {
  if (path === "/search") {
    const q = String(params.query ?? "");
    return {
      results: [0, 1, 2].map((i) => ({
        entity_id: `MOCK-${q.toUpperCase().replace(/\W+/g, "-")}-${i}`,
        name: i === 0 ? q : `${q} (mock ${i})`,
        subtype: "urn:entity:artist",
        types: ["urn:entity:artist"],
        disambiguation: "mock result",
      })),
    };
  }
  if (path === "/v2/tags") {
    const q = String(params["filter.query"] ?? "place").toLowerCase().replace(/\W+/g, "_");
    return { success: true, results: { tags: [{ id: `urn:tag:genre:place:${q}`, name: q.replace(/_/g, " "), type: "urn:tag:genre:place" }] } };
  }
  const seeds = String(params["signal.interests.entities"] ?? "").split(",").filter(Boolean);
  const tag = String(params["filter.tags"] ?? "urn:tag:genre:place:spot").split(":").pop();
  const excl = new Set(String(params["filter.exclude.entities"] ?? "").split(","));
  const page = Number(params.page ?? 1);
  const take = Math.min(50, Number(params.take ?? 14));
  const r = rnd(`${tag}${params["filter.location.query"]}${page}`);
  const entities = Array.from({ length: take }, (_, k) => {
    const i = (page - 1) * take + k;
    const w = seeds.map(() => r());
    const sum = w.reduce((a, b) => a + b, 0) || 1;
    return {
      entity_id: `MOCK-PLACE-${tag}-${i}`,
      name: `Mock ${tag?.replace(/_/g, " ")} ${i + 1}`,
      subtype: "urn:entity:place",
      properties: { address: `${10 + i} Mock Street`, business_rating: 4 + r(), price_level: 1 + Math.floor(r() * 3) },
      location: { lat: 38.71 + (r() - 0.5) * 0.06, lon: -9.14 + (r() - 0.5) * 0.08 },
      tags: [{ id: `urn:tag:genre:place:${tag}`, name: tag, type: "urn:tag:genre:place" }],
      query: {
        affinity: +Math.max(0.3, 0.97 - i * 0.012).toFixed(3),
        explainability: { "signal.interests.entities": seeds.map((s, j) => ({ entity_id: s, score: +(w[j] / sum).toFixed(3) })) },
      },
    };
  }).filter((e) => !excl.has(e.entity_id));
  return { success: true, results: { entities }, query: { locality: { signal: { name: `${params["filter.location.query"]} (mock)` } } } };
}
