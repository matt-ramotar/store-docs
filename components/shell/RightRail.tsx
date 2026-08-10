import type { TOCItemType } from "fumadocs-core/toc";
import { Chip, Separator } from "@heroui/react";

import { ActiveFloatingToc } from "@/components/shell/ActiveFloatingToc";
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
        <ActiveFloatingToc items={items} />
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
