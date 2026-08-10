import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import * as cheerio from "cheerio";
import TurndownService from "turndown";

const ROOT = resolve(import.meta.dirname, "..");
const LIVE_ORIGIN = "https://store.mobilenativefoundation.org";
const SITEMAP_URL = `${LIVE_ORIGIN}/sitemap.xml`;
const INVENTORY_PATH = resolve(ROOT, "evidence/live-url-inventory.txt");
const SNAPSHOT_PATH = resolve(ROOT, "evidence/T4-live-snapshot.json");
const MANIFEST_PATH = resolve(ROOT, "evidence/T4-manifest.md");
const EXCLUDED_URL = `${LIVE_ORIGIN}/api/openapi.json`;
const MIGRATION_DATE = "2026-08-09";
const OUTSIDE_ROUTE_TARGETS = new Map([
  ["/developer-newsletter/overview", "app/developer-newsletter/overview/page.tsx"],
  ["/release-notes/overview", "app/release-notes/overview/page.tsx"],
]);

const inventoryText = await readFile(INVENTORY_PATH, "utf8");
const inventory = inventoryText.trim().split(/\r?\n/).filter(Boolean);
const inventoryPathnames = new Set(inventory.map((url) => new URL(url).pathname));
let lastRequestStartedAt = 0;

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const mode = parseMode(process.argv.slice(2));
  if (mode === "acquire") await acquireSnapshot();
  else await generateFromSnapshot();
}

async function acquireSnapshot() {
  const sitemap = await fetchText(SITEMAP_URL);
  const sitemapInventory = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  if (sitemapInventory.length === 0) throw new Error("live sitemap contains zero URLs");
  if (JSON.stringify(sitemapInventory) !== JSON.stringify(inventory)) {
    throw new Error(`live sitemap differs from ${INVENTORY_PATH}`);
  }

  const pages = [];
  for (const url of inventory) {
    const html = await fetchText(url);
    const page = extractLivePage(html, url);
    const pathname = new URL(url).pathname;
    let sourceMarkdown = "";
    let markdownSha256;
    if (pathname.startsWith("/docs/")) {
      sourceMarkdown = await fetchText(`${url}.md`);
      validateMarkdownSidecar(sourceMarkdown, page.title, url);
      markdownSha256 = sha256(sourceMarkdown);
    }
    pages.push({
      bodyHtml: page.bodyHtml,
      bodySha256: sha256(page.bodyHtml),
      description: page.description,
      liveChars: page.liveChars,
      liveHeadings: page.liveHeadings,
      markdownSha256,
      sourceMarkdown,
      title: page.title,
      url,
    });
    console.log(`acquired ${pages.length}/${inventory.length} ${url}`);
  }

  const snapshot = {
    schemaVersion: 1,
    migrationDate: MIGRATION_DATE,
    inventorySha256: sha256(inventoryText),
    sitemapSha256: sha256(sitemap),
    pages,
  };
  await writeAtomic(SNAPSHOT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`pinned ${pages.length} live pages in ${relative(ROOT, SNAPSHOT_PATH)}`);
}

async function generateFromSnapshot() {
  const snapshot = JSON.parse(await readFile(SNAPSHOT_PATH, "utf8"));
  validateSnapshot(snapshot);

  const outputs = new Map();
  const rows = [];
  for (const page of snapshot.pages) {
    const pathname = new URL(page.url).pathname;
    const target = targetForPathname(pathname);
    if (pathname.startsWith("/docs/")) {
      const body = convertBodyToMdx(page.bodyHtml, page.url, page.sourceMarkdown);
      const portedChars = normalizedMarkdownChars(body);
      const portedHeadings = markdownHeadings(body);
      const assessment = assessFidelity({
        liveChars: page.liveChars,
        liveHeadings: page.liveHeadings,
        portedChars,
        portedHeadings,
      });
      outputs.set(target, renderMdx(page.title, page.description, body));
      rows.push(manifestRow(page, target, portedChars, portedHeadings, assessment));
    } else {
      const assessment = assessFidelity({
        liveChars: page.liveChars,
        liveHeadings: page.liveHeadings,
        portedChars: 0,
        portedHeadings: [],
      });
      outputs.set(target, renderTitleOnlyRoute(page.title, pathname));
      rows.push(manifestRow(page, target, 0, [], assessment));
    }
  }
  outputs.set(relative(ROOT, MANIFEST_PATH), renderManifest(rows, snapshot));
  assertOwnedOutputSet(outputs);
  await writeOutputTransaction(outputs);
  console.log(`generated ${rows.length} inventory targets and one manifest from the pinned snapshot`);
}

