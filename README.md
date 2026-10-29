# TasteTrip

**A city itinerary built from what you love.** Pick 3–6 artists, films, shows, books or brands, choose any city and 1–30 days, and TasteTrip uses [Qloo](https://qloo.com)'s taste graph to find the places whose fans overlap most with yours. An agent then arranges them into walkable days and tells you *why* each stop fits, using Qloo's explainability scores.

Built for the **Qloo Agentic Hackathon** (Oct 2026).

- **Live:** https://tastetrip-silk.vercel.app
- **License:** [MIT](LICENSE)

## The problem

Travel recommendations are mostly the same top-10 list for everyone. Your taste in music, film and fashion says a lot about which cafés, galleries and bars you'd enjoy, but no planner uses it. LLM-only planners also invent places, or recommend ones that closed years ago.

TasteTrip flips that: **every stop is a real place entity returned by Qloo's `/v2/insights`**, ranked by cross-domain affinity to your tastes. The LLM never invents a venue. It only picks categories, orders the stops by proximity, and writes one-line explanations grounded in Qloo's fields. A validator rejects any model output that isn't in Qloo's candidate set. If Qloo is down or returns nothing, you get an error, not a made-up itinerary.

## How Qloo is used

All calls are server-side (Next.js route handlers) to `https://hackathon.api.qloo.com` with the `X-Api-Key` header. The key is never sent to the browser. Responses are cached in Redis for 24 h and are never committed.

| Step | Endpoint | Parameters used |
| --- | --- | --- |
| Taste autocomplete | `GET /search` | `query`, `types` (`urn:entity:artist,movie,tv_show,book,brand,place,podcast,videogame,person`), `take` |
| Slot category → tag | `GET /v2/tags` | `filter.query`, `filter.tag.types=urn:tag:genre:place`, `take` |
| Places per slot | `GET /v2/insights` | `filter.type=urn:entity:place`, `signal.interests.entities`, `filter.location.query`, `filter.tags`, `filter.hours` (when a start date is set), `filter.price_level.max` (food & drink slots), `filter.popularity.min`, `bias.quality`, `feature.explainability=true`, `take` |
| Swap / regenerate | `GET /v2/insights` | same as above plus `filter.exclude.entities` (every place already in or removed from the trip) |

No legacy `/recommendations` or `/recs` endpoints are used.

### Example (redacted)

Request for the dinner slot of a Lisbon trip:

```http
GET /v2/insights?filter.type=urn:entity:place
  &signal.interests.entities=<burna-boy-id>,<king-of-boys-id>,<things-fall-apart-id>
  &filter.location.query=Lisbon
  &filter.tags=urn:tag:genre:place:restaurant
  &filter.price_level.max=2
  &filter.popularity.min=0.2&bias.quality=medium
  &feature.explainability=true&take=16
X-Api-Key: <redacted>
```

What TasteTrip keeps from each result (values elided; only the shape is shown):

```jsonc
{
  "entity_id": "…", "name": "…",
  "properties": { "address": "…", "neighborhood": "…", "business_rating": 4.6, "price_level": 2 },
  "location": { "lat": 38.7, "lon": -9.1 },
  "tags": [{ "id": "urn:tag:genre:place:restaurant:…", "name": "…" }],
  "query": {
    "affinity": 0.93,
    "explainability": { "signal.interests.entities": [{ "entity_id": "<burna-boy-id>", "score": 0.61 }, …] }
  }
}
```

`query.affinity` becomes the card's **Qloo match %**, and the per-seed explainability scores become the **Why this fits you** bars.

## Architecture

```
Browser (Next.js client)                      Server (route handlers, Node)
──────────────────────────                    ─────────────────────────────────────────────
Taste chips ── /api/search ─────────────────▶ Qloo /search  (24 h Redis cache)
"Plan my trip" ── POST /api/plan (NDJSON) ──▶ planner.ts
   ▲ live progress log                          1. LLM: day themes + slot categories (JSON, Zod, 1 retry)
   │                                            2. Qloo /v2/tags: category → place tag
   │                                            3. Qloo /v2/insights per (tag, weekday, price) pool
   │                                            4. LLM: pick + group stops by lat/lon
   │                                            5. Validator: drop any id not in that slot's Qloo pool,
   │                                               fill with best affinity-minus-distance candidate
   │                                            6. LLM: "why" lines from tags + explainability only;
   │                                               lines naming tastes Qloo didn't credit are replaced
   └──────────── trip id ◀──────────────────── 7. Save trip to Redis (180 days) + hashed edit key
/t/[id]  day tabs · timeline · Leaflet/OSM map · Swap · Regenerate day
         (public, read-only unless this browser holds the edit key)
```

- **Stack:** Next.js 15 App Router, TypeScript, Tailwind v4, shadcn/ui, react-leaflet + OpenStreetMap tiles, Upstash Redis, Zod, OpenAI SDK pointed at Nebius Token Factory (`nvidia/nemotron-3-super-120b-a12b`, thinking disabled for fast JSON).
- **Robustness:** per-IP rate limits on every API route, 15 s timeouts with 2 bounded retries on 429/5xx, and friendly messages for Qloo 400 (city not found), 401, 403 and empty results (with "try a bigger city / fewer filters" hints).
- **Agentic proof:** the progress log streams each tool call (`/v2/tags`, `/v2/insights` with its filters, LLM steps, validator result) as it happens.

## Run it locally

```bash
git clone https://github.com/PinnacleCryptNG/tastetrip && cd tastetrip
npm install
cp .env.example .env.local   # add QLOO_API_KEY and LLM_API_KEY
npm run dev                  # http://localhost:3000
```

Without `KV_REST_API_URL`/`KV_REST_API_TOKEN` it uses an in-memory store. `QLOO_MOCK=1` serves obviously fake "Mock …" places so you can work on the UI without a Qloo key; it's refused in production and on Vercel.

Deploy: import the repo on Vercel, add an Upstash Redis store (it sets `KV_REST_API_*`), and set the other variables from `.env.example`.

## Limitations

- Qloo affinities are **aggregate** cultural patterns ("fans of X over-index on Y"), not facts about any individual. The UI words them that way.
- Coverage varies by city; small towns or very niche tastes can return few places. The app says so instead of padding with guesses.
- Opening hours come from Qloo's `filter.hours` and may be out of date. Check before you go.
- Grouping by proximity uses straight-line distance, not transit times.
- Trips are public to anyone with the link. Only the browser that created a trip can swap or regenerate it.

## Built during the hackathon

Everything in this repo was written from scratch during the Qloo Agentic Hackathon, starting 28 Oct 2026 (after the 30 Sep 2026 start date): the Qloo client and caching, the planner/validator pipeline, the streaming UI, map, swap/regenerate and share pages.
