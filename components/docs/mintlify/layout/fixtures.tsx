"use client";

import { memo, useCallback, useEffect, useRef, useState, type RefObject } from "react";

import type { ComponentFixture } from "../fixture-contract";
import {
  Card,
  CardGroup,
  Color,
  ColorItem,
  ColorRow,
  Columns,
  Frame,
  Icon,
  Panel,
  Tile,
  Update,
  View,
  type IconProps,
} from "./index";

const iconTypes: Array<NonNullable<IconProps["iconType"]>> = [
  "brands",
  "duotone",
  "light",
  "regular",
  "sharp-duotone-solid",
  "sharp-light",
  "sharp-regular",
  "sharp-solid",
  "sharp-thin",
  "solid",
  "thin",
];

const iconLibraries: Array<NonNullable<IconProps["iconLibrary"]>> = ["fontawesome", "lucide"];
const pageTypes: Array<NonNullable<IconProps["pageType"]>> = ["default", "pdf", "minimal"];

const UpdateCallbackTarget = memo(function UpdateCallbackTarget({
  copied,
  registered,
  unregistered,
  updateRef,
}: {
  copied: (id: string) => void;
  registered: (id: string) => void;
  unregistered: (id: string) => void;
  updateRef: RefObject<HTMLDivElement | null>;
}) {
  return <Update
        description="Callbacks update the event log after client mount."
        hasContext
        id="layout-update-callbacks"
        label="September 2026"
        onCopyAnchorLink={copied}
        onRegisterHeading={registered}
        onUnregisterHeading={unregistered}
        ref={updateRef}
        tags={["stable", "layout", " stable ", ""]}
      >
        <p>The changelog body stays visible when isVisible is omitted.</p>
      </Update>;
});

function UpdateCallbackFixture() {
  const [events, setEvents] = useState<string[]>([]);
  const [mounted, setMounted] = useState(true);
  const [refState, setRefState] = useState("pending");
  const updateRef = useRef<HTMLDivElement>(null);
  const record = useCallback((event: string) => setEvents((current) => [...current, event]), []);
  const copied = useCallback((id: string) => record(`copied:${id}`), [record]);
  const registered = useCallback((id: string) => record(`registered:${id}`), [record]);
  const unregistered = useCallback((id: string) => record(`unregistered:${id}`), [record]);

  useEffect(() => {
    setRefState(updateRef.current?.id === "layout-update-callbacks" ? "attached" : "detached");
  }, [mounted]);

  return (
    <div>
      <button onClick={() => setMounted((current) => !current)} type="button">
        {mounted ? "Unmount callback update" : "Remount callback update"}
      </button>
      {mounted ? <UpdateCallbackTarget copied={copied} registered={registered} unregistered={unregistered} updateRef={updateRef} /> : null}
      <output aria-live="polite" data-fixture-events="update">Ref: {refState} | {events.join(" | ") || "No callback yet"}</output>
    </div>
  );
}

function ViewRegistryFixture() {
  const [activeTitle, setActiveTitle] = useState("Kotlin");
  const [refState, setRefState] = useState("pending");
  const kotlinRef = useRef<HTMLDivElement>(null);
  const swiftRef = useRef<HTMLDivElement>(null);
  const items = [
    { title: "Kotlin", content: "kotlin", active: activeTitle === "Kotlin" },
    { title: "Swift", content: "swift", active: activeTitle === "Swift" },
    { title: "Web", content: "web", active: false },
  ];

  useEffect(() => {
    setRefState(kotlinRef.current ? "Kotlin" : swiftRef.current ? "Swift" : "none");
  }, [activeTitle]);

  return (
    <div>
      <div aria-label="View selection">
        <button onClick={() => setActiveTitle("Kotlin")} type="button">Show Kotlin</button>
        <button onClick={() => setActiveTitle("Swift")} type="button">Show Swift</button>
      </div>
      <View items={items} ref={kotlinRef} title="Kotlin"><p>Kotlin active view mounted.</p></View>
      <View items={items} ref={swiftRef} title="Swift"><p>Swift active view mounted.</p></View>
      <View items={items} title="Web"><p>Inactive view must remain absent.</p></View>
      <View items={[]} title="Empty"><p>Empty registry must remain absent.</p></View>
      <output aria-live="polite" data-fixture-events="view">Active ref: {refState}</output>
    </div>
  );
}

