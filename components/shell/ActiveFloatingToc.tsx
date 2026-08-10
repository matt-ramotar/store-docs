"use client";

import type { TOCItemType } from "fumadocs-core/toc";
import { Link } from "@heroui/react";
import { FloatingToc } from "@heroui-pro/react";
import { useEffect, useState } from "react";

export function ActiveFloatingToc({ items }: { items: TOCItemType[] }) {
  const [activeUrl, setActiveUrl] = useState<string | null>(null);

  useEffect(() => {
    const sections = items.flatMap((item) => {
      const id = getSectionId(item.url);
      const element = id ? document.getElementById(id) : null;
      return element ? [{ element, url: item.url }] : [];
    });

    function selectFromViewport() {
      const readingLine = 112;
      const passed = sections.filter(({ element }) => element.getBoundingClientRect().top <= readingLine);
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

  return (
    <FloatingToc placement="right" triggerMode="press">
      <FloatingToc.Trigger aria-label="Open table of contents">
        {items.map((item) => (
          <FloatingToc.Bar
            key={item.url}
            active={activeUrl === item.url}
            level={Math.max(1, item.depth - 1)}
          />
        ))}
      </FloatingToc.Trigger>
      <FloatingToc.Content className="flex w-64 flex-col gap-1 p-2">
        {items.map((item) => {
          const isActive = activeUrl === item.url;

          return (
            <Link
              key={item.url}
              aria-current={isActive ? "location" : undefined}
              className={`hover:bg-default block rounded-xl px-3 py-2 text-sm no-underline ${
                isActive ? "bg-default text-accent" : "text-foreground"
              }`}
              href={item.url}
            >
              {item.title}
            </Link>
          );
        })}
      </FloatingToc.Content>
    </FloatingToc>
  );
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
