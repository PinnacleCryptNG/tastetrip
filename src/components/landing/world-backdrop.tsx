import { PINS, WORLD } from "./world-data";

const ROUTES: [string, string][] = [
  ["New York", "London"],
  ["São Paulo", "Lisbon"],
  ["Cape Town", "Mumbai"],
  ["Sydney", "Seoul"],
  ["Mexico City", "Buenos Aires"],
  ["Istanbul", "Nairobi"],
  ["Vancouver", "Reykjavik"],
  ["Dubai", "Bangkok"],
  ["Lagos", "Paris"],
  ["Lima", "Los Angeles"],
];

function arc(a: [number, number], b: [number, number]) {
  const [x1, y1] = a;
  const [x2, y2] = b;
  const d = Math.hypot(x2 - x1, y2 - y1);
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2 - d * 0.32;
  return `M${x1} ${y1}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2} ${y2}`;
}

const PLANE = "M-1.5 -.55 1.7 0-1.5 .55-1.05 0Z M-.2 -.2-.9 -1.3-.45 -1.3.55 -.15Z M-.2 .2-.9 1.3-.45 1.3.55 .15Z";

export function WorldBackdrop({ className }: { className?: string }) {
  const paths = ROUTES.map(([a, b]) => arc(PINS[a], PINS[b]));
  const cities = [...new Set(ROUTES.flat())];
  return (
    <div className={className} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/world.svg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.22]" />
      <svg viewBox={`0 0 ${WORLD.w} ${WORLD.h}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        {paths.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#ffd23f" strokeOpacity=".7" strokeWidth="1.5" strokeDasharray="6 7" vectorEffect="non-scaling-stroke" strokeLinecap="round" className="tt-route" style={{ "--d": `${i * 400}ms` } as React.CSSProperties} />
        ))}
        {paths.slice(0, 6).map((d, i) => (
          <path key={i} d={PLANE} fill="#ffd23f" opacity="0" className="tt-plane">
            <animateMotion dur={`${7 + i * 1.5}s`} begin={`${1.2 + i * 1.1}s`} repeatCount="indefinite" rotate="auto" path={d} keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines=".45 0 .55 1" />
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.08;.9;1" dur={`${7 + i * 1.5}s`} begin={`${1.2 + i * 1.1}s`} repeatCount="indefinite" />
          </path>
        ))}
        {cities.map((c, i) => (
          <g key={c} transform={`translate(${PINS[c][0]} ${PINS[c][1]})`}>
            <circle r="1.6" fill="#ffd23f" fillOpacity=".35" className="tt-ping" style={{ transformBox: "fill-box", transformOrigin: "center", "--d": `${i * 300}ms` } as React.CSSProperties} />
            <circle r=".8" fill="#fff" />
          </g>
        ))}
      </svg>
    </div>
  );
}
