import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadFixtureModule } from "./mintlify-test-utils.mjs";

const code = await loadFixtureModule("components/docs/mintlify/code/index.tsx");
const { fixtures } = await loadFixtureModule("components/docs/mintlify/code/fixtures.tsx");
const html = element => renderToStaticMarkup(element);

test("all executable code fixtures render through real adapters", () => {
  assert.equal(fixtures.length, 13);
  assert.ok(fixtures.some(fixture => fixture.id === "code-clipboard-denied"));
  for (const fixture of fixtures) {
    assert.ok(fixture.assertions.length > 0, fixture.id);
    assert.ok(html(fixture.render()).length > 0, fixture.id);
  }
});
test("compiled fences preserve token elements independently from exact source", () => {
  const raw = '\n  val text = "Exact"\n';
  const result = html(createElement(code.FencedCodeBlock, { "data-raw-code": raw, "data-language": "kotlin", title: "Exact.kt" },
    createElement("code", null, createElement("span", { "data-token": "kept", style: { color: "#CBB9F5" } }, "val"))));
  assert.match(result, /data-token="kept" style="color:#CBB9F5"/);
  assert.match(result, /Exact.kt/);
  assert.match(result, /aria-label="Copy code"/);
  assert.match(result, /data-raw-code="\n  val text = &quot;Exact&quot;\n"/);
  assert.doesNotMatch(result, /\[object Object\]/);
});
test("fences without raw metadata retain content without guessing copy text", () => {
  const result = html(createElement(code.FencedCodeBlock, null, createElement("code", null, "visible")));
  assert.match(result, /visible/);
  assert.doesNotMatch(result, /aria-label="Copy code"/);
});
test("code source honors compiler metadata and preserves whitespace", () => {
  assert.equal(code.codeSource("\n  exact\n"), "\n  exact\n");
  assert.equal(code.codeSource(createElement("pre", { "data-raw-code": "\n raw\n" }, createElement("code", null, "different display"))), "\n raw\n");
  assert.equal(code.codeSource([createElement("span", {key: 0}, "one"), "\n", createElement("span", {key: 1}, "two")]), "one\ntwo");
});
test("groups clamp initial selection and keep accessible panel associations", () => {
  const children = [createElement(code.CodeBlock, { key: "a", filename: "One", language: "text" }, "first"), createElement(code.CodeBlock, { key: "b", filename: "Two", language: "text" }, "second")];
  const result = html(createElement(code.CodeGroup, { initialSelectedTab: 99 }, children));
  assert.match(result, /role="tab"[^>]*aria-selected="true"[^>]*>Two/);
  assert.match(result, /role="tabpanel"/);
  assert.match(result, /second/);
  assert.doesNotMatch(result, />first</);
  assert.equal(html(createElement(code.CodeGroup)), "");
});
test("explicit code UI themes and syntax data survive adapters", () => {
  const light = html(createElement(code.CodeBlock, { language: "text", codeBlockTheme: "system", codeBlockThemeObject: {theme: "github-light"} }, "light"));
  const tidal = html(createElement(code.CodeBlock, { language: "text" }, "dark"));
  assert.match(light, /data-code-theme="system"/);
  assert.match(light, /data-code-syntax="explicit"/);
  assert.match(tidal, /data-code-theme="dark"/);
  assert.match(tidal, /data-code-syntax="tidal"/);
});
test("copy overrides, hidden assistant and line-state options render", () => {
  const result = html(createElement(code.CodeBlock, { language: "text", hideAskAiButton: true, askAiButton: createElement("button", null, "Hidden assistant"), copyButtonProps: { textToCopy: "override", copyButtonAriaLabel: "Custom copy", showTooltip: false } }, "code"));
  assert.match(result, /aria-label="Custom copy"/);
  assert.doesNotMatch(result, /Hidden assistant/);
  const lines = html(createElement(code.BaseCodeBlock, { language: "text", lines: true, wrap: true, highlight: "[2]", focus: "[2]", expandable: true, numberOfLines: 12 }, "line 1\nline 2"));
  assert.match(lines, /has-line-numbers/);
  assert.match(lines, /code-block-wrap/);
  assert.match(lines, /has-focused/);
  assert.match(lines, /See all 12 lines/);
  assert.match(lines, /aria-expanded="false"/);
  assert.match(lines, /max-height:190px;overflow-y:hidden/);
});
test("empty registry, snippet elements and audio sources remain valid", () => {
  const empty = html(createElement(code.CodeGroupSelect, { snippets: {} }));
  assert.match(empty, /disabled/);
  assert.match(empty, /No examples/);
  const audio = html(createElement(code.CodeGroupSelect, { snippets: {Audio: {Example: {filename: "audio.wav", code: "audio", language: "text", audioUrl: "/audio.wav"}}} }));
  assert.match(audio, /<audio controls="" src="\/audio.wav"/);
  const snippet = html(createElement(code.CodeSnippet, null, createElement("span", { "data-kept": "yes" }, "node")));
  assert.match(snippet, /data-kept="yes"/);
});