export function extractLivePage(html, url) {
  const $ = cheerio.load(html);
  const container = $("main#content-container");
  const titleNode = $("#page-title");
  const content = $("#content");
  if (container.length !== 1 || titleNode.length !== 1 || content.length !== 1) {
    throw new Error(
      `${url}: expected exactly one main#content-container, #page-title, and #content; got ${container.length}/${titleNode.length}/${content.length}`,
    );
  }

  const title = normalizeText(titleNode.text());
  if (title.length === 0) throw new Error(`${url}: #page-title is empty`);
  const description = normalizeText($("header#header > div.prose").first().text());
  return {
    bodyHtml: content.html() ?? "",
    description,
    liveChars: normalizeText(content.text()).length,
    liveHeadings: content
      .find("h1,h2,h3,h4,h5,h6")
      .map((_, element) => normalizeHeading($(element).text()))
      .get(),
    title,
  };
}

export function convertBodyToMdx(bodyHtml, pageUrl, sourceMarkdown = "") {
  const initial = cheerio.load(`<div id="body">${bodyHtml}</div>`, null, false);
  if (normalizeText(initial("#body").text()).length === 0) return "";

  const $ = cheerio.load(`<div id="ported-content">${bodyHtml}</div>`, null, false);
  const root = $("#ported-content");
  root.find("script,style,noscript,svg").remove();
  root.find("button").each((_, element) => {
    if (/^(?:copy|copied)$/i.test(normalizeText($(element).text()))) $(element).remove();
  });

  root.find('a[href][aria-label^="Navigate to header"]').each((_, element) => {
    if (normalizeText($(element).text()).length === 0) $(element).remove();
  });
  removeDarkOnlyMedia($, root);
  normalizeCards($, root, sourceMarkdown, pageUrl);
  normalizeSteps($, root);
  normalizeCallouts($, root);

  root.find("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (href !== undefined) $(element).attr("href", rewriteLiveUrl(href, pageUrl, false));
  });
  root.find("img[src]").each((_, element) => {
    const src = $(element).attr("src");
    if (src !== undefined) $(element).attr("src", rewriteLiveUrl(src, pageUrl, true));
  });

  const markdown = createTurndownService().turndown(root.html() ?? "");
  const missingStep = extractMissingFetcherStep(sourceMarkdown, pageUrl);
  const combined = missingStep.length > 0 ? insertBeforeStep(markdown, missingStep, "3") : markdown;
  return sanitizePortedMarkdown(combined);
}

export function rewriteLiveUrl(rawTarget, pageUrl, asset) {
  const target = rawTarget.trim();
  const errorCode = asset ? "UNSAFE_IMAGE_SCHEME" : "UNSAFE_ANCHOR_SCHEME";
  if (target.length === 0) return target;
  if (!asset && target.startsWith("#")) return target;

  const explicitScheme = target.match(/^([a-z][a-z0-9+.-]*):/i)?.[1]?.toLowerCase();
  const allowedSchemes = asset ? new Set(["http", "https"]) : new Set(["http", "https", "mailto", "tel"]);
  if (explicitScheme && !allowedSchemes.has(explicitScheme)) throw new Error(`${errorCode}: ${rawTarget}`);
  if (!asset && (explicitScheme === "mailto" || explicitScheme === "tel")) return target;

  let resolved;
  try {
    resolved = new URL(target, pageUrl);
  } catch {
    throw new Error(`${errorCode}: ${rawTarget}`);
  }
  if (!allowedSchemes.has(resolved.protocol.slice(0, -1).toLowerCase())) {
    throw new Error(`${errorCode}: ${rawTarget}`);
  }
  if (resolved.origin !== LIVE_ORIGIN) return resolved.href;
  if (!asset && inventoryPathnames.has(resolved.pathname)) {
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  }
  return resolved.href;
}

