import Link from "next/link";
import { ArrowDown, ArrowRight, BadgeCheck, CircleSlash, Fingerprint, LockOpen, Plane } from "lucide-react";
import { DeparturesBoard } from "@/components/landing/departures-board";
import { WorldBackdrop } from "@/components/landing/world-backdrop";
import { Logo } from "@/components/logo";
import { PlanApp } from "@/components/plan-app";
import { Stamp } from "@/components/stamp";

const REPO = "https://github.com/PinnacleCryptNG/tastetrip";
const d = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;
const CITIES = ["Lisbon", "Tokyo", "Lagos", "New York", "Seoul", "Mexico City", "Paris", "Cape Town", "Berlin", "São Paulo", "London", "Accra"];

const legs = [
  { code: "01", gate: "Check in", title: "Name what you love", body: "Search real artists, films, shows, books and brands. Each pick is a Qloo entity, so the taste is exact, not a keyword guess." },
  { code: "02", gate: "Security", title: "Qloo screens the city", body: "For every part of the day, TasteTrip asks Qloo which cafés, galleries, restaurants and bars fans of your picks go for, by category, budget and opening day." },
  { code: "03", gate: "Boarding", title: "Your days, mapped", body: "An agent groups Qloo's picks into walkable days and writes one line on why each fits, using only what Qloo returned." },
];

const advisories = [
  { icon: BadgeCheck, title: "Real places only", body: "Every stop comes from Qloo's results. A validator throws out anything the model makes up." },
  { icon: CircleSlash, title: "No guessing", body: "If Qloo can't answer, you see a clear error, not an invented plan." },
  { icon: Fingerprint, title: "Aggregate, not personal", body: "Match scores describe what fans of your tastes tend to like, not facts about you." },
  { icon: LockOpen, title: "No login", body: "Plan, tweak and share a trip without an account. Nothing is tracked." },
];

