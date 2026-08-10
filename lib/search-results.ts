import type { SortedResult } from "fumadocs-core/search";
import type { SearchClient } from "fumadocs-core/search/client";

export type SearchDocsVersion = "store5" | "store6";

export type NormalizedSearchResult = {
  id: string;
  url: string;
  title: string;
  context: string;
  version: SearchDocsVersion;
};

export type SearchView = {
  results: NormalizedSearchResult[];
  state: "idle" | "pending" | "error" | "empty" | "ready";
};

type SearchGeneration = {
  generation: number;
  normalizedQuery: string;
};

type SearchQueryState = {
  data?: SortedResult[] | "empty";
  error?: unknown;
  isLoading: boolean;
};

type AllowedDocsUrl = {
  pathname: string;
  url: string;
};

type NormalizedCandidate = NormalizedSearchResult & {
  sourceId: string;
  type: SortedResult["type"];
};

const RESULT_TYPE_PRIORITY: Record<SortedResult["type"], number> = {
  page: 0,
  heading: 1,
  text: 2,
};

export class SearchResultTracker {
  readonly #errorGenerations = new Map<unknown, SearchGeneration>();
  readonly #generationByQuery = new Map<string, number>([["", 0]]);
  readonly #resultGenerations = new WeakMap<SortedResult[], SearchGeneration>();
  #current: SearchGeneration = { generation: 0, normalizedQuery: "" };
  #nextGeneration = 0;

