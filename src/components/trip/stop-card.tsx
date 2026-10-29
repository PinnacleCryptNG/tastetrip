"use client";

import { ExternalLink, LoaderCircle, Shuffle, Star } from "lucide-react";
import { SLOT_LABEL, SLOT_TIME, type Stop } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Stamp } from "../stamp";
import { SLOT_COLOR, SLOT_PIN } from "./slot-style";

const mapsUrl = (s: Stop) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([s.name, s.address].filter(Boolean).join(", ") || `${s.lat},${s.lon}`)}`;

export function StopCard({
  stop,
  n,
  active,
  editable,
  busy,
  onSwap,
  onSelect,
}: {
  stop: Stop;
  n: number;
  active?: boolean;
  editable?: boolean;
  busy?: boolean;
  onSwap?: () => void;
  onSelect?: () => void;
}) {
  const color = SLOT_COLOR[stop.slot];
  const pct = stop.affinity != null ? Math.round(stop.affinity * 100) : null;
  const bars = [...stop.explain].sort((a, b) => b.score - a.score).slice(0, 4);
  return (
    <li id={`stop-${stop.entity_id}`} className="tt-rise" style={{ "--d": `${(n - 1) * 90}ms` } as React.CSSProperties}>
      <article className={cn("relative grid grid-cols-[4.25rem_1px_minmax(0,1fr)] overflow-hidden rounded-xl border bg-card transition sm:grid-cols-[5.5rem_1px_minmax(0,1fr)]", active ? "border-primary shadow-lg ring-2 ring-primary/20" : "border-border shadow-sm hover:shadow-md", busy && "opacity-60")}>
        <button type="button" onClick={onSelect} className="flex flex-col items-center gap-1.5 bg-[var(--tt-ink)] px-1 py-4 text-white" aria-label={`Show ${stop.name} on map`}>
          <span className="grid size-7 place-items-center rounded-full font-mono text-xs font-bold text-white ring-1 ring-white/30" style={{ background: SLOT_PIN[stop.slot] }}>{n}</span>
          <span className="font-mono text-base font-bold text-[var(--tt-accent)] sm:text-xl">{SLOT_TIME[stop.slot]}</span>
          <span className="font-mono text-[9px] tracking-[0.14em] text-white/55 uppercase">{SLOT_LABEL[stop.slot]}</span>
        </button>
        <div className="tt-dash-y" />
        <div className="min-w-0 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate font-mono text-[10px] font-bold tracking-[0.14em] uppercase" style={{ color }}>
              {stop.query.tagName ?? stop.query.label}
            </div>
            <h3 className="mt-1 text-3xl leading-[0.95] sm:text-4xl">{stop.name}</h3>
            {(stop.neighborhood || stop.address) && <p className="mt-1 truncate text-sm text-muted-foreground">{stop.neighborhood ?? stop.address}</p>}
          </div>
          {pct != null && <Stamp value={pct} rotate={-8 + ((n * 7) % 14)} delay={n * 90 + 250} className="size-[4.5rem] [&_.font-heading]:text-[1.6rem]" />}
        </div>

        <div className="mt-3 rounded-md bg-secondary p-3.5">
          <div className="font-mono text-[10px] font-bold tracking-[0.16em] uppercase">{stop.explain.length ? "Why this fits you" : "Why go"}</div>
          <p className="mt-1 text-sm leading-relaxed">{stop.why}</p>
          {bars.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {bars.map((b) => (
                <li key={b.entity_id} className="grid grid-cols-[minmax(0,7.5rem)_1fr_2.5rem] items-center gap-2 text-xs">
                  <span className="truncate font-medium">{b.seed_name}</span>
                  <span className="h-1.5 overflow-hidden rounded-sm bg-background">
                    <span className="tt-grow block h-full" style={{ width: `${Math.max(4, Math.round(b.score * 100))}%`, background: color }} />
                  </span>
                  <span className="text-right font-mono text-muted-foreground">{Math.round(b.score * 100)}%</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {stop.price_level ? <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs font-semibold">{"$".repeat(stop.price_level)}</span> : null}
          {stop.rating ? (
            <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 font-mono text-xs font-semibold">
              <Star className="size-3 fill-current text-amber-500" /> {stop.rating.toFixed(1)}
            </span>
          ) : null}
          {stop.tags.slice(0, 4).map((t) => (
            <span key={t} className="rounded border border-border px-2 py-0.5 text-xs text-muted-foreground">
              {t}
            </span>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
          <a href={mapsUrl(stop)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
            <ExternalLink className="size-3.5" /> Directions
          </a>
          {stop.website && (
            <a href={stop.website} target="_blank" rel="noreferrer" className="text-xs font-semibold text-muted-foreground hover:text-foreground">
              Website
            </a>
          )}
          {editable && (
            <button type="button" onClick={onSwap} disabled={busy} className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-md bg-[var(--tt-ink)] px-3 text-xs font-bold text-[var(--tt-accent)] transition hover:bg-primary hover:text-white disabled:opacity-50">
              {busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <Shuffle className="size-3.5" />} Swap
            </button>
          )}
        </div>
        </div>
      </article>
    </li>
  );
}
