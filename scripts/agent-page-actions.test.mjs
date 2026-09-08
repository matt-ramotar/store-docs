import assert from "node:assert/strict";
import test from "node:test";

import { copyAgentPage } from "../lib/copy-agent-page.ts";

const markdownUrl = "/llms/store6/quickstart.md";

test("does not rebind the browser fetch function to the dependency object", async () => {
  await copyAgentPage(markdownUrl, {
    fetchPage: async function () {
      assert.equal(this, undefined, "browser fetch must not receive the dependency bag as its receiver");
      return new Response("# Store6\n", { headers: { "content-type": "text/markdown" } });
    },
    writeText: async () => {},
  });
});

test("copies the exact Markdown response bytes as text", async () => {
  const markdown = "# Café ☕\n\nLine with βeta.\n";
  const copied = [];
  const fetched = [];

  await copyAgentPage(markdownUrl, {
    fetchPage: async (url) => {
      fetched.push(url);
      return new Response(markdown, {
        headers: { "content-type": "text/markdown; charset=utf-8" },
      });
    },
    writeText: async (value) => copied.push(value),
  });

  assert.deepEqual(fetched, [markdownUrl]);
  assert.deepEqual(copied, [markdown]);
});

test("rejects an unsuccessful Markdown response before reading or copying it", async () => {
  let copied = false;

  await assert.rejects(
    copyAgentPage(markdownUrl, {
      fetchPage: async () => new Response("Missing", { status: 404 }),
      writeText: async () => {
        copied = true;
      },
    }),
    { message: "Markdown could not be loaded." },
  );

  assert.equal(copied, false);
});

test("rejects a response whose media type is not Markdown", async () => {
  let copied = false;

  await assert.rejects(
    copyAgentPage(markdownUrl, {
      fetchPage: async () =>
        new Response("<h1>Quickstart</h1>", {
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      writeText: async () => {
        copied = true;
      },
    }),
    { message: "Markdown is unavailable for this page." },
  );

  assert.equal(copied, false);
});

test("propagates clipboard rejection after fetching the exact Markdown", async () => {
  const clipboardError = new Error("Clipboard permission denied");
  let copiedValue;

  await assert.rejects(
    copyAgentPage(markdownUrl, {
      fetchPage: async () =>
        new Response("first line\nsecond line\n", {
          headers: { "content-type": "text/markdown" },
        }),
      writeText: async (value) => {
        copiedValue = value;
        throw clipboardError;
      },
    }),
    clipboardError,
  );

  assert.equal(copiedValue, "first line\nsecond line\n");
});
