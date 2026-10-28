"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Check, LoaderCircle, Plus, RefreshCw, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Trip } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TypeIcon } from "../icons";
import { Logo } from "../logo";
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
    <main className="mx-auto max-w-6xl px-4 pt-5 pb-16 sm:px-6">
      <nav className="flex items-center justify-between">
        <Link href="/" aria-label="TasteTrip home">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <button type="button" onClick={share} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-sm font-semibold transition hover:border-foreground/30">
            {copied ? <Check className="size-4 text-accent" /> : <Share2 className="size-4" />} {copied ? "Copied" : "Share"}
          </button>
          <Link href="/#plan" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-semibold text-background transition hover:bg-primary" aria-label="New trip">
            <Plus className="size-4" /> <span className="hidden sm:inline">New trip</span>
          </Link>
        </div>
      </nav>

      <header className="tt-rise mt-10">
        <h1 className="text-[2.6rem] leading-[1] font-semibold sm:text-6xl">
          {trip.days} {trip.days > 1 ? "days" : "day"} in <em className="text-primary">{trip.matchedCity ?? trip.city}</em>
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>For fans of</span>
          {trip.seeds.map((s) => (
            <span key={s.entity_id} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 font-medium text-foreground">
              <TypeIcon type={s.type} className="size-3.5 text-primary" /> {s.name}
            </span>
          ))}
          {trip.budget ? <span className="rounded-full bg-muted px-2.5 py-1 font-semibold text-foreground">Up to {"$".repeat(trip.budget)}</span> : null}
        </div>
        {!editable && <p className="mt-3 text-xs text-muted-foreground">Shared trip · read-only</p>}
      </header>

      {trip.itinerary.length > 1 && (
        <div role="tablist" className="-mx-4 mt-8 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {trip.itinerary.map((x, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === day}
              onClick={() => (setDay(i), setActiveId(undefined))}
              className={cn("max-w-[16rem] shrink-0 snap-start rounded-2xl border px-4 py-2.5 text-left transition", i === day ? "border-foreground bg-foreground text-background shadow-md" : "border-border bg-card hover:border-foreground/30")}
            >
              <div className="text-xs font-semibold opacity-70">Day {i + 1}{x.weekday ? ` · ${x.weekday}` : ""}</div>
              <div className="truncate text-sm font-semibold">{x.theme}</div>
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold">{d.theme}</h2>
              <p className="text-sm text-muted-foreground">{d.stops.length} stops{d.weekday ? `, all open on ${d.weekday}` : ""}</p>
            </div>
            {editable && (
              <button type="button" disabled={!!busy} onClick={() => mutate("regenerate", { day }, `day-${day}`)} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-sm font-semibold transition hover:border-foreground/30 disabled:opacity-50">
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
          <div className="mb-5 h-[min(70vw,20rem)] overflow-hidden rounded-[1.5rem] border border-border lg:hidden">
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
          <div className="tt-card-shadow sticky top-4 h-[calc(100dvh-2rem)] max-h-[720px] overflow-hidden rounded-[1.75rem] border border-border">
            <TripMap stops={d.stops} activeId={activeId} onSelect={select} />
          </div>
        </aside>
      </div>

      <footer className="mt-12 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
        Every stop is a place entity returned by Qloo&apos;s /v2/insights for these tastes ({trip.stats.qlooCalls} Qloo calls
        {trip.stats.rejected ? `; the validator replaced ${trip.stats.rejected} model pick${trip.stats.rejected > 1 ? "s" : ""} that weren't in Qloo's results` : ""}). Match % is Qloo affinity, an aggregate signal of what fans of these tastes tend to like, not a statement about you. Check opening hours before you go.
      </footer>
    </main>
  );
}
