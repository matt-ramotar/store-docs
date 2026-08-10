import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import * as cheerio from "cheerio";
import TurndownService from "turndown";

import { reconcileOwnedOutputs } from "./generated-output-transaction.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const LIVE_ORIGIN = "https://store.mobilenativefoundation.org";
const SITEMAP_URL = `${LIVE_ORIGIN}/sitemap.xml`;
const INVENTORY_PATH = resolve(ROOT, "evidence/live-url-inventory.txt");
const SNAPSHOT_PATH = resolve(ROOT, "evidence/T4-live-snapshot.json");
const MANIFEST_PATH = resolve(ROOT, "evidence/T4-manifest.md");
const OWNED_TARGETS_PATH = "evidence/T4-owned-targets.json";
const ACQUIRE_OWNER = "port-page:acquire";
const GENERATE_OWNER = "port-page:generate";
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

async function acquireSnapshot() {
  const sitemap = await fetchText(SITEMAP_URL);
  const sitemapInventory = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  if (sitemapInventory.length === 0) throw new Error("live sitemap contains zero URLs");
  if (JSON.stringify(sitemapInventory) !== JSON.stringify(inventory)) {
    throw new Error(`live sitemap differs from ${INVENTORY_PATH}`);
  }

  const pages = [];
  const acquiredStatuses = new Map();
  for (const url of inventory) {
    const html = await fetchText(url);
    acquiredStatuses.set(url, 200);
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

  const linkUrls = collectSameOriginLinkHealthUrls(pages);
  const linkHealth = [];
  for (const url of linkUrls) {
    const status = acquiredStatuses.get(url) ?? await fetchStatus(url);
    linkHealth.push({ status, url });
    console.log(`checked link ${linkHealth.length}/${linkUrls.length} ${status} ${url}`);
  }

  const snapshot = {
    schemaVersion: 2,
    migrationDate: MIGRATION_DATE,
    inventorySha256: sha256(inventoryText),
    sitemapSha256: sha256(sitemap),
    linkHealth,
    linkHealthSha256: sha256(JSON.stringify(linkHealth)),
    pages,
  };
  validateSnapshot(snapshot);
  await writeLiveSnapshotTransaction(
    new Map([[relative(ROOT, SNAPSHOT_PATH), `${JSON.stringify(snapshot, null, 2)}\n`]]),
  );
  console.log(`pinned ${pages.length} live pages in ${relative(ROOT, SNAPSHOT_PATH)}`);
}

async function generateFromSnapshot() {
  const snapshot = JSON.parse(await readFile(SNAPSHOT_PATH, "utf8"));
  validateSnapshot(snapshot);

  const outputs = new Map();
  const rows = [];
  const linkHealth = new Map(snapshot.linkHealth.map((entry) => [entry.url, entry.status]));
  for (const page of snapshot.pages) {
    const pathname = new URL(page.url).pathname;
    const target = targetForPathname(pathname);
    if (pathname.startsWith("/docs/")) {
      const conversion = convertBodyToMdx(page.bodyHtml, page.url, page.sourceMarkdown, linkHealth);
      const body = conversion.body;
      const portedChars = normalizedMarkdownChars(body);
      const portedHeadings = markdownHeadings(body);
      let assessment = assessFidelity({
        liveChars: page.liveChars,
        liveHeadings: page.liveHeadings,
        portedChars,
        portedHeadings,
      });
      if (conversion.unavailableDestinations.length > 0) {
        assessment = {
          loss: `Source-authored destination ${conversion.unavailableDestinations.join(", ")} is unavailable and outside the inventory; rendered as a non-link label.`,
          status: "ported with noted loss",
        };
      }
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
  await writeLiveOutputTransaction(outputs);
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

export function convertBodyToMdx(bodyHtml, pageUrl, sourceMarkdown = "", linkHealth = new Map()) {
  const initial = cheerio.load(`<div id="body">${bodyHtml}</div>`, null, false);
  if (normalizeText(initial("#body").text()).length === 0) {
    return { body: "", unavailableDestinations: [] };
  }

  const $ = cheerio.load(`<div id="ported-content">${bodyHtml}</div>`, null, false);
  const root = $("#ported-content");
  const context = createConversionContext(pageUrl, sourceMarkdown, linkHealth);
  root.find("script,style,noscript,svg").remove();
  root.find("button").each((_, element) => {
    if (/^(?:copy|copied)$/i.test(normalizeText($(element).text()))) $(element).remove();
  });

  root.find('a[href][aria-label^="Navigate to header"]').each((_, element) => {
    if (normalizeText($(element).text()).length === 0) $(element).remove();
  });
  removeDarkOnlyMedia($, root);
  normalizeCards($, root, context);
  normalizeSourceWidgets($, root, context);
  normalizeCallouts($, root, context);

  root.find("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (href !== undefined) $(element).attr("href", rewriteLiveUrl(href, pageUrl, false));
  });
  root.find("img[src]").each((_, element) => {
    const src = $(element).attr("src");
    if (src !== undefined) $(element).attr("src", rewriteLiveUrl(src, pageUrl, true));
  });

  const markdown = createTurndownService(context).turndown(root.html() ?? "");
  return {
    body: restoreTrustedTags(sanitizePortedMarkdown(markdown), context),
    unavailableDestinations: context.unavailableDestinations,
  };
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
  if (!asset) resolved = normalizeSameOriginDocsUrl(resolved);
  if (!asset && inventoryPathnames.has(resolved.pathname)) {
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  }
  return resolved.href;
}

function normalizeSameOriginDocsUrl(url) {
  if (!url.pathname.startsWith("/docs/docs/")) return url;
  const candidate = `/docs/${url.pathname.slice("/docs/docs/".length)}`;
  if (!inventoryPathnames.has(candidate)) return url;
  const normalized = new URL(url.href);
  normalized.pathname = candidate;
  return normalized;
}

function sameOriginHealthUrl(rawTarget, pageUrl) {
  const target = rawTarget.trim();
  if (target.length === 0 || target.startsWith("#") || /^(?:mailto|tel):/i.test(target)) return undefined;
  let resolved;
  try {
    resolved = new URL(target, pageUrl);
  } catch {
    return undefined;
  }
  if (resolved.origin !== LIVE_ORIGIN || !["http:", "https:"].includes(resolved.protocol)) return undefined;
  resolved = normalizeSameOriginDocsUrl(resolved);
  resolved.hash = "";
  return resolved.href;
}

function normalizeCards($, root, context) {
  const cards = root.find('.card[role="link"][aria-labelledby]').toArray();
  const sourceCards = parseSourceCards(context.sourceTree);
  if (cards.length === 0) {
    if (sourceCards.length > 0) throw new Error(`${context.pageUrl}: source has cards but live body has none`);
    return;
  }
  if (cards.length !== sourceCards.length) {
    throw new Error(`${context.pageUrl}: live/source card count differs (${cards.length}/${sourceCards.length})`);
  }
  cards.forEach((card, index) => {
    const titleNode = $(card).find('[data-component-part="card-title"]').first();
    const liveTitle = normalizeText(titleNode.text());
    const sourceCard = sourceCards[index];
    if (liveTitle !== normalizeText(sourceCard.title)) {
      throw new Error(`${context.pageUrl}: live/source card title differs at ${index + 1}`);
    }
    const healthUrl = sameOriginHealthUrl(sourceCard.href, context.pageUrl);
    if (healthUrl && context.linkHealth.size > 0) {
      const status = context.linkHealth.get(healthUrl);
      if (status === undefined) throw new Error(`${context.pageUrl}: missing link-health status for ${healthUrl}`);
      if (status >= 400) {
        const destination = new URL(healthUrl).pathname;
        const fragment = [
          trustedTag(
            context,
            `<UnavailableDestination destination="${escapeMdxAttribute(destination)}" status="${status}">`,
          ),
          "This source-authored destination is currently unavailable.",
          trustedTag(context, "</UnavailableDestination>"),
        ].join("\n\n");
        const marker = $(`<div data-ported-fragment="${addFragment(context, fragment)}">generated fragment</div>`);
        $(card).append(marker);
        context.unavailableDestinations.push(`${destination} (HTTP ${status})`);
        return;
      }
    }
    titleNode.html(`<a href="${escapeHtmlAttribute(sourceCard.href)}">${titleNode.html() ?? ""}</a>`);
  });
}

function parseSourceCards(sourceTree) {
  const cards = [];
  for (const node of collectComponents(sourceTree, new Set(["Card"]))) {
    const title = literalAttribute(node.attributes, "title");
    const href = literalAttribute(node.attributes, "href");
    if (!href) continue;
    if (!title) throw new Error("linked source Card requires a title attribute");
    cards.push({ href, title });
  }
  return cards;
}

function normalizeSourceWidgets($, root, context) {
  const sourceStepGroups = topLevelStepGroups(context.sourceTree);
  const liveStepGroups = root
    .find('[role="list"].steps')
    .toArray()
    .filter((group) => $(group).parents('[role="list"].steps').length === 0);
  if (sourceStepGroups.length !== liveStepGroups.length) {
    throw new Error(
      `${context.pageUrl}: live/source top-level step group count differs (${liveStepGroups.length}/${sourceStepGroups.length})`,
    );
  }
  validateStepGroups($, liveStepGroups, sourceStepGroups, context.pageUrl);
  validateCodeGroups($, root, context.sourceTree, context.pageUrl);
  sourceStepGroups.forEach((group, index) => {
    const fragment = renderStepsGroup(group, context, false, `steps-${index + 1}`);
    $(liveStepGroups[index]).replaceWith(
      `<div data-ported-fragment="${addFragment(context, fragment)}">generated fragment</div>`,
    );
  });

  const sourceParamRuns = contiguousParamRuns(context.sourceTree);
  const sourceParams = sourceParamRuns.flat();
  const liveParams = root.find(".field").toArray();
  if (sourceParams.length !== liveParams.length) {
    throw new Error(`${context.pageUrl}: live/source parameter count differs (${liveParams.length}/${sourceParams.length})`);
  }
  validateParamFields($, liveParams, sourceParams, context.pageUrl);
  const liveRuns = contiguousLiveFieldRuns($, liveParams);
  if (liveRuns.length !== sourceParamRuns.length || liveRuns.some((run, index) => run.length !== sourceParamRuns[index].length)) {
    throw new Error(`${context.pageUrl}: live/source parameter grouping differs`);
  }
  sourceParamRuns.forEach((run, index) => {
    const fragment = renderParamRun(run, context, `params-${index + 1}`);
    $(liveRuns[index][0]).replaceWith(
      `<div data-ported-fragment="${addFragment(context, fragment)}">generated fragment</div>`,
    );
    for (const field of liveRuns[index].slice(1)) $(field).remove();
  });
}

function normalizeCallouts($, root, context) {
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

  const sourceCallouts = collectComponents(context.sourceTree, new Set(["Info", "Note", "Tip"]));
  const remainingLiveCallouts = root.find("[data-ported-callout]").length;
  const renderedSourceCallouts = countComponentsInTopLevelSteps(
    topLevelStepGroups(context.sourceTree),
    new Set(["Info", "Note", "Tip"]),
  );
  if (sourceCallouts.length !== remainingLiveCallouts + renderedSourceCallouts) {
    throw new Error(
      `${context.pageUrl}: source/live callout coverage differs (${sourceCallouts.length}/${remainingLiveCallouts + renderedSourceCallouts})`,
    );
  }
}

function removeDarkOnlyMedia($, root) {
  root.find("[class]").each((_, element) => {
    const tokens = new Set(($(element).attr("class") ?? "").split(/\s+/).filter(Boolean));
    if (tokens.has("hidden") && tokens.has("dark:block") && ($(element).is("img") || $(element).find("img").length > 0)) {
      $(element).remove();
    }
  });
}

function rewriteSourceMarkdown(source, pageUrl) {
  return source.replace(/(!?\[[^\]]*\]\()([^)]+)(\))/g, (match, prefix, rawTarget, suffix) => {
    const target = rawTarget.trim();
    return `${prefix}${rewriteLiveUrl(target, pageUrl, prefix.startsWith("!"))}${suffix}`;
  });
}

function createConversionContext(pageUrl, sourceMarkdown, linkHealth) {
  const tokenPrefix = "T4TRUSTEDGENERATEDTAG";
  if (sourceMarkdown.includes(tokenPrefix)) throw new Error(`${pageUrl}: reserved generated-tag token in source`);
  return {
    fragments: [],
    linkHealth,
    pageUrl,
    renderedCodeGroups: 0,
    sourceMarkdown,
    sourceTree: parseSourceTree(sourceMarkdown, pageUrl),
    tags: [],
    tokenPrefix,
    unavailableDestinations: [],
  };
}

function addFragment(context, fragment) {
  const index = context.fragments.length;
  context.fragments.push(fragment);
  return index;
}

function trustedTag(context, tag) {
  const index = context.tags.length;
  context.tags.push(tag);
  return `${context.tokenPrefix}${String(index).padStart(5, "0")}END`;
}

function restoreTrustedTags(markdown, context) {
  let restored = markdown;
  context.tags.forEach((tag, index) => {
    const token = `${context.tokenPrefix}${String(index).padStart(5, "0")}END`;
    if (!restored.includes(token)) {
      const surviving = restored.match(new RegExp(`${context.tokenPrefix}\\d+END`, "g")) ?? [];
      throw new Error(`${context.pageUrl}: generated tag ${index} was lost; surviving tags ${surviving.join(",")}`);
    }
    restored = restored.replaceAll(token, tag);
  });
  if (restored.includes(context.tokenPrefix)) throw new Error(`${context.pageUrl}: unresolved generated tag`);
  return restored;
}

const SOURCE_COMPONENT_NAMES = new Set([
  "Card",
  "CardGroup",
  "CodeGroup",
  "Info",
  "Note",
  "ParamField",
  "Step",
  "Steps",
  "Tip",
]);

function parseSourceTree(source, pageUrl) {
  const masked = maskFencedCode(source);
  const root = { children: [], name: "Root", type: "component" };
  const stack = [root];
  let cursor = 0;
  let searchIndex = 0;
  while (searchIndex < masked.length) {
    const start = masked.indexOf("<", searchIndex);
    if (start === -1) break;
    const prefix = masked.slice(start).match(/^<\/?([A-Z][A-Za-z0-9]*)\b/);
    if (!prefix || !SOURCE_COMPONENT_NAMES.has(prefix[1])) {
      searchIndex = start + 1;
      continue;
    }
    const end = findSourceTagEnd(source, start, pageUrl);
    const raw = source.slice(start, end + 1);
    const closing = /^<\//.test(raw);
    const selfClosing = /\/\s*>$/.test(raw);
    const name = prefix[1];
    if (start > cursor) stack.at(-1).children.push({ type: "text", value: source.slice(cursor, start) });
    if (closing) {
      if (stack.length === 1 || stack.at(-1).name !== name) {
        throw new Error(`${pageUrl}: mismatched source component closing tag ${name}`);
      }
      stack.pop();
    } else {
      const nameStart = raw.indexOf(name) + name.length;
      const attributes = raw.slice(nameStart, raw.length - (selfClosing ? 2 : 1));
      const node = { attributes, children: [], name, type: "component" };
      stack.at(-1).children.push(node);
      if (!selfClosing) stack.push(node);
    }
    cursor = end + 1;
    searchIndex = end + 1;
  }
  if (cursor < source.length) stack.at(-1).children.push({ type: "text", value: source.slice(cursor) });
  if (stack.length !== 1) throw new Error(`${pageUrl}: unclosed source component ${stack.at(-1).name}`);
  return root;
}

function maskFencedCode(source) {
  const lines = source.match(/.*(?:\n|$)/g) ?? [];
  let fence;
  return lines
    .map((line) => {
      const candidate = line.match(/^\s*(`{3,}|~{3,})/);
      const maskedLine = line.replace(/[^\n\r]/g, " ");
      if (!fence && candidate) {
        fence = { character: candidate[1][0], length: candidate[1].length };
        return maskedLine;
      }
      if (fence) {
        const closing = line.match(/^\s*(`{3,}|~{3,})\s*(?:\r?\n)?$/);
        if (closing && closing[1][0] === fence.character && closing[1].length >= fence.length) fence = undefined;
        return maskedLine;
      }
      return line;
    })
    .join("");
}

