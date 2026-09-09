"use client";

import { Link, Typography } from "@heroui/react";

import { HOMEPAGE_GUIDANCE, HOMEPAGE_INTRO, HOMEPAGE_TITLE } from "@/lib/homepage-content";

export function HeroThesis() {
  return (
    <header className="flex max-w-xl flex-col items-start">
      <Typography className="font-semibold text-accent-strong" type="body-sm">
        Store 6
      </Typography>
      <Typography.Heading
        className="mt-5 max-w-[12ch] text-5xl leading-[0.98] font-semibold tracking-[-0.055em] text-foreground sm:text-6xl xl:text-7xl"
        id="hero-thesis"
        level={1}
      >
        {HOMEPAGE_TITLE}
      </Typography.Heading>
      <Typography.Paragraph className="mt-5 max-w-lg text-base leading-7 text-foreground-secondary sm:mt-7 sm:text-lg sm:leading-8">
        {HOMEPAGE_INTRO}
      </Typography.Paragraph>
      <Typography.Paragraph className="mt-4 max-w-lg text-base leading-7 text-foreground-secondary">
        {HOMEPAGE_GUIDANCE}
      </Typography.Paragraph>
      <div className="mt-6 flex flex-wrap gap-3 sm:mt-8">
        <Link
          className="inline-flex w-fit rounded-xl bg-accent px-5 py-3 font-semibold text-accent-foreground no-underline hover:no-underline"
          href="/docs/store6/quickstart"
        >
          Build your first store
        </Link>
        <Link
          className="inline-flex w-fit rounded-xl border border-border bg-surface px-5 py-3 font-semibold text-foreground no-underline hover:no-underline"
          href="/docs/store6/overview"
        >
          Explore Store 6
        </Link>
        <Link
          className="inline-flex w-fit px-1 py-3 font-medium text-accent no-underline hover:no-underline"
          href="/docs/store6/concepts/read-contract#failure-trace-invalidated-persisted-data"
        >
          Read the failure trace
        </Link>
      </div>
    </header>
  );
}
