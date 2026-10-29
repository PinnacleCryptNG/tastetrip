"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, LoaderCircle, Plus, RefreshCw, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Trip } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TypeIcon } from "../icons";
import { Logo } from "../logo";
import { WorldBackdrop } from "../landing/world-backdrop";
import { StopCard } from "./stop-card";

const TripMap = dynamic(() => import("./trip-map"), { ssr: false, loading: () => <div className="h-full w-full animate-pulse bg-muted" /> });

export const editKeyFor = (id: string) => `tt:edit:${id}`;

export function TripView({ initial }: { initial: Trip }) {
  const [trip, setTrip] = useState(initial);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [day, setDay] = useState(0);
  const [activeId, setActiveId] = useState<string>();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<{ msg: string; hint?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => setEditKey(localStorage.getItem(editKeyFor(initial.id))), [initial.id]);
  useEffect(() => {
    document.querySelector<HTMLElement>(`[data-day-tab="${day}"]`)?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [day]);

  const d = trip.itinerary[day];
  const editable = !!editKey;

  async function mutate(path: "swap" | "regenerate", body: object, busyKey: string) {
    setBusy(busyKey);
    setError(null);
    try {
      const r = await fetch(`/api/trips/${trip.id}/${path}`, { method: "POST", headers: { "Content-Type": "application/json", "x-edit-key": editKey ?? "" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok) throw Object.assign(new Error(j.error ?? "Something went wrong"), { hint: j.hint });
      setTrip(j.trip);
    } catch (e) {
      setError({ msg: (e as Error).message, hint: (e as { hint?: string }).hint });
    } finally {
      setBusy(null);
    }
  }

  async function share() {
    const url = `${window.location.origin}/t/${trip.id}`;
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) await navigator.share({ title: `TasteTrip: ${trip.city}`, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {}
  }

  const select = (id: string) => {
    setActiveId(id);
    document.getElementById(`stop-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  return (
    <main className="pb-16">
      <div className="relative isolate overflow-hidden bg-[var(--tt-primary)] text-white">
        <WorldBackdrop className="absolute inset-0 -z-10 opacity-70" />
        <div className="mx-auto max-w-6xl px-4 pt-5 pb-8 sm:px-6">
          <nav className="flex items-center justify-between">
            <Link href="/" aria-label="TasteTrip home">
              <Logo tone="light" />
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle className="text-white ring-1 ring-white/35 hover:bg-white/10" />
              <button type="button" onClick={share} className="inline-flex h-10 items-center gap-1.5 rounded-md px-3.5 text-sm font-bold ring-1 ring-white/35 transition hover:bg-white/10">
                {copied ? <Check className="size-4 text-[var(--tt-accent)]" /> : <Share2 className="size-4" />} {copied ? "Copied" : "Share"}
              </button>
              <Link href="/#plan" className="inline-flex h-10 items-center gap-1.5 rounded-md bg-[var(--tt-accent)] px-3.5 text-sm font-bold text-[var(--tt-ink)]" aria-label="New trip">
                <Plus className="size-4" /> <span className="hidden sm:inline">New trip</span>
              </Link>
            </div>
          </nav>

          <header className="tt-rise mt-10">
            <div className="font-mono text-[11px] tracking-[0.18em] text-white/60 uppercase">
              {trip.days} {trip.days > 1 ? "days" : "day"} · {trip.itinerary.reduce((n, x) => n + x.stops.length, 0)} stops{trip.budget ? ` · up to ${"$".repeat(trip.budget)}` : ""}{!editable ? " · shared, read-only" : ""}
            </div>
            <h1 className="mt-2 text-[clamp(4rem,16vw,9rem)] leading-[0.82] font-black break-words">
              {trip.matchedCity ?? trip.city}
            </h1>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-mono text-[11px] tracking-[0.16em] text-white/60 uppercase">{trip.seeds.length ? "For fans of" : "Qloo's best-loved spots"}</span>
              {trip.seeds.map((s) => (
                <span key={s.entity_id} className="inline-flex items-center gap-1.5 rounded-md bg-[var(--tt-ink)] px-2.5 py-1 font-semibold">
                  <TypeIcon type={s.type} className="size-3.5 text-[var(--tt-accent)]" /> {s.name}
                </span>
              ))}
            </div>
          </header>

          {trip.itinerary.length > 1 && (
            <div role="tablist" className="-mx-4 mt-8 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
              {trip.itinerary.map((x, i) => (
                <button
                  key={i}
                  role="tab"
                  data-day-tab={i}
                  aria-selected={i === day}
                  onClick={() => (setDay(i), setActiveId(undefined))}
                  className={cn("max-w-[16rem] shrink-0 snap-start rounded-md px-4 py-2.5 text-left transition", i === day ? "bg-[var(--tt-accent)] text-[var(--tt-ink)] shadow-[0_5px_0_var(--tt-accent-deep)]" : "bg-white/10 text-white hover:bg-white/20")}
                >
                  <div className="font-mono text-[10px] font-bold tracking-[0.16em] uppercase opacity-70">Day {String(i + 1).padStart(2, "0")}{x.weekday ? ` · ${x.weekday}` : ""}</div>
                  <div className="truncate text-sm font-bold">{x.theme}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-4xl sm:text-5xl">{d.theme}</h2>
              {trip.itinerary.length > 3 && (
                <div className="mt-1 flex items-center gap-1 font-mono text-xs font-bold">
                  <button type="button" aria-label="Previous day" disabled={day === 0} onClick={() => (setDay(day - 1), setActiveId(undefined))} className="grid size-7 place-items-center rounded-md bg-[var(--tt-ink)] text-[var(--tt-accent)] disabled:opacity-30"><ChevronLeft className="size-4" /></button>
                  <span className="px-1.5 tracking-[0.12em] uppercase">Day {day + 1} / {trip.itinerary.length}</span>
                  <button type="button" aria-label="Next day" disabled={day === trip.itinerary.length - 1} onClick={() => (setDay(day + 1), setActiveId(undefined))} className="grid size-7 place-items-center rounded-md bg-[var(--tt-ink)] text-[var(--tt-accent)] disabled:opacity-30"><ChevronRight className="size-4" /></button>
                </div>
              )}
              <p className="text-sm text-muted-foreground">{d.stops.length} stops{d.weekday && d.stops.length && d.stops.every((s) => s.query.weekday) ? `, all open on ${d.weekday}` : ""}</p>
            </div>
            {editable && (
              <button type="button" disabled={!!busy} onClick={() => mutate("regenerate", { day }, `day-${day}`)} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-md bg-[var(--tt-ink)] px-3.5 text-sm font-bold text-[var(--tt-accent)] transition hover:bg-primary hover:text-white disabled:opacity-50">
                <RefreshCw className={cn("size-4", busy === `day-${day}` && "animate-spin")} /> <span className="hidden sm:inline">Regenerate day</span><span className="sm:hidden">Redo day</span>
              </button>
            )}
          </div>
          {error && (
            <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <div className="font-semibold text-destructive">{error.msg}</div>
              {error.hint && <div className="mt-0.5 text-muted-foreground">{error.hint}</div>}
            </div>
          )}
          <div className="mb-5 h-[min(70vw,20rem)] overflow-hidden rounded-xl border border-border lg:hidden">
            <TripMap stops={d.stops} activeId={activeId} onSelect={select} />
          </div>
          <ol key={`${day}-${d.stops.map((s) => s.entity_id).join()}`} className={cn("space-y-3", busy === `day-${day}` && "pointer-events-none opacity-50")}>
            {d.stops.map((s, i) => (
              <StopCard
                key={s.entity_id}
                stop={s}
                n={i + 1}
                active={s.entity_id === activeId}
                editable={editable}
                busy={busy === `stop-${day}-${i}`}
                onSelect={() => select(s.entity_id)}
                onSwap={() => mutate("swap", { day, stop: i }, `stop-${day}-${i}`)}
              />
            ))}
          </ol>
          {busy === `day-${day}` && (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" /> Asking Qloo for fresh places…
            </p>
          )}
        </section>
        <aside className="hidden lg:block">
          <div className="sticky top-4 h-[calc(100dvh-2rem)] max-h-[720px] overflow-hidden rounded-xl border border-border shadow-[0_24px_60px_-30px_rgb(11_13_23/.35)]">
            <TripMap stops={d.stops} activeId={activeId} onSelect={select} />
          </div>
        </aside>
      </div>

      <footer className="mt-12 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
        Every stop is a place entity returned by Qloo&apos;s /v2/insights for these tastes ({trip.stats.qlooCalls} Qloo calls
        {trip.stats.rejected ? `; the validator replaced ${trip.stats.rejected} model pick${trip.stats.rejected > 1 ? "s" : ""} that weren't in Qloo's results` : ""}). Match % is Qloo affinity, an aggregate signal of what fans of these tastes tend to like, not a statement about you. Check opening hours before you go.
      </footer>
      </div>
    </main>
  );
}
