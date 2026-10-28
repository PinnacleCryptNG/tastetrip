"use client";

import { Check, LoaderCircle, TriangleAlert } from "lucide-react";
import type { PlanEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

type Step = Extract<PlanEvent, { type: "step" }>;

const toolLabel: Record<string, string> = {
  "qloo.find_tags": "Qloo /v2/tags",
  "qloo.recommend_places": "Qloo /v2/insights",
  "llm.plan_slots": "Planner LLM",
  "llm.arrange": "Planner LLM",
  "llm.explain": "Planner LLM",
  validator: "Validator",
};

export function ProgressLog({ steps }: { steps: Step[] }) {
  return (
    <ol className="space-y-2" aria-live="polite">
      {steps.map((s) => (
        <li key={s.id} className="flex gap-3 rounded-xl border border-border bg-card px-3.5 py-3 shadow-sm animate-in fade-in slide-in-from-bottom-1">
          <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full", s.status === "run" ? "bg-secondary" : s.status === "ok" ? "bg-accent/10 text-accent" : "bg-amber-100 text-amber-700")}>
            {s.status === "run" ? <LoaderCircle className="size-3.5 animate-spin" /> : s.status === "ok" ? <Check className="size-3.5" /> : <TriangleAlert className="size-3.5" />}
          </span>
          <div className="min-w-0 flex-1">
            {s.tool && <div className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{toolLabel[s.tool] ?? s.tool}</div>}
            <div className="text-sm font-medium">{s.msg}</div>
            {s.detail && <div className="mt-1 font-mono text-[11px] leading-relaxed break-all whitespace-pre-line text-muted-foreground">{s.detail}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