function normalizeCards($, root, sourceMarkdown, pageUrl) {
  const cards = root.find('.card[role="link"][aria-labelledby]').toArray();
  const sourceCards = parseSourceCards(sourceMarkdown);
  if (cards.length === 0) {
    if (sourceCards.length > 0) throw new Error(`${pageUrl}: source has cards but live body has none`);
    return;
  }
  if (cards.length !== sourceCards.length) {
    throw new Error(`${pageUrl}: live/source card count differs (${cards.length}/${sourceCards.length})`);
  }
  cards.forEach((card, index) => {
    const titleNode = $(card).find('[data-component-part="card-title"]').first();
    const liveTitle = normalizeText(titleNode.text());
    const sourceCard = sourceCards[index];
    if (liveTitle !== normalizeText(sourceCard.title)) {
      throw new Error(`${pageUrl}: live/source card title differs at ${index + 1}`);
    }
    titleNode.html(`<a href="${escapeHtmlAttribute(sourceCard.href)}">${titleNode.html() ?? ""}</a>`);
  });
}

function parseSourceCards(sourceMarkdown) {
  const cards = [];
  for (const match of sourceMarkdown.matchAll(/<Card\b([^>]*)>/g)) {
    const title = attributeValue(match[1], "title");
    const href = attributeValue(match[1], "href");
    if (!href) continue;
    if (!title) throw new Error("linked source Card requires a title attribute");
    cards.push({ href, title });
  }
  return cards;
}

function normalizeSteps($, root) {
  root.find('[role="list"].steps').each((_, list) => {
    const parentList = $(list).parents('[role="list"].steps').length > 0;
    if (parentList) return;
    const replacements = [];
    $(list)
      .children('[role="listitem"].step')
      .each((__, step) => {
        const numberNode = $(step).find('[data-component-part="step-number"]').first();
        const titleNode = $(step).find('[data-component-part="step-title"]').first();
        const contentNode = $(step).find('[data-component-part="step-content"]').first();
        const number = normalizeText(numberNode.text());
        let title = normalizeText(titleNode.text());
        if (title.length === 0) {
          const firstContentChild = contentNode.children().first();
          const firstStrong = firstContentChild.find("strong").first();
          title = normalizeText(firstStrong.text());
          if (title.length > 0 && normalizeText(firstContentChild.text()) === title) firstContentChild.remove();
        }
        if (number.length === 0 || title.length === 0) throw new Error("rendered step lacks a number or title");
        const replacement = $(
          `<div data-ported-step="${escapeHtmlAttribute(number)}" data-ported-step-title="${escapeHtmlAttribute(title)}"></div>`,
        );
        replacement.html(contentNode.html() ?? "");
        replacements.push(replacement);
      });
    if (replacements.length > 0) $(list).replaceWith(replacements);
  });
}

function normalizeCallouts($, root) {
  root.find('span[data-as="p"]').each((_, element) => {
    const paragraph = $("<p></p>");
    paragraph.html($(element).html() ?? "");
    $(element).replaceWith(paragraph);
  });
  root.find('[role="note"][data-callout-type]').each((_, element) => {
    const type = capitalize($(element).attr("data-callout-type") ?? "note");
    $(element).find('[data-component-part="callout-icon"]').remove();
    const content = $(element).find('[data-component-part="callout-content"]').first();
    if (content.length > 0) $(element).html(content.html() ?? "");
    $(element).attr("data-ported-callout", type);
  });
}

function removeDarkOnlyMedia($, root) {
  root.find("[class]").each((_, element) => {
    const tokens = new Set(($(element).attr("class") ?? "").split(/\s+/).filter(Boolean));
    if (tokens.has("hidden") && tokens.has("dark:block") && ($(element).is("img") || $(element).find("img").length > 0)) {
      $(element).remove();
    }
  });
}

function extractMissingFetcherStep(sourceMarkdown, pageUrl) {
  const outer = sourceMarkdown.match(/<Steps\b([^>]*)stepNumber="2"([^>]*)>([\s\S]*?)<\/Steps>/);
  if (!outer) return "";
  const attributes = `${outer[1]} ${outer[2]}`;
  const title = attributeValue(attributes, "title");
  if (!title) throw new Error(`${pageUrl}: source step 2 has no title`);
  const inner = dedent(outer[3]);
  const noteMatch = inner.match(/<Note>([\s\S]*?)<\/Note>/);
  const nestedSteps = [...inner.matchAll(/<Step\b([^>]*)>([\s\S]*?)<\/Step>/g)];
  if (!noteMatch || nestedSteps.length !== 2) throw new Error(`${pageUrl}: source step 2 structure changed`);

  const lines = [`2. **${title}**`, "", renderSourceCallout("Note", noteMatch[1], pageUrl)];
  for (const nested of nestedSteps) {
    const label = attributeValue(nested[1], "stepNumber");
    const nestedTitle = attributeValue(nested[1], "title");
    if (!label || !nestedTitle) throw new Error(`${pageUrl}: nested source step lacks attributes`);
    lines.push("", `- **${label}. ${nestedTitle}**`, "", rewriteSourceMarkdown(dedent(nested[2]), pageUrl));
  }
  return lines.join("\n").trim();
}

