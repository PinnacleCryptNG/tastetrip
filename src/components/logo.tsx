import { cn } from "@/lib/utils";

export function LogoMark({ className, spinning }: { className?: string; spinning?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" className={cn(spinning && "tt-spinning", className)} aria-hidden>
      <path d="M16 1.5C8.8 1.5 3 7.1 3 14.1c0 9 11.3 16.6 12.1 17.1a1.6 1.6 0 0 0 1.8 0C17.7 30.7 29 23.1 29 14.1 29 7.1 23.2 1.5 16 1.5Z" fill="#e4572e" />
      <circle cx="16" cy="14" r="8.4" fill="#1d1a16" />
      <g className="tt-rec">
        <circle cx="16" cy="14" r="6.3" fill="none" stroke="#f7f3ec" strokeOpacity=".2" strokeWidth=".7" />
        <circle cx="16" cy="14" r="4.5" fill="none" stroke="#f7f3ec" strokeOpacity=".2" strokeWidth=".7" />
        <path d="M10.3 10.6a6.8 6.8 0 0 1 4.3-3" fill="none" stroke="#f7f3ec" strokeOpacity=".7" strokeWidth="1.1" strokeLinecap="round" />
        <circle cx="16" cy="14" r="2.4" fill="#f2a541" />
        <circle cx="16" cy="14" r=".8" fill="#1d1a16" />
      </g>
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("group inline-flex items-center gap-2", className)}>
      <LogoMark className="size-8" />
      <span className="font-heading text-[1.4rem] leading-none font-semibold tracking-[-0.03em]">
        Taste<em className="text-primary">Trip</em>
      </span>
    </span>
  );
}
