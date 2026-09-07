import type { TOCItemType } from "fumadocs-core/toc";
import { SeparatorRoot as Separator } from "@heroui/react/separator";
import type { Metadata } from "next";

import { AppShell } from "@/components/shell/AppShell";
import { OnThisPage } from "@/components/shell/OnThisPage";
import { source } from "@/lib/source";

const title = "Coming soon";
const toc: TOCItemType[] = [{ depth: 2, title, url: "#page-title" }];

export const metadata: Metadata = { title };

export default function Page() {
  return (
    <AppShell currentPath="/developer-newsletter/overview" pageTree={source.pageTree} toc={toc}>
      <article className="mx-auto max-w-3xl">
        <header className="space-y-4">
          <h1 id="page-title" className="text-4xl font-semibold tracking-tight">
            {title}
          </h1>
          <OnThisPage items={toc} compact />
          <Separator />
        </header>
        <div id="content" />
      </article>
    </AppShell>
  );
}
