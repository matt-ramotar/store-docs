import path from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createMDX } from "fumadocs-mdx/next";
import { pageIdentity } from "./scripts/agent-docs/links.mjs";

const withMDX = createMDX();
const root = path.dirname(fileURLToPath(import.meta.url));
const agentDocs = JSON.parse(readFileSync(path.join(root, "scripts/agent-docs/config.json"), "utf8"));
const mintlifyCjsLoader = path.join(root, "lib/mintlify-cjs-require-loader.cjs");
const mintlifyHugeiconsLoader = path.join(root, "lib/mintlify-hugeicons-loader.cjs");

export default withMDX({
  skipProxyUrlNormalize: true,
  async headers() {
    const markdownPaths = agentDocs.pages.map(source => pageIdentity(source, agentDocs.origin).markdownPath);
    return [...markdownPaths, "/llms-full.txt", "/llms.txt"].map(source => ({
      source,
      headers: [
        { key: "Content-Type", value: `${source.endsWith(".md") ? "text/markdown" : "text/plain"}; charset=utf-8` },
        { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
      ],
    }));
  },
  transpilePackages: ["@mintlify/components"],
  turbopack: {
    root,
    rules: {
      "*.js": [{
        condition: {
          all: [
            { path: /@mintlify\/components\// },
            { content: /import\s*\{\s*__require\s+as/ },
          ],
        },
        loaders: [mintlifyCjsLoader],
        as: "*.js",
      }, {
        condition: { path: /@mintlify\/components\/dist\// },
        loaders: [mintlifyHugeiconsLoader],
        as: "*.js",
      }],
    },
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /[\\/]@mintlify[\\/]components[\\/]dist[\\/].+\.js$/,
      use: [mintlifyHugeiconsLoader],
    }, {
      test: /[\\/]@mintlify[\\/]components[\\/]dist[\\/]_virtual[\\/].+\.js$/,
      use: [mintlifyCjsLoader],
    });
    return config;
  },
});
