"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { SearchHit } from "@/lib/qloo/api";
import { SAMPLES, type SampleTaste } from "@/lib/samples";
import type { PlanEvent, TasteSeed } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TypeIcon } from "./icons";
import { LogoMark } from "./logo";
import { ProgressLog } from "./progress-log";
import { TasteInput } from "./taste-input";
import { editKeyFor } from "./trip/trip-view";

type Step = Extract<PlanEvent, { type: "step" }>;

function Segmented<T extends string | number | undefined>({ value, options, onChange, label }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-md border border-input bg-background p-1">
      {options.map((o) => (
        <button key={String(o.v)} type="button" role="radio" aria-checked={o.v === value} onClick={() => onChange(o.v)} className={cn("h-10 flex-1 rounded-[5px] font-mono text-sm font-bold transition", o.v === value ? "bg-[#0b0d17] text-[#ffd23f]" : "text-muted-foreground hover:text-foreground")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function PlanApp() {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [days, setDays] = useState(2);
  const [budget, setBudget] = useState<number | undefined>(undefined);
  const [startDate, setStartDate] = useState("");
  const [seeds, setSeeds] = useState<TasteSeed[]>([]);
  const [phase, setPhase] = useState<"form" | "planning" | "error">("form");
  const [steps, setSteps] = useState<Step[]>([]);
  const [error, setError] = useState<{ msg: string; hint?: string } | null>(null);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase === "form") return;
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (phase !== "planning") return;
    const t0 = Date.now();
    setElapsed(0);
    const iv = setInterval(() => setElapsed(Math.round((Date.now() - t0) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [phase]);

  const ready = city.trim().length >= 2 && seeds.length >= 3;

  async function loadSample(s: SampleTaste) {
    setLoadingSample(s.label);
    setError(null);
    try {
      const found = await Promise.all(
        s.seeds.map(async ({ query, type }) => {
          const r = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${type}&take=1`);
          const j = await r.json();
          if (!r.ok) throw Object.assign(new Error(j.error ?? "Qloo search failed"), { hint: j.hint });
          const h: SearchHit | undefined = j.hits?.[0];
          return h ? { entity_id: h.entity_id, name: h.name, type: h.type } : null;
        }),
      );
      setSeeds(found.filter((x): x is TasteSeed => !!x));
      setCity(s.city);
      setDays(s.days);
      setBudget(undefined);
    } catch (e) {
      setError({ msg: (e as Error).message, hint: (e as { hint?: string }).hint });
    } finally {
      setLoadingSample(null);
    }
  }

  async function plan() {
    setPhase("planning");
    setSteps([]);
    setError(null);
    try {
      const r = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: city.trim(), days, budget, startDate: startDate || undefined, seeds }),
      });
      if (!r.ok || !r.body) {
        const j = await r.json().catch(() => ({}));
        throw Object.assign(new Error(j.error ?? "Couldn't start planning"), { hint: j.hint });
      }
      const reader = r.body.pipeThrough(new TextDecoderStream()).getReader();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += value;
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const ev = JSON.parse(line) as PlanEvent;
          if (ev.type === "step") setSteps((prev) => (prev.some((p) => p.id === ev.id) ? prev.map((p) => (p.id === ev.id ? ev : p)) : [...prev, ev]));
          else if (ev.type === "error") throw Object.assign(new Error(ev.msg), { hint: ev.hint });
          else if (ev.type === "done") {
            localStorage.setItem(editKeyFor(ev.tripId), ev.editKey);
            router.push(`/t/${ev.tripId}`);
            return;
          }
        }
      }
      throw new Error("The planner stopped before finishing.");
    } catch (e) {
      setError({ msg: (e as Error).message, hint: (e as { hint?: string }).hint });
      setPhase("error");
    }
  }

  if (phase !== "form") {
    const finished = steps.filter((x) => x.status !== "run").length;
    return (
      <div ref={top} className="scroll-mt-4">
        <section className="overflow-hidden rounded-xl bg-[#0b0d17] text-white shadow-[0_30px_80px_-30px_rgb(0_0_0/.6)]">
          <div className="flex items-center gap-4 border-b border-white/10 p-5 sm:p-6">
            <span className="relative grid size-12 shrink-0 place-items-center">
              {phase === "planning" && <span className="tt-ping absolute inset-1 rounded-lg bg-[#ffd23f]/30" />}
              <LogoMark className="relative size-12" busy={phase === "planning"} />
            </span>
            <div className="min-w-0">
              <div className="font-mono text-[10px] tracking-[0.18em] text-white/50 uppercase">{phase === "planning" ? "Now planning" : "Cancelled"}</div>
              <h2 className="mt-1 truncate text-4xl text-[#ffd23f]">{phase === "planning" ? city : "That didn't work"}</h2>
            </div>
            {phase === "planning" && (
              <div className="ml-auto text-right font-mono text-[11px] text-white/60">
                <div className="text-2xl font-bold text-white tabular-nums">{elapsed}s</div>
                {finished} done
              </div>
            )}
          </div>
          {phase === "planning" && (
            <div className="h-1 bg-white/10">
              <div className="h-full bg-[#ffd23f] transition-all duration-700" style={{ width: `${Math.min(95, 6 + finished * 7)}%` }} />
            </div>
          )}
          {error && (
            <div className="m-5 rounded-md border border-[#ff7a5c]/40 bg-[#ff7a5c]/10 p-4 text-sm">
              <div className="font-semibold text-[#ff9c84]">{error.msg}</div>
              {error.hint && <div className="mt-1 text-white/70">{error.hint}</div>}
              <p className="mt-2 text-white/50">No itinerary was made. TasteTrip only plans from Qloo results, so it won&apos;t guess.</p>
              <button type="button" onClick={() => setPhase("form")} className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-md bg-[#ffd23f] px-4 font-bold text-[#0b0d17]">
                <ArrowLeft className="size-4" /> Edit and retry
              </button>
            </div>
          )}
          <div className="p-3 sm:p-5">
            <ProgressLog steps={steps} />
          </div>
        </section>
      </div>
    );
  }

  const need = seeds.length < 3 ? `Pick ${3 - seeds.length} more thing${3 - seeds.length > 1 ? "s" : ""} you love` : "Add a destination";
  return (
    <form
      className="rounded-xl border border-border bg-card shadow-[0_24px_60px_-30px_rgb(11_13_23/.35)]"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready) plan();
      }}
    >
      <div className="flex items-center justify-between rounded-t-[11px] bg-[#0b0d17] px-5 py-3 font-mono text-[11px] tracking-[0.18em] text-white/70 uppercase sm:px-7">
        <span>Boarding pass</span>
        <span className="text-[#ffd23f]">No login</span>
      </div>
      <div className="space-y-7 p-5 sm:p-7">
        <div>
          <div className="font-mono text-[11px] font-bold tracking-[0.16em] text-muted-foreground uppercase">Popular routes · one tap</div>
          <div className="-mx-5 mt-3 flex snap-x gap-3 overflow-x-auto px-5 pb-1 [clip-path:inset(0)] sm:[clip-path:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
            {SAMPLES.map((s) => (
              <button key={s.label} type="button" disabled={!!loadingSample} onClick={() => loadSample(s)} className="group w-[14.5rem] shrink-0 snap-start overflow-hidden rounded-lg border border-border bg-background text-left transition hover:-translate-y-0.5 hover:border-primary hover:shadow-lg disabled:opacity-60 sm:w-auto">
                <div className="flex items-center justify-between bg-primary px-3.5 py-2 text-white">
                  <span className="font-heading text-2xl leading-none font-extrabold uppercase">{s.city}</span>
                  {loadingSample === s.label ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />}
                </div>
                <ul className="space-y-1 px-3.5 py-3">
                  {s.seeds.map((x) => (
                    <li key={x.query} className="flex items-center gap-1.5 truncate text-xs font-medium">
                      <TypeIcon type={x.type} className="size-3 shrink-0 text-primary" /> {x.query}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </div>
        <div className="tt-dash-x" />
        <div>
          <label htmlFor="city" className="font-mono text-[11px] font-bold tracking-[0.16em] text-muted-foreground uppercase">Destination</label>
          <input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Lisbon, Tokyo, Lagos…" autoComplete="off" className="mt-2 h-12 w-full rounded-md border border-input bg-background px-4 text-[15px] font-semibold outline-none transition placeholder:font-normal placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/15 font-heading text-2xl uppercase placeholder:font-sans placeholder:text-[15px] placeholder:normal-case" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <div className="font-mono text-[11px] font-bold tracking-[0.16em] text-muted-foreground uppercase">Duration</div>
            <div className="mt-2">
              <Segmented label="Days" value={days} onChange={setDays} options={[1, 2, 3].map((v) => ({ v, label: `${v} day${v > 1 ? "s" : ""}` }))} />
            </div>
          </div>
          <div>
            <div className="font-mono text-[11px] font-bold tracking-[0.16em] text-muted-foreground uppercase">Class <span className="normal-case tracking-normal font-normal">· food &amp; drink budget</span></div>
            <div className="mt-2">
              <Segmented label="Budget" value={budget} onChange={setBudget} options={[{ v: undefined, label: "Any" }, { v: 1, label: "$" }, { v: 2, label: "$$" }, { v: 3, label: "$$$" }]} />
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="date" className="font-mono text-[11px] font-bold tracking-[0.16em] text-muted-foreground uppercase">Departs <span className="normal-case tracking-normal font-normal">· optional, picks places open that day</span></label>
          <input id="date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-2 block h-12 w-full rounded-md border border-input bg-background px-4 text-[15px] font-semibold outline-none transition placeholder:font-normal placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/15 font-mono sm:w-60" />
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <div className="font-mono text-[11px] font-bold tracking-[0.16em] text-muted-foreground uppercase">Passenger tastes</div>
            <div className="font-mono text-[11px] text-muted-foreground">{seeds.length}/6 · min 3</div>
          </div>
          <div className="mt-2">
            <TasteInput seeds={seeds} onChange={setSeeds} />
          </div>
        </div>
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <div className="font-semibold text-destructive">{error.msg}</div>
            {error.hint && <div className="mt-0.5 text-muted-foreground">{error.hint}</div>}
          </div>
        )}
      </div>
      <div className="tt-perf-x -mt-1.5 bg-transparent" />
      <div className="rounded-b-[11px] bg-secondary p-5 sm:p-7">
        <button type="submit" disabled={!ready} className="group inline-flex h-14 w-full items-center justify-center gap-2 rounded-md bg-[#ffd23f] text-base font-bold text-[#0b0d17] shadow-[0_6px_0_#c99f12] transition active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:bg-[#e4e6ee] disabled:text-muted-foreground disabled:shadow-none">
          {ready ? "Plan my trip" : need}
          {ready && <ArrowRight className="size-5 transition group-hover:translate-x-0.5" />}
        </button>
      </div>
    </form>
  );
}
