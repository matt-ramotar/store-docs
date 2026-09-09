import assert from "node:assert/strict";
import { basename } from "node:path";
import test from "node:test";
import { parseArguments, runReverificationScripts } from "./repin-store6-lock.mjs";

test("re-pin accepts an explicit skill checkout and rejects incomplete or duplicate options", () => {
  assert.deepEqual(
    parseArguments(["--source-root", "/store6", "--skills-root", "/skills"]),
    { sourceRoot: "/store6", skillsRoot: "/skills" },
  );
  for (const args of [
    ["--source-root", "/store6", "--skills-root"],
    ["--skills-root", "--source-root", "/store6"],
    ["--source-root", "/store6", "--skills-root", "/skills", "--skills-root", "/other"],
  ]) {
    assert.throws(() => parseArguments(args), /skills-root/);
  }
});

test("re-pin forwards the skill checkout to claims without changing snippet verifier arguments", async () => {
  const calls = [];
  const failures = await runReverificationScripts("/store6", {
    skillsRoot: "/skills checkout",
    execute: async (script, args) => {
      calls.push({ script: basename(script), args });
      return { stdout: "", stderr: "" };
    },
    print: () => {},
  });
  assert.deepEqual(failures, []);
  assert.deepEqual(calls, [
    { script: "check-claims.mjs", args: ["--source-root", "/store6", "--skills-root", "/skills checkout"] },
    { script: "check-snippets.mjs", args: ["--source-root", "/store6"] },
  ]);
});
