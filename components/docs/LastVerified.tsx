import { isValidElement, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { parseRecordedSource } from "@/lib/source-recorded";

function flattenText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(flattenText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return flattenText(node.props.children);
  return "";
}

/** Render source-locked metadata neutrally without changing authored MDX. */
export function EmWithVerifiedCommit({
  children,
  ...props
}: ComponentPropsWithoutRef<"em">) {
  const record = parseRecordedSource(flattenText(children).trim());
  if (!record) return <em {...props}>{children}</em>;

  const revision = <code className="font-mono text-xs">{record.branch}@{record.hash}</code>;

  return (
    <span className="text-muted inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-sm not-italic">
      <span>Source recorded {record.date} ·</span>
      {record.commitUrl ? (
        <a
          aria-label={`View source commit ${record.hash} in matt-ramotar/Store6 on GitHub`}
          className="text-foreground rounded-sm underline underline-offset-4"
          href={record.commitUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          {revision}
        </a>
      ) : revision}
      <span>· {record.status}</span>
    </span>
  );
}