  updateInput(value: string): void {
    const normalizedQuery = normalizeSearchQuery(value);
    if (normalizedQuery === this.#current.normalizedQuery) return;

    const generation = ++this.#nextGeneration;
    this.#current = { generation, normalizedQuery };
    this.#generationByQuery.set(normalizedQuery, generation);
  }

  beginRequest(value: string): SearchGeneration {
    const normalizedQuery = normalizeSearchQuery(value);
    return {
      generation: this.#generationByQuery.get(normalizedQuery) ?? -1,
      normalizedQuery,
    };
  }

  recordResults(results: SortedResult[], generation: SearchGeneration): void {
    this.#resultGenerations.set(results, generation);
  }

  recordError(error: unknown, generation: SearchGeneration): void {
    this.#errorGenerations.set(error, generation);
  }

  resolve({ data, error, isLoading }: SearchQueryState): SearchView {
    if (!this.#current.normalizedQuery) return { results: [], state: "idle" };
    if (isLoading) return { results: [], state: "pending" };

    if (error && this.#isCurrent(this.#errorGenerations.get(error))) {
      return { results: [], state: "error" };
    }

    if (Array.isArray(data) && this.#isCurrent(this.#resultGenerations.get(data))) {
      const results = normalizeSearchResults(data);
      return { results, state: results.length > 0 ? "ready" : "empty" };
    }

    return { results: [], state: "pending" };
  }

  getActionableResult(query: SearchQueryState, id: string): NormalizedSearchResult | null {
    return this.resolve(query).results.find((result) => result.id === id) ?? null;
  }

  #isCurrent(generation: SearchGeneration | undefined): boolean {
    return (
      generation?.generation === this.#current.generation &&
      generation.normalizedQuery === this.#current.normalizedQuery
    );
  }
}

export function createTrackedSearchClient(
  client: SearchClient,
  tracker: SearchResultTracker,
): SearchClient {
  return {
    deps: client.deps,
    async search(query) {
      const generation = tracker.beginRequest(query);

      try {
        const results = await client.search(query);
        tracker.recordResults(results, generation);
        return results;
      } catch (error) {
        tracker.recordError(error, generation);
        throw error;
      }
    },
  };
}

export function getSearchTriggerAria(isOpen: boolean, dialogId: string) {
  const relationship = {
    "aria-expanded": isOpen,
    "aria-haspopup": "dialog" as const,
  };

  return isOpen ? { "aria-controls": dialogId, ...relationship } : relationship;
}

export function normalizeSearchQuery(value: string): string {
  return value.trim().replace(/\s+/gu, " ").toLocaleLowerCase("en-US");
}

export function normalizeSearchResult(result: SortedResult): NormalizedSearchResult | null {
  const candidate = normalizeCandidate(result);
  return candidate ? toSearchResult(candidate) : null;
}

export function normalizeSearchResults(
  results: readonly SortedResult[],
): NormalizedSearchResult[] {
  const candidatesByUrl = new Map<string, NormalizedCandidate[]>();

  for (const result of results) {
    const candidate = normalizeCandidate(result);
    if (!candidate) continue;

    const candidates = candidatesByUrl.get(candidate.url);
    if (candidates) candidates.push(candidate);
    else candidatesByUrl.set(candidate.url, [candidate]);
  }

  const selected = [...candidatesByUrl.values()].map((candidates) =>
    candidates.toSorted(compareCandidates).at(0),
  );
  const itemIdCounts = new Map<string, number>();

  for (const candidate of selected) {
    if (!candidate) continue;
    itemIdCounts.set(candidate.id, (itemIdCounts.get(candidate.id) ?? 0) + 1);
  }

  return selected.flatMap((candidate) => {
    if (!candidate) return [];

    const result = toSearchResult(candidate);
    if (itemIdCounts.get(result.id) === 1) return [result];

    return [
      {
        ...result,
        id: `${result.id}-destination-${encodeURIComponent(result.url)}`,
      },
    ];
  });
}

export function stripSearchMarkup(value: string): string {
  const protectedSegments: string[] = [];
  const protect = (segment: string) => {
    const token = `\uE000${protectedSegments.length}\uE001`;
    protectedSegments.push(segment);
    return token;
  };

  let plainText = value
    .replace(/\\([\\`*_[\]{}()#+.!>|~-])/gu, (_match, escaped: string) => protect(escaped))
    .replace(/```[^\r\n]*\r?\n([\s\S]*?)```/gu, (_match, code: string) => protect(code))
    .replace(/~~~[^\r\n]*\r?\n([\s\S]*?)~~~/gu, (_match, code: string) => protect(code))
    .replace(/(`+)([\s\S]*?)\1/gu, (_match, _ticks: string, code: string) => protect(code))
    .replace(/<!--([\s\S]*?)-->/gu, " ")
    .replace(/<((?:https?:\/\/|mailto:)[^>\s]+)>/giu, "$1")
    .replace(/!\[([^\]]*)\]\((?:\\.|[^\\)])*\)/gu, "$1")
    .replace(/\[([^\]]+)\]\((?:\\.|[^\\)])*\)/gu, "$1")
    .replace(/!\[([^\]]*)\]\[[^\]]*\]/gu, "$1")
    .replace(/\[([^\]]+)\]\[[^\]]*\]/gu, "$1")
    .replace(/^\s{0,3}(?:([-*_])(?:\s*\1){2,})\s*$/gmu, " ")
    .replace(/^\s{0,3}#{1,6}\s+/gmu, "")
    .replace(/\s+#+\s*$/gmu, "")
    .replace(/^(.+)\r?\n\s{0,3}(?:={2,}|-{2,})\s*$/gmu, "$1")
    .replace(/^\s{0,3}(?:[-+*]|\d+[.)])\s+(?:\[[ xX]\]\s+)?/gmu, "")
    .replace(/^\s{0,3}>\s?/gmu, "")
    .replace(/\*\*([^*]+)\*\*/gu, "$1")
    .replace(/__([^_]+)__/gu, "$1")
    .replace(/~~([^~]+)~~/gu, "$1")
    .replace(/\*([^*\r\n]+)\*/gu, "$1")
    .replace(/(^|[^\p{L}\p{N}])_([^_\r\n]+)_(?![\p{L}\p{N}])/gu, "$1$2")
    .replace(/<\/?[A-Za-z][^>]*>/gu, "")
    .replace(/&#x([\dA-F]+);/giu, (_match, codePoint: string) => decodeCodePoint(codePoint, 16))
    .replace(/&#(\d+);/gu, (_match, codePoint: string) => decodeCodePoint(codePoint, 10))
    .replace(/&(amp|apos|gt|lt|nbsp|quot);/giu, (_match, entity: string) =>
      decodeNamedEntity(entity),
    );

  plainText = plainText.replace(/\uE000(\d+)\uE001/gu, (_match, index: string) => {
    return protectedSegments[Number(index)] ?? "";
  });

  return plainText.replace(/\s+/gu, " ").trim();
}

export function hasSearchMarkdownArtifacts(value: string): boolean {
  return (
    /<\/?(?:a|code|em|img|mark|strong)\b[^>]*>/iu.test(value) ||
    /`|\*\*|__|~~/u.test(value) ||
    /!?\[[^\]]*\]\([^)]*\)/u.test(value) ||
    /\\[\\`*_[\]{}()#+.!>|~-]/u.test(value) ||
    /(^|\n)\s{0,3}(?:#{1,6}\s|>\s?|[-+*]\s|\d+[.)]\s)/u.test(value)
  );
}

function normalizeCandidate(result: SortedResult): NormalizedCandidate | null {
  const sourceId = validateSourceId(result.id);
  const destination = allowDocsUrl(result.url);
  if (!sourceId || !destination) return null;

  const title = stripSearchMarkup(result.content);
  if (!title) return null;

  return {
    id: `search-result-${encodeURIComponent(sourceId)}`,
    sourceId,
    type: result.type,
    url: destination.url,
    title,
    context: (result.breadcrumbs ?? []).map(stripSearchMarkup).filter(Boolean).join(" / "),
    version:
      destination.pathname === "/docs/store6" ||
      destination.pathname.startsWith("/docs/store6/")
        ? "store6"
        : "store5",
  };
}

function compareCandidates(left: NormalizedCandidate, right: NormalizedCandidate): number {
  return (
    RESULT_TYPE_PRIORITY[left.type] - RESULT_TYPE_PRIORITY[right.type] ||
    left.title.length - right.title.length ||
    compareText(left.title, right.title) ||
    compareText(left.context, right.context) ||
    compareText(left.sourceId, right.sourceId)
  );
}

function compareText(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function toSearchResult(candidate: NormalizedCandidate): NormalizedSearchResult {
  return {
    id: candidate.id,
    url: candidate.url,
    title: candidate.title,
    context: candidate.context,
    version: candidate.version,
  };
}

function validateSourceId(value: string): string | null {
  if (
    value.length === 0 ||
    value.length > 2048 ||
    value !== value.trim() ||
    /[\u0000-\u001f\u007f]/u.test(value)
  ) {
    return null;
  }

  try {
    encodeURIComponent(value);
    return value;
  } catch {
    return null;
  }
}

function allowDocsUrl(value: string): AllowedDocsUrl | null {
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u001f\u007f]/u.test(value)
  ) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(value, "https://local.invalid");
  } catch {
    return null;
  }

  if (parsed.origin !== "https://local.invalid") return null;
  if (parsed.pathname !== "/docs" && !parsed.pathname.startsWith("/docs/")) return null;

  return {
    pathname: parsed.pathname,
    url: `${parsed.pathname}${parsed.search}${parsed.hash}`,
  };
}

function decodeCodePoint(value: string, radix: number): string {
  const codePoint = Number.parseInt(value, radix);
  if (!Number.isSafeInteger(codePoint) || codePoint < 0 || codePoint > 0x10ffff) return "";

  try {
    return String.fromCodePoint(codePoint);
  } catch {
    return "";
  }
}

function decodeNamedEntity(value: string): string {
  const entities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return entities[value.toLowerCase()] ?? "";
}
