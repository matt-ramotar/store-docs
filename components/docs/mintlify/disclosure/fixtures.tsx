"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { memo, useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { ComponentFixture } from "../fixture-contract";
import { Accordion, Expandable, Steps, Tabs, Tree } from "./index";

function AccordionEvents() {
  const [events, setEvents] = useState<string[]>([]);
  const record = (event: string) => setEvents((previous) => [...previous, event]);
  return <>
    <Accordion.Group>
      <Accordion title="Repeated title" defaultOpen="true" description="Legacy string initial state"
        trackOpen={({ title }) => record(`open:${title}`)} trackClose={({ title }) => record(`close:${title}`)}
        onMount={() => record("mounted")}
        getInitialOpenFromUrl={(id, parents) => id === "from-url" && parents.length === 1}
        onUrlStateChange={(open, id, parents) => record(`url:${open}:${[...parents, id].join(":")}`)}>
        First panel.
        <Accordion title="From URL" defaultOpen={false}
          getInitialOpenFromUrl={(id, parents) => id === "from-url" && parents[0] === "repeated-title"}>
          Nested URL-open panel.
        </Accordion>
      </Accordion>
      <Accordion title="Repeated title" defaultOpen="false">Second panel.</Accordion>
      <Accordion title="Disabled disclosure" _disabled>Unavailable panel.</Accordion>
    </Accordion.Group>
    <output aria-live="polite" data-fixture-events="accordion">{events.join(" | ")}</output>
  </>;
}

function ExpandableEvents() {
  const [events, setEvents] = useState<string[]>([]);
  const [sessionValue, setSessionValue] = useState("unread");
  const anchorRef = useRef(false);
  const record = (event: string) => setEvents((previous) => [...previous, event]);
  const readSessionValue = useCallback(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem("user_toggled_expandables") ?? "{}");
      setSessionValue(String(stored["c2-session-fields"] ?? "absent"));
    } catch {
      setSessionValue("unavailable");
    }
  }, []);
  const resetSessionFixture = useCallback(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem("user_toggled_expandables") ?? "{}");
      delete stored["c2-session-fields"];
      sessionStorage.setItem("user_toggled_expandables", JSON.stringify(stored));
      window.location.reload();
    } catch {
      setSessionValue("reset failed");
    }
  }, []);
  useEffect(readSessionValue, [readSessionValue]);
  return <>
    <div>
      <button onClick={resetSessionFixture} type="button">Reset session fixture and reload</button>
      <button onClick={() => window.location.reload()} type="button">Reload session fixture</button>
    </div>
    <Expandable title="response fields" lazy onChange={(open) => record(`change:${open}`)}
      onOpen={() => record("opened")} onClose={() => record("closed")} onMount={() => record("mounted")}
      openedText="Collapse" closedText="Inspect">
      <p>Lazy response fields mount on first expansion and remain mounted.</p>
    </Expandable>
    <Expandable title="session fields" uniqueParamId="c2-session-fields" defaultOpen
      onChange={(open) => { record(`session:${open}`); readSessionValue(); }}
      openedText="Collapse" closedText="Inspect">
      <p>Local tab-session memory uses the installed package behavior.</p>
    </Expandable>
    <Expandable title="anchored fields" uniqueParamId="c2-anchor" anchor="response-c2-anchor-id" hasScrolledToAnchorRef={anchorRef}>
      <p>Anchor opens the matching fields until the supplied scrolled ref is set.</p>
    </Expandable>
    <output aria-live="polite" data-fixture-events="expandable">{events.join(" | ")}</output>
    <output aria-live="polite" data-fixture-events="expandable-session">Stored session state: {sessionValue}</output>
  </>;
}

const StepsCallbackTarget = memo(function StepsCallbackTarget({
  copied,
  registered,
  scrolled,
  unregistered,
}: {
  copied: (id: string | undefined) => void;
  registered: (id: string) => void;
  scrolled: (id: string) => void;
  unregistered: (id: string) => void;
}) {
  return <Steps titleSize="h2">
      <Steps.Item
        _hasContext
        id="c2-step-callbacks"
        onCopyAnchorLink={copied}
        onRegisterHeading={registered}
        onUnregisterHeading={unregistered}
        scrollElementIntoView={scrolled}
        title="Callback step"
      >
        Copy, registration, cleanup and fragment scrolling are recorded below.
      </Steps.Item>
    </Steps>;
});

function StepsEvents() {
  const [events, setEvents] = useState<string[]>([]);
  const [mounted, setMounted] = useState(true);
  const record = useCallback((event: string) => {
    setEvents((previous) => [...previous, event]);
  }, []);
  const copied = useCallback((id: string | undefined) => record(`copied:${id ?? "undefined"}`), [record]);
  const registered = useCallback((id: string) => record(`registered:${id}`), [record]);
  const unregistered = useCallback((id: string) => record(`unregistered:${id}`), [record]);
  const scrolled = useCallback((id: string) => record(`scrolled:${id}`), [record]);

  return <>
    <button onClick={() => setMounted((current) => !current)} type="button">
      {mounted ? "Unmount callback step" : "Remount callback step"}
    </button>
    {mounted ? <StepsCallbackTarget copied={copied} registered={registered} scrolled={scrolled} unregistered={unregistered} /> : null}
    <output aria-live="polite" data-fixture-events="steps">{events.join(" | ") || "No callback yet"}</output>
  </>;
}

