"use client";

import { useRef, useState } from "react";
import type { ComponentFixture } from "../fixture-contract";
import {
  BaseCodeBlock, CodeBlock, CodeGroup, CodeGroupSelect, CodeSnippet,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  FencedCodeBlock, ClipboardWriterFixture,
} from "./index";

export const exactCopySource = '\n  const title = "Tidal";\n  // Keep indentation and the final newline.\n';
const longCode = Array.from({ length: 24 }, (_, index) => `val item${index + 1} = store.get(${index + 1})`).join("\n");
const longLine = 'val description = "A deliberately long line of Kotlin source makes it possible to inspect horizontal scrolling and wrapping at a narrow viewport without truncating any source characters."';

function CopyContractFixture() {
  const [copied, setCopied] = useState("No attempt");
  const [actions, setActions] = useState(0);
  const anchorRef = useRef<HTMLDivElement>(null!);
  return <div data-code-fixture="copy-contract">
    <CodeBlock filename="Exact source.kt" language="kotlin" anchorRef={anchorRef} feedbackModalOpen
      feedbackButton={<button type="button" onClick={() => setActions(value => value + 1)}>Code feedback</button>}
      askAiButton={<button type="button" onClick={() => setActions(value => value + 1)}>Code assistant</button>}
      copyButtonProps={{ textToCopy: exactCopySource, copyButtonAriaLabel: "Copy exact fixture", tooltipCopyText: "Copy source", tooltipCopiedText: "Source copied", onCopied: (result, text) => setCopied(`${result}: ${text === exactCopySource ? "exact source" : "source mismatch"}`) }}>
      {exactCopySource}
    </CodeBlock>
    <output data-code-output="copy">{copied}</output><output data-code-output="actions">{actions}</output>
    <button type="button" onClick={() => setCopied(anchorRef.current?.classList.contains("store-m-code") ? "anchor attached" : "anchor missing")}>Check code anchor</button>
  </div>;
}
function ClipboardFailureFixture() {
  const [result, setResult] = useState("No attempt");
  return <ClipboardWriterFixture writeText={async () => { throw new Error("Simulated denied clipboard access"); }}>
    <CodeBlock language="text" copyButtonProps={{textToCopy:"Preserved source",copyButtonAriaLabel:"Exercise denied clipboard",onCopied:(state,text)=>setResult(`${state}:${text}`)}}>Preserved source</CodeBlock>
    <output data-code-output="denied">{result}</output>
  </ClipboardWriterFixture>;
}
function GroupFixture() {
  const [selection, setSelection] = useState(1);
  const anchorRef = useRef<HTMLDivElement>(null!);
  return <div data-code-fixture="group-tabs">
    <CodeGroup initialSelectedTab={1} onSelectedTabChange={setSelection} anchorRef={anchorRef} noMargins isSmallText>
      <CodeBlock filename="Store.kt" language="kotlin">{'val store = Store()'}</CodeBlock>
      <CodeBlock filename="Store.ts" language="typescript">{'const store = new Store();'}</CodeBlock>
      <CodeBlock filename="Store.swift" language="swift">{'let store = Store()'}</CodeBlock>
    </CodeGroup>
    <output data-code-output="tab">{selection}</output>
    <button type="button" onClick={() => setSelection(anchorRef.current ? 42 : -1)}>Check group anchor</button>
  </div>;
}
function GroupDropdownFixture() {
  const [selection, setSelection] = useState(0);
  return <div data-code-fixture="group-dropdown"><CodeGroup dropdown onSelectedTabChange={setSelection}>
    <CodeBlock filename="Store.kt" language="kotlin">{'val store = Store()'}</CodeBlock>
    <CodeBlock filename="Store.ts" language="typescript">{'const store = new Store();'}</CodeBlock>
  </CodeGroup><output data-code-output="dropdown">{selection}</output></div>;
}
function SelectFixture() {
  const [label, setLabel] = useState("Read");
  const [index, setIndex] = useState(0);
  return <div data-code-fixture="group-select"><CodeGroupSelect syncedLabel={label} setSyncedLabel={setLabel} setSelectedExampleIndex={setIndex}
    codeSnippetAriaLabel="Selected Store example" snippets={{
      Kotlin: { Read: { filename: "Read.kt", language: "kotlin", code: "store.get(1)" }, Write: { filename: "Write.kt", language: "kotlin", code: "store.write(1, value)" } },
      TypeScript: { Read: { filename: "Read.ts", language: "typescript", code: "store.get(1);" }, Write: { filename: "Write.ts", language: "typescript", code: "store.write(1, value);" } },
    }} />
    <output data-code-output="example">{label}:{index}</output>
    <button type="button" onClick={() => setLabel("Write")}>Sync Write example</button>
  </div>;
}
function DropdownFixture() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("Read");
  const [clicks, setClicks] = useState(0);
  const [refs, setRefs] = useState("unchecked");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);
  const inspectRefs = () => setRefs([
    triggerRef.current ? "trigger" : "missing-trigger",
    contentRef.current ? "content" : "missing-content",
    itemRef.current ? "item" : "missing-item",
  ].join(","));
  return <div data-code-fixture="menu"><DropdownMenu open={open} onOpenChange={setOpen}>
    <DropdownMenuTrigger aria-label="Code operations" className={state => state.open ? "author-open" : "author-closed"}
      render={<button ref={triggerRef} data-authored-menu-part="trigger" />}>Code operations</DropdownMenuTrigger>
    <DropdownMenuContent align="end" sideOffset={8} aria-label="Code operations menu" className={() => "author-menu-content"}
      render={<div ref={contentRef} data-authored-menu-part="content" />}>
      <DropdownMenuItem isSelected={selected === "Read"} onSelect={() => setSelected("Read")} onClick={() => setClicks(value => value + 1)}
        className={() => "author-menu-item"} render={<div ref={itemRef} data-authored-menu-part="item" />}>Read</DropdownMenuItem>
      <DropdownMenuItem isSelected={selected === "Write"} onSelect={() => setSelected("Write")} onClick={() => setClicks(value => value + 1)}>Write</DropdownMenuItem>
      <DropdownMenuItem disabled onSelect={() => setSelected("Disabled")}>Unavailable operation</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
    <button type="button" data-code-action="outside-dismiss" onPointerDown={inspectRefs}>Inspect composed refs and dismiss outside</button>
    <output data-code-output="menu">{open ? "open" : "closed"}:{selected}:{clicks} | refs:{refs}</output>
  </div>;
}

