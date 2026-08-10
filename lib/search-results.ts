import type { SortedResult } from "fumadocs-core/search";

export type SearchDocsVersion = "store5" | "store6";

export type NormalizedSearchResult = {
  id: string;
  url: string;
  title: string;
  context: string;
  version: SearchDocsVersion;
};

export function normalizeSearchResult(
  result: SortedResult,
  index: number,
): NormalizedSearchResult | null {
  const url = allowDocsUrl(result.url);
  if (!url) return null;

  const title = stripSearchMarkup(result.content);
  if (!title) return null;

  return {
    id: `search-result-${index}`,
    url,
    title,
    context: (result.breadcrumbs ?? []).map(stripSearchMarkup).filter(Boolean).join(" / "),
    version: url === "/docs/store6" || url.startsWith("/docs/store6/") ? "store6" : "store5",
  };
}

export function stripSearchMarkup(value: string): string {
  return value
    .replace(/<\/?mark(?:\s[^>]*)?>/giu, "")
    .replace(/\s+/gu, " ")
    .trim();
}

function allowDocsUrl(value: string): string | null {
  if (/[\\\u0000-\u001f\u007f]/u.test(value)) return null;
  if (value !== "/docs" && !value.startsWith("/docs/")) return null;

  const parsed = new URL(value, "https://local.invalid");
  if (parsed.origin !== "https://local.invalid") return null;
  if (parsed.pathname !== "/docs" && !parsed.pathname.startsWith("/docs/")) return null;

  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}
