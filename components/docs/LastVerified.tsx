import { isValidElement, type ComponentPropsWithoutRef, type ReactNode } from "react";

// These exact revisions were resolved in the Store6 checkout and checked
// against its fork remote. Unknown revisions remain text until attributed.
const sourceRevisions: Record<string, string> = {
  c67a94ed: "c67a94ed30460a35161c2cbc3e725f127caf055e",
  a6a156e9: "a6a156e99db29cebf7da238263b007802bff2bfb",
  "539614c0": "539614c06be1a8f20dead562585e47394551ebae",
  be470620: "be47062070eba8f8a327279e9c5a68caa0ef06ca",
  c4fbaf4: "c4fbaf442f61a59c57f3d8dd98650b4066508d66",
  "5a8c956b": "5a8c956bc1dbd6ad838ea9da3b34c7d76c703a71",
};

function getSourceCommitUrl(hash: string): string | undefined {
  const revision = sourceRevisions[hash] ?? Object.values(sourceRevisions).find((known) => known === hash);
  return revision ? `https://github.com/matt-ramotar/Store6/commit/${revision}` : undefined;
}

const lastVerifiedPattern =
  /^Last verified: (\d{4}-\d{2}-\d{2}) · (\S+) @ ([0-9a-f]{7,40}), (.+)$/;

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
  const match = lastVerifiedPattern.exec(flattenText(children).trim());
  if (!match) return <em {...props}>{children}</em>;

  const [, date, branch, hash, status] = match;
  const commitUrl = getSourceCommitUrl(hash);
  const revision = <code className="font-mono text-xs">{branch}@{hash}</code>;

  return (
    <span className="text-muted inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-sm not-italic">
      <span>Source recorded {date} ·</span>
      {commitUrl ? (
        <a
          aria-label={`View source commit ${hash} in matt-ramotar/Store6 on GitHub`}
          className="text-foreground rounded-sm underline underline-offset-4"
          href={commitUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          {revision}
        </a>
      ) : revision}
      <span>· {status}</span>
    </span>
  );
}
