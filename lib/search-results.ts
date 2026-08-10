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

export type SearchResidualKind = SearchMarkupKind | "invalid" | "non-convergent";

export type SearchLabelNormalization = {
  text: string;
  consumedKinds: SearchMarkupKind[];
  residualKinds: SearchResidualKind[];
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

const MAX_SEARCH_AST_DEPTH = 256;
const MAX_SEARCH_AST_NODES = 4096;
const MAX_SEARCH_LABEL_LENGTH = 32_768;
const MAX_SEARCH_NORMALIZATION_PASSES = 32;
const SEARCH_RAW_TEXT_ELEMENTS = new Set(["script", "style"]);

export class SearchResultTracker {
  readonly #errorGenerations = new Map<unknown, SearchGeneration>();
  readonly #generationByQuery = new Map<string, number>([["", 0]]);
  readonly #normalizedResults = new WeakMap<
    SortedResult[],
    { generation: SearchGeneration; results: NormalizedSearchResult[] }
  >();
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
    const cached = this.#normalizedResults.get(results);
    if (
      this.#isCurrent(generation) &&
      (!cached ||
        cached.generation.generation !== generation.generation ||
        cached.generation.normalizedQuery !== generation.normalizedQuery)
    ) {
      this.#normalizedResults.set(results, {
        generation,
        results: normalizeSearchResults(results),
      });
    }
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
      const cached = this.#normalizedResults.get(data);
      if (!cached || !this.#isCurrent(cached.generation)) {
        return { results: [], state: "pending" };
      }
      return {
        results: cached.results,
        state: cached.results.length > 0 ? "ready" : "empty",
      };
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

  try {
    if (value.length > MAX_SEARCH_LABEL_LENGTH) return invalidSearchLabel(consumed);

    const sourceTree = parseSearchMarkdown(value);
    if (!sourceTree) return invalidSearchLabel(consumed);

    const html = stripSearchHtml(value, findHtmlScannerOpaqueRanges(sourceTree, value));
    if (html.consumed) consumed.add("html");

    const literals = createSearchLiteralRegistry(value);
    const initialTree = parseSearchMarkdown(html.source);
    if (!initialTree) return invalidSearchLabel(consumed);

    let current = protectEscapedPunctuation(
      html.source,
      findOpaqueSourceRanges(initialTree),
      literals,
    );

    for (let pass = 0; pass < MAX_SEARCH_NORMALIZATION_PASSES; pass += 1) {
      let tree = parseSearchMarkdown(current);
      if (!tree) return invalidSearchLabel(consumed);

      recordDecodedEntities(tree, current, consumed);
      const htmlPass = stripSearchHtml(current, findHtmlScannerOpaqueRanges(tree, current));
      if (htmlPass.consumed) {
        consumed.add("html");
        current = htmlPass.source;
        tree = parseSearchMarkdown(current);
        if (!tree) return invalidSearchLabel(consumed);
      }

      const collected = collectSearchMarkdown(tree, consumed, literals);
      if (collected === null) return invalidSearchLabel(consumed);

      const next = collapseSearchLabel(collected);
      if (next === current) {
        return completeSearchLabel(literals.restore(current), consumed, []);
      }

      current = next;
    }

    return completeSearchLabel(literals.restore(current), consumed, ["non-convergent"]);
  } catch {
    return invalidSearchLabel(consumed);
  }
}

export function stripSearchMarkup(value: string): string {
  const normalized = normalizeSearchLabel(value);
  return normalized.residualKinds.length === 0 ? normalized.text : "";
}

export function hasSearchMarkdownArtifacts(value: string): boolean {
  const diagnostic = normalizeSearchLabel(value);
  return diagnostic.consumedKinds.length > 0 || diagnostic.residualKinds.length > 0;
}

type SearchLiteralRegistry = {
  protect: (value: string) => string;
  restore: (value: string) => string;
};

type SearchHtmlTag = {
  closing: boolean;
  end: number;
  name: string;
  selfClosing: boolean;
};

function completeSearchLabel(
  text: string,
  consumed: Set<SearchMarkupKind>,
  residualKinds: SearchResidualKind[],
): SearchLabelNormalization {
  return {
    text: collapseSearchLabel(text),
    consumedKinds: [...consumed].toSorted(),
    residualKinds,
  };
}

function invalidSearchLabel(consumed: Set<SearchMarkupKind>): SearchLabelNormalization {
  return completeSearchLabel("", consumed, ["invalid"]);
}

function parseSearchMarkdown(value: string): MarkdownNode | null {
  if (value.length > MAX_SEARCH_LABEL_LENGTH) return null;

  try {
    const tree = fromMarkdown(value, {
      extensions: [gfm()],
      mdastExtensions: [gfmFromMarkdown()],
    }) as MarkdownNode;
    return isSearchMarkdownTreeSafe(tree) ? tree : null;
  } catch {
    return null;
  }
}

