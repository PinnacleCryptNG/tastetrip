"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, LoaderCircle, Sparkles } from "lucide-react";
import { useState } from "react";
import type { SearchHit } from "@/lib/qloo/api";
import { SAMPLES, type SampleTaste } from "@/lib/samples";
import type { PlanEvent, TasteSeed } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProgressLog } from "./progress-log";
import { TasteInput } from "./taste-input";
import { editKeyFor } from "./trip/trip-view";

type Step = Extract<PlanEvent, { type: "step" }>;

function Segmented<T extends string | number | undefined>({ value, options, onChange, label }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-xl border border-input bg-card p-1 shadow-sm">
      {options.map((o) => (
        <button key={String(o.v)} type="button" role="radio" aria-checked={o.v === value} onClick={() => onChange(o.v)} className={cn("h-10 flex-1 rounded-lg text-sm font-semibold transition", o.v === value ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}>
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

  if (phase !== "form")
    return (
      <section className="mx-auto max-w-xl">
        <h2 className="text-2xl font-extrabold">{phase === "planning" ? `Planning ${city}…` : "That didn't work"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {phase === "planning" ? "The agent is querying Qloo's taste graph live. This usually takes 15–40 seconds." : "No itinerary was made. TasteTrip only plans from Qloo results, so it won't guess."}
        </p>
        <div className="mt-5">
          <ProgressLog steps={steps} />
        </div>
        {phase === "planning" && (
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" /> Working…
          </p>
        )}
        {error && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <div className="font-semibold text-destructive">{error.msg}</div>
            {error.hint && <div className="mt-1 text-muted-foreground">{error.hint}</div>}
            <button type="button" onClick={() => setPhase("form")} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 font-semibold hover:bg-muted">
              <ArrowLeft className="size-4" /> Edit and retry
            </button>
          </div>
        )}
      </section>
    );

  return (
    <form
      className="mx-auto max-w-xl space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready) plan();
      }}
    >
      <div>
        <label htmlFor="city" className="text-sm font-bold">Where are you going?</label>
        <input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Lisbon, Tokyo, Lagos…" autoComplete="off" className="mt-2 h-12 w-full rounded-xl border border-input bg-card px-4 text-[15px] shadow-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-primary/15" />
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
        <input id="date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-input bg-card px-4 text-[15px] shadow-sm outline-none focus:border-primary focus:ring-3 focus:ring-primary/15 sm:w-56" />
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
      <div>
        <div className="text-xs font-semibold text-muted-foreground">Or try one</div>
        <div className="mt-2 flex flex-col gap-2">
          {SAMPLES.map((s) => (
            <button key={s.label} type="button" disabled={!!loadingSample} onClick={() => loadSample(s)} className="flex items-center gap-2 rounded-xl border border-dashed border-input bg-card/60 px-3.5 py-2.5 text-left text-sm font-medium hover:border-primary hover:bg-card disabled:opacity-60">
              {loadingSample === s.label ? <LoaderCircle className="size-4 animate-spin text-primary" /> : <Sparkles className="size-4 text-primary" />}
              {s.label}
            </button>
          ))}
        </div>
      </div>
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <div className="font-semibold text-destructive">{error.msg}</div>
          {error.hint && <div className="mt-0.5 text-muted-foreground">{error.hint}</div>}
        </div>
      )}
      <button type="submit" disabled={!ready} className="h-13 w-full rounded-xl bg-primary text-base font-bold text-primary-foreground shadow-md transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40">
        Plan my trip
      </button>
    </form>
  );
}
