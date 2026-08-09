import { Chip } from "@heroui/react";

export const metadata = {
  title: "Token architecture",
  description: "Reference rendering for Store origin and semantic status tokens.",
};

const origins = [
  {
    label: "Memory",
    chipClass: "bg-store-origin-memory-soft text-foreground",
    dotClass: "bg-store-origin-memory",
    onDarkClass: "text-store-origin-memory-on-dark",
  },
  {
    label: "Source of truth",
    chipClass: "bg-store-origin-sot-soft text-foreground",
    dotClass: "bg-store-origin-sot",
    onDarkClass: "text-store-origin-sot-on-dark",
  },
  {
    label: "Fetcher",
    chipClass: "bg-store-origin-fetcher-soft text-foreground",
    dotClass: "bg-store-origin-fetcher",
    onDarkClass: "text-store-origin-fetcher-on-dark",
  },
  {
    label: "Overlay",
    chipClass: "bg-store-origin-overlay-soft text-foreground",
    dotClass: "bg-store-origin-overlay",
    onDarkClass: "text-store-origin-overlay-on-dark",
  },
] as const;

export default function TokensDemoPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground sm:px-10 lg:px-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="max-w-2xl">
          <p className="mb-3 text-sm font-semibold tracking-[0.16em] text-accent-strong uppercase">
            Store token architecture
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Origins and status stay separate.
          </h1>
          <p className="mt-4 text-base leading-7 text-(--foreground-secondary)">
            Origin colors identify where a value came from. Semantic status colors describe
            support and release state.
          </p>
        </header>

        <section
          aria-labelledby="origin-legend-heading"
          className="rounded-2xl border border-border bg-surface p-6 shadow-surface sm:p-8"
        >
          <div className="mb-6">
            <h2 id="origin-legend-heading" className="text-xl font-semibold">
              Origin legend
            </h2>
            <p className="mt-1 text-sm text-muted">
              Each dot uses its origin color over the matching soft surface.
            </p>
          </div>
          <ul className="flex list-none flex-wrap gap-3 p-0" role="list">
            {origins.map((origin) => (
              <li key={origin.label}>
                <Chip className={origin.chipClass} size="lg" variant="soft">
                  <span aria-hidden="true" className={`size-2 rounded-full ${origin.dotClass}`} />
                  <Chip.Label>{origin.label}</Chip.Label>
                </Chip>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="status-heading"
          className="rounded-2xl border border-border bg-surface-secondary p-6 sm:p-8"
        >
          <div className="mb-6">
            <h2 id="status-heading" className="text-xl font-semibold">
              Semantic status
            </h2>
            <p className="mt-1 text-sm text-foreground-secondary">
              Status chips use HeroUI semantic colors, independent of the origin palette.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Chip color="success" size="lg" variant="soft">
              <span aria-hidden="true" className="size-2 rounded-full bg-success" />
              <Chip.Label>Supported</Chip.Label>
            </Chip>
            <Chip color="warning" size="lg" variant="soft">
              <span aria-hidden="true" className="size-2 rounded-full bg-warning" />
              <Chip.Label>Experimental</Chip.Label>
            </Chip>
          </div>
        </section>

        <section
          aria-labelledby="on-dark-heading"
          className="rounded-2xl bg-store-code-surface p-6 sm:p-8"
        >
          <h2 id="on-dark-heading" className="text-xl font-semibold text-store-code-foreground">
            Origins on dark
          </h2>
          <p className="mt-1 text-sm text-store-code-foreground/75">
            Bright origin values retain readable contrast on the code surface.
          </p>
          <ul className="mt-6 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4" role="list">
            {origins.map((origin) => (
              <li key={origin.label} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <span className={`text-sm font-semibold ${origin.onDarkClass}`}>{origin.label}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