function isSearchMarkdownTreeSafe(tree: MarkdownNode): boolean {
  const seen = new Set<MarkdownNode>();
  const stack = [{ depth: 0, node: tree }];
  let nodes = 0;

  while (stack.length > 0) {
    const entry = stack.pop();
    if (!entry || seen.has(entry.node)) return false;
    seen.add(entry.node);

    nodes += 1;
    if (nodes > MAX_SEARCH_AST_NODES || entry.depth > MAX_SEARCH_AST_DEPTH) return false;

    const children = entry.node.children ?? [];
    for (let index = children.length - 1; index >= 0; index -= 1) {
      stack.push({ depth: entry.depth + 1, node: children[index] });
    }
  }

  return true;
}

function stripSearchHtml(
  value: string,
  opaqueRanges: readonly SourceRange[],
): { consumed: boolean; source: string } {
  const output: string[] = [];
  let consumed = false;
  let index = 0;
  let rangeIndex = 0;

  while (index < value.length) {
    while (opaqueRanges[rangeIndex]?.end <= index) rangeIndex += 1;
    const range = opaqueRanges[rangeIndex];
    if (range && index >= range.start && index < range.end) {
      output.push(value.slice(index, range.end));
      index = range.end;
      rangeIndex += 1;
      continue;
    }

    if (value.startsWith("<!--", index) && !isEscapedSearchCharacter(value, index)) {
      const commentEnd = value.indexOf("-->", index + 4);
      output.push(" ");
      consumed = true;
      index = commentEnd === -1 ? value.length : commentEnd + 3;
      continue;
    }

    if (value.startsWith("{/*", index) && !isEscapedSearchCharacter(value, index)) {
      const commentEnd = value.indexOf("*/}", index + 3);
      output.push(" ");
      consumed = true;
      index = commentEnd === -1 ? value.length : commentEnd + 3;
      continue;
    }

    if (value[index] === "<" && !isEscapedSearchCharacter(value, index)) {
      const tag = scanSearchHtmlTag(value, index);
      if (tag) {
        output.push(" ");
        consumed = true;
        index = tag.end;

        if (!tag.closing && !tag.selfClosing && SEARCH_RAW_TEXT_ELEMENTS.has(tag.name)) {
          const closingTag = findSearchRawTextClosingTag(value, index, tag.name);
          index = closingTag?.end ?? value.length;
          output.push(" ");
        }
        continue;
      }
    }

    output.push(value[index]);
    index += 1;
  }

  return { consumed, source: output.join("") };
}

function scanSearchHtmlTag(value: string, start: number): SearchHtmlTag | null {
  if (value.startsWith("<>", start)) {
    return { closing: false, end: start + 2, name: "", selfClosing: false };
  }
  if (value.startsWith("</>", start)) {
    return { closing: true, end: start + 3, name: "", selfClosing: false };
  }

  let cursor = start + 1;
  let closing = false;

  if (value[cursor] === "/") {
    closing = true;
    cursor += 1;
  }

  const nameStart = cursor;
  while (cursor < value.length && /[A-Za-z0-9._:-]/u.test(value[cursor])) cursor += 1;
  if (cursor === nameStart || !/[A-Za-z]/u.test(value[nameStart])) return null;
  if (cursor >= value.length || !/[\s/>]/u.test(value[cursor])) return null;
  if (value[cursor] === "/" && value[cursor + 1] !== ">") return null;

  const name = value.slice(nameStart, cursor).toLocaleLowerCase("en-US");
  let braceDepth = 0;
  let quote: "\"" | "'" | "`" | null = null;

  while (cursor < value.length) {
    const character = value[cursor];
    if (quote) {
      if (character === "\\") cursor += 2;
      else {
        if (character === quote) quote = null;
        cursor += 1;
      }
      continue;
    }

    if (character === "\"" || character === "'" || character === "`") {
      quote = character;
      cursor += 1;
      continue;
    }
    if (character === "{") {
      braceDepth += 1;
      cursor += 1;
      continue;
    }
    if (character === "}" && braceDepth > 0) {
      braceDepth -= 1;
      cursor += 1;
      continue;
    }
    if (character === ">" && braceDepth === 0) {
      let tail = cursor - 1;
      while (tail > start && /\s/u.test(value[tail])) tail -= 1;
      return {
        closing,
        end: cursor + 1,
        name,
        selfClosing: !closing && value[tail] === "/",
      };
    }
    cursor += 1;
  }

  return { closing, end: value.length, name, selfClosing: false };
}

