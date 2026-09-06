"use client";

import type { TOCItemType } from "fumadocs-core/toc";
import { FloatingToc } from "@heroui-pro/react/floating-toc";
import { isValidElement, useEffect, useId, useRef, useState, type ReactNode } from "react";

/** Preserve heading nesting even when a page skips a heading level. */
export function getTocEntries(items: TOCItemType[]) {
  const ancestors: number[] = [];
  return items.map((item) => {
    while (ancestors.length && ancestors.at(-1)! >= item.depth) ancestors.pop();
    ancestors.push(item.depth);
    return { url: item.url, title: toPlainText(item.title), level: ancestors.length };
  });
}

export function OnThisPage({ items, compact = false }: { items: TOCItemType[]; compact?: boolean }) {
  const activeUrl = useActiveSection(items);
  const headingId = useId();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const focusOnOpen = useRef(false);
  const suppressFocusOpen = useRef(false);
  useEffect(() => setOpen(false), [items]);
  if (items.length === 0) return null;

  const entries = getTocEntries(items);
  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen && suppressFocusOpen.current) return;
    // A hover-close timer must not dismiss the panel while navigating it by keyboard.
    if (!nextOpen && panelRef.current?.contains(document.activeElement)) return;
    setOpen(nextOpen);
  }

  function focusActiveItem() {
    const panel = panelRef.current;
    (panel?.querySelector<HTMLButtonElement>('[aria-current="location"]') ?? panel?.querySelector<HTMLButtonElement>('button'))?.focus();
  }

  function navigateToSection(url: string) {
    const id = getSectionId(url);
    const section = id ? document.getElementById(id) : null;
    if (!section) return;
    setOpen(false);
    requestAnimationFrame(() => {
      window.location.hash = url;
      section.scrollIntoView({ block: "start", behavior: "instant" });
      if (!section.hasAttribute("tabindex")) section.setAttribute("tabindex", "-1");
      section.focus({ preventScroll: true });
    });
  }

  return (
    <div className={`store-floating-toc ${compact ? "xl:hidden" : "hidden xl:block"}`}>
      <FloatingToc placement="right" open={open} onOpenChange={handleOpenChange}>
        <FloatingToc.Trigger
          ref={triggerRef}
          aria-label="On this page"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          className="store-floating-toc__trigger"
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              suppressFocusOpen.current = false;
              focusOnOpen.current = true;
              setOpen(true);
              focusActiveItem();
            }
            if (event.key === "Escape") {
              suppressFocusOpen.current = true;
              setOpen(false);
            }
          }}
          onPointerEnter={() => { suppressFocusOpen.current = false; }}
          onPointerDown={() => {
            suppressFocusOpen.current = false;
            focusOnOpen.current = false;
          }}
          onBlur={() => { suppressFocusOpen.current = false; }}
        >
          {entries.map((entry) => (
            <FloatingToc.Bar key={entry.url} active={activeUrl === entry.url} level={entry.level} aria-hidden="true" />
          ))}
        </FloatingToc.Trigger>
        <FloatingToc.Content containerPadding={12} className="store-floating-toc__content" onOpenChange={setOpen}>
          <nav
            id={panelId}
            aria-labelledby={headingId}
            ref={(node) => {
              panelRef.current = node;
              if (node && focusOnOpen.current) {
                focusOnOpen.current = false;
                focusActiveItem();
              }
            }}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget) && event.relatedTarget !== triggerRef.current) {
                setOpen(false);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                suppressFocusOpen.current = true;
                triggerRef.current?.focus({ preventScroll: true });
                setOpen(false);
              }
            }}
          >
            <p id={headingId} className="px-3 py-2 text-sm font-semibold text-foreground">On this page</p>
            {entries.map((entry) => (
              <FloatingToc.Item
                key={entry.url}
                active={activeUrl === entry.url}
                level={entry.level}
                aria-current={activeUrl === entry.url ? "location" : undefined}
                onClick={() => navigateToSection(entry.url)}
              >
                {entry.title}
              </FloatingToc.Item>
            ))}
          </nav>
        </FloatingToc.Content>
      </FloatingToc>
    </div>
  );
}

function useActiveSection(items: TOCItemType[]): string | null {
  const [activeUrl, setActiveUrl] = useState<string | null>(null);

  useEffect(() => {
    const sections = items.flatMap((item) => {
      const id = getSectionId(item.url);
      const element = id ? document.getElementById(id) : null;
      return element ? [{ element, url: item.url }] : [];
    });

    function selectFromViewport() {
      const readingLine = 112;
      const passed = sections.filter(
        ({ element }) => element.getBoundingClientRect().top <= readingLine,
      );
      const visible = sections.find(({ element }) => {
        const bounds = element.getBoundingClientRect();
        return bounds.bottom > readingLine && bounds.top < window.innerHeight * 0.45;
      });

      setActiveUrl(passed.at(-1)?.url ?? visible?.url ?? null);
    }

    function selectFromHash() {
      const hashId = getSectionId(window.location.hash);
      const match = hashId
        ? sections.find(({ element }) => element.id === hashId)
        : undefined;
      if (match) setActiveUrl(match.url);
      else selectFromViewport();
    }

    window.addEventListener("hashchange", selectFromHash);

    if (window.location.hash) selectFromHash();
    else selectFromViewport();

    if (!("IntersectionObserver" in window)) {
      return () => window.removeEventListener("hashchange", selectFromHash);
    }

    const observer = new IntersectionObserver(selectFromViewport, {
      rootMargin: "-112px 0px -55% 0px",
      threshold: [0, 1],
    });
    sections.forEach(({ element }) => observer.observe(element));

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", selectFromHash);
    };
  }, [items]);

  return activeUrl;
}

function toPlainText(value: ReactNode): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(toPlainText).join("");
  if (isValidElement<{ children?: ReactNode }>(value)) return toPlainText(value.props.children);
  return "";
}

function getSectionId(url: string): string | null {
  const hashIndex = url.indexOf("#");
  if (hashIndex < 0 || hashIndex === url.length - 1) return null;

  try {
    return decodeURIComponent(url.slice(hashIndex + 1));
  } catch {
    return url.slice(hashIndex + 1);
  }
}
