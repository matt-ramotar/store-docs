import type { TOCItemType } from "fumadocs-core/toc";
import { Chip, Separator } from "@heroui/react";

import { OnThisPage } from "@/components/shell/OnThisPage";
import { docsVersions, type DocsVersion } from "@/lib/nav";

export type RightRailProps = {
  items: TOCItemType[];
  version: DocsVersion;
};

export function RightRail({ items, version }: RightRailProps) {
  const appliesTo = docsVersions.find((item) => item.id === version)?.label ?? version;

  return (
    <aside aria-label="Page details" className="flex flex-col gap-6 px-5 py-6">
      <OnThisPage items={items} />
      <Separator />
      <section
        aria-labelledby="page-status-heading"
        className="flex flex-wrap items-center gap-2"
      >
        <h2 id="page-status-heading" className="sr-only">
          Page Status
        </h2>
        <Chip color="success" size="sm" variant="soft">
          <Chip.Label>Verified</Chip.Label>
        </Chip>
        <span className="text-muted text-xs">Applies to {appliesTo}</span>
      </section>
    </aside>
  );
}
