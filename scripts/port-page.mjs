import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import * as cheerio from "cheerio";
import TurndownService from "turndown";

const ROOT = resolve(import.meta.dirname, "..");
const LIVE_ORIGIN = "https://store.mobilenativefoundation.org";
const SITEMAP_URL = `${LIVE_ORIGIN}/sitemap.xml`;
const INVENTORY_PATH = resolve(ROOT, "evidence/live-url-inventory.txt");
const MANIFEST_PATH = resolve(ROOT, "evidence/T4-manifest.md");
const EXCLUDED_URL = `${LIVE_ORIGIN}/api/openapi.json`;
const MIGRATION_DATE = "2026-08-09";
const OUTSIDE_ROUTE_TARGETS = new Map([
  ["/developer-newsletter/overview", "app/developer-newsletter/overview/page.tsx"],
  ["/release-notes/overview", "app/release-notes/overview/page.tsx"],
]);

let lastRequestStartedAt = 0;

const inventory = (await readFile(INVENTORY_PATH, "utf8"))
  .trim()
  .split(/\r?\n/)
  .filter(Boolean);
const inventoryPathnames = new Set(inventory.map((url) => new URL(url).pathname));

await verifyLiveInventory();

const rows = [];
for (const url of inventory) {
  const pathname = new URL(url).pathname;
  const target = targetForPathname(pathname);

  try {
    const html = await fetchText(url);
    const page = extractLivePage(html, url);

    if (pathname.startsWith("/docs/")) {
      const body = convertBodyToMdx(page.bodyHtml, url);
      const portedChars = normalizedMarkdownChars(body);
      const portedHeadings = markdownHeadings(body);
      const assessment = assessFidelity({
        liveChars: page.liveChars,
        liveHeadings: page.liveHeadings,
        portedChars,
        portedHeadings,
      });

      await writeText(resolve(ROOT, target), renderMdx(page.title, body));
      rows.push({
        liveChars: page.liveChars,
        liveHeadings: page.liveHeadings,
        liveTitle: page.title,
        loss: assessment.loss,
        portedChars,
        portedHeadings,
        status: assessment.status,
        target,
        url,
      });
    } else {
      const portedChars = 0;
      const portedHeadings = [];
      const assessment = assessFidelity({
        liveChars: page.liveChars,
        liveHeadings: page.liveHeadings,
        portedChars,
        portedHeadings,
      });

      await writeText(resolve(ROOT, target), renderTitleOnlyRoute(page.title, pathname));
      rows.push({
        liveChars: page.liveChars,
        liveHeadings: page.liveHeadings,
        liveTitle: page.title,
        loss: assessment.loss,
        portedChars,
        portedHeadings,
        status: assessment.status,
        target,
        url,
      });
    }

    console.log(`${rows.length}/${inventory.length} ${url} -> ${target} (${rows.at(-1).status})`);
  } catch (error) {
    rows.push({
      liveChars: "—",
      liveHeadings: "—",
      liveTitle: "—",
      loss: error instanceof Error ? error.message : String(error),
      portedChars: "—",
      portedHeadings: "—",
      status: "blocked",
      target,
      url,
    });
    console.error(`${rows.length}/${inventory.length} ${url} -> blocked: ${rows.at(-1).loss}`);
  }
}

await writeText(MANIFEST_PATH, renderManifest(rows));
console.log(`manifest: ${rows.length} inventory rows + 1 exclusion`);

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

  return {
    bodyHtml: content.html() ?? "",
    liveChars: normalizeText(content.text()).length,
    liveHeadings: content
      .find("h1,h2,h3,h4,h5,h6")
      .map((_, element) => normalizeHeading($(element).text()))
      .get(),
    title,
  };
}

export function convertBodyToMdx(bodyHtml, pageUrl) {
  if (normalizeText(cheerio.load(`<div id="body">${bodyHtml}</div>`)("#body").text()).length === 0) {
    return "";
  }

  const $ = cheerio.load(`<div id="ported-content">${bodyHtml}</div>`, null, false);
  const root = $("#ported-content");
  root.find("script,style,noscript,svg").remove();
  root.find("button").each((_, element) => {
    const label = normalizeText($(element).text());
    if (/^(?:copy|copied)$/i.test(label)) $(element).remove();
  });

  root.find("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (href) $(element).attr("href", rewriteLiveUrl(href, pageUrl, false));
  });
  root.find("img[src]").each((_, element) => {
    const src = $(element).attr("src");
    if (src) $(element).attr("src", rewriteLiveUrl(src, pageUrl, true));
  });

  const turndown = createTurndownService();
  const markdown = turndown.turndown(root.html() ?? "");
  return sanitizePortedMarkdown(markdown);
}

export function rewriteLiveUrl(rawTarget, pageUrl, asset) {
  const target = rawTarget.trim();
  if (
    target.length === 0 ||
    target.startsWith("#") ||
    /^(?:mailto|tel|data|javascript):/i.test(target)
  ) {
    return target;
  }

  let resolved;
  try {
    resolved = new URL(target, pageUrl);
  } catch {
    return target;
  }

  if (resolved.origin !== LIVE_ORIGIN) return resolved.href;
  if (!asset && inventoryPathnames.has(resolved.pathname)) {
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  }
  return resolved.href;
}

