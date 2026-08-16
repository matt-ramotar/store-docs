import { Children, isValidElement, type ComponentPropsWithoutRef, type ReactNode } from "react";

import { gitHubRepo } from "@/lib/nav";

const lastVerifiedPattern =
  /^Last verified: (\d{4}-\d{2}-\d{2}) · (\S+) @ ([0-9a-f]{7,40}), (.+)$/;

function flattenText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(flattenText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return flattenText(node.props.children);
  return "";
}

/**
 * MDX `em` mapping. The store6 pages end with a source-locked italic line
 * (`*Last verified: <date> · `main` @ `<hash>`, <status>*`) whose format T4
 * pins, so the upgrade to a GitHub commit button happens here at render time
 * instead of in the MDX. Everything else stays a plain <em>.
 */
export function EmWithVerifiedCommit({
  children,
  ...props
}: ComponentPropsWithoutRef<"em">) {
  const match = lastVerifiedPattern.exec(flattenText(children).trim());
  if (!match) return <em {...props}>{children}</em>;

  const [, date, branch, hash, status] = match;

  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-2 not-italic">
      <span className="text-muted text-sm">Last verified: {date} ·</span>
      <a
        aria-label={`View commit ${hash} on GitHub`}
        className="border-border bg-surface text-foreground hover:border-accent hover:text-accent-strong inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium no-underline transition-colors"
        href={`${gitHubRepo.href}/commit/${hash}`}
        rel="noopener noreferrer"
        target="_blank"
      >
        <GitHubMark />
        <span className="font-mono">
          {branch}@{hash}
        </span>
      </a>
      <span className="text-muted text-sm">· {status}</span>
    </span>
  );
}

function GitHubMark() {
  return (
    <svg aria-hidden className="size-3.5 shrink-0" fill="currentColor" viewBox="0 0 16 16">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}