function renderSourceCallout(type, source, pageUrl) {
  const body = rewriteSourceMarkdown(dedent(source), pageUrl).trim();
  return [`> **${type}**`, ">", ...body.split("\n").map((line) => (line.length > 0 ? `> ${line}` : ">"))].join("\n");
}

function rewriteSourceMarkdown(source, pageUrl) {
  return source.replace(/(!?\[[^\]]*\]\()([^)]+)(\))/g, (match, prefix, rawTarget, suffix) => {
    const target = rawTarget.trim();
    return `${prefix}${rewriteLiveUrl(target, pageUrl, prefix.startsWith("!"))}${suffix}`;
  });
}

function insertBeforeStep(markdown, addition, stepNumber) {
  const marker = new RegExp(`^${stepNumber}\\. \\*\\*`, "m");
  const match = marker.exec(markdown);
  if (!match) throw new Error(`rendered step ${stepNumber} was not found`);
  return `${markdown.slice(0, match.index).trimEnd()}\n\n${addition}\n\n${markdown.slice(match.index).trimStart()}`;
}

function createTurndownService() {
  const service = new TurndownService({
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "*",
    fence: "```",
    headingStyle: "atx",
    strongDelimiter: "**",
  });

  service.addRule("fenced-code", {
    filter: "pre",
    replacement(_content, node) {
      const code = node.textContent.replace(/^\n|\n$/g, "");
      const language =
        node.getAttribute("language") ??
        node.querySelector("code")?.getAttribute("language") ??
        languageFromClass(node.querySelector("code")?.getAttribute("class") ?? "");
      const longestTicks = Math.max(0, ...[...code.matchAll(/`+/g)].map((match) => match[0].length));
      const fence = "`".repeat(Math.max(3, longestTicks + 1));
      return `\n\n${fence}${language ?? ""}\n${code}\n${fence}\n\n`;
    },
  });

  service.addRule("callouts", {
    filter(node) {
      return node.nodeType === 1 && node.hasAttribute("data-ported-callout");
    },
    replacement(content, node) {
      const label = node.getAttribute("data-ported-callout");
      const body = content.trim();
      const quoted = body.length > 0
        ? `\n>\n${body.split("\n").map((line) => (line.length > 0 ? `> ${line}` : ">")).join("\n")}`
        : "";
      return `\n\n> **${label}**${quoted}\n\n`;
    },
  });

  service.addRule("steps", {
    filter(node) {
      return node.nodeType === 1 && node.hasAttribute("data-ported-step");
    },
    replacement(content, node) {
      const number = node.getAttribute("data-ported-step");
      const title = node.getAttribute("data-ported-step-title");
      return `\n\n${number}. **${title}**${content.trim().length > 0 ? `\n\n${content.trim()}` : ""}\n\n`;
    },
  });

  service.addRule("headings", {
    filter: ["h1", "h2", "h3", "h4", "h5", "h6"],
    replacement(content, node) {
      const depth = Math.max(2, Number(node.nodeName.slice(1)));
      const title = content
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        .replace(/\s+#+$/, "")
        .trim()
        .replace(/^\*\*([\s\S]+)\*\*$/, "$1");
      return title.length > 0 ? `\n\n${"#".repeat(depth)} ${title}\n\n` : "";
    },
  });

  service.addRule("table", {
    filter: "table",
    replacement(_content, node) {
      const rows = [...node.querySelectorAll("tr")].map((row) =>
        [...row.querySelectorAll(":scope > th, :scope > td")].map((cell) => cellMarkdown(cell)),
      );
      if (rows.length === 0 || rows[0].length === 0) return "";
      const width = Math.max(...rows.map((row) => row.length));
      const normalized = rows.map((row) => [...row, ...Array(width - row.length).fill("")]);
      const header = normalized[0];
      const body = normalized.slice(1);
      return `\n\n| ${header.join(" | ")} |\n| ${header.map(() => "---").join(" | ")} |${
        body.length > 0 ? `\n${body.map((row) => `| ${row.join(" | ")} |`).join("\n")}` : ""
      }\n\n`;
    },
  });

  return service;
}

function cellMarkdown(cell) {
  return [...cell.childNodes]
    .map((node) => {
      if (node.nodeType === 3) return node.textContent ?? "";
      if (node.nodeType !== 1) return "";
      if (node.nodeName === "A") {
        const href = node.getAttribute("href");
        return href ? `[${normalizeText(node.textContent)}](${href})` : normalizeText(node.textContent);
      }
      if (node.nodeName === "CODE") return `\`${normalizeText(node.textContent)}\``;
      return normalizeText(node.textContent);
    })
    .join(" ")
    .replaceAll("|", "\\|")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizePortedMarkdown(markdown) {
  const withoutBodyH1 = markdown
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => (/^#\s+/.test(line) ? `#${line}` : line))
    .join("\n");
  return escapeMdxText(withoutBodyH1)
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function escapeMdxText(markdown) {
  let inFence = false;
  return markdown
    .split("\n")
    .map((line) => {
      if (/^\s*>?\s*(`{3,}|~{3,})/.test(line)) {
        inFence = !inFence;
        return line;
      }
      if (inFence) return line;
      return escapeOutsideInlineCode(line);
    })
    .join("\n");
}

function escapeOutsideInlineCode(line) {
  let output = "";
  let index = 0;
  while (index < line.length) {
    if (line[index] !== "`") {
      const nextTick = line.indexOf("`", index);
      const end = nextTick === -1 ? line.length : nextTick;
      output += line.slice(index, end).replaceAll("{", "&#123;").replaceAll("}", "&#125;").replaceAll("<", "&lt;");
      index = end;
      continue;
    }
    const delimiter = line.slice(index).match(/^`+/)?.[0] ?? "`";
    const closing = line.indexOf(delimiter, index + delimiter.length);
    if (closing === -1) {
      output += line.slice(index).replaceAll("{", "&#123;").replaceAll("}", "&#125;").replaceAll("<", "&lt;");
      break;
    }
    output += line.slice(index, closing + delimiter.length);
    index = closing + delimiter.length;
  }
  return output;
}

export function normalizedMarkdownChars(body) {
  let inFence = false;
  const kept = [];
  for (const line of body.split(/\r?\n/)) {
    if (/^\s*>?\s*(`{3,}|~{3,})/.test(line)) {
      inFence = !inFence;
      continue;
    }
    kept.push(
      inFence
        ? line
        : line
            .replace(/^\s{0,3}#{1,6}\s+/, "")
            .replace(/^\s*(?:[-+*]|\d+[.)])\s+/, "")
            .replace(/^\s*>\s?/, ""),
    );
  }
  return normalizeText(
    kept.join("\n")
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/<[^>]+>/g, "")
      .replace(/[*_~]/g, "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&"),
  ).length;
}

export function markdownHeadings(body) {
  let inFence = false;
  const headings = [];
  for (const line of body.split(/\r?\n/)) {
    if (/^\s*>?\s*(`{3,}|~{3,})/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = line.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/);
    if (match) headings.push(normalizeHeading(match[1]));
  }
  return headings;
}

function assessFidelity({ liveChars, liveHeadings, portedChars, portedHeadings }) {
  const headingsMatch = JSON.stringify(liveHeadings) === JSON.stringify(portedHeadings);
  const meetsRatio = liveChars === 0 ? portedChars === 0 : portedChars / liveChars >= 0.6;
  if (headingsMatch && meetsRatio) return { loss: "none", status: "ported clean" };
  const reasons = [];
  if (!meetsRatio) {
    const ratio = liveChars === 0 ? "N/A" : `${((portedChars / liveChars) * 100).toFixed(1)}%`;
    reasons.push(`normalized character ratio ${ratio} is below 60%`);
  }
  if (!headingsMatch) reasons.push("ordered headings differ");
  return { loss: reasons.join("; "), status: "ported with noted loss" };
}

function renderMdx(title, description, body) {
  const descriptionLine = description.length > 0 ? `description: ${JSON.stringify(description)}\n` : "";
  const frontmatter = `---\ntitle: ${JSON.stringify(title)}\n${descriptionLine}---\n`;
  return body.length > 0 ? `${frontmatter}\n${body}\n` : frontmatter;
}

function renderTitleOnlyRoute(title, pathname) {
  return `import type { TOCItemType } from "fumadocs-core/toc";
import { Separator } from "@heroui/react";
import type { Metadata } from "next";

import { AppShell } from "@/components/shell/AppShell";
import { source } from "@/lib/source";

const title = ${JSON.stringify(title)};
const toc: TOCItemType[] = [{ depth: 2, title, url: "#page-title" }];

export const metadata: Metadata = { title };

export default function Page() {
  return (
    <AppShell currentPath=${JSON.stringify(pathname)} pageTree={source.pageTree} toc={toc}>
      <article className="mx-auto max-w-3xl">
        <header className="space-y-4">
          <h1 id="page-title" className="text-4xl font-semibold tracking-tight">
            {title}
          </h1>
          <Separator />
        </header>
        <div id="content" />
      </article>
    </AppShell>
  );
}
`;
}

function renderManifest(manifestRows, snapshot) {
  const header = [
    "# Content migration manifest",
    "",
    `Date: ${snapshot.migrationDate}`,
    "",
    `Pinned inventory SHA-256: \`${snapshot.inventorySha256}\``,
    `Pinned sitemap SHA-256: \`${snapshot.sitemapSha256}\``,
    "",
    "Live character counts normalize whitespace from `#content` while retaining hidden code-tab panels. Ported counts apply the same whitespace normalization after removing Markdown presentation syntax. Heading cells are ordered JSON arrays; equality is value-and-order equality, not count equality. A zero-character live body uses an N/A ratio and is clean only when the title matches and the ported body is empty.",
    "",
    "| URL | Target | Live title | Live chars | Ported chars | Live headings | Ported headings | Status | Loss |",
    "| --- | --- | --- | ---: | ---: | --- | --- | --- | --- |",
  ];
  const lines = manifestRows.map((row) =>
    [row.url, row.target, row.liveTitle, row.liveChars, row.portedChars, JSON.stringify(row.liveHeadings), JSON.stringify(row.portedHeadings), row.status, row.loss]
      .map(manifestCell)
      .join(" | "),
  );
  lines.push(
    [EXCLUDED_URL, "—", "—", "—", "—", "—", "—", "excluded by design", "Not part of the sitemap inventory; no route or content was generated."]
      .map(manifestCell)
      .join(" | "),
  );
  return `${header.join("\n")}\n| ${lines.join(" |\n| ")} |\n`;
}

function validateSnapshot(snapshot) {
  if (snapshot?.schemaVersion !== 1 || snapshot.migrationDate !== MIGRATION_DATE || !Array.isArray(snapshot.pages)) {
    throw new Error("invalid live snapshot metadata");
  }
  if (snapshot.inventorySha256 !== sha256(inventoryText)) throw new Error("live snapshot inventory hash differs");
  if (JSON.stringify(snapshot.pages.map((page) => page.url)) !== JSON.stringify(inventory)) {
    throw new Error("live snapshot page set or order differs from inventory");
  }
  if (new Set(snapshot.pages.map((page) => page.url)).size !== inventory.length) {
    throw new Error("live snapshot contains duplicate URLs");
  }
  for (const page of snapshot.pages) {
    if (page.bodySha256 !== sha256(page.bodyHtml)) throw new Error(`${page.url}: live body hash differs`);
    const pathname = new URL(page.url).pathname;
    if (pathname.startsWith("/docs/") && page.markdownSha256 !== sha256(page.sourceMarkdown)) {
      throw new Error(`${page.url}: source Markdown hash differs`);
    }
  }
}

export function assertOwnedOutputSet(outputs) {
  const expected = new Set([
    ...inventory.map((url) => targetForPathname(new URL(url).pathname)),
    relative(ROOT, MANIFEST_PATH),
  ]);
  if (outputs.size !== expected.size || [...outputs.keys()].some((target) => !expected.has(target))) {
    throw new Error("generated output set differs from the owned inventory targets");
  }
}

export async function writeOutputTransaction(outputs) {
  const originals = new Map();
  const temporary = new Map();
  try {
    for (const [target, content] of outputs) {
      const targetPath = resolve(ROOT, target);
      if (!isWithin(ROOT, targetPath)) throw new Error(`target escapes repository: ${target}`);
      await mkdir(dirname(targetPath), { recursive: true });
      try {
        originals.set(targetPath, await readFile(targetPath));
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
        originals.set(targetPath, null);
      }
      const temporaryPath = `${targetPath}.${randomUUID()}.tmp`;
      await writeFile(temporaryPath, content, "utf8");
      temporary.set(targetPath, temporaryPath);
    }
    for (const [targetPath, temporaryPath] of temporary) await rename(temporaryPath, targetPath);
  } catch (error) {
    for (const temporaryPath of temporary.values()) await unlink(temporaryPath).catch(() => {});
    for (const [targetPath, original] of originals) {
      if (original === null) await unlink(targetPath).catch(() => {});
      else await writeFile(targetPath, original);
    }
    throw error;
  }
}

async function writeAtomic(path, content) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, content, "utf8");
    await rename(temporary, path);
  } catch (error) {
    await unlink(temporary).catch(() => {});
    throw error;
  }
}

function manifestRow(page, target, portedChars, portedHeadings, assessment) {
  return {
    liveChars: page.liveChars,
    liveHeadings: page.liveHeadings,
    liveTitle: page.title,
    loss: assessment.loss,
    portedChars,
    portedHeadings,
    status: assessment.status,
    target,
    url: page.url,
  };
}

function targetForPathname(pathname) {
  if (pathname.startsWith("/docs/")) return `content${pathname}.mdx`;
  const target = OUTSIDE_ROUTE_TARGETS.get(pathname);
  if (!target) throw new Error(`No exact target for inventory path ${pathname}`);
  return target;
}

function validateMarkdownSidecar(source, liveTitle, url) {
  const titleMatch = source.match(/^#\s+(.+)$/m);
  if (!titleMatch) throw new Error(`${url}.md: missing H1`);
  if (normalizeHeading(titleMatch[1]) !== normalizeHeading(liveTitle)) {
    throw new Error(`${url}.md: H1 differs from live title`);
  }
}

async function fetchText(url) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await waitForRequestSlot();
    const response = await fetch(url);
    if (response.status >= 500 && response.status <= 599 && attempt < 2) continue;
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
    return response.text();
  }
  throw new Error(`${url}: exhausted two 5xx retries`);
}

async function waitForRequestSlot() {
  const remaining = 1000 - (Date.now() - lastRequestStartedAt);
  if (remaining > 0) await new Promise((resolvePromise) => setTimeout(resolvePromise, remaining));
  lastRequestStartedAt = Date.now();
}

function parseMode(argumentsList) {
  if (argumentsList.length !== 1 || !["--acquire", "--generate"].includes(argumentsList[0])) {
    throw new Error("usage: port-page.mjs --acquire | --generate");
  }
  return argumentsList[0].slice(2);
}

function manifestCell(value) {
  return String(value).replace(/\s+/g, " ").trim().replaceAll("|", "&#124;").replaceAll("`", "&#96;");
}

function languageFromClass(className) {
  return className.match(/(?:language|lang)-([\w+-]+)/)?.[1];
}

function normalizeHeading(value) {
  return normalizeText(value)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+#+$/, "")
    .replace(/[*_`]/g, "")
    .trim();
}

function normalizeText(value) {
  return value.replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\s+/g, " ").trim();
}

function attributeValue(attributes, name) {
  return attributes.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`))?.[1];
}

function dedent(value) {
  const lines = value.replace(/^\n|\n$/g, "").split("\n");
  const indents = lines.filter((line) => line.trim().length > 0).map((line) => line.match(/^\s*/)[0].length);
  const minimum = indents.length > 0 ? Math.min(...indents) : 0;
  return lines.map((line) => line.slice(minimum)).join("\n").trim();
}

function capitalize(value) {
  return value.length > 0 ? `${value[0].toUpperCase()}${value.slice(1).toLowerCase()}` : value;
}

function escapeHtmlAttribute(value) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function isWithin(root, path) {
  const relativePath = relative(root, path);
  return relativePath !== "" && relativePath !== ".." && !relativePath.startsWith(`..${sep}`);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
