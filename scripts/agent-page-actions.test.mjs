import assert from "node:assert/strict";
import test from "node:test";

import { copyAgentPage } from "../lib/copy-agent-page.ts";
import { createAgentChatUrl, createAgentSetupPrompt } from "../lib/agent-page-prompt.ts";

const markdownUrl = "/llms/store6/quickstart.md";

test("chat shortcuts preserve the public Markdown URL as one query value", () => {
  const page = "https://store.mobilenativefoundation.org/llms/store6/quickstart.md";
  for (const client of ["chatgpt", "claude"]) {
    const url = new URL(createAgentChatUrl(client, page));
    assert.equal(url.origin, client === "chatgpt" ? "https://chatgpt.com" : "https://claude.ai");
    assert.equal(url.pathname, client === "chatgpt" ? "/" : "/new");
    assert.equal(url.searchParams.getAll("q").length, 1);
    assert.ok(url.searchParams.get("q").includes(page));
    assert.ok(url.searchParams.get("q").includes("ask me to paste its Markdown"));
    assert.ok(!url.toString().includes("localhost"));
  }
});

test("the setup prompt checks skill discovery before the short install command", () => {
  const page = {
    title: "Quickstart",
    canonicalUrl: "https://store.mobilenativefoundation.org/docs/store6/quickstart",
  };
  const prompt = createAgentSetupPrompt(page);
  assert.ok(prompt.includes(page.canonicalUrl));
  const lines = prompt.split("\n");
  const discovery = lines.indexOf("npx skills add matt-ramotar/store-agent-skills --list");
  const install = lines.indexOf("npx skills add matt-ramotar/store-agent-skills");
  assert.ok(discovery >= 0 && install > discovery);
  assert.ok(prompt.includes("If discovery fails or does not list store6, stop the installation"));
  assert.ok(prompt.includes("it does not select an immutable release"));
  assert.ok(!prompt.includes("store6-skill-v0.1.0"));
  assert.ok(prompt.includes("node scripts/get-docs.mjs --list"));
  assert.ok(!prompt.includes("mcp add"));
  assert.ok(!prompt.includes("--global"));
});

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
