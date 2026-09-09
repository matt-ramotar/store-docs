import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CONTENT_VARY } from "../lib/content-negotiation.ts";

export function withContentVary(metadata) {
  const headers = { ...metadata.headers };
  const vary = new Map(CONTENT_VARY.split(/,\s*/).map((value) => [value.toLowerCase(), value]));
  for (const name of Object.keys(headers)) {
    if (name.toLowerCase() !== "vary") continue;
    for (const value of String(headers[name]).split(/,\s*/)) if (value) vary.set(value.toLowerCase(), value);
    delete headers[name];
  }
  headers.vary = vary.has("*") ? "*" : [...vary.values()].join(", ");
  return { ...metadata, headers };
}

export async function finalizeAgentHeaders(root = resolve(import.meta.dirname, "..")) {
  const { markdown } = JSON.parse(await readFile(resolve(root, "lib/agent-routes.generated.json"), "utf8"));
  // Next 16.3's app-page runtime replaces Proxy/config Vary before applying
  // prerender metadata. Add the variant keys there while retaining RSC keys.
  for (const pathname of [...markdown, "/_not-found"]) {
    const stem = pathname === "/" ? "index" : pathname.slice(1);
    const path = resolve(root, ".next/server/app", `${stem}.meta`);
    const metadata = JSON.parse(await readFile(path, "utf8"));
    await writeFile(path, `${JSON.stringify(withContentVary(metadata), null, 2)}\n`);
  }
  console.log(`Finalized cache variation for ${markdown.length} HTML pages and the 404 page.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await finalizeAgentHeaders();
