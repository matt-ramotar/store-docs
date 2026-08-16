import Link from "next/link";
import type { ReactNode } from "react";

export type PageFooterLink = {
  name: ReactNode;
  url: string;
};

export type PageFooterNavProps = {
  previous?: PageFooterLink;
  next?: PageFooterLink;
};

export function PageFooterNav({ previous, next }: PageFooterNavProps) {
  if (!previous && !next) return null;

  return (
    <nav
      aria-label="Pagination"
      className="border-separator mt-16 grid gap-4 border-t pt-8 sm:grid-cols-2"
    >
      {previous ? (
        <Link
          aria-label={`Go to previous page: ${toLabel(previous.name)}`}
          className="group border-border bg-surface hover:border-accent rounded-2xl border px-5 py-4 no-underline transition-colors"
          href={previous.url}
        >
          <span className="text-muted text-xs">Previous</span>
          <span className="text-foreground group-hover:text-accent-strong mt-1 block font-medium transition-colors">
            {previous.name}
          </span>
        </Link>
      ) : (
        <span aria-hidden="true" className="hidden sm:block" />
      )}
      {next ? (
        <Link
          aria-label={`Go to next page: ${toLabel(next.name)}`}
          className="group border-border bg-surface hover:border-accent rounded-2xl border px-5 py-4 text-right no-underline transition-colors"
          href={next.url}
        >
          <span className="text-muted text-xs">Next</span>
          <span className="text-foreground group-hover:text-accent-strong mt-1 block font-medium transition-colors">
            {next.name}
          </span>
        </Link>
      ) : null}
    </nav>
  );
}

function toLabel(name: ReactNode): string {
  return typeof name === "string" || typeof name === "number" ? String(name) : "page";
}
