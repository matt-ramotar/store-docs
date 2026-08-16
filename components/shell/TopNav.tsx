import type * as PageTree from "fumadocs-core/page-tree";
import Link from "next/link";

import { CommandSearch } from "@/components/shell/CommandSearch";
import { GithubInfo } from "@/components/shell/GithubInfo";
import { MobileNav } from "@/components/shell/MobileNav";
import { VersionMenu } from "@/components/shell/VersionMenu";
import {
  getActiveTabHref,
  topNavLinks,
  topNavTabs,
  type DocsVersion,
} from "@/lib/nav";

export type TopNavProps = {
  currentPath: string;
  tree: PageTree.Root;
  version: DocsVersion;
};

/**
 * Full-width two-row header modeled on store.mobilenativefoundation.org:
 * logo + version menu + search + utility links, then a section tab row.
 */
export function TopNav({ currentPath, tree, version }: TopNavProps) {
  const activeTabHref = getActiveTabHref(currentPath);

  return (
    <header className="bg-background sticky top-0 z-40">
      <div className="flex h-14 items-center gap-1.5 px-3 lg:px-6">
        <MobileNav currentPath={currentPath} tree={tree} />
        <Link aria-label="Store home" className="flex shrink-0 items-center px-1" href="/">
          <span
            aria-hidden
            className="bg-accent inline-block size-9 [mask-image:url('/store-logo.png')] [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]"
          />
        </Link>
        <VersionMenu version={version} />
        <div className="ms-3 hidden w-full max-w-sm sm:block">
          <CommandSearch />
        </div>
        <div className="ms-auto flex shrink-0 items-center gap-1">
          <nav aria-label="Utility" className="hidden items-center md:flex">
            {topNavLinks.map((link) => (
              <a
                key={link.href}
                className="text-foreground-secondary hover:text-foreground rounded-lg px-3 py-1.5 text-sm transition-colors"
                href={link.href}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <GithubInfo />
        </div>
      </div>
      <nav
        aria-label="Site sections"
        className="border-separator flex items-center gap-6 overflow-x-auto border-b px-4 lg:px-6"
      >
        {topNavTabs.map((tab) => {
          const isActive = tab.href === activeTabHref;
          return (
            <Link
              key={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={`relative whitespace-nowrap py-2.5 text-sm transition-colors ${
                isActive
                  ? "text-foreground after:bg-foreground font-semibold after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full"
                  : "text-muted hover:text-foreground"
              }`}
              href={tab.href}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