export const fixtures: ComponentFixture[] = [
  {id:"code-clipboard-denied",name:"Clipboard rejection feedback",description:"A deterministic denied writer exercises the production copy failure path without changing browser permissions.",assertions:["Failure announces manual-copy instructions and preserves the exact source callback."],render:()=> <ClipboardFailureFixture/>},
  { id: "code-copy-contract", name: "CodeBlock copy and action contract", description: "Real clipboard result callbacks, exact source, reference attachment and custom action slots.", assertions: ["Clipboard success announces Code copied and reports success: exact source.", "Clipboard rejection remains actionable and reports error: exact source.", "Custom labels, action callbacks and anchorRef work."], render: () => <CopyContractFixture /> },
  { id: "code-line-states", name: "BaseCodeBlock lines, focus and expansion", description: "Native highlighting keeps line numbers, highlight and focus metadata, wrapping and expand/collapse.", assertions: ["The initial See all 24 lines control has aria-expanded=false and clips the region to 190px.", "Activating See all 24 lines changes the label to Collapse, sets aria-expanded=true and removes the region height limit.", "Activating Collapse restores aria-expanded=false and the 190px limit.", "24 numbered lines have line 2 highlighted and lines 2 and 3 focused.", "Long source wraps inside its container."], render: () => <div data-code-fixture="line-states"><BaseCodeBlock language="kotlin" lines highlight="[2]" focus="[2,3]" expandable numberOfLines={24}>{longCode}</BaseCodeBlock><CodeBlock language="kotlin" wrap filename="Wrapped.kt">{longLine}</CodeBlock></div> },
  { id: "code-base-props", name: "BaseCodeBlock extraction and plain text", description: "Precompiled source extraction, unhighlighted text, malformed metadata and small text.", assertions: ["forceExtract accepts code nodes and rehighlights them.", "shouldHighlight false keeps readable text.", "Malformed highlight/focus values do not crash."], render: () => <><BaseCodeBlock language="kotlin" forceExtract isSmallText><pre className="shiki"><code>{"val extracted = true"}</code></pre></BaseCodeBlock><BaseCodeBlock language="kotlin" shouldHighlight={false} highlight="bad" focus="null">{"val plain = true"}</BaseCodeBlock></> },
  { id: "code-theme-states", name: "Explicit code theme precedence", description: "Default Tidal, explicit system, explicit dark, named and dual syntax themes.", assertions: ["Default syntax resolves to Tidal CSS tokens.", "Explicit github-light keeps its light syntax surface.", "Explicit dark and dual syntax options remain supported."], render: () => <div data-code-fixture="themes"><CodeBlock filename="Default.kt" language="kotlin">{'val title = "Tidal" // comment'}</CodeBlock><CodeBlock filename="Light.kt" language="kotlin" codeBlockTheme="system" codeBlockThemeObject={{ theme: "github-light" }}>{'val title = "Author light"'}</CodeBlock><CodeBlock filename="Dark.kt" language="kotlin" codeBlockTheme="dark" codeBlockThemeObject={{ theme: "dracula" }}>{'val title = "Author dark"'}</CodeBlock><CodeBlock filename="Variables.kt" language="kotlin" codeBlockThemeObject={{ theme: "css-variables" }}>{'val title = "Author CSS variables"'}</CodeBlock><CodeBlock filename="Dual.kt" language="kotlin" codeBlockTheme="system" codeBlockThemeObject={{ theme: { light: "github-light", dark: "github-dark" } }}>{'val title = "Author dual"'}</CodeBlock></div> },
  { id: "code-group-tabs", name: "CodeGroup tabs", description: "Initial selected tab, keyboard navigation, noMargins, small text and selection callback.", assertions: ["Store.ts is initially selected and output is 1.", "ArrowRight selects Store.swift and reports 2; Home selects Store.kt and reports 0.", "Copy uses the active panel source; group anchor is attached."], render: () => <GroupFixture /> },
  { id: "code-group-dropdown", name: "CodeGroup dropdown", description: "Dropdown code selection and selected-tab callbacks.", assertions: ["Code language opens a real menu.", "Choosing TypeScript displays its source and reports 1.", "Escape closes the menu and restores focus."], render: () => <GroupDropdownFixture /> },
  { id: "code-group-select", name: "CodeGroupSelect synchronization", description: "Language and example dropdowns with controlled cross-example synchronization.", assertions: ["Choosing Write reports Write:1 and renders store.write(1, value).", "Choosing TypeScript resets to Read:0 and renders store.get(1);.", "Sync Write example reports Write:1 and renders store.write(1, value); for the current TypeScript language."], render: () => <SelectFixture /> },
  { id: "code-select-empty-audio", name: "Empty and audio examples", description: "Empty snippet registries and native audio controls.", assertions: ["An empty registry renders disabled selectors without throwing.", "Audio snippets render audio controls with the supplied URL."], render: () => <><CodeGroupSelect snippets={{}} /><CodeGroupSelect snippets={{ Audio: { Example: { filename: "sound.wav", language: "text", code: "audio example", audioUrl: "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=" } } }} /></> },
  { id: "code-snippet", name: "CodeSnippet strings and elements", description: "Memoized snippets preserve strings, React children and explicit syntax themes.", assertions: ["String snippets highlight Kotlin tokens.", "React code children remain intact.", "A named light theme stays light."], render: () => <><CodeSnippet language="kotlin">{'val source = "Store"'}</CodeSnippet><CodeSnippet><span data-code-node="preserved">Preserved node</span></CodeSnippet><CodeSnippet language="typescript" codeBlockThemeObject={{ theme: "github-light" }}>{'const source = "Store";'}</CodeSnippet></> },
  { id: "code-dropdown-primitives", name: "DropdownMenu compound states", description: "Controlled open state, alignment, selected and disabled items, onClick, onSelect, dismissal, and authored/native ref composition.", assertions: ["Code operations opens an end-aligned portal with an 8px side offset and reports open:Read:0.", "Selecting Write fires onSelect and onClick once, closes the menu, and reports closed:Write:1.", "The disabled item cannot change selection or callbacks.", "Escape closes the menu and restores focus to the authored trigger.", "Pointer activation of Inspect composed refs and dismiss outside reports trigger,content,item before outside-press dismissal.", "The authored trigger, content and item refs coexist with the native Base UI refs."], render: () => <DropdownFixture /> },
  { id: "code-fence-tree", name: "Compiled fence tree preservation", description: "A compiler-shaped tree verifies raw metadata independently from token spans.", assertions: ["The named token span remains a span with its authored color.", "Copy uses the exact raw string, preserving indentation and final newline."], render: () => <FencedCodeBlock title="Original source.kt" data-raw-code={exactCopySource} data-language="kotlin"><code><span className="line"><span data-code-token="preserved" style={{ color: "#CBB9F5" }}>const</span>{' title = "Tidal";'}</span></code></FencedCodeBlock> },
  { id: "code-hidden-action", name: "Hidden assistant and copy overrides", description: "hideAskAiButton and copy override labels remain functional.", assertions: ["Hidden assistant action is absent.", "Copy button carries the supplied label and suppresses its tooltip."], render: () => <CodeBlock lang="text" hideAskAiButton askAiButton={<button>Hidden assistant</button>} copyButtonProps={{ textToCopy: "override source", showTooltip: false, copyButtonAriaLabel: "Copy override" }}>Original source</CodeBlock> },
];