export const fixtures: ComponentFixture[] = [
  {
    id: "layout-card-navigation",
    name: "Card navigation and state",
    description: "Internal, anchor, external, protocol-relative, explicit-as, disabled, horizontal, image, CTA and arrow states.",
    assertions: [
      "Explicit as wins over local route inference.",
      "A same-origin leading / uses local navigation, while // is protocol-relative external.",
      "Disabled cards retain content without an href; caller images and colors remain intact.",
    ],
    render: () => (
      <CardGroup cols={2}>
        <Card href="/docs/store6/overview" icon="database" title="Internal route">Local navigation</Card>
        <Card href="#layout-colors" title="Section anchor">Preserved document anchor</Card>
        <Card arrow href="https://example.com" title="External route">New tab semantics</Card>
        <Card href="//example.com/reference" title="Protocol-relative route">External target semantics</Card>
        <Card as="article" href="/docs/store6/overview" title="Explicit as">Rendered as an article</Card>
        <Card disabled href="/docs/store6/overview" title="Disabled">Visible without navigation</Card>
        <Card cta="Inspect trace" horizontal icon="wave-square" title="Horizontal CTA">Condensed state</Card>
        <Card img="/store-logo.png" title="Image card">Author media is preserved</Card>
      </CardGroup>
    ),
  },
  {
    id: "layout-columns-enum",
    name: "Responsive Columns enum",
    description: "Every numeric and string column enum from 1 through 4 with responsive collapse.",
    assertions: [
      "1, 2, 3, and 4 map to --cols for both numeric and string inputs.",
      "Columns collapse to one track on narrow viewports.",
    ],
    render: () => (
      <div>
        {([1, 2, 3, 4, "1", "2", "3", "4"] as const).map((cols) => (
          <Columns cols={cols} key={`${typeof cols}-${cols}`}>
            {Array.from({ length: Number(cols) }, (_, index) => <Panel key={index}>Column {index + 1}</Panel>)}
          </Columns>
        ))}
      </div>
    ),
  },
  {
    id: "layout-long-empty-nested",
    name: "Long, empty and nested layouts",
    description: "Long prose, empty containers and nested Columns/Card/Panel arrangements stress layout boundaries.",
    assertions: [
      "Long unbroken and prose content wraps without widening the page.",
      "Empty Card, Panel, Frame and Columns states keep stable boundaries.",
      "Nested layout containers do not leak styles outside .store-docs.",
    ],
    render: () => (
      <Columns cols={2}>
        <Card title="A deliberately long title that must remain readable when the available inline space becomes narrow">
          persistenceconfigurationwithaverylongunbrokenidentifier and supporting prose for wrapping.
          <Panel><Columns cols={2}><Panel>Nested A</Panel><Panel>Nested B</Panel></Columns></Panel>
        </Card>
        <div><Card /><Panel /><Frame><div /></Frame><Columns cols={1}><span /></Columns></div>
      </Columns>
    ),
  },
  {
    id: "layout-frame-media",
    name: "Frame media overflow",
    description: "Wide image, video and iframe media preserve author attributes and scroll within the Frame container.",
    assertions: [
      "Wide media gains horizontal overflow at the frame content boundary.",
      "Author dimensions, source URLs, captions and custom style colors remain present.",
    ],
    render: () => (
      <Frame
        description="A trace that is wider than its documentation column."
        renderDescription={(description) => <em>{description}</em>}
        style={{ borderColor: "#6D28D9" }}
        title="Store trace"
      >
        <div style={{ display: "flex", minWidth: 1100 }}>
          <img alt="Wide trace" height={240} src="/store-logo.png" width={640} />
          <video aria-label="Trace recording" controls width={640} />
          <iframe src="about:blank" title="Embedded trace" width={640} />
        </div>
      </Frame>
    ),
  },
  {
    id: "layout-panel-responsive",
    name: "Responsive Panel states",
    description: "Panel demonstrates its below-xl visible state, above-xl hidden state, HTML attributes and nested content.",
    assertions: [
      "The panel is visible below xl and hidden at xl according to the upstream responsive contract.",
      "ID and accessible label remain on the panel root.",
    ],
    render: () => <Panel aria-label="On-page contents" id="layout-mobile-panel"><strong>Contents</strong></Panel>,
  },
  {
    id: "layout-tile-links",
    name: "Tile content and link states",
    description: "Local and external Tile targets with graphical, empty, long-title and description states.",
    assertions: [
      "External Tiles keep target and rel while local Tiles stay in the current browsing context.",
      "Graphical children retain their author colors and scale within the media area.",
      "Empty and long labels do not widen the containing grid.",
    ],
    render: () => (
      <Columns cols={3}>
        <Tile description="Local route" href="/docs/store6/overview" title="Store overview"><svg aria-label="Origin diagram" viewBox="0 0 40 40"><circle cx="20" cy="20" fill="#6D28D9" r="16" /></svg></Tile>
        <Tile href="https://example.com" title="A very long tile title that demonstrates the constrained truncation state">External destination</Tile>
        <Tile href="#layout-colors"><span aria-label="Empty visual" /></Tile>
      </Columns>
    ),
  },
  {
    id: "layout-update-visibility-callbacks",
    name: "Update visibility and callbacks",
    description: "Visible-by-default and explicitly hidden updates, deduplicated tags, anchor copy and heading lifecycle callbacks.",
    assertions: [
      "Omitted isVisible renders the update while false renders no update.",
      "Duplicate and empty tags are removed.",
      "Client interactions call onCopyAnchorLink, onRegisterHeading and onUnregisterHeading callbacks.",
      "The forwarded Update ref attaches while visible and detaches on unmount.",
    ],
    render: () => <><UpdateCallbackFixture /><Update id="hidden-update" isVisible={false} label="Hidden">Hidden body</Update></>,
  },
  {
    id: "layout-view-registry",
    name: "View explicit registry and mount states",
    description: "An explicit items registry demonstrates active, inactive, mounting, switched and empty states.",
    assertions: [
      "No View content appears during server rendering before mount.",
      "After client mount only the active registered View appears.",
      "Buttons switch active and inactive items; unmatched and empty registries remain absent.",
      "The forwarded ref follows the active mounted View and detaches from the inactive View.",
    ],
    render: () => <ViewRegistryFixture />,
  },
  {
    id: "layout-color-variants",
    name: "Color compact and table variants",
    description: "Compact and table enums, standalone ColorRow/ColorItem exports, compound members and legacy light/dark data.",
    assertions: [
      "Compact displays names and values while table groups swatches by row.",
      "Color.Row and Color.Item match the standalone ColorRow and ColorItem adapters.",
      "Current string and legacy light/dark author swatches remain unchanged.",
      "Clicking a swatch copies its resolved value and exposes the copied state.",
      "Focusing or hovering a table swatch opens a tooltip containing its resolved value.",
    ],
    render: () => (
      <div>
        <Color variant="compact">
          <ColorItem name="Accent" value="#13766D" />
          <Color.Item name="Memory origin" value={{ light: "#6D28D9", dark: "#C4A7FF" }} />
        </Color>
        <Color variant="table">
          <ColorRow title="Core"><ColorItem name="Ink" value="#172C2A" /><ColorItem name="Paper" value="#F7F6F0" /></ColorRow>
          <Color.Row title="Origin"><Color.Item name="Fetcher" value={{ light: "#B45309", dark: "#F1B96D" }} /></Color.Row>
        </Color>
      </div>
    ),
  },
  {
    id: "layout-icon-enums-overrides",
    name: "Icon enums and overrides",
    description: "All iconType, iconLibrary and pageType enum values plus colorLight/colorDark, overrideColor, overrideSize, basePath and URL forms.",
    assertions: [
      `iconType values: ${iconTypes.join(", ")}.`,
      `iconLibrary values: ${iconLibraries.join(", ")}; pageType values: ${pageTypes.join(", ")}.`,
      "overrideSize and overrideColor leave author class sizing and color in control.",
    ],
    render: () => (
      <Columns cols={4}>
        {iconTypes.map((iconType) => <Icon icon={iconType === "brands" ? "github" : "database"} iconType={iconType} key={iconType} />)}
        {iconLibraries.map((iconLibrary) => <Icon icon="database" iconLibrary={iconLibrary} key={iconLibrary} />)}
        {pageTypes.map((pageType) => <Icon icon="database" key={pageType} pageType={pageType} />)}
        <Icon color="#6D28D9" icon="database" size={28} />
        <Icon colorDark="#C4A7FF" colorLight="#6D28D9" icon="database" />
        <Icon className="author-icon-size author-icon-color" icon="database" overrideColor overrideSize />
        <Icon basePath="/" icon="/store-logo.png" />
      </Columns>
    ),
  },
];
