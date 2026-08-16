import type * as PageTree from "fumadocs-core/page-tree";

export type DocsVersion = "store5" | "store6";

export type NavItem = {
  href: string;
  label: string;
};

export type VersionNavItem = NavItem & {
  id: DocsVersion;
};

export const primaryNavItems: NavItem[] = [
  { href: "/docs/store6/overview", label: "Docs" },
  { href: "/reference/store6-core/index.html", label: "Reference" },
  { href: "/docs/community/overview", label: "Community" },
];

export const docsVersions: VersionNavItem[] = [
  { href: "/docs", id: "store5", label: "Store5" },
  { href: "/docs/store6/overview", id: "store6", label: "Store6" },
];

export function getDocsVersion(pathname: string): DocsVersion {
  return pathname === "/docs/store6" || pathname.startsWith("/docs/store6/")
    ? "store6"
    : "store5";
}

/**
 * Short sidebar and breadcrumb labels for pages whose frontmatter titles are
 * long-form. Frontmatter of generator-owned pages is content-hash-locked, so
 * display names are overridden here instead of in the MDX files.
 */
const navLabels: Record<string, string> = {
  "/docs/store6/concepts/read-contract": "Read Contract",
  "/docs/store6/concepts/freshness": "Freshness",
  "/docs/store6/concepts/errors": "Errors",
  "/docs/store6/concepts/memory-and-lifecycle": "Memory and Lifecycle",
  "/docs/store6/concepts/api-tiers": "API Tiers",
  "/docs/store6/key-design": "Keys and Namespaces",
  "/docs/store6/invalidate-vs-clear": "Invalidate or Clear",
  "/docs/store6/guides/fetchers": "Fetchers",
  "/docs/store6/guides/persistence": "Persistence",
  "/docs/store6/guides/testing": "Testing",
  "/docs/store6/guides/devtools": "DevTools",
  "/docs/store6/guides/extending": "Extending Store",
  "/docs/store6/guides/performance": "Performance",
  "/docs/store6/guides/swift": "Swift",
  "/docs/store6/mutations": "Overview",
  "/docs/store6/mutations/quickstart": "Quickstart",
  "/docs/store6/mutations/mutators": "Authoring Mutators",
  "/docs/store6/mutations/pending-write-ui": "Pending-Write UI",
  "/docs/store6/mutations/server": "Mutation Server",
  "/docs/store6/mutations/conflicts": "Conflict Resolution",
  "/docs/store6/mutations/aliases": "Aliases",
  "/docs/store6/mutations/drain-and-restart": "Drain and Restart",
  "/docs/store6/mutations/journal-storage": "Journal Storage",
  "/docs/store6/mutations/inspection": "Inspection",
  "/docs/store6/mutations/testing": "Testing",
  "/docs/store6/compose": "Compose",
  "/docs/store6/room": "Room",
  "/docs/store6/sqldelight": "SQLDelight",
  "/docs/store6/migration/from-store5": "From Store 5",
  "/docs/store6/migration/component-map": "Component Map",
  "/docs/store6/migration/from-store4": "From Store 4",
  "/docs/store6/stability": "Stability",
  "/docs/store6/roadmap": "Roadmap",
  "/docs/store6/contributing": "Contributing",
  "/docs/concepts/store5/overview": "Overview",
  "/docs/use-cases/store5/overview": "Overview",
  "/docs/best-practices/store5/overview": "Overview",
  "/docs/community/overview": "Community",
};

/**
 * Top-level sections that start collapsed, mirroring how the AI SDK docs
 * collapse secondary sections (Advanced, Reference, Migration, Troubleshooting)
 * while keeping the core sections expanded.
 */
const collapsedSections: Record<DocsVersion, ReadonlySet<string>> = {
  store5: new Set(["Use Cases", "Best Practices"]),
  store6: new Set(["Migration", "Reference", "Project"]),
};

export function getVersionTrees(tree: PageTree.Root): Record<DocsVersion, PageTree.Root> {
  return {
    store5: createVersionTree(tree, "store5"),
    store6: createVersionTree(tree, "store6"),
  };
}

function createVersionTree(tree: PageTree.Root, version: DocsVersion): PageTree.Root {
  const versionLabel = docsVersions.find((item) => item.id === version)?.label ?? version;
  const store6Folder = tree.children.find(isStore6Folder);
  const children =
    version === "store6"
      ? (store6Folder?.children ?? [])
      : tree.children.filter((node) => node !== store6Folder);

  return {
    ...tree,
    name: versionLabel,
    children: groupSections(children, version).map((node) => applyNavLabels(node)),
  };
}

