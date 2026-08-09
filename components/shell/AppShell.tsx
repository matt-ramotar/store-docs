import type * as PageTree from "fumadocs-core/page-tree";
import type { TOCItemType } from "fumadocs-core/toc";
import { AppLayout } from "@heroui-pro/react";
import type { ReactNode } from "react";

import { RightRail } from "@/components/shell/RightRail";
import { SideTree } from "@/components/shell/SideTree";
import { TopNav } from "@/components/shell/TopNav";
import { getDocsVersion, getVersionTrees } from "@/lib/nav";

export type AppShellProps = {
  children: ReactNode;
  currentPath: string;
  pageTree: PageTree.Root;
  toc: TOCItemType[];
};

export function AppShell({ children, currentPath, pageTree, toc }: AppShellProps) {
  const version = getDocsVersion(currentPath);
  const versionTrees = getVersionTrees(pageTree);

  return (
    <AppLayout
      aside={<RightRail items={toc} version={version} />}
      className="bg-background text-foreground min-h-dvh"
      navbar={<TopNav currentPath={currentPath} version={version} />}
      scrollMode="page"
      sidebar={
        <SideTree currentPath={currentPath} tree={versionTrees[version]} version={version} />
      }
      sidebarCollapsible="none"
      toggleShortcut={false}
    >
      <div className="mx-auto w-full max-w-4xl px-6 py-10 lg:px-10 lg:py-14">{children}</div>
    </AppLayout>
  );
}
