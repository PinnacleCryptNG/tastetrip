export const OG_SIZE = { width: 1200, height: 630 };

export async function ogFont(family: string, weight: number) {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&display=swap`)).text();
  const url = css.match(/src: url\((.+?)\) format/)?.[1];
  if (!url) throw new Error("font");
  return (await fetch(url)).arrayBuffer();
}

export async function ogFonts() {
  const [disp, mono] = await Promise.all([ogFont("Big+Shoulders", 900), ogFont("JetBrains+Mono", 700)]).catch(() => [null, null]);
  return [
    ...(disp ? [{ name: "Display", data: disp, weight: 900 as const }] : []),
    ...(mono ? [{ name: "Mono", data: mono, weight: 700 as const }] : []),
  ];
}

export function Flaps({ text, n, color = "#ffb3c1", w = 30, h = 42, size = 26 }: { text: string; n: number; color?: string; w?: number; h?: number; size?: number }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {text.slice(0, n).padEnd(n, " ").split("").map((c, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: w, height: h, borderRadius: 4, background: "#2b171f", color, fontSize: size, fontFamily: "Mono" }}>{c}</div>
      ))}
    </div>
  );
}

export function OgLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 40, letterSpacing: 1 }}>
      <svg width="48" height="48" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#201117" /><path d="M21.1 21.4 19.75 15.25l2.63-2.63C23.5 11.5 23.88 10 23.5 9.25c-.75-.38-2.25 0-3.38 1.13L17.5 13l-6.15-1.35c-.38-.08-.68.08-.83.38l-.22.38c-.15.37-.08.75.22.97L14.5 16.75 13 19h-2.25l-.75.75 2.25 1.5 1.5 2.25.75-.75V20.5l2.25-1.5 2.63 3.98c.22.3.6.37.97.22l.38-.15c.3-.23.45-.53.37-.9Z" fill="#ffb3c1" /></svg>
      <span>TASTE</span><span style={{ color: "#ffb3c1", marginLeft: -14 }}>TRIP</span>
    </div>
  );
}
