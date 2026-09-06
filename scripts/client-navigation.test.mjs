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
  const files = (await payloadFiles(app)).filter((path) => {
    const name = relative(app, path);
    // This internal gallery intentionally emits notFound in the public build.
    return name !== "design-review/components.rsc" &&
      !name.startsWith("design-review/components.segments/");
  });
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
