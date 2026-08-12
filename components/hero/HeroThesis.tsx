import { Link, Typography } from "@heroui/react";

export function HeroThesis() {
  return (
    <header className="flex max-w-xl flex-col items-start">
      <Typography className="font-semibold text-accent-strong" type="body-sm">
        Store 6
      </Typography>
      <Typography.Heading
        className="mt-5 max-w-[10ch] text-5xl leading-[0.98] font-semibold tracking-[-0.055em] text-foreground sm:text-6xl xl:text-7xl"
        id="hero-thesis"
        level={1}
      >
        Offline is just another origin.
      </Typography.Heading>
      <Typography.Paragraph className="mt-7 max-w-lg text-lg leading-8 text-foreground-secondary">
        Under the default freshness validator, <code>Freshness.CachedOrFetch</code> can keep an
        invalidated persisted value visible while a refresh runs. Provenance and failure remain
        explicit.
      </Typography.Paragraph>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          className="inline-flex w-fit rounded-xl bg-accent px-5 py-3 font-semibold text-accent-foreground no-underline hover:no-underline"
          href="/docs/store6/overview"
        >
          Read the docs
        </Link>
        <Link
          className="inline-flex w-fit rounded-xl border border-border bg-surface px-5 py-3 font-semibold text-foreground no-underline hover:no-underline"
          href="/docs/store6/quickstart"
        >
          Build your first store
        </Link>
      </div>
    </header>
  );
}
