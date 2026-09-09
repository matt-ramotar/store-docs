import { load } from "cheerio";
import TurndownService from "turndown";

const normalize = (value) => value.replace(/\s+/g, " ").trim();

function converter() {
  const service = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced", bulletListMarker: "-" });
  service.addRule("literal-code", {
    filter: "pre",
    replacement(_content, node) {
      const code = node.getAttribute("data-raw-code") ?? node.querySelector("code")?.textContent ?? node.textContent;
      const language = node.getAttribute("data-language") ?? node.querySelector("code")?.className.match(/(?:^|\s)language-([^\s]+)/)?.[1] ?? "";
      const fence = "`".repeat(Math.max(3, ...[...code.matchAll(/`+/g)].map((match) => match[0].length + 1)));
      return `\n\n${fence}${language}\n${code}${code.endsWith("\n") ? "" : "\n"}${fence}\n\n`;
    },
  });
  service.addRule("table", {
    filter: "table",
    replacement(_content, node) {
      const $ = load(node.outerHTML);
      const table = $("table").first();
      const rows = table.find("tr").filter((_, row) => $(row).closest("table")[0] === table[0]).toArray();
      if (!rows.length) return "";
      if (table.find("table, [rowspan]:not([rowspan='1']), [colspan]:not([colspan='1'])").length) {
        throw new Error("Markdown export needs an explicit conversion for nested or spanning table cells.");
      }
      const cells = rows.map((row) => $(row).children("th, td").toArray());
      const width = Math.max(...cells.map((row) => row.length));
      const hasHeader = cells[0].every((cell) => cell.tagName === "th");
      const markdownRows = cells.map((row) => `| ${Array.from({ length: width }, (_, index) => {
        const cell = row[index];
        return cell ? service.turndown($(cell).html()).replace(/\|/g, "\\|").replace(/[ \t]*\n+/g, "<br>") : "";
      }).join(" | ")} |`);
      if (!hasHeader) markdownRows.unshift(`| ${Array(width).fill("").join(" | ")} |`);
      markdownRows.splice(1, 0, `| ${Array(width).fill("---").join(" | ")} |`);
      const caption = table.children("caption").first();
      return `\n\n${caption.length ? `${service.turndown(caption.html())}\n\n` : ""}${markdownRows.join("\n")}\n\n`;
    },
  });
  service.addRule("definition-term", {
    filter: "dt",
    replacement: (content) => `\n\n**${content.trim()}**\n`,
  });
  service.addRule("definition-description", {
    filter: "dd",
    replacement: (content) => `\n${content.trim()}\n\n`,
  });
  service.addRule("fragment-anchors", {
    filter: (node) => /^H[1-6]$/.test(node.nodeName) && node.hasAttribute("id"),
    replacement(content, node) {
      const id = node.getAttribute("id").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
      return `\n\n<a id="${id}"></a>\n\n${"#".repeat(Number(node.nodeName[1]))} ${content}\n\n`;
    },
  });
  return service;
}

/** Convert the published article, retaining content in inactive tabs and disclosures. */
export function htmlToMarkdown(html, { pathname = "/" } = {}) {
  const $ = load(html);
  const article = $("article").filter((_, element) => $(element).find("#content").length > 0).first();
  let content;
  if (article.length) {
    const header = article.children("header");
    content = $("<main></main>");
    // The page title can share a layout wrapper with agent action controls.
    // Keep only the heading and direct description, never that wrapper's UI.
    content.append(header.find("h1").clone());
    content.append(header.children("p").clone());
    content.append(article.find("#content").first().clone());
  } else {
    content = $("main").first().clone();
  }
  if (!content.length || content.find("h1").length !== 1) {
    throw new Error(`${pathname}: expected one main content region with one H1.`);
  }

  // UI controls are chrome. Semantic nav (StartHereList), callouts, hidden tabs,
  // and screen-reader labels inside the article are content and remain present.
  content.find("script, style, template, link, button, input, select, [role='tablist'], [data-component-part='tabs-list']").remove();
  content.find("[data-callout-type]").toArray().reverse().forEach((element) => {
    const callout = $(element);
    const label = normalize(callout.find("[data-callout-label]").first().text()) || callout.attr("data-callout-type");
    const title = normalize(callout.find("[data-component-part='callout-title']").first().text());
    const body = callout.find("[data-component-part='callout-content']").first();
    if (!body.length) throw new Error(`${pathname}: callout content is missing.`);
    const replacement = $("<blockquote></blockquote>");
    replacement.append($("<p></p>").append($("<strong></strong>").text(`${label}${title ? `: ${title}` : ""}`)));
    replacement.append(body.contents().clone());
    callout.replaceWith(replacement);
  });

  // The migrated step wrapper carries an explicit label independently of the
  // visual component's repeated number/title and nested list structure.
  content.find("[data-step-item]").each((_, element) => {
    const item = $(element);
    item.children("[data-step-title]").find("span[aria-hidden]").remove();
    const label = item.attr("data-step-label") ?? "";
    if (label && !/^\d+$/.test(label)) item.children("[data-step-title]").find("strong").prepend(`${label}. `);
    item.children("[data-step-body]").find("[data-component-part='step-title'], [data-component-part='step-number'], [data-component-part='step-line']").remove();
  });

  content.find(".store-m-code-header").each((_, element) => {
    const header = $(element);
    const block = header.parent();
    const pre = block.find("pre").first();
    const title = normalize(header.find(".store-m-code-title").first().text() || header.children("span").first().text());
    const language = pre.attr("data-language") || (block.hasClass("store-m-code-slab") ? normalize(header.children("span").eq(1).text()) : "");
    if (language && !pre.attr("data-language")) pre.attr("data-language", language);
    if (title && title !== language && title !== "Code") header.replaceWith($("<p></p>").append($("<strong></strong>").text(title)));
    else header.remove();
  });

  content.find("svg").each((_, element) => {
    const svg = $(element);
    const figure = svg.closest("figure[data-diagram]");
    const title = normalize(svg.find("title").first().text());
    const description = normalize(svg.find("desc").first().text());
    if (figure.length) {
      if (!title || !description) throw new Error(`${pathname}: diagram needs an accessible title and description.`);
      svg.before($("<p></p>").append($("<strong></strong>").text(title)));
      if (!normalize(figure.find("figcaption").text()).includes(description)) svg.before($("<p></p>").text(description));
    } else if (!svg.closest("[aria-hidden='true'], [inert]").length && (title || description)) {
      svg.before($("<p></p>").text([title, description].filter(Boolean).join(": ")));
    }
    svg.remove();
  });

  // Images and media retain their descriptive text and destinations.
  content.find("video, audio, iframe").each((_, element) => {
    const media = $(element);
    const href = media.attr("src") || media.find("source").first().attr("src");
    const label = media.attr("title") || media.attr("aria-label") || normalize(media.text()) || "Media";
    media.replaceWith(href ? $("<p></p>").append($("<a></a>").attr("href", href).text(label)) : $("<p></p>").text(label));
  });
  // CSS gaps are absent in plain text. Preserve the separation between adjacent
  // action links, module names and tier badges without touching code tokens.
  content.find(".flex, .inline-flex").each((_, element) => {
    if (!$(element).closest("pre, code").length) $(element).children().each((_, child) => $(child).before(" "));
  });
  const markdown = converter().turndown(content.html()).trim();
  if (!markdown) throw new Error(`${pathname}: Markdown conversion produced no content.`);
  return `${markdown}\n`;
}
