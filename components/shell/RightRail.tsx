import type { TOCItemType } from "fumadocs-core/toc";
import { Chip, Link, Separator } from "@heroui/react";
import { FloatingToc } from "@heroui-pro/react";

import { docsVersions, type DocsVersion } from "@/lib/nav";

export type RightRailProps = {
  items: TOCItemType[];
  version: DocsVersion;
};

export function RightRail({ items, version }: RightRailProps) {
  const appliesTo = docsVersions.find((item) => item.id === version)?.label ?? version;

  return (
    <aside aria-label="Page details" className="flex min-h-svh flex-col gap-6 px-5 py-8">
      <section
        aria-labelledby="on-this-page-heading"
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h2 id="on-this-page-heading" className="text-sm font-semibold">
            On This Page
          </h2>
          <p className="text-muted mt-1 text-xs">Jump to a section.</p>
        </div>
        <FloatingToc placement="right" triggerMode="press">
          <FloatingToc.Trigger aria-label="Open table of contents">
            {items.map((item, index) => (
              <FloatingToc.Bar
                key={item.url}
                active={index === 0}
                level={Math.max(1, item.depth - 1)}
              />
            ))}
          </FloatingToc.Trigger>
          <FloatingToc.Content className="flex w-64 flex-col gap-1 p-2">
            {items.map((item) => (
              <Link
                key={item.url}
                className="text-foreground hover:bg-default block rounded-xl px-3 py-2 text-sm no-underline"
                href={item.url}
              >
                {item.title}
              </Link>
            ))}
          </FloatingToc.Content>
        </FloatingToc>
      </section>
      <Separator />
      <section aria-labelledby="page-status-heading" className="space-y-3">
        <h2 id="page-status-heading" className="text-sm font-semibold">
          Page Status
        </h2>
        <Chip color="success" size="sm" variant="soft">
          <Chip.Label>Verified</Chip.Label>
        </Chip>
        <dl className="grid gap-1 text-sm">
          <dt className="text-muted text-xs">Applies to</dt>
          <dd>{appliesTo}</dd>
        </dl>
      </section>
    </aside>
  );
}
