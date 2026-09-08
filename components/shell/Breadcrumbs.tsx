import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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
              <HugeiconsIcon
                aria-hidden="true"
                className="size-3 shrink-0"
                icon={ArrowRight01Icon}
                strokeWidth={1.5}
              />
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