function findSourceTagEnd(source, start, pageUrl) {
  let quote;
  for (let index = start + 1; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (character === quote && source[index - 1] !== "\\") quote = undefined;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === ">") return index;
  }
  throw new Error(`${pageUrl}: unterminated source component tag`);
}

function collectComponents(root, names) {
  const result = [];
  function visit(node) {
    if (node.type !== "component") return;
    if (names.has(node.name)) result.push(node);
    for (const child of node.children) visit(child);
  }
  visit(root);
  return result;
}

function topLevelStepGroups(root) {
  const result = [];
  function visit(node, insideSteps) {
    if (node.type !== "component") return;
    const nextInside = insideSteps || node.name === "Steps" || node.name === "Step";
    if (node.name === "Steps" && !insideSteps) result.push(node);
    for (const child of node.children) visit(child, nextInside);
  }
  visit(root, false);
  return result;
}

function semanticStepItems(group) {
  return group.children.filter(
    (child) =>
      child.type === "component" &&
      (child.name === "Step" ||
        (child.name === "Steps" &&
          (literalAttribute(child.attributes, "title") || literalAttribute(child.attributes, "stepNumber")))),
  );
}

function validateStepGroups($, liveGroups, sourceGroups, pageUrl) {
  sourceGroups.forEach((sourceGroup, groupIndex) => {
    const sourceItems = semanticStepItems(sourceGroup).filter((item) => item.name === "Step");
    const liveItems = $(liveGroups[groupIndex]).children('[role="listitem"].step').toArray();
    if (liveItems.length !== sourceItems.length) {
      throw new Error(`${pageUrl}: live/source step item count differs in group ${groupIndex + 1}`);
    }
    sourceItems.forEach((sourceItem, itemIndex) => {
      const attributes = parseLiteralAttributes(sourceItem.attributes, new Set(["stepNumber", "title"]), pageUrl);
      const inferred = stepTitleAndChildren(sourceItem, attributes, pageUrl);
      const liveTitle = normalizeText(
        $(liveItems[itemIndex]).find('[data-component-part="step-title"]').first().text(),
      ) || inferLiveStepTitle($, liveItems[itemIndex]);
      if (normalizeText(inferred.title) !== liveTitle) {
        throw new Error(`${pageUrl}: live/source step title differs in group ${groupIndex + 1}, item ${itemIndex + 1}`);
      }
    });
  });
}