export function normalizedMarkdownChars(body) {
  let inFence = false;
  const kept = [];
  for (const line of body.split(/\r?\n/)) {
    if (/^\s*(`{3,}|~{3,})/.test(line)) {
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
    kept
      .join("\n")
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
    if (/^\s*(`{3,}|~{3,})/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = line.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/);
    if (match) headings.push(normalizeHeading(match[1]));
  }
  return headings;
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

  service.addRule("headings", {
    filter: ["h1", "h2", "h3", "h4", "h5", "h6"],
    replacement(_content, node) {
      const liveDepth = Number(node.nodeName.slice(1));
      const depth = Math.max(2, liveDepth);
      const title = normalizeHeading(node.textContent);
      return title.length > 0 ? `\n\n${"#".repeat(depth)} ${title}\n\n` : "";
    },
  });

  service.addRule("table", {
    filter: "table",
    replacement(_content, node) {
      const rows = [...node.querySelectorAll("tr")].map((row) =>
        [...row.querySelectorAll(":scope > th, :scope > td")].map((cell) =>
          normalizeText(cell.textContent).replaceAll("|", "\\|"),
        ),
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

function languageFromClass(className) {
  return className.match(/(?:language|lang)-([\w+-]+)/)?.[1];
}

function sanitizePortedMarkdown(markdown) {
  const withoutBodyH1 = markdown
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => (/^#\s+/.test(line) ? `#${line}` : line))
    .join("\n");
  return escapeMdxText(withoutBodyH1)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function escapeMdxText(markdown) {
  let inFence = false;
  return markdown
    .split("\n")
    .map((line) => {
      if (/^\s*(`{3,}|~{3,})/.test(line)) {
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

function renderMdx(title, body) {
  const frontmatter = `---\ntitle: ${JSON.stringify(title)}\n---\n`;
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

function renderManifest(manifestRows) {
  const header = [
    "# Content migration manifest",
    "",
    `Date: ${MIGRATION_DATE}`,
    "",
    "Live character counts normalize whitespace from `#content` while retaining hidden code-tab panels. Ported counts apply the same whitespace normalization after removing Markdown presentation syntax. Heading cells are ordered JSON arrays; equality is value-and-order equality, not count equality. A zero-character live body uses an N/A ratio and is clean only when the title matches and the ported body is empty.",
    "",
    "| URL | Target | Live title | Live chars | Ported chars | Live headings | Ported headings | Status | Loss |",
    "| --- | --- | --- | ---: | ---: | --- | --- | --- | --- |",
  ];
  const lines = manifestRows.map((row) =>
    [
      row.url,
      row.target,
      row.liveTitle,
      row.liveChars,
      row.portedChars,
      Array.isArray(row.liveHeadings) ? JSON.stringify(row.liveHeadings) : row.liveHeadings,
      Array.isArray(row.portedHeadings) ? JSON.stringify(row.portedHeadings) : row.portedHeadings,
      row.status,
      row.loss,
    ]
      .map(manifestCell)
      .join(" | "),
  );
  lines.push(
    [
      EXCLUDED_URL,
      "—",
      "—",
      "—",
      "—",
      "—",
      "—",
      "excluded by design",
      "Not part of the 37-URL sitemap inventory; no route or content was generated.",
    ]
      .map(manifestCell)
      .join(" | "),
  );
  return `${header.join("\n")}\n| ${lines.join(" |\n| ")} |\n`;
}

function manifestCell(value) {
  return String(value)
    .replace(/\s+/g, " ")
    .trim()
    .replaceAll("|", "&#124;")
    .replaceAll("`", "&#96;");
}

function targetForPathname(pathname) {
  if (pathname.startsWith("/docs/")) return `content${pathname}.mdx`;
  const target = OUTSIDE_ROUTE_TARGETS.get(pathname);
  if (!target) throw new Error(`No exact target for inventory path ${pathname}`);
  return target;
}

async function verifyLiveInventory() {
  const sitemap = await fetchText(SITEMAP_URL);
  const live = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  if (live.length === 0) throw new Error("live sitemap contains zero URLs");
  if (JSON.stringify(live) !== JSON.stringify(inventory)) {
    throw new Error(`live sitemap differs from ${INVENTORY_PATH}`);
  }
  console.log(`inventory equality: ${live.length}/${inventory.length}`);
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

async function writeText(path, content) {
  await mkdir(dirname(path), { recursive: true });
  let current;
  try {
    current = await readFile(path, "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  if (current !== content) await writeFile(path, content, "utf8");
}

function normalizeHeading(value) {
  return normalizeText(value)
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+#+$/, "")
    .replace(/[*_`]/g, "")
    .trim();
}

function normalizeText(value) {
  return value.replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\s+/g, " ").trim();
}
