import { readdir, writeFile } from "node:fs/promises";
import { resolve, relative } from "node:path";

const root = resolve(import.meta.dirname, "..");
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  }));
  return nested.flat();
}

const docs = (await files(resolve(root, "content/docs")))
  .filter((path) => /\.mdx?$/.test(path))
  .map((path) => `/docs/${relative(resolve(root, "content/docs"), path)}`.replace(/\.mdx?$/, "").replace(/\/index$/, ""));
const pages = (await files(resolve(root, "app")))
  .filter((path) => /\/page\.tsx$/.test(path))
  .map((path) => `/${relative(resolve(root, "app"), path)}`.replace(/\/page\.tsx$/, "").replace(/\/\([^/]+\)/g, "") || "/")
  .filter((path) => !path.includes("["))
  .filter((path) => path !== "/design-review/components" || process.env.DOCS_COMPONENT_GALLERY === "1");
const publicFiles = (await files(resolve(root, "public")))
  .map((path) => `/${relative(resolve(root, "public"), path)}`)
  .filter((path) => !path.startsWith("/agent-markdown/"));

const markdown = [...new Set(["/", "/diagrams", ...docs])].sort();
const manifest = {
  pages: [...new Set([...pages, ...docs])].sort(),
  markdown,
  publicFiles: [...new Set([...publicFiles, "/openapi.json", "/sitemap.xml", "/robots.txt"])].sort(),
};
await writeFile(resolve(root, "lib/agent-routes.generated.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Indexed ${manifest.pages.length} pages; ${markdown.length} Markdown variants.`);
