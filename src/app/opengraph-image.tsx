import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "TasteTrip: travel by taste";

async function font(family: string, weight: number) {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&display=swap`)).text();
  const url = css.match(/src: url\((.+?)\) format/)?.[1];
  if (!url) throw new Error("font");
  return (await fetch(url)).arrayBuffer();
}

const ROWS = [
  ["FRANK OCEAN", "PARIS", "92%"],
  ["BTS", "SEOUL", "94%"],
  ["BLACK COFFEE", "CAPE TOWN", "91%"],
];

function Flaps({ text, n, color = "#ffd23f" }: { text: string; n: number; color?: string }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {text.padEnd(n, " ").split("").map((c, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 42, borderRadius: 4, background: "#1d2030", color, fontSize: 26, fontFamily: "Mono" }}>{c}</div>
      ))}
    </div>
  );
}

export default async function OG() {
  const [disp, mono] = await Promise.all([font("Big+Shoulders", 900), font("JetBrains+Mono", 700)]).catch(() => [null, null]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 64px", background: "#2f3cff", color: "#fff", fontFamily: "Display" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 40, letterSpacing: 1 }}>
          <svg width="48" height="48" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#12141f" /><path d="M21.1 21.4 19.75 15.25l2.63-2.63C23.5 11.5 23.88 10 23.5 9.25c-.75-.38-2.25 0-3.38 1.13L17.5 13l-6.15-1.35c-.38-.08-.68.08-.83.38l-.22.38c-.15.37-.08.75.22.97L14.5 16.75 13 19h-2.25l-.75.75 2.25 1.5 1.5 2.25.75-.75V20.5l2.25-1.5 2.63 3.98c.22.3.6.37.97.22l.38-.15c.3-.23.45-.53.37-.9Z" fill="#ffd23f" /></svg>
          <span>TASTE</span><span style={{ color: "#ffd23f", marginLeft: -14 }}>TRIP</span>
        </div>
        <div style={{ display: "flex", fontSize: 150, lineHeight: 0.82, gap: 32 }}>
          TRAVEL BY <span style={{ color: "#ffd23f" }}>TASTE.</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 20, borderRadius: 14, background: "#0b0d17" }}>
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
    {
      ...size,
      fonts: [
        ...(disp ? [{ name: "Display", data: disp, weight: 900 as const }] : []),
        ...(mono ? [{ name: "Mono", data: mono, weight: 700 as const }] : []),
      ],
    },
  );
}
