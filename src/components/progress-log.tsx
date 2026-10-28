"use client";

import type { PlanEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

type Step = Extract<PlanEvent, { type: "step" }>;

const toolLabel: Record<string, string> = {
  "qloo.find_tags": "QLOO /V2/TAGS",
  "qloo.recommend_places": "QLOO /V2/INSIGHTS",
  "llm.plan_slots": "PLANNER",
  "llm.arrange": "PLANNER",
  "llm.explain": "PLANNER",
  validator: "VALIDATOR",
};
const status = {
  run: { label: "Boarding", cls: "text-[#ffd23f] tt-blink" },
  ok: { label: "Landed", cls: "text-[#5ef0b2]" },
  warn: { label: "Delayed", cls: "text-[#ff7a5c]" },
} as const;

export function ProgressLog({ steps }: { steps: Step[] }) {
  return (
    <ol className="divide-y divide-white/8" aria-live="polite">
      {steps.map((s) => {
        const st = status[s.status as keyof typeof status] ?? status.ok;
        return (
          <li key={s.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 px-2 py-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="min-w-0">
              {s.tool && <div className="font-mono text-[10px] font-bold tracking-[0.14em] text-[#7fb0ff]">{toolLabel[s.tool] ?? s.tool.toUpperCase()}</div>}
              <div className="text-sm font-medium text-white">{s.msg}</div>
              {s.detail && <div className="mt-1 font-mono text-[11px] leading-relaxed break-all whitespace-pre-line text-white/45">{s.detail}</div>}
            </div>
            <span className={cn("self-start pt-0.5 font-mono text-[10px] font-bold tracking-[0.14em] uppercase", st.cls)}>{st.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
