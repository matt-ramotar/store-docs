import type { BundledLanguage } from "shiki";
import { bundledLanguages, codeToHtml } from "shiki";

export const storeCodeTheme = {
  name: "store-code",
  type: "dark" as const,
  colors: {
    "editor.background": "var(--color-store-code-surface)",
    "editor.foreground": "var(--color-store-code-foreground)",
  },
  tokenColors: [
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: "var(--color-store-code-comment)" },
    },
    {
      scope: ["string", "constant.other.symbol"],
      settings: { foreground: "var(--color-store-code-string)" },
    },
    {
      scope: ["entity.name.function", "support.function", "variable.function"],
      settings: { foreground: "var(--color-store-code-function)" },
    },
    {
      scope: ["entity.name.type", "entity.name.class", "support.type", "support.class"],
      settings: { foreground: "var(--color-store-code-type)" },
    },
    {
      scope: ["keyword", "storage.type", "storage.modifier"],
      settings: { foreground: "var(--color-store-code-keyword)" },
    },
  ],
};

export async function highlightCode(code: string, lang: string): Promise<string> {
  const normalizedLanguage = lang.trim().toLowerCase();
  const language: BundledLanguage | "text" =
    normalizedLanguage in bundledLanguages
      ? (normalizedLanguage as BundledLanguage)
      : "text";

  return codeToHtml(code, {
    lang: language,
    rootStyle: false,
    theme: storeCodeTheme,
  });
}