test("Tidal highlighter emits real syntax spans and precise line states", async () => {
  const { highlightTidalCode } = await loadFixtureModule("components/docs/mintlify/code/highlight.ts");
  const result = await highlightTidalCode('val title = "Tidal"\nprintln(title)\n// comment', "kotlin", "[2]", "[2]");
  assert.match(result, /color:var\(--color-store-code-keyword\)/);
  assert.match(result, /color:var\(--color-store-code-string\)/);
  assert.match(result, /color:var\(--color-store-code-comment\)/);
  assert.match(result, /class="line line-highlight line-focus"/);
  const plain = await highlightTidalCode("<script>safe</script>", "unknown-language", "bad", "null");
  assert.match(plain, /&#x3C;script>/);
  assert.doesNotMatch(plain, /<script>/);
});

test("explicit CSS-variable syntax theme honors Shiki variable names", async () => {
  const { highlightTidalCode } = await loadFixtureModule("components/docs/mintlify/code/highlight.ts");
  const result = await highlightTidalCode('const text = "author"', "typescript", undefined, undefined, true);
  assert.match(result, /var\(--shiki-token-keyword\)/);
  assert.match(result, /var\(--shiki-token-string-expression\)/);
  assert.doesNotMatch(result, /var\(--color-store-code-keyword\)/);
});

test("dropdown public display names and state-valued trigger classes survive", () => {
  assert.equal(code.DropdownMenuTrigger.displayName, "DropdownMenuTrigger");
  assert.equal(code.DropdownMenuContent.displayName, "DropdownMenuContent");
  assert.equal(code.DropdownMenuItem.displayName, "DropdownMenuItem");
  const result = html(createElement(code.DropdownMenu, { open: false }, createElement(code.DropdownMenuTrigger, { className: state => state.open ? "author-open" : "author-closed" }, "State trigger")));
  assert.match(result, /store-m-code-menu-trigger/);
  assert.match(result, /author-closed/);
});
test("state class adapters preserve caller render functions and elements", () => {
  const functional = html(createElement(code.DropdownMenu, { open: false }, createElement(code.DropdownMenuTrigger, {
    className: () => "author-function",
    render: (props, state) => createElement("button", { ...props, "data-render-open": String(state.open) }),
  }, "Functional trigger")));
  assert.match(functional, /author-function/);
  assert.match(functional, /data-render-open="false"/);
  const element = html(createElement(code.DropdownMenu, { open: false }, createElement(code.DropdownMenuTrigger, {
    className: () => "state-class", render: createElement("button", { className: "element-class", "data-custom-render": "kept" }),
  }, "Element trigger")));
  assert.match(element, /element-class/);
  assert.match(element, /state-class/);
  assert.match(element, /data-custom-render="kept"/);
});
test("state render adapters compose native and authored refs with symmetric cleanup", () => {
  const calls = [];
  const authoredRef = { current: null };
  const nativeRef = value => { calls.push(["native", value]); };
  const trigger = code.DropdownMenuTrigger({
    children: "Composed trigger",
    className: state => state.open ? "open" : "closed",
    render: createElement("button", { ref: authoredRef, "data-composed-ref": "trigger" }),
  });
  const rendered = trigger.props.render({ ref: nativeRef, className: "native" }, { open: true });
  assert.equal(rendered.props["data-composed-ref"], "trigger");
  assert.match(rendered.props.className, /open/);
  const node = { id: "trigger-node" };
  const cleanup = rendered.props.ref(node);
  assert.equal(authoredRef.current, node);
  assert.deepEqual(calls, [["native", node]]);
  cleanup();
  assert.equal(authoredRef.current, null);
  assert.deepEqual(calls, [["native", node], ["native", null]]);
});
test("C4 interaction fixtures name the remaining observable acceptance transitions", () => {
  const byId = Object.fromEntries(fixtures.map(fixture => [fixture.id, fixture]));
  assert.deepEqual(byId["code-line-states"].assertions.slice(0, 3), [
    "The initial See all 24 lines control has aria-expanded=false and clips the region to 190px.",
    "Activating See all 24 lines changes the label to Collapse, sets aria-expanded=true and removes the region height limit.",
    "Activating Collapse restores aria-expanded=false and the 190px limit.",
  ]);
  assert.match(byId["code-group-select"].assertions.join("\n"), /TypeScript resets to Read:0/);
  assert.match(byId["code-group-select"].assertions.join("\n"), /Write:1/);
  assert.match(byId["code-dropdown-primitives"].assertions.join("\n"), /Escape closes/);
  assert.match(byId["code-dropdown-primitives"].assertions.join("\n"), /trigger,content,item/);
});
test("explicit CSS-variable themes are separated from forced Tidal surfaces", () => {
  const block = html(createElement(code.BaseCodeBlock, { language: "text", codeBlockThemeObject: { theme: "css-variables" } }, "author"));
  const snippet = html(createElement(code.CodeSnippet, { language: "text", codeBlockThemeObject: { theme: "css-variables" } }, "author"));
  assert.match(block, /data-code-syntax="css-variables"/);
  assert.match(snippet, /data-code-syntax="css-variables"/);
  assert.doesNotMatch(block + snippet, /data-code-syntax="tidal"/);
});
test("standalone Tidal snippets force their code surface without changing named themes or CodeGroups", async () => {
  const css = await readFile(new URL("../components/docs/mintlify/code/styles.css", import.meta.url), "utf8");
  assert.match(
    css,
    /\.store-docs \.store-m-code-snippet\[data-code-syntax="tidal"\] \{ background: var\(--color-store-code-surface\); \}/,
  );
  assert.match(
    css,
    /\.store-docs \.store-m-code-snippet\[data-code-syntax="tidal"\] pre \{ background: var\(--color-store-code-surface\) !important;/,
  );
  assert.match(css, /\.store-m-code-snippet\[data-code-syntax="css-variables"\] pre/);
  assert.match(css, /\.store-m-code-body\[data-code-syntax="tidal"\] \[data-component-part="code-block-root"\]/);
  assert.doesNotMatch(css, /\.store-m-code-snippet\[data-code-syntax="explicit"\][^{]*\{[^}]*background/s);
});
test("code menu triggers override translucent utilities with context-aware solid colors", async () => {
  const css = await readFile(new URL("../components/docs/mintlify/code/styles.css", import.meta.url), "utf8");
  assert.match(css, /\.store-docs \.store-m-code-menu-trigger \{[^}]*color: var\(--foreground\) !important;/);
  assert.match(css, /\.store-docs \.store-m-code-menu-trigger:hover \{ color: var\(--foreground\) !important; \}/);
  assert.match(css, /\.store-docs \.store-m-code \.store-m-code-menu-trigger \{[^}]*color: var\(--code-ui-muted\) !important;/);
  assert.match(css, /\.store-docs \.store-m-code \.store-m-code-menu-trigger:hover \{ color: var\(--code-ui-fg\) !important; \}/);
});
test("portal menu items keep solid state colors while preserving selected accent and disabled opacity", async () => {
  const css = await readFile(new URL("../components/docs/mintlify/code/styles.css", import.meta.url), "utf8");
  assert.match(css, /\.store-docs \.store-m-code-menu-item \{[^}]*color: var\(--foreground\) !important;/);
  assert.match(css, /\.store-m-code-menu-item:is\(:hover, :focus-visible, \[data-highlighted\]\) \{[^}]*color: var\(--foreground\) !important;/);
  assert.match(css, /\.store-m-code-menu-item\[data-selected\] \{ color: var\(--accent\) !important;/);
  assert.match(css, /\.store-m-code-menu-item\[data-selected\]:is\(:hover, :focus-visible, \[data-highlighted\]\) \{ color: var\(--accent\) !important; \}/);
  assert.match(css, /\.store-m-code-menu-item\[data-disabled\][^{]*\{ opacity: \.5; \}/);
});
test("compiled fence code resets inline-code utilities and plain output inherits the pre foreground", async () => {
  const css = await readFile(new URL("../components/docs/mintlify/code/styles.css", import.meta.url), "utf8");
  const serializable = await readFile(new URL("../components/docs/mintlify/code/serializable.mdx", import.meta.url), "utf8");
  assert.match(
    css,
    /\.store-docs pre\.store-m-code-compiled > code \{ background: transparent !important; color: inherit !important; \}/,
  );
  assert.doesNotMatch(css, /\.store-docs code \{[^}]*background: transparent !important;/s);
  assert.match(serializable, /```text title="Plain compiled fence\.txt"\nPlain output inherits the compiled fence foreground\.\n```/);
});
