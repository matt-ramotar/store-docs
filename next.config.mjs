import path from "node:path";
import { fileURLToPath } from "node:url";
import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();
const root = path.dirname(fileURLToPath(import.meta.url));
const mintlifyCjsLoader = path.join(root, "lib/mintlify-cjs-require-loader.cjs");

export default withMDX({
  transpilePackages: ["@mintlify/components"],
  turbopack: {
    root,
    rules: {
      "*.js": {
        condition: {
          all: [
            { path: /@mintlify\/components\// },
            { content: /import\s*\{\s*__require\s+as/ },
          ],
        },
        loaders: [mintlifyCjsLoader],
        as: "*.js",
      },
    },
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /[\\/]@mintlify[\\/]components[\\/]dist[\\/]_virtual[\\/].+\.js$/,
      use: [mintlifyCjsLoader],
    });
    return config;
  },
});