function isEscapedSearchCharacter(value: string, index: number): boolean {
  let backslashes = 0;
  for (let cursor = index - 1; cursor >= 0 && value[cursor] === "\\"; cursor -= 1) {
    backslashes += 1;
  }
  return backslashes % 2 === 1;
}

function findSearchRawTextClosingTag(
  value: string,
  start: number,
  name: string,
): SearchHtmlTag | null {
  let cursor = start;

  while (cursor < value.length) {
    const tagStart = value.indexOf("<", cursor);
    if (tagStart === -1) return null;

    const tag = scanSearchHtmlTag(value, tagStart);
    if (tag?.closing && tag.name === name) return tag;
    cursor = tag?.end ?? tagStart + 1;
  }

  return null;
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
  return findSearchSourceRanges(tree, true);
}

function findHtmlScannerOpaqueRanges(tree: MarkdownNode, source: string): SourceRange[] {
  const ranges: SourceRange[] = [];
  const stack = [tree];

  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) continue;

    const start = node.position?.start.offset;
    const end = node.position?.end.offset;
    const isCode = node.type === "code" || node.type === "inlineCode";
    const isAutolink =
      node.type === "link" &&
      typeof start === "number" &&
      typeof end === "number" &&
      source[start] === "<" &&
      source[end - 1] === ">";

    if ((isCode || isAutolink) && typeof start === "number" && typeof end === "number") {
      ranges.push({ start, end });
      continue;
    }

    const children = node.children ?? [];
    for (let index = children.length - 1; index >= 0; index -= 1) stack.push(children[index]);
  }

  return ranges.toSorted((left, right) => left.start - right.start || left.end - right.end);
}

function findSearchSourceRanges(tree: MarkdownNode, includeHtml: boolean): SourceRange[] {
  const ranges: SourceRange[] = [];
  const stack = [tree];

  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) continue;

    if (
      node.type === "code" ||
      node.type === "inlineCode" ||
      (includeHtml && node.type === "html")
    ) {
      const start = node.position?.start.offset;
      const end = node.position?.end.offset;
      if (typeof start === "number" && typeof end === "number") ranges.push({ start, end });
      continue;
    }

    const children = node.children ?? [];
    for (let index = children.length - 1; index >= 0; index -= 1) stack.push(children[index]);
  }

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
): string | null {
  const collected = new Map<MarkdownNode, string>();
  const stack = [{ node, visited: false }];

  while (stack.length > 0) {
    const entry = stack.pop();
    if (!entry) continue;

    if (!entry.visited) {
      stack.push({ node: entry.node, visited: true });
      const children = entry.node.children ?? [];
      for (let index = children.length - 1; index >= 0; index -= 1) {
        stack.push({ node: children[index], visited: false });
      }
      continue;
    }

    const children = (entry.node.children ?? []).map((child) => collected.get(child) ?? "");
    const value = collectSearchMarkdownNode(entry.node, children, consumed, literals);
    if (value.length > MAX_SEARCH_LABEL_LENGTH * 2) return null;
    collected.set(entry.node, value);
  }

  return collected.get(node) ?? "";
}

function collectSearchMarkdownNode(
  node: MarkdownNode,
  children: string[],
  consumed: Set<SearchMarkupKind>,
  literals: SearchLiteralRegistry,
): string {
  const collectChildren = (separator: string) => children.join(separator);

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
  const stack = [node];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    if (current.type === "code" || current.type === "inlineCode" || current.type === "html") {
      continue;
    }

    if (current.type === "text" || current.type === "image" || current.type === "imageReference") {
      const start = current.position?.start.offset;
      const end = current.position?.end.offset;
      const rendered = current.type === "text" ? (current.value ?? "") : (current.alt ?? "");
      if (typeof start === "number" && typeof end === "number") {
        const references = source
          .slice(start, end)
          .match(/&(?:#x[\dA-F]+|#\d+|[A-Za-z][A-Za-z\d]+);/giu);
        if (references?.some((reference) => !rendered.includes(reference))) {
          consumed.add("entity");
        }
      }
    }

    const children = current.children ?? [];
    for (let index = children.length - 1; index >= 0; index -= 1) stack.push(children[index]);
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

  const title = normalizeSearchLabel(result.content);
  if (!title.text || title.residualKinds.length > 0) return null;

  const breadcrumbs = (result.breadcrumbs ?? []).map(normalizeSearchLabel);
  if (breadcrumbs.some((breadcrumb) => breadcrumb.residualKinds.length > 0)) return null;

  return {
    id: `search-result-${encodeURIComponent(sourceId)}`,
    sourceId,
    type: result.type,
    url: destination.url,
    title: title.text,
    context: breadcrumbs.map((breadcrumb) => breadcrumb.text).filter(Boolean).join(" / "),
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