function inferLiveStepTitle($, item) {
  const content = $(item).find('[data-component-part="step-content"]').first();
  const first = content.children().first();
  const strong = first.find("strong").first();
  return normalizeText(first.text()) === normalizeText(strong.text()) ? normalizeText(strong.text()) : "";
}

function renderStepsGroup(group, context, nested, path) {
  return renderStepsItems(semanticStepItems(group), context, nested, path);
}

function renderStepsItems(items, context, nested, path) {
  const parts = [trustedTag(context, `<StepsGroup nested="${nested ? "true" : "false"}">`)];
  items.forEach((item, index) => parts.push(renderStepItem(item, index, context, `${path}-${index + 1}`)));
  parts.push(trustedTag(context, "</StepsGroup>"));
  return parts.join("\n\n");
}

function renderStepItem(node, index, context, path) {
  const attributes = parseLiteralAttributes(node.attributes, new Set(["stepNumber", "title"]), context.pageUrl);
  const { children, title } = stepTitleAndChildren(node, attributes, context.pageUrl);
  const label = attributes.stepNumber ?? String(index + 1);
  const bodyChildren = node.name === "Steps"
    ? children.filter((child) => !(child.type === "component" && child.name === "Step"))
    : children;
  const nestedItems = node.name === "Steps"
    ? children.filter((child) => child.type === "component" && child.name === "Step")
    : [];
  const bodyParts = [];
  const body = renderSourceNodes(bodyChildren, context, path);
  if (body.length > 0) bodyParts.push(body);
  if (nestedItems.length > 0) bodyParts.push(renderStepsItems(nestedItems, context, true, `${path}-nested`));
  return [
    trustedTag(
      context,
      `<StepItem label="${escapeMdxAttribute(label)}" title="${escapeMdxAttribute(title)}">`,
    ),
    bodyParts.join("\n\n"),
    trustedTag(context, "</StepItem>"),
  ].filter((part) => part.length > 0).join("\n\n");
}