export default function Home() {
  return (
    <main className="overflow-x-clip">
      <section className="relative isolate overflow-hidden bg-[#2f3cff] text-white">
        <WorldBackdrop className="absolute inset-0 -z-10 opacity-45 sm:opacity-100" />
        <div className="tt-grid-bg absolute inset-0 -z-10" aria-hidden />
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 pt-5 sm:px-8">
          <Link href="/" aria-label="TasteTrip home"><Logo tone="light" /></Link>
          <div className="flex items-center gap-5 text-sm font-semibold text-white/75">
            <a href="#how" className="hidden hover:text-white sm:block">How it works</a>
            <a href={REPO} className="hover:text-white">GitHub</a>
          </div>
        </nav>

        <div className="mx-auto max-w-6xl px-5 pt-14 pb-10 sm:px-8 lg:pt-20">
          <div className="grid gap-8 lg:grid-cols-[1fr_21rem] lg:items-end">
            <h1 className="tt-rise text-[clamp(5.2rem,21vw,9.75rem)] leading-[0.86] font-black">
              Travel by<br />
              <span className="text-[#ffd23f]">taste.</span>
            </h1>
            <div className="tt-rise lg:pb-3" style={d(150)}>
              <p className="text-lg leading-relaxed text-white/85">
                Tell us the artists, films, shows, books and brands you love. Qloo&apos;s taste graph finds where their fans eat, drink and wander in your next city. We turn it into days you&apos;ll actually want to walk.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="#plan" className="group inline-flex h-12 items-center gap-2 rounded-md bg-[#ffd23f] px-5 font-bold text-[#0b0d17] shadow-[0_6px_0_#c99f12] transition active:translate-y-1 active:shadow-none">
                  Check in your taste <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                </a>
                <a href="#how" className="inline-flex h-12 items-center rounded-md px-4 font-semibold text-white ring-1 ring-white/35 transition hover:bg-white/10">How it works</a>
              </div>
            </div>
          </div>
          <div className="tt-rise mt-12" style={d(300)}>
            <DeparturesBoard />
          </div>
        </div>

        <div className="relative h-14 overflow-hidden" aria-hidden>
          <div className="tt-dash-x absolute top-1/2 right-0 left-0 opacity-60 [--border:#fff]" />
          <Plane className="absolute top-1/2 size-6 -translate-y-1/2 rotate-45 fill-[#ffd23f] text-[#ffd23f]" style={{ animation: "tt-taxi 14s linear infinite" }} />
        </div>
      </section>

      <div className="tt-marquee-wrap overflow-hidden border-y-2 border-[#0b0d17] bg-[#ffd23f] py-3" aria-hidden>
        <div className="tt-marquee flex w-max items-center gap-6 whitespace-nowrap">
          {[...CITIES, ...CITIES].map((c, i) => (
            <span key={i} className="flex items-center gap-6 font-heading text-3xl font-extrabold text-[#0b0d17] uppercase">
              {c}
              <Plane className="size-5 rotate-45 fill-current" />
            </span>
          ))}
        </div>
      </div>

      <section id="how" className="mx-auto max-w-6xl scroll-mt-4 px-5 py-20 sm:px-8 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="tt-reveal max-w-3xl text-6xl sm:text-7xl lg:text-8xl">
            Three gates. <span className="text-primary">One itinerary.</span>
          </h2>
          <p className="tt-reveal max-w-xs text-muted-foreground">From a playlist to a plan in under a minute. You can watch every Qloo call as it happens.</p>
        </div>
        <div className="tt-reveal mt-12 overflow-hidden rounded-xl border border-border bg-card shadow-[0_24px_60px_-30px_rgb(11_13_23/.35)]">
          <div className="flex items-center justify-between bg-[#0b0d17] px-5 py-3 font-mono text-[11px] tracking-[0.18em] text-white/70 uppercase">
            <span>Boarding pass · TasteTrip</span>
            <span className="hidden sm:block">Seat: wherever your taste lands</span>
          </div>
          <ol className="grid md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_9rem]">
            {legs.map((l, i) => (
              <li key={l.code} className="contents">
                <div className="p-6 sm:p-7">
                  <div className="flex items-baseline justify-between font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                    <span>Gate {l.code}</span>
                    <span className="text-primary">{l.gate}</span>
                  </div>
                  <h3 className="mt-5 text-4xl">{l.title}</h3>
                  <p className="mt-3 leading-relaxed text-muted-foreground">{l.body}</p>
                </div>
                <div className={i < 2 ? "tt-dash-x mx-6 md:mx-0 md:my-6 md:h-auto md:w-px md:bg-[linear-gradient(var(--border)_55%,transparent_0)] md:bg-[length:1px_10px]" : "hidden md:block md:my-6 md:w-px md:bg-[linear-gradient(var(--border)_55%,transparent_0)] md:bg-[length:1px_10px]"} />
              </li>
            ))}
            <li className="hidden flex-col justify-between bg-secondary p-5 md:flex">
              <div className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">Flight<div className="mt-1 font-heading text-3xl tracking-normal text-foreground">TT 001</div></div>
              <div className="tt-barcode h-16 w-full text-foreground" />
            </li>
          </ol>
        </div>
      </section>

      <section id="plan" className="scroll-mt-0 border-y border-border bg-[#eceef5]">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.75fr_1.25fr] lg:gap-14 lg:py-28">
          <div className="tt-reveal lg:sticky lg:top-10 lg:self-start">
            <h2 className="text-7xl sm:text-8xl">Check in<span className="text-primary">.</span></h2>
            <p className="mt-5 max-w-sm text-lg leading-relaxed text-muted-foreground">
              Three picks is enough; six gives Qloo more to work with. Mix types: a musician, a film and a brand say more together than three bands.
            </p>
            <a href="#plan-form" className="mt-6 inline-flex items-center gap-2 font-mono text-xs tracking-[0.16em] text-primary uppercase lg:hidden">
              Start below <ArrowDown className="size-3.5" />
            </a>
          </div>
          <div id="plan-form">
            <PlanApp />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:items-center lg:py-28">
        <div className="tt-reveal">
          <h2 className="text-6xl sm:text-7xl lg:text-8xl">Every stop <span className="text-[#e3361b]">gets stamped.</span></h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
            Qloo scores how much each of your tastes drove a match. TasteTrip prints that on every stop, so you know a bar made the list because of your Wizkid habit, not your Ghibli one.
          </p>
        </div>
        <div className="tt-reveal relative">
          <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-[0_24px_60px_-30px_rgb(11_13_23/.35)]">
            <div className="grid grid-cols-[5.5rem_1px_1fr]">
              <div className="flex flex-col items-center justify-center gap-1 bg-[#0b0d17] p-3 text-white">
                <span className="font-mono text-2xl font-bold text-[#ffd23f]">21:30</span>
                <span className="font-mono text-[10px] tracking-[0.16em] text-white/60 uppercase">Night</span>
              </div>
              <div className="tt-dash-y" />
              <div className="p-5">
                <div className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">Listening bar · Shibuya</div>
                <div className="mt-1 font-heading text-4xl leading-none font-extrabold uppercase">A vinyl bar</div>
                <p className="mt-3 pr-20 text-sm leading-relaxed">Fans of Wizkid over-index on this bar&apos;s late sets; your Nike pick adds a little.</p>
                <ul className="mt-4 space-y-2">
                  {([["Wizkid", 64], ["Nike", 24], ["Spirited Away", 12]] as const).map(([n, v], i) => (
                    <li key={n} className="grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-2 text-xs">
                      <span className="font-semibold">{n}</span>
                      <span className="h-1.5 overflow-hidden rounded-sm bg-muted"><span className="tt-grow block h-full bg-primary" style={{ width: `${v}%`, ...d(i * 150) }} /></span>
                      <span className="text-right font-mono text-muted-foreground">{v}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <Stamp value={88} sub="Tokyo" className="absolute top-4 right-4" />
          </div>
          <div className="pointer-events-none absolute -bottom-8 -left-4 hidden sm:block">
            <Stamp value={92} label="Matched" sub="Lisbon" color="#2f3cff" rotate={12} delay={300} className="bg-[#f7f7f2]" />
          </div>
          <p className="mt-4 text-right font-mono text-[11px] text-muted-foreground">Example. Real trips use Qloo&apos;s live scores.</p>
        </div>
      </section>

      <section className="bg-[#0b0d17] text-white">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-24">
          <h2 className="tt-reveal max-w-3xl text-6xl sm:text-7xl">Travel <span className="text-[#ffd23f]">advisories.</span></h2>
          <ul className="mt-12 grid gap-px overflow-hidden rounded-xl bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {advisories.map((a, i) => (
              <li key={a.title} className="tt-reveal bg-[#0b0d17] p-6">
                <div className="flex items-center justify-between">
                  <a.icon className="size-6 text-[#ffd23f]" />
                  <span className="font-mono text-[10px] tracking-[0.16em] text-white/40">NO. 0{i + 1}</span>
                </div>
                <h3 className="mt-6 text-3xl">{a.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{a.body}</p>
              </li>
            ))}
          </ul>
          <a href="#plan" className="group mt-12 inline-flex h-12 items-center gap-2 rounded-md bg-[#ffd23f] px-5 font-bold text-[#0b0d17] shadow-[0_6px_0_#c99f12] transition active:translate-y-1 active:shadow-none">
            Plan a trip now <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
          </a>
        </div>
      </section>

      <footer className="bg-[#0b0d17] text-white/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 border-t border-white/10 px-5 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Logo tone="light" />
          <p className="max-w-xl leading-relaxed">
            Made for the Qloo Agentic Hackathon. Recommendations use Qloo&apos;s cultural affinity data. <a href={REPO} className="font-semibold text-white underline-offset-4 hover:underline">Open source</a> under MIT.
          </p>
        </div>
      </footer>
    </main>
  );
}
