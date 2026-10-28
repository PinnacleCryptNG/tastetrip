import { cn } from "@/lib/utils";

export function Stamp({ value, label = "Match", sub, color, rotate = -8, delay = 0, className }: { value: number; label?: string; sub?: string; color?: string; rotate?: number; delay?: number; className?: string }) {
  return (
    <div
      className={cn("tt-stamp tt-stamp-in size-[5.25rem] shrink-0", className)}
      style={{ color, "--r": `${rotate}deg`, "--d": `${delay}ms` } as React.CSSProperties}
      title="Qloo affinity: how strongly fans of your tastes over-index on this place"
    >
      <div className="leading-none">
        <div className="text-[8px] font-bold tracking-[0.14em]">{label}</div>
        <div className="font-heading text-[2rem] leading-[0.95] font-extrabold">{value}%</div>
        {sub && <div className="mx-auto max-w-[4.4rem] truncate text-[7.5px] font-bold tracking-[0.1em]">{sub}</div>}
      </div>
    </div>
  );
}