function stepTitleAndChildren(node, attributes, pageUrl) {
  if (attributes.title) return { children: node.children, title: attributes.title };
  const children = node.children.map((child) => ({ ...child }));
  for (let index = 0; index < children.length; index += 1) {
    if (children[index].type !== "text") continue;
    const match = children[index].value.match(/^\s*\*\*([^*\n]+)\*\*\s*(?:\r?\n|$)/);
    if (!match) {
      if (children[index].value.trim().length === 0) continue;
      break;
    }
    children[index].value = children[index].value.slice(match[0].length);
    return { children, title: normalizeText(match[1]) };
  }
  throw new Error(`${pageUrl}: source Step has no literal or leading-bold title`);
}

function renderSourceNodes(nodes, context, path) {
  const parts = [];
  for (const node of nodes) {
    if (node.type === "text") {
      const text = rewriteSourceMarkdown(dedent(node.value), context.pageUrl).trim();
      if (text.length > 0) parts.push(text);
      continue;
    }
    if (node.name === "Steps") {
      parts.push(renderStepsGroup(node, context, true, `${path}-nested`));
    } else if (["Info", "Note", "Tip"].includes(node.name)) {
      parts.push(renderSourceCalloutNode(node, context, path));
    } else if (node.name === "CodeGroup") {
      parts.push(renderCodeGroup(node, context));
    } else {
      throw new Error(`${context.pageUrl}: unsupported source component ${node.name} inside generated widget`);
    }
  }
  return parts.join("\n\n");
}

