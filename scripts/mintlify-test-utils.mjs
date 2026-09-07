import { createRequire } from "node:module";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const require = createRequire(import.meta.url);
const esbuild = require(require.resolve("esbuild", { paths: [dirname(require.resolve("fumadocs-mdx"))] }));
const transformMintlify = require("../lib/mintlify-cjs-require-loader.cjs");
const root = resolve(import.meta.dirname, "..");

/** Bundle real adapters into an isolated temporary module, preserving one React instance. */
export async function loadFixtureModule(entry) {
  const directory = await mkdtemp(join(tmpdir(), "store-mintlify-test-"));
  const output = join(directory, "fixture.cjs");
  try {
    await esbuild.build({
      entryPoints: [resolve(root, entry)], outfile: output, bundle: true,
      platform: "node", format: "cjs", jsx: "automatic", logLevel: "silent",
      plugins: [{ name: "installed-component-interop", setup(build) {
        build.onResolve({ filter: /^(react|react-dom)(\/.*)?$/ }, args => ({path: require.resolve(args.path), external: true}));
        build.onResolve({ filter: /^next(\/.*)?$/ }, args => ({path: require.resolve(args.path), external: true}));
        build.onLoad({ filter: /@mintlify\/components\/.*\.js$/ }, async args => ({contents: transformMintlify(await readFile(args.path, "utf8")), loader: "js"}));
      }}],
    });
    return require(output);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
