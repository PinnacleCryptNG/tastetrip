import { ImageResponse } from "next/og";
import { Flaps, OG_SIZE, OgLogo, ogFonts } from "@/lib/og";
import { getTrip } from "@/lib/trips";
import { SLOT_TIME } from "@/lib/types";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "A TasteTrip itinerary";

// The board fonts only cover Latin scripts, so stops with other scripts (e.g. Japanese names) are skipped on the card.
const LATIN = /^[\x20-\x7E\u00A0-\u024F\u2013\u2014\u2018-\u201F]+$/;
const up = (s: string) => s.normalize("NFC").toUpperCase();
const fit = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n + 1).replace(/[\s,.\-–—(]+\S*$/, "") || s.slice(0, n));

export default async function TripOG({ params }: { params: Promise<{ id: string }> }) {
  const trip = await getTrip((await params).id);
  const fonts = await ogFonts();
  const city = up(trip?.matchedCity ?? trip?.city ?? "Trip not found");
  const stops = (trip?.itinerary[0]?.stops ?? []).filter((s) => LATIN.test(s.name)).slice(0, 3);
  const nStops = trip?.itinerary.reduce((a, d) => a + d.stops.length, 0) ?? 0;
  const fans = trip?.seeds.length ? `FOR FANS OF ${up(trip.seeds.map((s) => s.name).join(", "))}` : "QLOO'S BEST-LOVED SPOTS";
  const citySize = city.length > 12 ? 110 : city.length > 8 ? 140 : 170;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "48px 64px", background: "#6d1a36", color: "#fff", fontFamily: "Display" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <OgLogo />
          <div style={{ display: "flex", fontFamily: "Mono", fontSize: 22, letterSpacing: 4, color: "#ffb3c1" }}>{trip ? `${trip.days} DAY${trip.days > 1 ? "S" : ""} · ${nStops} STOPS` : ""}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", fontSize: citySize, lineHeight: 0.85 }}>{city}</div>
          <div style={{ display: "flex", fontFamily: "Mono", fontSize: 22, letterSpacing: 3, color: "rgba(255,255,255,.8)", maxWidth: 1070, overflow: "hidden", whiteSpace: "nowrap" }}>{fans.length > 70 ? fans.slice(0, 69) + "…" : fans}</div>
        </div>
        {stops.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 18, borderRadius: 14, background: "#1a0d12" }}>
            {stops.map((s) => (
              <div key={s.entity_id} style={{ display: "flex", gap: 18 }}>
                <Flaps text={SLOT_TIME[s.slot].padStart(5, "0")} n={5} color="#fff" />
                <Flaps text={fit(up(s.name), 21)} n={21} />
                <Flaps text={s.affinity != null ? `${Math.round(s.affinity * 100)}%` : ""} n={3} color="#fff" />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", fontSize: 60, color: "#ffb3c1" }}>TRAVEL BY TASTE.</div>
        )}
      </div>
    ),
    { ...size, fonts },
  );
}