function renderSourceCalloutNode(node, context, path) {
  parseLiteralAttributes(node.attributes, new Set(), context.pageUrl);
  const body = renderSourceNodes(node.children, context, `${path}-callout`);
  return [
    trustedTag(context, `<Callout type="${node.name}">`),
    body,
    trustedTag(context, "</Callout>"),
  ].filter((part) => part.length > 0).join("\n\n");
}

function validateCodeGroups($, root, sourceTree, pageUrl) {
  const sourceGroups = collectComponents(sourceTree, new Set(["CodeGroup"]));
  const liveGroups = root.find(".code-group").toArray();
  if (sourceGroups.length !== liveGroups.length) {
    throw new Error(`${pageUrl}: live/source code group count differs (${liveGroups.length}/${sourceGroups.length})`);
  }
  sourceGroups.forEach((sourceGroup, groupIndex) => {
    const panels = parseCodeGroupPanels(sourceGroup, pageUrl);
    const tabs = $(liveGroups[groupIndex]).find('[role="tab"]')
      .map((_, tab) => normalizeText($(tab).text()))
      .get();
    const livePanels = $(liveGroups[groupIndex]).find('[role="tabpanel"]').toArray();
    if (JSON.stringify(tabs) !== JSON.stringify(panels.map((panel) => panel.label))) {
      throw new Error(`${pageUrl}: live/source code tab labels differ in group ${groupIndex + 1}`);
    }
    if (livePanels.length !== panels.length) {
      throw new Error(`${pageUrl}: live/source code panel count differs in group ${groupIndex + 1}`);
    }
    panels.forEach((panel, panelIndex) => {
      const liveCode = normalizeCode($(livePanels[panelIndex]).find("pre").first().text());
      if (liveCode !== normalizeCode(panel.code)) {
        throw new Error(`${pageUrl}: live/source code panel differs in group ${groupIndex + 1}, panel ${panelIndex + 1}`);
      }
    });
  });
}

