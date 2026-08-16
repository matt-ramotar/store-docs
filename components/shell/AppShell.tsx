import type * as PageTree from "fumadocs-core/page-tree";
import type { TOCItemType } from "fumadocs-core/toc";
import type { ReactNode } from "react";

import { RightRail } from "@/components/shell/RightRail";
import { SideTree } from "@/components/shell/SideTree";
import { Store6Banner } from "@/components/shell/Store6Banner";
import { TopNav } from "@/components/shell/TopNav";
import { getDocsVersion, getVersionTrees } from "@/lib/nav";

export type AppShellProps = {
  children: ReactNode;
  currentPath: string;
  pageTree: PageTree.Root;
  toc: TOCItemType[];
};

/* Header rows: 56px navbar + 41px tab bar (incl. border). Rails stick below. */
const railClass =
  "sticky top-[97px] hidden h-[calc(100svh-97px)] shrink-0 overflow-y-auto";

export function AppShell({ children, currentPath, pageTree, toc }: AppShellProps) {
  const version = getDocsVersion(currentPath);
  const tree = getVersionTrees(pageTree)[version];

  return (
    <div className="bg-background text-foreground min-h-dvh">
      {version === "store6" && <Store6Banner />}
      <TopNav currentPath={currentPath} tree={tree} version={version} />
      <div className="flex w-full">
        <aside aria-label="Documentation sidebar" className={`${railClass} w-64 px-3 py-6 lg:block`}>
          <SideTree currentPath={currentPath} tree={tree} />
        </aside>
        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-4xl px-6 py-10 lg:px-10 lg:py-12">
            {children}
          </div>
        </main>
        <div className={`${railClass} w-72 xl:block`}>
          <RightRail items={toc} version={version} />
        </div>
      </div>
    </div>
  );
}
