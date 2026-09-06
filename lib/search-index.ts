import { createFromSource } from "fumadocs-core/search/server";

import { source } from "@/lib/source";

export const searchIndex = createFromSource(source, {
  buildIndex(page) {
    return {
      id: page.url,
      url: page.url,
      title: page.data.title,
      description: page.data.description,
      structuredData: page.data.structuredData,
      tag: page.url === "/docs/store6" || page.url.startsWith("/docs/store6/") ? "store6" : "store5",
    };
  },
});