function renderCodeGroup(node, context) {
  const panels = parseCodeGroupPanels(node, context.pageUrl);
  context.renderedCodeGroups += 1;
  const groupId = `${new URL(context.pageUrl).pathname.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}-code-${context.renderedCodeGroups}`;
  const parts = [trustedTag(context, '<TabGroup label="Code examples">')];
  panels.forEach((panel, index) => {
    const panelId = `${groupId}-panel-${index + 1}`;
    const longestTicks = Math.max(0, ...[...panel.code.matchAll(/`+/g)].map((match) => match[0].length));
    const fence = "`".repeat(Math.max(3, longestTicks + 1));
    parts.push(
      [
        trustedTag(
          context,
          `<TabPanel id="${panelId}" label="${escapeMdxAttribute(panel.label)}" language="${escapeMdxAttribute(panel.language)}">`,
        ),
        `${fence}${panel.language}\n${panel.code}\n${fence}`,
        trustedTag(context, "</TabPanel>"),
      ].join("\n\n"),
    );
  });
  parts.push(trustedTag(context, "</TabGroup>"));
  return parts.join("\n\n");
}

function parseCodeGroupPanels(node, pageUrl) {
  parseLiteralAttributes(node.attributes, new Set(), pageUrl);
  if (node.children.some((child) => child.type !== "text")) {
    throw new Error(`${pageUrl}: CodeGroup contains a nested source component`);
  }
  const source = node.children.map((child) => child.value).join("");
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const panels = [];
  for (let index = 0; index < lines.length; index += 1) {
    const opening = lines[index].match(/^\s*(`{3,}|~{3,})([^\s]+)\s+(.+?)\s+theme=\{["']system["']\}\s*$/);
    if (!opening) continue;
    const fence = opening[1];
    const code = [];
    let closed = false;
    for (index += 1; index < lines.length; index += 1) {
      const closing = lines[index].match(/^\s*(`{3,}|~{3,})\s*$/);
      if (closing && closing[1][0] === fence[0] && closing[1].length >= fence.length) {
        closed = true;
        break;
      }
      code.push(lines[index]);
    }
    if (!closed) throw new Error(`${pageUrl}: unclosed CodeGroup fence`);
    panels.push({ code: dedent(code.join("\n")), label: normalizeText(opening[3]), language: opening[2] });
  }
  if (panels.length === 0) throw new Error(`${pageUrl}: CodeGroup contains no labeled panels`);
  return panels;
}

function contiguousParamRuns(sourceTree) {
  const runs = [];
  let current = [];
  for (const child of sourceTree.children) {
    if (child.type === "component" && child.name === "ParamField") {
      current.push(child);
      continue;
    }
    if (child.type === "text" && child.value.trim().length === 0) continue;
    if (current.length > 0) runs.push(current);
    current = [];
  }
  if (current.length > 0) runs.push(current);
  return runs;
}

function contiguousLiveFieldRuns($, fields) {
  const runs = [];
  let current = [];
  for (const field of fields) {
    const previous = current.at(-1);
    if (!previous || $(previous).next()[0] === field) {
      current.push(field);
      continue;
    }
    runs.push(current);
    current = [field];
  }
  if (current.length > 0) runs.push(current);
  return runs;
}

function paramMetadata(node, pageUrl) {
  const attributes = parseLiteralAttributes(
    node.attributes,
    new Set(["path", "query", "required", "type"]),
    pageUrl,
  );
  const names = [attributes.path, attributes.query].filter(Boolean);
  if (names.length !== 1 || !attributes.type) throw new Error(`${pageUrl}: invalid ParamField metadata`);
  const description = renderPlainSourceText(node.children, pageUrl);
  return {
    description,
    name: names[0],
    required: attributes.required === true,
    type: attributes.type,
  };
}

function validateParamFields($, liveFields, sourceFields, pageUrl) {
  sourceFields.forEach((field, index) => {
    const expected = paramMetadata(field, pageUrl);
    const live = liveFields[index];
    const actual = {
      description: normalizeText($(live).find('[data-component-part="field-content"]').first().text()),
      name: normalizeText($(live).find('[data-component-part="field-name"]').first().text()),
      required: $(live).find('[data-component-part="field-required-pill"]').length > 0,
      type: normalizeText($(live).find('[data-component-part="field-info-pill"]').first().text()),
    };
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`${pageUrl}: live/source ParamField differs at ${index + 1}`);
    }
  });
}

