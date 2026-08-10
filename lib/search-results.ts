import type { SortedResult } from "fumadocs-core/search";
import type { SearchClient } from "fumadocs-core/search/client";
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { gfm } from "micromark-extension-gfm";

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

export type SearchMarkupKind =
  | "blockquote"
  | "code"
  | "emphasis"
  | "entity"
  | "heading"
  | "html"
  | "image"
  | "link"
  | "list"
  | "reference-definition"
  | "strikethrough"
  | "table"
  | "thematic-break";

export type SearchLabelNormalization = {
  text: string;
  consumedKinds: SearchMarkupKind[];
  residualKinds: SearchMarkupKind[];
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

type MarkdownNode = {
  alt?: string | null;
  children?: MarkdownNode[];
  identifier?: string;
  label?: string | null;
  position?: {
    start: { offset?: number };
    end: { offset?: number };
  };
  type: string;
  value?: string;
};

type SourceRange = {
  end: number;
  start: number;
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

export function normalizeSearchLabel(value: string): SearchLabelNormalization {
  const consumed = new Set<SearchMarkupKind>();
  const literals = createSearchLiteralRegistry(value);
  const initialTree = parseSearchMarkdown(value);
  let current = protectEscapedPunctuation(value, findOpaqueSourceRanges(initialTree), literals);
  let residualKinds: SearchMarkupKind[] = [];

  for (let pass = 0; pass < 32; pass += 1) {
    const tree = parseSearchMarkdown(current);
    recordDecodedEntities(tree, current, consumed);
    const collected = collectSearchMarkdown(tree, consumed, literals);
    const next = collapseSearchLabel(collected);

    if (next === current) {
      residualKinds = [];
      break;
    }

    current = next;
    if (pass === 31) residualKinds = collectSearchMarkupKinds(parseSearchMarkdown(current));
  }

  const text = collapseSearchLabel(literals.restore(current));

  return {
    text,
    consumedKinds: [...consumed].toSorted(),
    residualKinds,
  };
}

export function stripSearchMarkup(value: string): string {
  return normalizeSearchLabel(value).text;
}

export function hasSearchMarkdownArtifacts(value: string): boolean {
  const diagnostic = normalizeSearchLabel(value);
  return diagnostic.consumedKinds.length > 0 || diagnostic.residualKinds.length > 0;
}

type SearchLiteralRegistry = {
  protect: (value: string) => string;
  restore: (value: string) => string;
};

function parseSearchMarkdown(value: string): MarkdownNode {
  return fromMarkdown(value, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  }) as MarkdownNode;
}

function createSearchLiteralRegistry(source: string): SearchLiteralRegistry {
  let opener = "\uD800";
  while (source.includes(opener)) opener += "\uD800";
  const closer = `${opener}\uD801`;
  const tokens: string[] = [];
  const values: string[] = [];

  function restore(value: string): string {
    let restored = value;
    for (let index = 0; index < tokens.length; index += 1) {
      restored = restored.split(tokens[index]).join(values[index]);
    }
    return restored;
  }

  return {
    protect(value) {
      const token = `${opener}${tokens.length.toString(36)}${closer}`;
      tokens.push(token);
      values.push(restore(value));
      return token;
    },
    restore,
  };
}

function findOpaqueSourceRanges(tree: MarkdownNode): SourceRange[] {
  const ranges: SourceRange[] = [];

  function visit(node: MarkdownNode): void {
    if (node.type === "code" || node.type === "inlineCode" || node.type === "html") {
      const start = node.position?.start.offset;
      const end = node.position?.end.offset;
      if (typeof start === "number" && typeof end === "number") ranges.push({ start, end });
      return;
    }

    for (const child of node.children ?? []) visit(child);
  }

  visit(tree);
  return ranges.toSorted((left, right) => left.start - right.start || left.end - right.end);
}

function protectEscapedPunctuation(
  value: string,
  opaqueRanges: readonly SourceRange[],
  literals: SearchLiteralRegistry,
): string {
  let output = "";
  let index = 0;
  let rangeIndex = 0;

  while (index < value.length) {
    const range = opaqueRanges[rangeIndex];
    if (range && index >= range.start) {
      output += value.slice(index, range.end);
      index = range.end;
      rangeIndex += 1;
      continue;
    }

    const next = value[index + 1];
    if (value[index] === "\\" && next && isEscapablePunctuation(next)) {
      output += literals.protect(next);
      index += 2;
      continue;
    }

    output += value[index];
    index += 1;
  }

  return output;
}

function collectSearchMarkdown(
  node: MarkdownNode,
  consumed: Set<SearchMarkupKind>,
  literals: SearchLiteralRegistry,
): string {
  const collectChildren = (separator: string) =>
    (node.children ?? [])
      .map((child) => collectSearchMarkdown(child, consumed, literals))
      .join(separator);

  switch (node.type) {
    case "text":
      return node.value ?? "";
    case "inlineCode":
    case "code":
      consumed.add("code");
      return literals.protect(node.value ?? "");
    case "html":
      consumed.add("html");
      return "";
    case "image":
    case "imageReference":
      consumed.add("image");
      return node.alt ?? "";
    case "link":
    case "linkReference":
      consumed.add("link");
      return collectChildren("");
    case "definition":
    case "footnoteDefinition":
      consumed.add("reference-definition");
      return "";
    case "footnoteReference":
      consumed.add("link");
      return node.label ?? node.identifier ?? "";
    case "emphasis":
    case "strong":
      consumed.add("emphasis");
      return collectChildren("");
    case "delete":
      consumed.add("strikethrough");
      return collectChildren("");
    case "heading":
      consumed.add("heading");
      return collectChildren("");
    case "list":
    case "listItem":
      consumed.add("list");
      return collectChildren(" ");
    case "blockquote":
      consumed.add("blockquote");
      return collectChildren(" ");
    case "thematicBreak":
      consumed.add("thematic-break");
      return "";
    case "table":
      consumed.add("table");
      return collectChildren(" ");
    case "tableRow":
      return collectChildren(" ");
    case "tableCell":
    case "paragraph":
      return collectChildren("");
    case "root":
      return collectChildren(" ");
    case "break":
      return " ";
    default:
      return node.children ? collectChildren("") : "";
  }
}

function recordDecodedEntities(
  node: MarkdownNode,
  source: string,
  consumed: Set<SearchMarkupKind>,
): void {
  if (node.type === "code" || node.type === "inlineCode" || node.type === "html") return;

  if (node.type === "text" || node.type === "image" || node.type === "imageReference") {
    const start = node.position?.start.offset;
    const end = node.position?.end.offset;
    const rendered = node.type === "text" ? (node.value ?? "") : (node.alt ?? "");
    if (typeof start === "number" && typeof end === "number") {
      const references = source
        .slice(start, end)
        .match(/&(?:#x[\dA-F]+|#\d+|[A-Za-z][A-Za-z\d]+);/giu);
      if (references?.some((reference) => !rendered.includes(reference))) consumed.add("entity");
    }
  }

  for (const child of node.children ?? []) recordDecodedEntities(child, source, consumed);
}

function collectSearchMarkupKinds(tree: MarkdownNode): SearchMarkupKind[] {
  const kinds = new Set<SearchMarkupKind>();

  function visit(node: MarkdownNode): void {
    const kind = searchMarkupKindForNode(node.type);
    if (kind) kinds.add(kind);
    for (const child of node.children ?? []) visit(child);
  }

  visit(tree);
  return [...kinds].toSorted();
}

function searchMarkupKindForNode(type: string): SearchMarkupKind | null {
  switch (type) {
    case "inlineCode":
    case "code":
      return "code";
    case "html":
      return "html";
    case "image":
    case "imageReference":
      return "image";
    case "link":
    case "linkReference":
    case "footnoteReference":
      return "link";
    case "definition":
    case "footnoteDefinition":
      return "reference-definition";
    case "emphasis":
    case "strong":
      return "emphasis";
    case "delete":
      return "strikethrough";
    case "heading":
      return "heading";
    case "list":
    case "listItem":
      return "list";
    case "blockquote":
      return "blockquote";
    case "thematicBreak":
      return "thematic-break";
    case "table":
      return "table";
    default:
      return null;
  }
}

function collapseSearchLabel(value: string): string {
  return value.replace(/\s+/gu, " ").trim();
}

function isEscapablePunctuation(value: string): boolean {
  const codePoint = value.codePointAt(0);
  return (
    codePoint !== undefined &&
    ((codePoint >= 0x21 && codePoint <= 0x2f) ||
      (codePoint >= 0x3a && codePoint <= 0x40) ||
      (codePoint >= 0x5b && codePoint <= 0x60) ||
      (codePoint >= 0x7b && codePoint <= 0x7e))
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
