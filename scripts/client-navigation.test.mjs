import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { resolve, relative } from "node:path";
import test from "node:test";

const app = resolve(import.meta.dirname, "../.next/server/app");

async function payloadFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return payloadFiles(path);
    return entry.isFile() && path.endsWith(".rsc") ? [path] : [];
  }));
  return nested.flat();
}

test("public page Flight payloads contain no server-render errors during client navigation", async () => {
  const manifest = JSON.parse(await readFile(resolve(app, "../../prerender-manifest.json"), "utf8"));
  const published = new Set(Object.entries(manifest.routes)
    .filter(([path, route]) => route.dataRoute?.endsWith(".rsc") && path !== "/design-review/components")
    .map(([path]) => path === "/" ? "index" : path.slice(1)));
  const files = (await payloadFiles(app)).filter((path) => {
    const name = relative(app, path);
    // HTTP recovery checks can create cached 404 payloads for unpublished URLs.
    // A 404 digest on any published route must still fail this assertion.
    const stem = name.includes(".segments/") ? name.split(".segments/")[0] : name.replace(/\.rsc$/, "");
    return published.has(stem);
  });
  for (const stem of published) assert.ok(files.includes(resolve(app, `${stem}.rsc`)), `${stem}: missing published Flight payload`);
  assert.ok(files.some((path) => path.endsWith("__PAGE__.segment.rsc")),
    "Build the site before checking its client-navigation payloads");

  const failures = [];
  for (const path of files) {
    const payload = await readFile(path, "utf8");
    for (const line of payload.split("\n")) {
      const error = /^[\da-f]+:E(\{.*\})$/.exec(line);
      if (error && typeof JSON.parse(error[1]).digest === "string") {
        failures.push(`${relative(app, path)}: ${line}`);
      }
    }
  }
  assert.deepEqual(failures, [],
    "Static HTML can pass while prefetched page segments contain render errors:\n" + failures.join("\n"));
});
