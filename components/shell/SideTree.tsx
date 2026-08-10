"use client";

import type * as PageTree from "fumadocs-core/page-tree";
import { Sidebar, type SidebarMenuProps } from "@heroui-pro/react";
import {
  isValidElement,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { VersionSwitcher } from "@/components/shell/VersionSwitcher";
import { primaryNavItems, type DocsVersion } from "@/lib/nav";
import { normalizeExpandedKeys } from "@/lib/sidebar-expansion";

type SidebarExpandedChangeHandler = NonNullable<
  SidebarMenuProps<object>["onExpandedChange"]
>;
type SidebarExpandedKeys = Parameters<SidebarExpandedChangeHandler>[0];
type SidebarExpandedKey = SidebarExpandedKeys extends Set<infer Key> ? Key : never;

export type SideTreeProps = {
  currentPath: string;
  tree: PageTree.Root;
  version: DocsVersion;
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
  const expansionKeys = useMemo(
    () => getExpansionKeys(tree.children, currentPath, scope),
    [currentPath, scope, tree.children],
  );
  const [expandedKeys, setExpandedKeys] = useState<SidebarExpandedKeys>(() =>
    normalizeExpandedKeys<SidebarExpandedKey>(
      [...expansionKeys.defaultOpenKeys, ...expansionKeys.currentKeys],
      expansionKeys.lockedKeys,
    ),
  );
  const previousDefaultOpenKeys = useRef(new Set(expansionKeys.defaultOpenKeys));

  useEffect(() => {
    const newlyDefaultOpenKeys = [...expansionKeys.defaultOpenKeys].filter(
      (key) => !previousDefaultOpenKeys.current.has(key),
    );
    previousDefaultOpenKeys.current = new Set(expansionKeys.defaultOpenKeys);

    setExpandedKeys((currentKeys) =>
      normalizeExpandedKeys<SidebarExpandedKey>(
        [...currentKeys, ...expansionKeys.currentKeys, ...newlyDefaultOpenKeys],
        expansionKeys.lockedKeys,
      ),
    );
  }, [expansionKeys]);

  const handleExpandedChange = useCallback<SidebarExpandedChangeHandler>(
    (proposedKeys) => {
      setExpandedKeys(
        normalizeExpandedKeys<SidebarExpandedKey>(proposedKeys, expansionKeys.lockedKeys),
      );
    },
    [expansionKeys.lockedKeys],
  );

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
        {tree.children.length > 0 ? (
          <Sidebar.Group>
            <Sidebar.GroupLabel>{tree.name}</Sidebar.GroupLabel>
            {tree.description ? (
              <p className="text-muted px-2 pb-1 text-xs">{tree.description}</p>
            ) : null}
            <Sidebar.Menu
              aria-label={`${toText(tree.name, "Documentation")} pages`}
              expandedKeys={expandedKeys}
              onExpandedChange={handleExpandedChange}
              showGuideLines="hover"
            >
              {renderNodes(tree.children, currentPath, scope)}
            </Sidebar.Menu>
          </Sidebar.Group>
        ) : null}
      </Sidebar.Content>
    </>
  );
}

function renderNodes(
  nodes: PageTree.Node[],
  currentPath: string,
  scope: string,
  ancestry: number[] = [],
): ReactNode[] {
  return nodes.map((node, index) => {
    const path = [...ancestry, index];
    const id = getNodeId(node, scope, path);

    if (node.type === "separator") {
      return (
        <Sidebar.MenuItem
          key={id}
          id={id}
          isDisabled
          textValue={toText(node.name, "Documentation section separator")}
        >
          <Sidebar.MenuItemContent>
            {node.icon ? <Sidebar.MenuIcon>{node.icon}</Sidebar.MenuIcon> : null}
            {node.name ? <Sidebar.MenuLabel>{node.name}</Sidebar.MenuLabel> : null}
            <Sidebar.Separator
              aria-label={node.name ? toText(node.name, "Documentation section") : undefined}
              className={node.name ? "ml-2 flex-1" : "w-full"}
            />
          </Sidebar.MenuItemContent>
        </Sidebar.MenuItem>
      );
    }

    if (node.type === "page") {
      return renderPage(node, currentPath, id);
    }

    return (
      <Sidebar.MenuItem
        key={id}
        href={node.index?.url}
        id={id}
        isCurrent={node.index?.url === currentPath}
        rel={node.index?.external ? "noopener noreferrer" : undefined}
        target={node.index?.external ? "_blank" : undefined}
        textValue={toText(node.name, node.index?.url ?? id)}
      >
        <Sidebar.MenuItemContent>
          {node.icon ? <Sidebar.MenuIcon>{node.icon}</Sidebar.MenuIcon> : null}
          <NodeLabel description={node.description} name={node.name} />
          <Sidebar.MenuTrigger
            aria-label={
              node.collapsible === false
                ? `${toText(node.name, "Folder")} is always expanded`
                : `Toggle ${toText(node.name, "folder")}`
            }
            isDisabled={node.collapsible === false}
          >
            <Sidebar.MenuIndicator />
          </Sidebar.MenuTrigger>
        </Sidebar.MenuItemContent>
        <Sidebar.Submenu>
          {renderNodes(node.children, currentPath, scope, path)}
        </Sidebar.Submenu>
      </Sidebar.MenuItem>
    );
  });
}

