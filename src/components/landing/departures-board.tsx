"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SplitFlap } from "./split-flap";

const ROUTES = [
  { time: "08:30", fans: "Wizkid", to: "Tokyo", match: "92", status: "Boarding" },
  { time: "09:45", fans: "Burna Boy", to: "Lisbon", match: "89", status: "On time" },
  { time: "11:10", fans: "Gilmore Girls", to: "New York", match: "87", status: "Final call" },
  { time: "12:25", fans: "Frank Ocean", to: "Paris", match: "84", status: "On time" },
  { time: "14:05", fans: "Studio Ghibli", to: "Seoul", match: "90", status: "Boarding" },
  { time: "15:40", fans: "Frida Kahlo", to: "Mexico City", match: "86", status: "On time" },
  { time: "17:20", fans: "Fela Kuti", to: "Lagos", match: "95", status: "Gate open" },
  { time: "19:00", fans: "Wes Anderson", to: "London", match: "81", status: "On time" },
];
const ROWS = 5;
const statusColor: Record<string, string> = { Boarding: "text-[#5ef0b2]", "Final call": "text-[#ff7a5c]", "Gate open": "text-[#7fb0ff]" };

export function DeparturesBoard() {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setOffset((o) => (o + 1) % ROUTES.length), 3800);
    return () => clearInterval(iv);
  }, []);
  const rows = Array.from({ length: ROWS }, (_, i) => ROUTES[(offset + i) % ROUTES.length]);

  return (
    <div className="relative overflow-hidden rounded-xl bg-[#0b0d17] p-3 text-[10px] shadow-[0_30px_80px_-20px_rgb(0_0_0/.6)] ring-1 ring-white/10 min-[420px]:text-[11px] sm:p-5 sm:text-[13px] lg:text-[15px]">
      <div className="mb-3 flex items-center justify-between gap-3 font-mono text-[10px] tracking-[0.18em] text-white/60 uppercase sm:mb-4 sm:text-xs">
        <span className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-[#5ef0b2] tt-blink" /> Departures by taste
        </span>
        <span>Example routes</span>
      </div>
      <div className="grid grid-cols-[auto_auto_auto] gap-x-[0.9em] gap-y-[0.45em] sm:grid-cols-[auto_auto_auto_auto_auto]">
        {["Time", "For fans of", "To", "Match", "Status"].map((h, i) => (
          <div key={h} className={cn("font-mono text-[0.75em] tracking-[0.14em] text-white/45 uppercase", (i === 0 || i === 4) && "hidden sm:block")}>
            {h}
          </div>
        ))}
        {rows.map((r, i) => (
          <div key={i} className="contents">
            <SplitFlap className="hidden sm:inline-flex" text={r.time} length={5} delay={i * 90} />
            <SplitFlap text={r.fans} length={13} delay={i * 90} />
            <SplitFlap text={r.to} length={11} delay={i * 90 + 40} />
            <SplitFlap text={r.match + "%"} length={3} delay={i * 90 + 80} cellClassName="text-white" />
            <SplitFlap className="hidden sm:inline-flex" text={r.status} length={10} delay={i * 90 + 120} cellClassName={statusColor[r.status] ?? "text-white/85"} />
          </div>
        ))}
      </div>
    </div>
  );
}
