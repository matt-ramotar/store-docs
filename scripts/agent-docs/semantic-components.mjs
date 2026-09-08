import { readOrigins, readNotice, readParagraphs } from "../../components/overview/content/read-resolution.ts";
import { supportModules, canonicalTargets, inspectorTargets, supportIntro, supportFooter } from "../../components/overview/content/support-matrix.ts";
import { startHereItems } from "../../components/overview/content/start-here.ts";

export const text = value => ({ type: "text", value });
export const code = value => ({ type: "inlineCode", value });
export const p = children => ({ type: "paragraph", children });
const strong = value => ({ type: "strong", children: [text(value)] });
export const inline = tokens => tokens.map(token => {
  if (typeof token === "string") return text(token);
  if ("code" in token) return code(token.code);
  return { type: "link", url: token.href, children: [text(token.label)] };
});
const row = cells => ({ type: "tableRow", children: cells.map(children => ({ type: "tableCell", children })) });
const table = rows => ({ type: "table", align: rows[0].map(() => null), children: rows.map(row) });
const list = items => ({ type: "list", ordered: false, spread: true, children: items.map(children => ({ type: "listItem", spread: false, children })) });

export function semanticComponent(name) {
  if (name === "ReadResolutionTable") {
    return [
      table([
        [[text("Origin")], [text("Resolution boundary")], [text("Meaning")]],
        ...readOrigins.map(origin => [[code(origin.label)], [text(origin.boundary)], [text(origin.meaning)]]),
      ]),
      { type: "blockquote", children: [p([strong(`${readNotice.type}: ${readNotice.title}`)]), p(inline(readNotice.body))] },
      ...readParagraphs.map(tokens => p(inline(tokens))),
    ];
  }
  if (name === "SupportMatrix") {
    return [
      p(inline(supportIntro)),
      table([
        ["Module", "API tier", "Release target", "Targets", "Notes"].map(value => [text(value)]),
        ...supportModules.map(module => [[code(module.module)], [text(module.tier)], [text(module.release)], [text(module.targets)], [text(module.detail ?? "")]]),
      ]),
      p([text(canonicalTargets)]), p([text(inspectorTargets)]), p(inline(supportFooter)),
    ];
  }
  if (name === "StartHereList") {
    return [list(startHereItems.map(item => [
      p([strong(item.title), ...(item.experimental ? [text(" (Experimental)")] : [])]),
      p([text(item.description)]),
      p(item.links.flatMap((link, index) => [
        ...(index ? [text(" · ")] : []),
        { type: "link", url: link.href, children: [text(link.label)] },
      ])),
    ]))];
  }
  throw new Error(`Unsupported semantic component: ${name}`);
}
