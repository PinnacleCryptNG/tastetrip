"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:-+";

function pad(s: string, n: number) {
  return s.toUpperCase().slice(0, n).padEnd(n, " ");
}

export function SplitFlap({ text, length, className, cellClassName, delay = 0 }: { text: string; length: number; className?: string; cellClassName?: string; delay?: number }) {
  const target = pad(text, length);
  const [shown, setShown] = useState(target);
  const first = useRef(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(target);
      return;
    }
    const start = first.current ? pad("", length) : null;
    first.current = false;
    const settle = Array.from({ length }, (_, i) => 4 + i * 1.3 + Math.random() * 4);
    let tick = 0;
    let iv: ReturnType<typeof setInterval>;
    const t0 = setTimeout(() => {
      iv = setInterval(() => {
        tick++;
        setShown((prev) => {
          const base = start ?? prev;
          let out = "";
          for (let i = 0; i < length; i++) {
            if (tick >= settle[i]) out += target[i];
            else if (target[i] === " " && base[i] === " ") out += " ";
            else out += CHARS[(Math.random() * CHARS.length) | 0];
          }
          return out;
        });
        if (tick > Math.max(...settle)) clearInterval(iv);
      }, 55);
    }, delay);
    return () => {
      clearTimeout(t0);
      clearInterval(iv);
    };
  }, [target, length, delay]);

  return (
    <span className={cn("inline-flex gap-[2px]", className)} aria-label={text}>
      {shown.split("").map((c, i) => (
        <span key={i} className={cn("tt-flap", cellClassName)} data-blank={c === " " ? "" : undefined} aria-hidden>
          <span key={c + i}>{c === " " ? "\u00a0" : c}</span>
        </span>
      ))}
    </span>
  );
}
