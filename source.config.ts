import { defineConfig, defineDocs } from "fumadocs-mdx/config";

import { storeCodeTheme } from "./lib/shiki";

export const docs = defineDocs({
  dir: "content/docs",
});

export default defineConfig({
  mdxOptions: {
    // Fumadocs shallow-merges its rehype-code defaults (dual github themes +
    // `defaultColor: false`) under these options, and shiki prefers `themes`
    // over `theme` — so a bare `theme:` would be ignored. Overriding `themes`
    // with the single brand theme and pointing `defaultColor` at it makes
    // shiki emit plain inline `color:` styles from storeCodeTheme.
    rehypeCodeOptions: {
      themes: { dark: storeCodeTheme },
      defaultColor: "dark",
      icon: false,
    },
  },
});