function renderPage(page: PageTree.Item, currentPath: string, id: string): ReactNode {
  return (
    <Sidebar.MenuItem
      key={id}
      href={page.url}
      id={id}
      isCurrent={currentPath === page.url}
      rel={page.external ? "noopener noreferrer" : undefined}
      target={page.external ? "_blank" : undefined}
      textValue={toText(page.name, page.url)}
    >
      <Sidebar.MenuItemContent>
        {page.icon ? <Sidebar.MenuIcon>{page.icon}</Sidebar.MenuIcon> : null}
        <NodeLabel description={page.description} name={page.name} />
      </Sidebar.MenuItemContent>
    </Sidebar.MenuItem>
  );
}

function NodeLabel({ description, name }: { description?: ReactNode; name: ReactNode }) {
  return (
    <span className="min-w-0 flex-1">
      <Sidebar.MenuLabel>{name}</Sidebar.MenuLabel>
      {description ? (
        <span className="text-muted mt-0.5 block truncate text-xs">{description}</span>
      ) : null}
    </span>
  );
}

type ExpansionKeys = {
  currentKeys: Set<string>;
  defaultOpenKeys: Set<string>;
  lockedKeys: Set<string>;
};

function getExpansionKeys(
  nodes: PageTree.Node[],
  currentPath: string,
  scope: string,
  ancestry: number[] = [],
): ExpansionKeys {
  const keys: ExpansionKeys = {
    currentKeys: new Set(),
    defaultOpenKeys: new Set(),
    lockedKeys: new Set(),
  };

  nodes.forEach((node, index) => {
    if (node.type !== "folder") return;

    const path = [...ancestry, index];
    const id = getNodeId(node, scope, path);

    if (node.defaultOpen) keys.defaultOpenKeys.add(id);
    if (node.collapsible === false) keys.lockedKeys.add(id);
    if (containsCurrentPage(node, currentPath)) keys.currentKeys.add(id);

    const childKeys = getExpansionKeys(node.children, currentPath, scope, path);
    addKeys(keys.currentKeys, childKeys.currentKeys);
    addKeys(keys.defaultOpenKeys, childKeys.defaultOpenKeys);
    addKeys(keys.lockedKeys, childKeys.lockedKeys);
  });

  return keys;
}

function addKeys(target: Set<string>, source: Set<string>) {
  for (const key of source) target.add(key);
}

function containsCurrentPage(folder: PageTree.Folder, currentPath: string): boolean {
  if (folder.index?.url === currentPath) return true;

  return folder.children.some((node) => {
    if (node.type === "page") return node.url === currentPath;
    if (node.type === "folder") return containsCurrentPage(node, currentPath);
    return false;
  });
}

function getNodeId(node: PageTree.Node, scope: string, path: number[]): string {
  if (node.$id) return `${scope}:${node.$id}`;
  if (node.type === "page") return `${scope}:page:${node.url}`;
  if (node.type === "folder" && node.$ref?.folder) return `${scope}:folder:${node.$ref.folder}`;
  if (node.type === "folder" && node.index) return `${scope}:folder:${node.index.url}`;
  return `${scope}:${node.type}:${path.join(".")}`;
}

function toText(name: ReactNode, fallback: string): string {
  const text = extractText(name).trim();
  return text || fallback;
}

function extractText(value: ReactNode): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(extractText).join(" ");
  if (isValidElement<{ children?: ReactNode }>(value)) return extractText(value.props.children);
  return "";
}

function isCurrentPath(currentPath: string, href: string): boolean {
  return currentPath === href || (href !== "/docs" && currentPath.startsWith(`${href}/`));
}
