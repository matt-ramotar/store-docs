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
      <GitHubMark />
      <span className="hidden min-w-0 truncate font-medium sm:inline">
        {gitHubRepo.owner}
        <span className="text-muted">/</span>
        {gitHubRepo.repo}
      </span>
      {stars !== null ? (
        <span className="text-muted inline-flex shrink-0 items-center gap-1">
          <StarMark />
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

function GitHubMark() {
  return (
    <svg aria-hidden className="size-4 shrink-0" fill="currentColor" viewBox="0 0 16 16">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

function StarMark() {
  return (
    <svg aria-hidden className="size-3.5 shrink-0" fill="currentColor" viewBox="0 0 16 16">
      <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
    </svg>
  );
}
