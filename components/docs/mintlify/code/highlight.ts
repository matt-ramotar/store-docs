import { bundledLanguages, codeToHtml, createCssVariablesTheme, type BundledLanguage } from "shiki";
import { storeCodeTheme } from "../../../../lib/shiki";

function lineNumbers(value?: string): number[] {
  if (!value) return [];
  try { const parsed: unknown = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter((line): line is number => typeof line === "number" && Number.isInteger(line) && line > 0) : []; }
  catch { return []; }
}

/** Uses the installed Shiki API, avoiding Mintlify 1.0.18's unregistered CSS theme. */
export async function highlightTidalCode(source: string, language = "text", highlight?: string, focus?: string, cssVariables = false) {
  const normalized = language.toLowerCase();
  const lang = normalized in bundledLanguages ? normalized as BundledLanguage : "text";
  const highlighted = new Set(lineNumbers(highlight));
  const focused = new Set(lineNumbers(focus));
  return codeToHtml(source, {
    lang,
    theme: cssVariables ? createCssVariablesTheme() : storeCodeTheme,
    transformers: [{
      name: "store-code-line-states",
      line(node, line) {
        if (highlighted.has(line)) this.addClassToHast(node, "line-highlight");
        if (focused.has(line)) this.addClassToHast(node, "line-focus");
      },
    }],
  });
}
