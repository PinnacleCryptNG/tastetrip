import { ImageResponse } from "next/og";
import { Flaps, OG_SIZE, OgLogo, ogFonts } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "TasteTrip: travel by taste";

const ROWS = [
  ["FRANK OCEAN", "PARIS", "92%"],
  ["BTS", "SEOUL", "94%"],
  ["BLACK COFFEE", "CAPE TOWN", "91%"],
];

export default async function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 64px", background: "#6d1a36", color: "#fff", fontFamily: "Display" }}>
        <OgLogo />
        <div style={{ display: "flex", fontSize: 150, lineHeight: 0.82, gap: 32 }}>
          TRAVEL BY <span style={{ color: "#ffb3c1" }}>TASTE.</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 20, borderRadius: 14, background: "#1a0d12" }}>
          {ROWS.map(([a, b, c]) => (
            <div key={a} style={{ display: "flex", gap: 22 }}>
              <Flaps text={a} n={13} />
              <Flaps text={b} n={8} />
              <Flaps text={c} n={3} color="#fff" />
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
