"use client";

import { ExternalLink, LoaderCircle, Shuffle, Star } from "lucide-react";
import { SLOT_LABEL, SLOT_TIME, type Stop } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SLOT_COLOR } from "./slot-style";

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
    <li id={`stop-${stop.entity_id}`} className="tt-rise relative pl-12" style={{ "--d": `${(n - 1) * 90}ms` } as React.CSSProperties}>
      <span className="absolute top-5 left-[15px] h-[calc(100%+0.75rem)] w-px bg-border" aria-hidden />
      <button type="button" onClick={onSelect} className="absolute top-4 left-0 grid size-8 place-items-center rounded-full text-xs font-bold text-white shadow" style={{ background: color }} aria-label={`Show ${stop.name} on map`}>
        {n}
      </button>
      <article className={cn("rounded-[1.5rem] border bg-card p-4 transition sm:p-5", active ? "border-foreground/30 shadow-lg ring-2 ring-foreground/10" : "border-border shadow-sm hover:shadow-md", busy && "opacity-60")}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold" style={{ color }}>
              {SLOT_TIME[stop.slot]} · {SLOT_LABEL[stop.slot]}
              <span className="font-medium text-muted-foreground"> · {stop.query.tagName ?? stop.query.label}</span>
            </div>
            <h3 className="mt-1 text-xl leading-tight font-semibold">{stop.name}</h3>
            {(stop.neighborhood || stop.address) && <p className="mt-0.5 truncate text-sm text-muted-foreground">{stop.neighborhood ?? stop.address}</p>}
          </div>
          {pct != null && (
            <div className="shrink-0 text-right" title="Qloo affinity: how strongly fans of your tastes over-index on this place">
              <div className="font-heading text-3xl leading-none font-semibold">{pct}%</div>
              <div className="mt-1 text-[11px] text-muted-foreground">Qloo match</div>
            </div>
          )}
        </div>

        <div className="mt-3 rounded-2xl bg-secondary/70 p-3.5">
          <div className="text-xs font-bold">Why this fits you</div>
          <p className="mt-1 text-sm leading-relaxed">{stop.why}</p>
          {bars.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {bars.map((b) => (
                <li key={b.entity_id} className="grid grid-cols-[minmax(0,7.5rem)_1fr_2.5rem] items-center gap-2 text-xs">
                  <span className="truncate font-medium">{b.seed_name}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-background">
                    <span className="tt-grow block h-full rounded-full" style={{ width: `${Math.max(4, Math.round(b.score * 100))}%`, background: color }} />
                  </span>
                  <span className="text-right text-muted-foreground tabular-nums">{Math.round(b.score * 100)}%</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {stop.price_level ? <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">{"$".repeat(stop.price_level)}</span> : null}
          {stop.rating ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">
              <Star className="size-3 fill-current text-amber-500" /> {stop.rating.toFixed(1)}
            </span>
          ) : null}
          {stop.tags.slice(0, 4).map((t) => (
            <span key={t} className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
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
            <button type="button" onClick={onSwap} disabled={busy} className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-semibold transition hover:border-foreground/30 hover:bg-muted disabled:opacity-50">
              {busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <Shuffle className="size-3.5" />} Swap
            </button>
          )}
        </div>
      </article>
    </li>
  );
}
