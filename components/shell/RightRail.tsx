import type { TOCItemType } from "fumadocs-core/toc";

import { OnThisPage } from "@/components/shell/OnThisPage";

export function RightRail({ items }: { items: TOCItemType[] }) {
  return (
    <aside aria-label="Page details" className="px-5 py-6">
      <OnThisPage items={items} />
    </aside>
  );
}