function TabEvents() {
  const [selected, setSelected] = useState(1);
  const [refState, setRefState] = useState("pending");
  const panelsRef = useRef<HTMLDivElement>(null!);
  useEffect(() => {
    setRefState(panelsRef.current?.dataset.componentPart === "tabs-panels" ? "attached" : "missing");
  }, []);
  return <>
    <Tabs ariaLabel="Storage backend" defaultTabIndex={1} onTabChange={setSelected} panelsRef={panelsRef} borderBottom>
      <Tabs.Item title="Memory" data-child-heading-ids="c2-memory-heading"><h3 id="c2-memory-heading">Memory backend</h3></Tabs.Item>
      <Tabs.Item title="Persistent database with a deliberately long label" icon="database"><p>Database backend</p></Tabs.Item>
      <Tabs.Item title="Memory"><p>Duplicate labels keep separate IDs.</p></Tabs.Item>
    </Tabs>
    <output data-fixture-events="tabs">Selected index: {selected} | Panels ref: {refState}</output>
  </>;
}

function TreeKeyboardEvents() {
  const [state, setState] = useState("Focused: none | Open folders: src, commonMain");
  const record = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    const tree = event.currentTarget.querySelector('[role="tree"]');
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const label = active?.querySelector('[data-component-part="tree-folder-title"], [data-component-part="tree-file-title"]')?.textContent ?? "none";
    const openFolders = [...(tree?.querySelectorAll('[role="treeitem"][aria-expanded="true"]') ?? [])]
      .map((item) => item.querySelector('[data-component-part="tree-folder-title"]')?.textContent)
      .filter(Boolean)
      .join(", ") || "none";
    setState(`Focused: ${label} | Open folders: ${openFolders}`);
  }, []);

  return <div onKeyUp={record}>
    <Tree>
      <Tree.Folder name="src" defaultOpen><Tree.Folder name="commonMain" defaultOpen><Tree.File name="StoreBuilderWithAnIntentionallyLongFileName.kt" /></Tree.Folder><Tree.File name="README.md" /></Tree.Folder>
      <Tree.Folder name="closed"><Tree.File name="hidden.txt" /></Tree.Folder>
      <Tree.Folder name="empty" />
      <Tree.Folder name="unavailable" openable={false}><Tree.File name="inaccessible.txt" /></Tree.Folder>
      <Tree.File name="package.json" />
    </Tree>
    <output aria-live="polite" data-fixture-events="tree">{state}</output>
  </div>;
}

export const fixtures: ComponentFixture[] = [
  {
    id: "c2-accordion", name: "Accordion and Accordion.Group",
    description: "Grouped, nested, repeated-title and disabled disclosures with URL and tracking callbacks.",
    assertions: ["Legacy true/false strings set only the initial state", "Repeated titles have unique accessible IDs in SSR and after hydration", "Disabled summaries cannot toggle by pointer or keyboard", "Callbacks retain title slugs and ancestor URL IDs", "Open and close callbacks fire once per manual transition"],
    render: () => <AccordionEvents />,
  },
  {
    id: "c2-expandable", name: "Expandable",
    description: "Lazy content, custom labels, lifecycle callbacks, supplied anchor and local session memory.",
    assertions: ["Lazy children are absent until first open", "Open/close and onChange callbacks match transitions", "Unique panel IDs connect summary controls", "Session state survives a reload only for supplied uniqueParamId", "The reset control deletes only c2-session-fields before reloading"],
    render: () => <ExpandableEvents />,
  },
  {
    id: "c2-steps", name: "Steps and Steps.Item",
    description: "Nested step lists, all declared title sizes, custom marker, anchor behavior and lifecycle callbacks.",
    assertions: ["Outer and nested lists each have their own numbering", "p/h2/h3/h4 title sizes remain supported", "Explicit stepNumber and icon override the generated marker", "Heading anchor is keyboard reachable and visible on focus", "Fragment mount, successful anchor copy, heading registration and unregistration report the exact step ID"],
    render: () => <><Steps titleSize="h2">
        <Steps.Item title="Fetch" id="c2-step-fetch"><p>Fetch the value.</p>
          <Steps titleSize="h3"><Steps.Item title="Cache branch" id="c2-step-cache">Check local storage.</Steps.Item><Steps.Item title="Network branch" noAnchor>Refresh remote storage.</Steps.Item></Steps>
        </Steps.Item>
        <Steps.Item title="Transform" titleSize="h4" stepNumber="7">Map the result.</Steps.Item>
        <Steps.Item title="Return" titleSize="p" icon={<HugeiconsIcon aria-label="Complete" role="img" icon={Tick02Icon} size={16} strokeWidth={1.5} />}>Return the value.</Steps.Item>
      </Steps><StepsEvents /></>,
  },
  {
    id: "c2-tabs", name: "Tabs and Tabs.Item",
    description: "Initial second tab, duplicate titles, callback output and a narrow-screen long label.",
    assertions: ["Exactly one tab is selected and tabbable", "Arrow keys wrap; Home/End select first/last", "Every label controls its matching panel", "Inactive content remains rendered and hidden", "No hosted tab synchronization or controlled active-index prop is promised"],
    render: () => <TabEvents />,
  },
  {
    id: "c2-tree", name: "Tree, Tree.File and Tree.Folder",
    description: "Open, closed, nested, empty and explicitly non-openable folders with long names.",
    assertions: ["Tree levels and group ownership track nesting", "Arrow keys, Home/End, asterisk and typeahead move or expand as declared upstream", "Only one visible tree item is tabbable after hydration", "Non-openable and empty folders have no expanded state", "Long names fit the available width"],
    render: () => <TreeKeyboardEvents />,
  },
];
