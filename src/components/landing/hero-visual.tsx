import { Film, Music, ShoppingBag } from "lucide-react";
import { LogoMark } from "../logo";

const seeds = [
  { icon: Music, name: "Wizkid" },
  { icon: Film, name: "Spirited Away" },
  { icon: ShoppingBag, name: "Nike" },
];

const stops = [
  { time: "8:30", slot: "Breakfast", what: "Kissaten coffee house", color: "#f2a541", w: 78 },
  { time: "13:00", slot: "Lunch", what: "Standing ramen counter", color: "#e4572e", w: 92 },
  { time: "16:00", slot: "Afternoon", what: "Sneaker archive store", color: "#6c5ce7", w: 84 },
  { time: "21:30", slot: "Night", what: "Vinyl listening bar", color: "#2b2d42", w: 88 },
];

export function HeroVisual() {
  return (
    <div className="tt-rise relative mx-auto w-full max-w-md lg:max-w-none" style={{ "--d": "250ms" } as React.CSSProperties}>
      <div className="tt-float absolute -top-5 -right-3 z-10 hidden rotate-3 rounded-2xl bg-foreground px-4 py-3 text-background shadow-xl sm:block" style={{ "--d": "800ms" } as React.CSSProperties}>
        <div className="text-[11px] opacity-70">Qloo match</div>
        <div className="font-heading text-3xl leading-none font-semibold">92%</div>
      </div>
      <div className="tt-card-shadow rounded-[1.75rem] border border-border bg-card p-5 sm:p-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Tokyo · Day 1</span>
          <span>Example</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {seeds.map((s, i) => (
            <span key={s.name} className="tt-rise inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium" style={{ "--d": `${400 + i * 120}ms` } as React.CSSProperties}>
              <s.icon className="size-3.5 text-primary" /> {s.name}
            </span>
          ))}
        </div>

        <div className="relative my-3 flex h-16 items-center justify-center" aria-hidden>
          <svg viewBox="0 0 300 64" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
            <path className="tt-flow" d="M40 0 C 40 32, 150 20, 150 32" fill="none" stroke="#e4572e" strokeWidth="1.6" />
            <path className="tt-flow" d="M150 0 L 150 32" fill="none" stroke="#e4572e" strokeWidth="1.6" />
            <path className="tt-flow" d="M250 0 C 250 32, 150 20, 150 32" fill="none" stroke="#e4572e" strokeWidth="1.6" />
            <path className="tt-flow" d="M150 32 L 150 64" fill="none" stroke="#1d1a16" strokeOpacity=".5" strokeWidth="1.6" />
          </svg>
          <span className="relative inline-flex items-center gap-2 rounded-full bg-foreground py-1.5 pr-3.5 pl-1.5 text-xs font-semibold text-background shadow-lg">
            <LogoMark className="size-6" spinning /> Qloo taste graph
          </span>
        </div>

        <ol className="space-y-2">
          {stops.map((s, i) => (
            <li key={s.slot} className="tt-rise flex items-center gap-3 rounded-2xl border border-border bg-background/60 px-3 py-2.5" style={{ "--d": `${800 + i * 140}ms` } as React.CSSProperties}>
              <span className="grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white" style={{ background: s.color }}>{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold" style={{ color: s.color }}>{s.time} · {s.slot}</div>
                <div className="truncate text-sm font-semibold">{s.what}</div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="tt-grow h-full rounded-full" style={{ width: `${s.w}%`, background: s.color, "--d": `${1000 + i * 140}ms` } as React.CSSProperties} />
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
