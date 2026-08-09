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
  { href: "/docs/intro", label: "Start" },
  { href: "/docs/use-cases/store5/overview", label: "Use Store" },
  {
    href: "/docs/use-cases/store5/integration-with-jetpack-compose-and-swift-ui",
    label: "Integrations",
  },
  {
    href: "/docs/use-cases/store5/testing-store-and-its-components",
    label: "Test",
  },
  { href: "/reference/store6-core/index.html", label: "Reference" },
  { href: "/docs/community/overview", label: "Project" },
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

export function getVersionTrees(tree: PageTree.Root): Record<DocsVersion, PageTree.Root> {
  return {
    store5: createVersionTree(tree, "store5"),
    store6: createVersionTree(tree, "store6"),
  };
}

function createVersionTree(tree: PageTree.Root, version: DocsVersion): PageTree.Root {
  const versionLabel = docsVersions.find((item) => item.id === version)?.label ?? version;

  return {
    ...tree,
    name: versionLabel,
    children: filterNodes(tree.children, version),
  };
}

function filterNodes(nodes: PageTree.Node[], version: DocsVersion): PageTree.Node[] {
  const filtered: PageTree.Node[] = [];

  for (const node of nodes) {
    if (node.type === "page") {
      if (belongsToVersion(node.url, version)) filtered.push(node);
      continue;
    }

    if (node.type === "folder") {
      const children = filterNodes(node.children, version);
      const index =
        node.index && belongsToVersion(node.index.url, version) ? node.index : undefined;

      if (children.length === 0 && !index) continue;

      filtered.push({ ...node, children, index });
      continue;
    }

    filtered.push(node);
  }

  return filtered;
}

function belongsToVersion(url: string, version: DocsVersion): boolean {
  const isStore6 = url === "/docs/store6" || url.startsWith("/docs/store6/");
  return version === "store6" ? isStore6 : !isStore6;
}
