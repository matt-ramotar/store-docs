"use client";

import type * as PageTree from "fumadocs-core/page-tree";
import { Icon } from "@iconify/react";
import Link from "next/link";
import {
  isValidElement,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type SideTreeProps = {
  currentPath: string;
  tree: PageTree.Root;
};

const itemBaseClass =
  "flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm transition-colors";
const itemIdleClass = "text-foreground-secondary hover:bg-default hover:text-foreground";
const itemActiveClass = "bg-accent-soft font-semibold text-accent-soft-foreground";

/**
 * Docs navigation tree modeled on store.mobilenativefoundation.org: bold group
 * headers with always-visible pages, and collapsible category rows (chevron)
 * for secondary sections and nested folders.
 */
export function SideTree({ currentPath, tree }: SideTreeProps) {
  const pathFolderIds = useMemo(
    () => getFolderIdsContaining(tree.children, currentPath),
    [tree.children, currentPath],
  );
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(pathFolderIds);

  useEffect(() => {
    setExpandedIds((previous) => {
      const merged = new Set(previous);
      for (const id of pathFolderIds) merged.add(id);
      return merged;
    });
  }, [pathFolderIds]);

  const toggle = (id: string) => {
    setExpandedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <nav aria-label="Documentation" className="flex flex-col gap-6">
      {renderTopLevel(tree.children, { currentPath, expandedIds, toggle })}
    </nav>
  );
}

type RenderContext = {
  currentPath: string;
  expandedIds: ReadonlySet<string>;
  toggle: (id: string) => void;
};

function renderTopLevel(nodes: PageTree.Node[], context: RenderContext): ReactNode[] {
  const sections: ReactNode[] = [];
  let looseItems: ReactNode[] = [];
  let looseKey = "";

  const flushLoose = () => {
    if (looseItems.length === 0) return;
    sections.push(
      <ul key={`loose-${looseKey}`} className="flex flex-col gap-0.5">
        {looseItems}
      </ul>,
    );
    looseItems = [];
  };

  nodes.forEach((node, index) => {
    const id = getNodeId(node, [index]);

    if (node.type === "folder" && node.defaultOpen) {
      flushLoose();
      sections.push(
        <section key={id}>
          <h3 className="text-foreground px-2.5 pb-1.5 text-sm font-semibold">
            {node.name}
          </h3>
          <ul className="flex flex-col gap-0.5">
            {node.children.map((child, childIndex) =>
              renderNode(child, [index, childIndex], context),
            )}
          </ul>
        </section>,
      );
      return;
    }

    looseKey = id;
    looseItems.push(renderNode(node, [index], context));
  });

  flushLoose();
  return sections;
}

function renderNode(
  node: PageTree.Node,
  path: number[],
  context: RenderContext,
): ReactNode {
  const id = getNodeId(node, path);

  if (node.type === "separator") return null;

  if (node.type === "page") {
    return (
      <li key={id}>
        <PageLink currentPath={context.currentPath} page={node} />
      </li>
    );
  }

  return <FolderRow key={id} context={context} folder={node} id={id} path={path} />;
}

function FolderRow({
  context,
  folder,
  id,
  path,
}: {
  context: RenderContext;
  folder: PageTree.Folder;
  id: string;
  path: number[];
}) {
  const isExpanded = context.expandedIds.has(id);
  const chevron = (
    <Icon
      className={`size-3.5 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`}
      icon="gravity-ui:chevron-right"
    />
  );
  const isIndexCurrent = folder.index?.url === context.currentPath;

  return (
    <li>
      {folder.index ? (
        <span className="flex items-center gap-0.5">
          <PageLink
            className="flex-1"
            currentPath={context.currentPath}
            page={folder.index}
            label={folder.name}
          />
          <button
            aria-expanded={isExpanded}
            aria-label={`Toggle ${toText(folder.name, "section")}`}
            className={`text-muted hover:bg-default hover:text-foreground rounded-lg p-1.5 transition-colors ${isIndexCurrent ? "text-accent-soft-foreground" : ""}`}
            onClick={() => context.toggle(id)}
            type="button"
          >
            {chevron}
          </button>
        </span>
      ) : (
        <button
          aria-expanded={isExpanded}
          className={`${itemBaseClass} ${itemIdleClass} justify-between`}
          onClick={() => context.toggle(id)}
          type="button"
        >
          <span className="min-w-0 flex-1 truncate text-start">{folder.name}</span>
          {chevron}
        </button>
      )}
      {isExpanded ? (
        <ul className="border-separator ms-3.5 mt-0.5 flex flex-col gap-0.5 border-s ps-2">
          {folder.children.map((child, childIndex) =>
            renderNode(child, [...path, childIndex], context),
          )}
        </ul>
      ) : null}
    </li>
  );
}

function PageLink({
  className,
  currentPath,
  label,
  page,
}: {
  className?: string;
  currentPath: string;
  label?: ReactNode;
  page: PageTree.Item;
}) {
  const isCurrent = page.url === currentPath;
  const linkClass = `${itemBaseClass} ${isCurrent ? itemActiveClass : itemIdleClass} ${className ?? ""}`;
  const content = (
    <>
      <span className="min-w-0 flex-1 truncate">{label ?? page.name}</span>
      {page.external ? (
        <Icon aria-hidden className="text-muted size-3 shrink-0" icon="gravity-ui:arrow-up-right" />
      ) : null}
    </>
  );

  // Only /docs routes live in this app; Dokka reference pages and external
  // sites need a full navigation.
  if (page.external || !page.url.startsWith("/docs")) {
    return (
      <a
        className={linkClass}
        href={page.url}
        rel={page.external ? "noopener noreferrer" : undefined}
        target={page.external ? "_blank" : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      aria-current={isCurrent ? "page" : undefined}
      className={linkClass}
      href={page.url}
    >
      {content}
    </Link>
  );
}

function getFolderIdsContaining(
  nodes: PageTree.Node[],
  currentPath: string,
  ancestry: number[] = [],
): Set<string> {
  const ids = new Set<string>();

  nodes.forEach((node, index) => {
    if (node.type !== "folder") return;
    const path = [...ancestry, index];

    if (containsCurrentPage(node, currentPath)) ids.add(getNodeId(node, path));

    for (const id of getFolderIdsContaining(node.children, currentPath, path)) {
      ids.add(id);
    }
  });

  return ids;
}

function containsCurrentPage(folder: PageTree.Folder, currentPath: string): boolean {
  if (folder.index?.url === currentPath) return true;

  return folder.children.some((node) => {
    if (node.type === "page") return node.url === currentPath;
    if (node.type === "folder") return containsCurrentPage(node, currentPath);
    return false;
  });
}

function getNodeId(node: PageTree.Node, path: number[]): string {
  if (node.$id) return node.$id;
  if (node.type === "page") return `page:${node.url}`;
  if (node.type === "folder" && node.$ref?.folder) return `folder:${node.$ref.folder}`;
  if (node.type === "folder" && node.index) return `folder:${node.index.url}`;
  return `${node.type}:${path.join(".")}`;
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
