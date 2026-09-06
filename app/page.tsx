import type { Metadata } from "next";

import { HeroThesis } from "@/components/hero/HeroThesis";
import { KeyEngineTrace } from "@/components/hero/KeyEngineTrace";

export const metadata: Metadata = {
  title: "Store 6",
  description: "Build a Kotlin Multiplatform Store that coordinates network, persistence, and memory.",
};

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <section
        aria-labelledby="hero-thesis"
        className="mx-auto grid min-h-dvh max-w-[90rem] items-center gap-12 px-6 py-10 sm:py-16 lg:grid-cols-[minmax(0,0.76fr)_minmax(0,1.24fr)] lg:px-12 xl:gap-16 xl:px-20"
      >
        <HeroThesis />
        <KeyEngineTrace />
      </section>
    </main>
  );
}
