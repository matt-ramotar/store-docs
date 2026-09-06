import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import { rehypeCodeDefaultOptions } from "fumadocs-core/mdx-plugins/rehype-code";

import { storeCodeTheme } from "./lib/shiki";

export const docs = defineDocs({
  dir: "content/docs",
});

export default defineConfig({
  mdxOptions: {
    // Keep authored remote images; building documentation must not fetch CDN dimensions.
    remarkImageOptions: { external: false },
    // Fumadocs shallow-merges its rehype-code defaults (dual github themes +
    // `defaultColor: false`) under these options, and shiki prefers `themes`
    // over `theme` — so a bare `theme:` would be ignored. Overriding `themes`
    // with the single brand theme and pointing `defaultColor` at it makes
    // shiki emit plain inline `color:` styles from storeCodeTheme.
    rehypeCodeOptions: {
      themes: { dark: storeCodeTheme },
      defaultColor: "dark",
      icon: false,
      transformers: [...(rehypeCodeDefaultOptions.transformers ?? []), {
        name: "store-raw-code",
        pre(node) {
          node.properties["data-raw-code"] = this.source;
          node.properties["data-language"] = this.options.lang ?? "text";
        },
      }],
    },
  },
});
