import type { BreadcrumbItem } from "fumadocs-core/breadcrumb";
import Link from "next/link";
import { Fragment } from "react";

export type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="text-muted flex flex-wrap items-center gap-1.5 text-sm">
      {items.map((item, index) => {
        const isCurrent = index === items.length - 1;

        return (
          <Fragment key={index}>
            {index > 0 ? (
              <svg
                aria-hidden="true"
                className="size-3 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            ) : null}
            {isCurrent ? (
              <span aria-current="page" className="text-foreground font-medium">
                {item.name}
              </span>
            ) : item.url ? (
              <Link className="hover:text-foreground transition-colors" href={item.url}>
                {item.name}
              </Link>
            ) : (
              <span>{item.name}</span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
