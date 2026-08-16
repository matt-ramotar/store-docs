"use client";

import type { TOCItemType } from "fumadocs-core/toc";
import { isValidElement, useEffect, useState, type ReactNode } from "react";

export function OnThisPage({ items }: { items: TOCItemType[] }) {
  const activeUrl = useActiveSection(items);

  if (items.length === 0) return null;

  return (
    <nav aria-labelledby="on-this-page-heading">
      <h2 id="on-this-page-heading" className="text-sm font-semibold">
        On this page
      </h2>
      <ul className="mt-3 space-y-2 text-sm">
        {items.map((item) => {
          const isActive = activeUrl === item.url;

          return (
            <li
              key={item.url}
              style={{ paddingInlineStart: `${Math.max(0, item.depth - 2) * 0.75}rem` }}
            >
              <a
                aria-current={isActive ? "location" : undefined}
                className={`block leading-5 no-underline transition-colors ${
                  isActive
                    ? "text-accent-strong font-medium"
                    : "text-muted hover:text-foreground"
                }`}
                href={item.url}
              >
                {/* Headings can contain inline links; render text only to avoid nested anchors. */}
                {toPlainText(item.title)}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
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
