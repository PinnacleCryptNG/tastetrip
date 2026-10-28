import Link from "next/link";
import { ArrowRight, BadgeCheck, CircleSlash, Fingerprint, LockOpen, Route, Search, Sparkles } from "lucide-react";
import { HeroVisual } from "@/components/landing/hero-visual";
import { TasteMarquee } from "@/components/landing/marquee";
import { Ticker } from "@/components/landing/ticker";
import { Logo } from "@/components/logo";
import { PlanApp } from "@/components/plan-app";

const REPO = "https://github.com/PinnacleCryptNG/tastetrip";

const steps = [
  { icon: Search, title: "Tell it what you love", body: "Search real artists, films, shows, books and brands. Every pick is a Qloo entity, not a loose keyword." },
  { icon: Sparkles, title: "Qloo finds the overlap", body: "For each part of the day, TasteTrip asks Qloo for places in your city that fans of your picks go for, filtered by category, budget and opening day." },
  { icon: Route, title: "The agent plans the day", body: "An LLM groups Qloo's picks into walkable days and writes a one-line reason for each, using only what Qloo returned." },
];

const rules = [
  { icon: BadgeCheck, title: "Real places only", body: "Every stop comes from Qloo's results. A validator drops anything the model invents." },
  { icon: CircleSlash, title: "No guessing", body: "If Qloo can't answer, you get a clear error, not a made-up plan." },
  { icon: Fingerprint, title: "Aggregate, not personal", body: "Match scores describe what fans of your tastes tend to like, not facts about you." },
  { icon: LockOpen, title: "No login", body: "Plan, tweak and share a trip without an account. Nothing is tracked." },
];

const d = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

export default function Home() {
  return (
    <main className="overflow-x-clip">
      <div className="relative">
        <div className="tt-dots pointer-events-none absolute inset-0" aria-hidden />
        <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-5 pt-5 sm:px-8">
          <Link href="/" aria-label="TasteTrip home"><Logo /></Link>
          <div className="flex items-center gap-5 text-sm font-medium text-muted-foreground">
            <a href="#how" className="hidden hover:text-foreground sm:block">How it works</a>
            <a href={REPO} className="hover:text-foreground">GitHub</a>
          </div>
        </nav>

        <section className="relative mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-12 px-5 pt-12 pb-16 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16 lg:pt-20 lg:pb-24">
          <div>
            <h1 className="tt-rise text-[2.9rem] leading-[0.95] font-semibold sm:text-6xl lg:text-[4.75rem]">
              Your taste already knows <em className="text-primary">where to go.</em>
            </h1>
            <p className="tt-rise mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground" style={d(120)}>
              Pick a few artists, films, shows, books or brands you love. TasteTrip asks Qloo&apos;s taste graph where their fans eat, drink and wander in your city, then plans the days around it.
            </p>
            <div className="tt-rise mt-8 flex flex-wrap items-center gap-3" style={d(220)}>
              <a href="#plan" className="group inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-6 text-[15px] font-semibold text-background shadow-lg transition hover:bg-primary">
                Plan my trip <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
              </a>
              <a href="#how" className="inline-flex h-12 items-center rounded-full border border-border bg-card px-6 text-[15px] font-semibold transition hover:border-foreground/30">
                How it works
              </a>
            </div>
            <p className="tt-rise mt-8 flex items-center gap-1.5 text-[15px] leading-[1.4em] text-muted-foreground" style={d(320)}>
              Plan <Ticker />
            </p>
          </div>
          <HeroVisual />
        </section>
      </div>

      <TasteMarquee />

      <section id="plan" className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] scroll-mt-4 gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:py-24">
        <div className="tt-reveal lg:sticky lg:top-10 lg:self-start">
          <h2 className="text-4xl leading-[1.02] font-semibold sm:text-5xl">
            Where to, and <em className="text-primary">what moves you?</em>
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
            Three picks is enough; six gives Qloo more to work with. Mixing types works best: a musician, a film and a brand say more together than three bands.
          </p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            Planning takes 15 to 40 seconds. You&apos;ll watch every Qloo call as it happens.
          </p>
        </div>
        <PlanApp />
      </section>

      <section id="how" className="scroll-mt-4 border-t border-border bg-card/60">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
          <h2 className="tt-reveal max-w-2xl text-4xl leading-[1.02] font-semibold sm:text-5xl">
            From a playlist to a plan in <em className="text-primary">three moves.</em>
          </h2>
          <ol className="mt-12 grid gap-4 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="tt-reveal rounded-[1.5rem] border border-border bg-background p-6">
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary"><s.icon className="size-5" /></span>
                  <span className="font-heading text-5xl leading-none text-foreground/10">{i + 1}</span>
                </div>
                <h3 className="mt-6 text-2xl font-semibold">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:items-center lg:py-24">
        <div className="tt-reveal">
          <h2 className="text-4xl leading-[1.02] font-semibold sm:text-5xl">
            Every stop <em className="text-primary">shows its working.</em>
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
            Qloo scores how much each of your tastes drove a match. TasteTrip puts those scores on the card, so you can see that a bar made the list because of your Wizkid habit rather than your Ghibli one.
          </p>
        </div>
        <div className="tt-reveal tt-card-shadow rounded-[1.75rem] border border-border bg-card p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-[#2b2d42]">21:30 · Night · listening bar</div>
              <div className="mt-1 font-heading text-2xl font-semibold">A vinyl bar in Shibuya</div>
            </div>
            <div className="text-right">
              <div className="font-heading text-3xl leading-none font-semibold">88%</div>
              <div className="mt-1 text-[11px] text-muted-foreground">Qloo match</div>
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-secondary/70 p-4">
            <div className="text-xs font-bold">Why this fits you</div>
            <p className="mt-1 text-sm leading-relaxed">Fans of Wizkid over-index on this bar&apos;s late sets and Afrobeats nights; your Nike pick adds a little.</p>
            <ul className="mt-3 space-y-2">
              {[["Wizkid", 64], ["Nike", 24], ["Spirited Away", 12]].map(([n, v], i) => (
                <li key={n} className="grid grid-cols-[7rem_1fr_2.5rem] items-center gap-2 text-xs">
                  <span className="font-medium">{n}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-background"><span className="tt-grow block h-full rounded-full bg-[#2b2d42]" style={{ width: `${v}%`, ...d(i * 150) }} /></span>
                  <span className="text-right text-muted-foreground tabular-nums">{v}%</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">Example card. Real trips use Qloo&apos;s live scores.</p>
        </div>
      </section>

      <section className="border-t border-border bg-foreground text-background">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
          <h2 className="tt-reveal max-w-2xl text-4xl leading-[1.02] font-semibold sm:text-5xl">
            Built to be <em className="text-[#f2a541]">honest</em> about where picks come from.
          </h2>
          <ul className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {rules.map((r) => (
              <li key={r.title} className="tt-reveal">
                <r.icon className="size-6 text-[#f2a541]" />
                <h3 className="mt-3 text-xl font-semibold">{r.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-background/70">{r.body}</p>
              </li>
            ))}
          </ul>
          <a href="#plan" className="group mt-12 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-[15px] font-semibold text-primary-foreground transition hover:bg-[#f2a541] hover:text-foreground">
            Plan a trip now <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
          </a>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Logo />
        <p className="max-w-xl leading-relaxed">
          Made for the Qloo Agentic Hackathon. Recommendations use Qloo&apos;s cultural affinity data. <a href={REPO} className="font-semibold text-foreground underline-offset-4 hover:underline">Open source</a> under MIT.
        </p>
      </footer>
    </main>
  );
}
