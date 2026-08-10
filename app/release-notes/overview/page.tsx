import type { TOCItemType } from "fumadocs-core/toc";
import { Separator } from "@heroui/react";
import type { Metadata } from "next";

import { AppShell } from "@/components/shell/AppShell";
import { source } from "@/lib/source";

const title = "Coming soon";
const toc: TOCItemType[] = [{ depth: 2, title, url: "#page-title" }];

export const metadata: Metadata = { title };

export default function Page() {
  return (
    <AppShell currentPath="/release-notes/overview" pageTree={source.pageTree} toc={toc}>
      <article className="mx-auto max-w-3xl">
        <header className="space-y-4">
          <h1 id="page-title" className="text-4xl font-semibold tracking-tight">
            {title}
          </h1>
          <Separator />
        </header>
        <div id="content" />
      </article>
    </AppShell>
  );
}