function renderParamRun(run, context, path) {
  const parts = [trustedTag(context, "<ParamList>")];
  run.forEach((node, index) => {
    const metadata = paramMetadata(node, context.pageUrl);
    const body = renderSourceNodes(node.children, context, `${path}-${index + 1}`);
    parts.push(
      [
        trustedTag(
          context,
          `<ParamField name="${escapeMdxAttribute(metadata.name)}" type="${escapeMdxAttribute(metadata.type)}" required="${metadata.required ? "true" : "false"}">`,
        ),
        body,
        trustedTag(context, "</ParamField>"),
      ].join("\n\n"),
    );
  });
  parts.push(trustedTag(context, "</ParamList>"));
  return parts.join("\n\n");
}

function renderPlainSourceText(nodes, pageUrl) {
  const source = nodes.map((node) => {
    if (node.type !== "text") throw new Error(`${pageUrl}: ParamField description contains a component`);
    return node.value;
  }).join("");
  return normalizeText(
    source
      .replace(/!?\[([^\]]*)\]\([^)]+\)/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/[*_~]/g, ""),
  );
}

function countComponentsInTopLevelSteps(groups, names) {
  return groups.reduce((total, group) => total + collectComponents(group, names).length, 0);
}

function parseLiteralAttributes(source, allowed, pageUrl) {
  const result = {};
  let index = 0;
  while (index < source.length) {
    while (/\s/.test(source[index] ?? "")) index += 1;
    if (index >= source.length) break;
    const nameMatch = source.slice(index).match(/^([A-Za-z][A-Za-z0-9_-]*)/);
    if (!nameMatch) throw new Error(`${pageUrl}: source component has a non-literal attribute`);
    const name = nameMatch[1];
    if (!allowed.has(name)) throw new Error(`${pageUrl}: unexpected source component attribute ${name}`);
    index += name.length;
    while (/\s/.test(source[index] ?? "")) index += 1;
    if (source[index] !== "=") {
      result[name] = true;
      continue;
    }
    index += 1;
    while (/\s/.test(source[index] ?? "")) index += 1;
    const quote = source[index];
    if (quote !== '"' && quote !== "'") throw new Error(`${pageUrl}: source component attribute ${name} is not literal`);
    index += 1;
    let value = "";
    while (index < source.length && source[index] !== quote) {
      if (source[index] === "\\" && source[index + 1] === quote) index += 1;
      value += source[index];
      index += 1;
    }
    if (source[index] !== quote) throw new Error(`${pageUrl}: unterminated source component attribute ${name}`);
    index += 1;
    result[name] = value;
  }
  return result;
}

function literalAttribute(source, name) {
  let index = 0;
  while (index < source.length) {
    while (/\s/.test(source[index] ?? "")) index += 1;
    const nameMatch = source.slice(index).match(/^([A-Za-z][A-Za-z0-9_-]*)/);
    if (!nameMatch) return undefined;
    const attributeName = nameMatch[1];
    index += attributeName.length;
    while (/\s/.test(source[index] ?? "")) index += 1;
    if (source[index] !== "=") {
      if (attributeName === name) return "";
      continue;
    }
    index += 1;
    while (/\s/.test(source[index] ?? "")) index += 1;
    const quote = source[index];
    if (quote !== '"' && quote !== "'") return undefined;
    const start = index + 1;
    index = start;
    while (index < source.length && source[index] !== quote) index += 1;
    if (attributeName === name) return source.slice(start, index);
    index += 1;
  }
  return undefined;
}

function normalizeCode(value) {
  return value.replace(/\r\n/g, "\n").replace(/^\n+|\n+$/g, "");
}

