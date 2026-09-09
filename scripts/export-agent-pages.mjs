import { readdir, readFile, mkdir, mkdtemp, rename, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { htmlToMarkdown } from "../lib/html-to-markdown.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// Use the site's installed MDX parser so JSX inside code fences or attribute
// strings is never mistaken for an authored interactive component.
const require = createRequire(import.meta.url);
const { createProcessor } = await import(pathToFileURL(require.resolve("@mdx-js/mdx", { paths: [dirname(require.resolve("fumadocs-mdx"))] })).href);
const parser = createProcessor({ format: "mdx" });
const supportedComponents = new Set([
  "Callout", "StoreDiagram", "ParamList", "ParamField", "StepsGroup", "StepItem",
  "TabGroup", "TabPanel", "CodeSlab", "ReadResolutionTable", "StartHereList",
  "SupportMatrix", "Link", "Link.Icon", "UnavailableDestination",
]);

async function files(directory, extension) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await files(path, extension));
    else if (entry.isFile() && entry.name.endsWith(extension)) result.push(path);
  }
  return result.sort();
}

/** Reject interactive source whose SSR output cannot establish complete content. */
export function assertExportableSource(source, path) {
  function visit(node) {
    if (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") {
      if (node.name && /^[A-Z]/.test(node.name) && !supportedComponents.has(node.name)) {
        throw new Error(`${path}: ${node.name} requires a complete semantic Markdown exporter before publication.`);
      }
    } else if (node.type === "mdxjsEsm") {
      throw new Error(`${path}: MDX imports and exports need a reviewed semantic Markdown exporter before publication.`);
    }
    for (const child of node.children ?? []) visit(child);
  }
  visit(parser.parse(source.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "")));
}

async function authoritativeMarkdown(root) {
  const manifestPath = join(root, "public/llms/store6-manifest.json");
  const input = await readFile(manifestPath, "utf8").catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  const pages = new Map();
  if (input === null) return pages;
  const manifest = JSON.parse(input);
  if (!Array.isArray(manifest.pages)) throw new Error("Agent documentation manifest must list its pages.");
  for (const page of manifest.pages) {
    const canonical = new URL(page.canonicalUrl);
    const markdown = new URL(page.markdownUrl);
    if (!/^https?:$/.test(canonical.protocol) || !/^https?:$/.test(markdown.protocol) ||
        canonical.origin !== manifest.origin || markdown.origin !== manifest.origin ||
        canonical.search || canonical.hash || markdown.search || markdown.hash ||
        !/^\/docs\/store6\/[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(canonical.pathname) ||
        !/^\/llms\/store6\/[a-z0-9-]+(?:\/[a-z0-9-]+)*\.md$/.test(markdown.pathname) ||
        !/^[a-f0-9]{64}$/.test(page.sha256)) {
      throw new Error("Agent documentation manifest contains an unsafe page mapping or invalid hash.");
    }
    if (pages.has(canonical.pathname)) throw new Error(`Duplicate agent documentation page: ${canonical.pathname}`);
    const bytes = await readFile(join(root, "public", markdown.pathname.slice(1))).catch((error) => {
      throw new Error(`${canonical.pathname}: source-owned Markdown is missing. Run build-agent-docs first.`, { cause: error });
    });
    if (createHash("sha256").update(bytes).digest("hex") !== page.sha256) {
      throw new Error(`${canonical.pathname}: source-owned Markdown hash does not match its manifest. Run build-agent-docs first.`);
    }
    pages.set(canonical.pathname, bytes);
  }
  return pages;
}

export async function exportAgentPages({ root = ROOT } = {}) {
  const authoritative = await authoritativeMarkdown(root);
  const contentDirectory = join(root, "content/docs");
  const sourceFiles = await files(contentDirectory, ".mdx");
  const paths = new Set(["/", "/diagrams"]);
  for (const path of sourceFiles) {
    const slug = relative(contentDirectory, path).replaceAll("\\", "/").replace(/\.mdx$/, "").replace(/(^|\/)index$/, "");
    const pathname = `/docs${slug ? `/${slug.replace(/\/$/, "")}` : ""}`;
    // Source-owned pages already pass their owner's semantic MDX lowering.
    if (!authoritative.has(pathname)) assertExportableSource(await readFile(path, "utf8"), relative(root, path));
    paths.add(pathname);
  }
  for (const pathname of authoritative.keys()) {
    if (!paths.has(pathname)) throw new Error(`${pathname}: source-owned Markdown has no authored documentation route.`);
  }
  const generated = new Map();
  for (const pathname of [...paths].sort()) {
    const stem = pathname === "/" ? "index" : pathname.slice(1);
    if (authoritative.has(pathname)) {
      generated.set(`${stem}.md`, authoritative.get(pathname));
      continue;
    }
    const htmlPath = join(root, ".next/server/app", `${stem}.html`);
    const html = await readFile(htmlPath, "utf8").catch((error) => {
      throw new Error(`${pathname}: prerendered HTML is required for agent export. Run next build first.`, { cause: error });
    });
    generated.set(`${stem}.md`, htmlToMarkdown(html, { pathname }));
  }
  // Compute the entire corpus before replacing output, so failures leave the
  // previous successful corpus intact and removed docs cannot linger in it.
  const destination = join(root, "public/agent-markdown");
  const temporary = await mkdtemp(join(root, "public/.agent-markdown-"));
  try {
    for (const [path, markdown] of generated) {
      await mkdir(dirname(join(temporary, path)), { recursive: true });
      await writeFile(join(temporary, path), markdown);
    }
    await rm(destination, { recursive: true, force: true });
    await rename(temporary, destination);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
  return { pages: generated.size, paths: [...paths].sort() };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await exportAgentPages();
  console.log(`Exported ${result.pages} agent Markdown pages from the source-owned corpus and prerendered HTML.`);
}
