"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SplitFlap } from "./split-flap";

const ROUTES = [
  { time: "08:30", fans: "Frank Ocean", to: "Paris", match: "92", status: "Boarding" },
  { time: "09:15", fans: "BTS", to: "Seoul", match: "94", status: "On time" },
  { time: "10:05", fans: "Bad Bunny", to: "CDMX", match: "89", status: "Final call" },
  { time: "11:20", fans: "Black Coffee", to: "Cape Town", match: "91", status: "Boarding" },
  { time: "12:40", fans: "Tame Impala", to: "Sydney", match: "86", status: "On time" },
  { time: "13:55", fans: "Studio Ghibli", to: "Kyoto", match: "93", status: "Gate open" },
  { time: "14:30", fans: "Bjork", to: "Reykjavik", match: "88", status: "On time" },
  { time: "15:45", fans: "Bollywood", to: "Mumbai", match: "90", status: "Boarding" },
  { time: "16:50", fans: "Gilmore Girls", to: "New York", match: "87", status: "Final call" },
  { time: "17:35", fans: "Rosalia", to: "Barcelona", match: "85", status: "On time" },
  { time: "18:20", fans: "Fela Kuti", to: "Lagos", match: "95", status: "Gate open" },
  { time: "19:10", fans: "Wes Anderson", to: "Budapest", match: "84", status: "On time" },
  { time: "20:25", fans: "Shakira", to: "Bogota", match: "88", status: "Boarding" },
  { time: "21:40", fans: "Anime", to: "Bangkok", match: "83", status: "On time" },
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
      <div className="hidden grid-cols-[auto_auto_auto_auto_auto] gap-x-[0.9em] gap-y-[0.45em] sm:grid">
        {["Time", "For fans of", "To", "Match", "Status"].map((h) => (
          <div key={h} className="font-mono text-[0.75em] tracking-[0.14em] text-white/45 uppercase">
            {h}
          </div>
        ))}
        {rows.map((r, i) => (
          <div key={i} className="contents">
            <SplitFlap text={r.time} length={5} delay={i * 90} />
            <SplitFlap text={r.fans} length={13} delay={i * 90} />
            <SplitFlap text={r.to} length={11} delay={i * 90 + 40} />
            <SplitFlap text={r.match + "%"} length={3} delay={i * 90 + 80} cellClassName="text-white" />
            <SplitFlap text={r.status} length={10} delay={i * 90 + 120} cellClassName={statusColor[r.status] ?? "text-white/85"} />
          </div>
        ))}
      </div>
      <ul className="space-y-3 text-[12px] min-[400px]:text-[13px] sm:hidden">
        {rows.slice(0, 4).map((r, i) => (
          <li key={i} className="space-y-[3px]">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[9px] tracking-[0.14em] text-white/45 uppercase">Fans of</span>
              <SplitFlap text={r.fans} length={13} delay={i * 90} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[9px] tracking-[0.14em] text-white/45 uppercase">To · match</span>
              <span className="flex gap-[0.6em]">
                <SplitFlap text={r.to} length={9} delay={i * 90 + 40} />
                <SplitFlap text={r.match + "%"} length={3} delay={i * 90 + 80} cellClassName="text-white" />
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
