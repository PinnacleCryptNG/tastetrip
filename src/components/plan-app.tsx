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
    <div role="radiogroup" aria-label={label} className="flex rounded-2xl border border-input bg-background p-1">
      {options.map((o) => (
        <button key={String(o.v)} type="button" role="radio" aria-checked={o.v === value} onClick={() => onChange(o.v)} className={cn("h-10 flex-1 rounded-xl text-sm font-semibold transition", o.v === value ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground")}>
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
        <section className="tt-card-shadow rounded-[1.75rem] border border-border bg-card p-5 sm:p-7">
          <div className="flex items-center gap-4">
            <span className="relative grid size-14 shrink-0 place-items-center">
              {phase === "planning" && <span className="tt-ping absolute inset-2 rounded-full bg-primary/25" />}
              <LogoMark className="relative size-14" spinning={phase === "planning"} />
            </span>
            <div className="min-w-0">
              <h2 className="text-3xl leading-tight font-semibold">{phase === "planning" ? <>Planning <em className="text-primary">{city}</em></> : "That didn't work"}</h2>
              <p className="text-sm text-muted-foreground">
                {phase === "planning" ? `${finished} steps done · ${elapsed}s` : "No itinerary was made. TasteTrip only plans from Qloo results, so it won't guess."}
              </p>
            </div>
          </div>
          {phase === "planning" && (
            <div className="mt-5 h-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${Math.min(95, 6 + finished * 7)}%` }} />
            </div>
          )}
          {error && (
            <div className="mt-5 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <div className="font-semibold text-destructive">{error.msg}</div>
              {error.hint && <div className="mt-1 text-muted-foreground">{error.hint}</div>}
              <button type="button" onClick={() => setPhase("form")} className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-4 font-semibold hover:bg-muted">
                <ArrowLeft className="size-4" /> Edit and retry
              </button>
            </div>
          )}
          <div className="mt-5">
            <ProgressLog steps={steps} />
          </div>
        </section>
      </div>
    );
  }

  return (
    <form
      className="tt-card-shadow space-y-7 rounded-[1.75rem] border border-border bg-card p-5 sm:p-7"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready) plan();
      }}
    >
      <div>
        <div className="text-sm font-semibold">Short on time? Try a sample</div>
        <div className="-mx-5 mt-3 flex snap-x gap-3 overflow-x-auto px-5 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
          {SAMPLES.map((s) => (
            <button key={s.label} type="button" disabled={!!loadingSample} onClick={() => loadSample(s)} className="group w-[15rem] shrink-0 snap-start rounded-2xl border border-border bg-background p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md disabled:opacity-60 sm:w-auto">
              <div className="flex items-center justify-between">
                <span className="font-heading text-xl font-semibold">{s.city}</span>
                {loadingSample === s.label ? <LoaderCircle className="size-4 animate-spin text-primary" /> : <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />}
              </div>
              <ul className="mt-2 space-y-1">
                {s.seeds.map((x) => (
                  <li key={x.query} className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                    <TypeIcon type={x.type} className="size-3 shrink-0 text-primary" /> {x.query}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      </div>
      <div className="border-t border-border pt-6">
        <label htmlFor="city" className="text-sm font-bold">Where are you going?</label>
        <input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Lisbon, Tokyo, Lagos…" autoComplete="off" className="mt-2 h-12 w-full rounded-2xl border border-input bg-background px-4 text-[15px] outline-none transition placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/12" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="text-sm font-bold">How long?</div>
          <div className="mt-2">
            <Segmented label="Days" value={days} onChange={setDays} options={[1, 2, 3].map((v) => ({ v, label: `${v} day${v > 1 ? "s" : ""}` }))} />
          </div>
        </div>
        <div>
          <div className="text-sm font-bold">Budget <span className="font-normal text-muted-foreground">(food &amp; drinks)</span></div>
          <div className="mt-2">
            <Segmented label="Budget" value={budget} onChange={setBudget} options={[{ v: undefined, label: "Any" }, { v: 1, label: "$" }, { v: 2, label: "$$" }, { v: 3, label: "$$$" }]} />
          </div>
        </div>
      </div>
      <div>
        <label htmlFor="date" className="text-sm font-bold">Start date <span className="font-normal text-muted-foreground">(optional, picks places open that day)</span></label>
        <input id="date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-2 block h-12 w-full rounded-2xl border border-input bg-background px-4 text-[15px] outline-none transition placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/12 sm:w-60" />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <div className="text-sm font-bold">Things you love</div>
          <div className="text-xs text-muted-foreground">{seeds.length}/6 · pick at least 3</div>
        </div>
        <div className="mt-2">
          <TasteInput seeds={seeds} onChange={setSeeds} />
        </div>
      </div>
      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <div className="font-semibold text-destructive">{error.msg}</div>
          {error.hint && <div className="mt-0.5 text-muted-foreground">{error.hint}</div>}
        </div>
      )}
      <button type="submit" disabled={!ready} className="group inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none">
        {ready ? "Plan my trip" : seeds.length < 3 ? `Pick ${3 - seeds.length} more thing${3 - seeds.length > 1 ? "s" : ""} you love` : "Add a city"}
        {ready && <ArrowRight className="size-5 transition group-hover:translate-x-0.5" />}
      </button>
    </form>
  );
}
