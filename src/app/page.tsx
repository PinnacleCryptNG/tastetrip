import { PlanApp } from "@/components/plan-app";

export default function Home() {
  return (
    <main className="px-4 pt-5 pb-16 sm:px-6">
      <nav className="mx-auto flex max-w-xl items-center justify-between">
        <span className="font-heading text-lg font-extrabold">
          Taste<span className="text-primary">Trip</span>
        </span>
        <a href="https://github.com/PinnacleCryptNG/tastetrip" className="text-sm font-semibold text-muted-foreground hover:text-foreground">GitHub</a>
      </nav>
      <header className="mx-auto mt-10 mb-8 max-w-xl">
        <h1 className="text-4xl leading-[1.05] font-extrabold sm:text-5xl">
          A city plan built from <span className="text-primary">what you love</span>.
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          Name a few artists, films, shows, books or brands. Qloo&apos;s taste graph finds the cafés, galleries, restaurants and bars their fans love most in your city, and an agent arranges them into walkable days with the reason behind every pick.
        </p>
      </header>
      <PlanApp />
      <footer className="mx-auto mt-16 max-w-xl text-xs leading-relaxed text-muted-foreground">
        Recommendations come from Qloo&apos;s cultural affinity data: aggregate patterns across many people, not facts about you. No login, nothing tracked.
      </footer>
    </main>
  );
}
