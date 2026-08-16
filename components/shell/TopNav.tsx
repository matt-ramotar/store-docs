import type * as PageTree from "fumadocs-core/page-tree";
import Link from "next/link";

import { CommandSearch } from "@/components/shell/CommandSearch";
import { MobileNav } from "@/components/shell/MobileNav";
import { VersionMenu } from "@/components/shell/VersionMenu";
import {
  getActiveTabHref,
  gitHubRepo,
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
          <a
            aria-label={`GitHub repository ${gitHubRepo.label}`}
            className="text-foreground-secondary hover:text-foreground flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors"
            href={gitHubRepo.href}
            rel="noopener noreferrer"
            target="_blank"
          >
            <GitHubMark />
            <span className="hidden xl:inline">{gitHubRepo.label}</span>
          </a>
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

function GitHubMark() {
  return (
    <svg aria-hidden className="size-4.5 shrink-0" fill="currentColor" viewBox="0 0 16 16">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}