function escapeMdxAttribute(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function createTurndownService(context) {
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
      return `\n\n${trustedTag(context, `<Callout type="${escapeMdxAttribute(label)}">`)}\n\n${body}\n\n${trustedTag(context, "</Callout>")}\n\n`;
    },
  });

  service.addRule("source-fragments", {
    filter(node) {
      return node.nodeType === 1 && node.hasAttribute("data-ported-fragment");
    },
    replacement(_content, node) {
      const index = Number(node.getAttribute("data-ported-fragment"));
      const fragment = context.fragments[index];
      if (fragment === undefined) throw new Error(`missing generated source fragment ${index}`);
      return `\n\n${fragment}\n\n`;
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
    `Pinned same-origin link-health SHA-256: \`${snapshot.linkHealthSha256}\``,
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
  if (
    snapshot?.schemaVersion !== 2 ||
    snapshot.migrationDate !== MIGRATION_DATE ||
    !Array.isArray(snapshot.pages) ||
    !Array.isArray(snapshot.linkHealth)
  ) {
    throw new Error("invalid live snapshot metadata");
  }
  if (snapshot.inventorySha256 !== sha256(inventoryText)) throw new Error("live snapshot inventory hash differs");
  if (JSON.stringify(snapshot.pages.map((page) => page.url)) !== JSON.stringify(inventory)) {
    throw new Error("live snapshot page set or order differs from inventory");
  }
  if (new Set(snapshot.pages.map((page) => page.url)).size !== inventory.length) {
    throw new Error("live snapshot contains duplicate URLs");
  }
  const linkUrls = snapshot.linkHealth.map((entry) => entry.url);
  if (
    JSON.stringify(linkUrls) !== JSON.stringify([...linkUrls].sort()) ||
    new Set(linkUrls).size !== linkUrls.length ||
    snapshot.linkHealth.some(
      (entry) =>
        typeof entry.url !== "string" ||
        new URL(entry.url).origin !== LIVE_ORIGIN ||
        !Number.isInteger(entry.status) ||
        entry.status < 100 ||
        entry.status > 599,
    )
  ) {
    throw new Error("invalid live snapshot link-health inventory");
  }
  if (snapshot.linkHealthSha256 !== sha256(JSON.stringify(snapshot.linkHealth))) {
    throw new Error("live snapshot link-health hash differs");
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
  const expected = new Set(derivePortPageOwnedTargets(inventory));
  if (outputs.size !== expected.size || [...outputs.keys()].some((target) => !expected.has(target))) {
    throw new Error("generated output set differs from the owned inventory targets");
  }
}

export function derivePortPageOwnedTargets(inventoryUrls) {
  const targets = [
    ...inventoryUrls.map((url) => targetForPathname(new URL(url).pathname)),
    relative(ROOT, MANIFEST_PATH),
  ].sort();
  if (new Set(targets).size !== targets.length) throw new Error("inventory resolves to duplicate output targets");
  return targets;
}

export function writeLiveOutputTransaction(outputs, options = {}) {
  return reconcileOwnedOutputs({
    ledgerRelativePath: options.ledgerRelativePath ?? OWNED_TARGETS_PATH,
    outputs,
    owner: GENERATE_OWNER,
    root: options.root ?? ROOT,
    testHooks: options.testHooks,
  });
}

function writeLiveSnapshotTransaction(outputs) {
  return reconcileOwnedOutputs({
    ledgerRelativePath: OWNED_TARGETS_PATH,
    outputs,
    owner: ACQUIRE_OWNER,
    root: ROOT,
  });
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

async function fetchStatus(url) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await waitForRequestSlot();
    const response = await fetch(url);
    if (response.status >= 500 && response.status <= 599 && attempt < 2) continue;
    return response.status;
  }
  throw new Error(`${url}: exhausted two 5xx retries`);
}

function collectSameOriginLinkHealthUrls(pages) {
  const urls = new Set();
  for (const page of pages) {
    const $ = cheerio.load(page.bodyHtml);
    $("a[href]").each((_, anchor) => {
      const url = sameOriginHealthUrl($(anchor).attr("href"), page.url);
      if (url) urls.add(url);
    });
    for (const match of page.sourceMarkdown.matchAll(/!?\[[^\]]*\]\(([^\s)]+)(?:\s+[^)]*)?\)/g)) {
      const url = sameOriginHealthUrl(match[1], page.url);
      if (url) urls.add(url);
    }
    const sourceTree = parseSourceTree(page.sourceMarkdown, page.url);
    for (const card of parseSourceCards(sourceTree)) {
      const url = sameOriginHealthUrl(card.href, page.url);
      if (url) urls.add(url);
    }
  }
  return [...urls].sort();
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

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const mode = parseMode(process.argv.slice(2));
  if (mode === "acquire") await acquireSnapshot();
  else await generateFromSnapshot();
}