function isStore6Folder(node: PageTree.Node): node is PageTree.Folder {
  if (node.type !== "folder") return false;
  if (node.$ref?.folder === "store6") return true;
  return node.index?.url === "/docs/store6" || node.index?.url.startsWith("/docs/store6/") === true;
}

/**
 * Convert separator-delimited runs of pages into named collapsible sections,
 * so meta.json separators define the AI-SDK-style grouped sidebar. Real
 * folders pass through as sections of their own and end any open run.
 */
function groupSections(nodes: PageTree.Node[], version: DocsVersion): PageTree.Node[] {
  const grouped: PageTree.Node[] = [];
  let section: PageTree.Folder | null = null;

  for (const node of nodes) {
    if (node.type === "separator") {
      const name = toPlainText(node.name);
      if (!name) {
        section = null;
        continue;
      }

      section = {
        type: "folder",
        name: node.name,
        children: [],
        $id: `section-${version}-${toSectionId(name)}`,
        defaultOpen: !collapsedSections[version].has(name),
      };
      grouped.push(section);
      continue;
    }

    if (node.type === "folder") {
      section = null;
      grouped.push({
        ...node,
        defaultOpen: node.defaultOpen ?? !collapsedSections[version].has(toPlainText(node.name)),
      });
      continue;
    }

    if (section) section.children.push(node);
    else grouped.push(node);
  }

  return grouped;
}

function applyNavLabels(node: PageTree.Node): PageTree.Node {
  if (node.type === "page") {
    // Only rename file-backed pages ($ref present); meta.json link items keep
    // their authored names (e.g. "Migrate to Store 6" pointing at a Store6 URL).
    const label = "$ref" in node && node.$ref ? navLabels[node.url] : undefined;
    return label ? { ...node, name: label } : node;
  }

  if (node.type === "folder") {
    return {
      ...node,
      index: node.index ? (applyNavLabels(node.index) as PageTree.Item) : undefined,
      children: node.children.map((child) => applyNavLabels(child)),
    };
  }

  return node;
}

function toPlainText(name: PageTree.Node["name"]): string {
  return typeof name === "string" || typeof name === "number" ? String(name) : "";
}

function toSectionId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

/* Navigation-shell metadata. Display-only; canonical routes stay in
 * primaryNavItems and docsVersions above (their declarations are pinned by
 * scripts/t4-contract.test.mjs and anchored by evidence/store6-claims.json,
 * so this block is append-only). */

/** Full-width tab row under the header, mirroring store.mobilenativefoundation.org. */
export const topNavTabs: NavItem[] = [
  { href: "/docs/store6/overview", label: "Documentation" },
  { href: "/release-notes/overview", label: "Release Notes" },
  { href: "/developer-newsletter/overview", label: "Developer Newsletter" },
];

export function getActiveTabHref(pathname: string): string {
  if (pathname === "/release-notes" || pathname.startsWith("/release-notes/")) {
    return "/release-notes/overview";
  }
  if (pathname === "/developer-newsletter" || pathname.startsWith("/developer-newsletter/")) {
    return "/developer-newsletter/overview";
  }
  return "/docs/store6/overview";
}

export type TopNavLink = NavItem & {
  external?: boolean;
};

/** Utility links on the right side of the header row. */
export const topNavLinks: TopNavLink[] = [
  { href: "/reference/store6-core/index.html", label: "API Reference" },
  { href: "/docs/community/overview", label: "Support" },
];

export const gitHubRepo = {
  href: "https://github.com/MobileNativeFoundation/Store",
  label: "MobileNativeFoundation/Store",
};

export type VersionSwitcherItem = VersionNavItem & {
  badge: "Latest" | "Legacy";
  name: string;
};

export const versionSwitcherItems: VersionSwitcherItem[] = [
  { ...getDocsVersionEntry("store6"), badge: "Latest", name: "Store 6" },
  { ...getDocsVersionEntry("store5"), badge: "Legacy", name: "Store 5" },
];

export function getVersionSwitcherItem(id: DocsVersion): VersionSwitcherItem {
  const item = versionSwitcherItems.find((entry) => entry.id === id);
  if (!item) throw new Error(`Unknown docs version: ${id}`);
  return item;
}

function getDocsVersionEntry(id: DocsVersion): VersionNavItem {
  const entry = docsVersions.find((item) => item.id === id);
  if (!entry) throw new Error(`Unknown docs version: ${id}`);
  return entry;
}
