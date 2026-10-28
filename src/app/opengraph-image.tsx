import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "TasteTrip: your taste already knows where to go";

async function font(family: string, weight: number, italic = false) {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}:ital,wght@${italic ? 1 : 0},${weight}&display=swap`)).text();
  const url = css.match(/src: url\((.+?)\) format/)?.[1];
  return url ? (await fetch(url)).arrayBuffer() : null;
}

export default async function OG() {
  const [reg, ital] = await Promise.all([font("Fraunces", 600), font("Fraunces", 600, true)]).catch(() => [null, null]);
  const fonts = [
    ...(reg ? [{ name: "Fraunces", data: reg, weight: 600 as const, style: "normal" as const }] : []),
    ...(ital ? [{ name: "Fraunces", data: ital, weight: 600 as const, style: "italic" as const }] : []),
  ];
  const chips = ["Wizkid", "Spirited Away", "Nike", "Burna Boy"];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#f7f3ec", color: "#1d1a16", fontFamily: "Fraunces" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="64" height="64" viewBox="0 0 32 32">
            <path d="M16 1.5C8.8 1.5 3 7.1 3 14.1c0 9 11.3 16.6 12.1 17.1a1.6 1.6 0 0 0 1.8 0C17.7 30.7 29 23.1 29 14.1 29 7.1 23.2 1.5 16 1.5Z" fill="#e4572e" />
            <circle cx="16" cy="14" r="8.4" fill="#1d1a16" />
            <circle cx="16" cy="14" r="5.6" fill="none" stroke="#f7f3ec" strokeOpacity=".25" strokeWidth=".9" />
            <circle cx="16" cy="14" r="2.6" fill="#f2a541" />
          </svg>
          <div style={{ display: "flex", fontSize: 44 }}>
            Taste<span style={{ color: "#e4572e", fontStyle: "italic" }}>Trip</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 92, lineHeight: 1, letterSpacing: -3 }}>
          <span>Your taste already knows</span>
          <span style={{ color: "#e4572e", fontStyle: "italic" }}>where to go.</span>
        </div>
        <div style={{ display: "flex", gap: 14, fontSize: 28, fontFamily: "sans-serif" }}>
          {chips.map((c) => (
            <div key={c} style={{ display: "flex", alignItems: "center", height: 58, lineHeight: 1, padding: "0 24px", borderRadius: 999, background: "#fff", border: "2px solid #e6dfd3" }}>{c}</div>
          ))}
          <div style={{ display: "flex", alignItems: "center", height: 58, marginLeft: "auto", whiteSpace: "nowrap", color: "#6b6258" }}>Powered by Qloo</div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
