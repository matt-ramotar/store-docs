import { GithubIcon, StarIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { gitHubRepo } from "@/lib/nav";

const starFormatter = new Intl.NumberFormat("en", {
  maximumFractionDigits: 1,
  notation: "compact",
});

/**
 * Compact header chip: GitHub mark, owner/repo, and a cached star count.
 * Modeled on Fumadocs GithubInfo, styled with HeroUI tokens.
 */
export async function GithubInfo() {
  const stars = await fetchStarCount(gitHubRepo.owner, gitHubRepo.repo);

  return (
    <a
      aria-label={`GitHub repository ${gitHubRepo.label}${stars === null ? "" : `, ${starFormatter.format(stars)} stars`}`}
      className="border-border bg-surface text-foreground hover:bg-default inline-flex max-w-full items-center gap-2 rounded-full border px-2.5 py-1 text-sm no-underline transition-colors"
      href={gitHubRepo.href}
      rel="noopener noreferrer"
      target="_blank"
    >
      <HugeiconsIcon aria-hidden className="size-4 shrink-0" icon={GithubIcon} strokeWidth={1.5} />
      <span className="hidden min-w-0 truncate font-medium sm:inline">
        {gitHubRepo.owner}
        <span className="text-muted">/</span>
        {gitHubRepo.repo}
      </span>
      {stars !== null ? (
        <span className="text-muted inline-flex shrink-0 items-center gap-1">
          <HugeiconsIcon aria-hidden className="size-3.5 shrink-0" icon={StarIcon} strokeWidth={1.5} />
          <span className="text-foreground tabular-nums">{starFormatter.format(stars)}</span>
        </span>
      ) : null}
    </a>
  );
}

async function fetchStarCount(owner: string, repo: string): Promise<number | null> {
  try {
    const headers = new Headers({
      Accept: "application/vnd.github+json",
      "User-Agent": "store-docs",
    });
    const token = process.env.GITHUB_TOKEN;
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers,
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;

    const data: unknown = await response.json();
    if (
      typeof data === "object" &&
      data !== null &&
      "stargazers_count" in data &&
      typeof data.stargazers_count === "number"
    ) {
      return data.stargazers_count;
    }
    return null;
  } catch {
    return null;
  }
}
