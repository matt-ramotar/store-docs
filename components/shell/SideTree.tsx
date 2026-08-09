import type * as PageTree from "fumadocs-core/page-tree";
import { Sidebar } from "@heroui-pro/react";
import type { ReactNode } from "react";

import { VersionSwitcher } from "@/components/shell/VersionSwitcher";
import { primaryNavItems, type DocsVersion } from "@/lib/nav";

export type SideTreeProps = {
  currentPath: string;
  tree: PageTree.Root;
  version: DocsVersion;
};

type TreeSection = {
  label: ReactNode;
  pages: PageTree.Item[];
};

export function SideTree(props: SideTreeProps) {
  return (
    <>
      <Sidebar aria-label="Documentation">
        <TreeContents {...props} scope="desktop" />
      </Sidebar>
      <Sidebar.Mobile aria-label="Documentation">
        <TreeContents {...props} scope="mobile" />
      </Sidebar.Mobile>
    </>
  );
}

function TreeContents({ currentPath, tree, version, scope }: SideTreeProps & { scope: string }) {
  const sections = toSections(tree.children, tree.name);

  return (
    <>
      <Sidebar.Header className="gap-4 px-4 pb-2 pt-5">
        <div>
          <p className="text-sm font-semibold">Store</p>
          <p className="text-muted text-xs">Kotlin Multiplatform data</p>
        </div>
        <VersionSwitcher version={version} />
      </Sidebar.Header>
      <Sidebar.Content
        hideScrollBar
        className="max-h-[calc(100svh-7rem)] overflow-y-auto px-2 pb-5"
      >
        <Sidebar.Group>
          <Sidebar.GroupLabel>Sections</Sidebar.GroupLabel>
          <Sidebar.Menu aria-label="Primary documentation sections" showGuideLines={false}>
            {primaryNavItems.map((item) => (
              <Sidebar.MenuItem
                key={item.href}
                href={item.href}
                id={`${scope}:primary:${item.href}`}
                isCurrent={isCurrentPath(currentPath, item.href)}
                textValue={item.label}
              >
                <Sidebar.MenuItemContent>
                  <Sidebar.MenuLabel>{item.label}</Sidebar.MenuLabel>
                </Sidebar.MenuItemContent>
              </Sidebar.MenuItem>
            ))}
          </Sidebar.Menu>
        </Sidebar.Group>
        {sections.map((section, sectionIndex) => (
          <Sidebar.Group key={`${scope}:section:${sectionIndex}`}>
            <Sidebar.GroupLabel>{section.label}</Sidebar.GroupLabel>
            <Sidebar.Menu
              aria-label={`${toText(section.label, "Documentation")} pages`}
              showGuideLines={false}
            >
              {section.pages.map((page) => (
                <Sidebar.MenuItem
                  key={page.url}
                  href={page.url}
                  id={`${scope}:page:${page.url}`}
                  isCurrent={currentPath === page.url}
                  textValue={toText(page.name, page.url)}
                >
                  <Sidebar.MenuItemContent>
                    <Sidebar.MenuLabel>{page.name}</Sidebar.MenuLabel>
                  </Sidebar.MenuItemContent>
                </Sidebar.MenuItem>
              ))}
            </Sidebar.Menu>
          </Sidebar.Group>
        ))}
      </Sidebar.Content>
    </>
  );
}

function toSections(nodes: PageTree.Node[], rootName: ReactNode): TreeSection[] {
  const rootPages = nodes.filter((node): node is PageTree.Item => node.type === "page");
  const sections: TreeSection[] = rootPages.length > 0 ? [{ label: rootName, pages: rootPages }] : [];

  for (const node of nodes) {
    if (node.type !== "folder") continue;

    const pages = collectPages(node);
    if (pages.length > 0) sections.push({ label: node.name, pages });
  }

  return sections;
}

function collectPages(folder: PageTree.Folder): PageTree.Item[] {
  const pages = folder.index ? [folder.index] : [];

  for (const child of folder.children) {
    if (child.type === "page") pages.push(child);
    if (child.type === "folder") pages.push(...collectPages(child));
  }

  return pages;
}

function toText(name: ReactNode, fallback: string): string {
  return typeof name === "string" ? name : fallback;
}

function isCurrentPath(currentPath: string, href: string): boolean {
  return currentPath === href || (href !== "/docs" && currentPath.startsWith(`${href}/`));
}
