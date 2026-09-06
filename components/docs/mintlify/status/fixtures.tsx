"use client";

import { useCallback, useEffect, useRef, useState, type FocusEvent } from "react";

import type { ComponentFixture } from "../fixture-contract";
import {
  Badge,
  Callout,
  Check,
  Danger,
  DeprecatedPill,
  Info,
  InfoPill,
  Note,
  ParamHead,
  Property,
  RequiredPill,
  Tip,
  Warning,
} from "./index";

const badgeColors = [
  "gray",
  "blue",
  "green",
  "orange",
  "yellow",
  "red",
  "purple",
  "white",
  "surface",
  "white-destructive",
  "surface-destructive",
] as const;

const badgeSizes = ["xs", "sm", "md", "lg"] as const;
const badgeIconTypes = [
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
] as const;

const namedCallouts = [Info, Warning, Note, Tip, Check, Danger];

function InteractiveStatusFixture() {
  const [buttonPresses, setButtonPresses] = useState(0);
  const [linkPresses, setLinkPresses] = useState(0);
  const [focused, setFocused] = useState("none");
  const [hash, setHash] = useState("none");
  const [mounted, setMounted] = useState(false);
  const [clipboardMode, setClipboardMode] = useState("native");
  const [unhandledRejections, setUnhandledRejections] = useState(0);
  const clipboardOverrideInstalled = useRef(false);
  const originalClipboardDescriptor = useRef<PropertyDescriptor | undefined>(undefined);
  const handleMount = useCallback(() => setMounted(true), []);

  const restoreClipboard = useCallback(() => {
    if (!clipboardOverrideInstalled.current) return;
    if (originalClipboardDescriptor.current) {
      Object.defineProperty(navigator, "clipboard", originalClipboardDescriptor.current);
    } else {
      Reflect.deleteProperty(navigator, "clipboard");
    }
    clipboardOverrideInstalled.current = false;
  }, []);

  const toggleClipboardDenial = useCallback(() => {
    if (clipboardOverrideInstalled.current) {
      restoreClipboard();
      setClipboardMode("native");
      return;
    }
    try {
      originalClipboardDescriptor.current = Object.getOwnPropertyDescriptor(navigator, "clipboard");
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: async () => { throw new Error("Simulated denied clipboard access"); } },
      });
      clipboardOverrideInstalled.current = true;
      setClipboardMode("denied");
    } catch {
      setClipboardMode("setup failed");
    }
  }, [restoreClipboard]);

  useEffect(() => {
    const recordHash = () => setHash(window.location.hash || "none");
    const recordUnhandledRejection = () => setUnhandledRejections((count) => count + 1);
    recordHash();
    window.addEventListener("hashchange", recordHash);
    window.addEventListener("unhandledrejection", recordUnhandledRejection);
    return () => {
      window.removeEventListener("hashchange", recordHash);
      window.removeEventListener("unhandledrejection", recordUnhandledRejection);
    };
  }, []);
  useEffect(() => restoreClipboard, [restoreClipboard]);

  const recordFocus = useCallback((event: FocusEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    setFocused(target.textContent?.trim() || target.getAttribute("aria-label") || target.tagName.toLowerCase());
  }, []);

  return (
    <div className="grid gap-4" onFocusCapture={recordFocus}>
      <div className="flex flex-wrap items-center gap-3">
        <Badge onClick={() => setButtonPresses((count) => count + 1)}>Run Badge callback</Badge>
        <Badge href="#c1-badge-linked-target" onClick={() => setLinkPresses((count) => count + 1)}>Run linked Badge callback</Badge>
      </div>
      <span id="c1-badge-linked-target">Linked Badge target</span>
      <button onClick={toggleClipboardDenial} type="button">
        {clipboardMode === "denied" ? "Restore clipboard" : "Enable ParamHead clipboard denial"}
      </button>
      <ParamHead id="c1-paramhead-clipboard-denial" name="clipboardDenied" onMount={handleMount} type="string" />
      <output aria-live="polite" data-fixture-events="status-callbacks">
        Button callbacks: {buttonPresses} | Link callbacks: {linkPresses} | Focused: {focused} | ParamHead mounted: {mounted ? "yes" : "no"} | Clipboard mode: {clipboardMode} | Hash: {hash} | Unhandled rejections: {unhandledRejections}
      </output>
    </div>
  );
}

export const fixtures: ComponentFixture[] = [
  {
    id: "status-badge-enums",
    name: "Badge enum coverage",
    description: "Every Mintlify color plus size, shape, outline, icons, link, and disabled behavior.",
    assertions: [
      "Every public Badge color is visible and uses a semantic Store status token.",
      "The smallest and largest sizes, both shapes, and outline compatibility remain distinct.",
      "Links remain anchors while disabled links become non-interactive labeled spans.",
    ],
    render: () => (
      <div className="flex flex-wrap items-center gap-3">
        {badgeColors.map((color) => (
          <Badge color={color} key={color}>
            {color}
          </Badge>
        ))}
        {badgeSizes.map((size) => (
          <Badge key={size} shape={size === "xs" ? "pill" : "rounded"} size={size} variant="outline">
            {size} outline
          </Badge>
        ))}
        {badgeIconTypes.map((iconType) => (
          <Badge iconType={iconType} key={iconType} leadIcon="circle-info" size="xs">
            {iconType}
          </Badge>
        ))}
        <Badge iconLibrary="lucide" leadIcon="sparkles" shape="pill">
          Lucide
        </Badge>
        <Badge href="#property-fixture" size="lg" tailIcon="arrow-right">
          linked badge
        </Badge>
        <Badge disabled href="#disabled-badge">
          disabled link
        </Badge>
      </div>
    ),
  },
  {
    id: "status-callout-variants",
    name: "Callout variants and aliases",
    description: "All package variants, all six named aliases, and explicit variant precedence over legacy type.",
    assertions: [
      "All seven package variants have a matching accessible label and compatibility marker.",
      "Named aliases resolve to their corresponding variant.",
      "An explicit danger variant overrides the legacy Info type and labels itself Danger.",
    ],
    render: () => (
      <div>
        {(["info", "warning", "note", "tip", "check", "danger", "custom"] as const).map((variant) => (
          <Callout key={variant} title={`${variant} title`} variant={variant}>
            {variant} body
          </Callout>
        ))}
        {namedCallouts.map((NamedCallout, index) => (
          <NamedCallout key={index}>Named alias {index + 1}</NamedCallout>
        ))}
        <Callout title="Variant wins" type="Info" variant="danger">
          This must be announced as a Danger callout.
        </Callout>
        <Callout ariaLabel="Brand-specific note" color="#6D28D9" icon="sparkles" iconLibrary="lucide">
          Custom icon, color, and accessible name.
        </Callout>
      </div>
    ),
  },
  {
    id: "status-property-states",
    name: "Property metadata states",
    description: "Property and head metadata with custom labels, default values, arbitrary content, and pills.",
    assertions: [
      "Name, type, location, default, required, deprecated, pre, and post metadata remain visible.",
      "Property descriptions accept structured React content.",
      "Standalone pills retain custom content and labels; omitted pill labels render nothing.",
      "The hidden Property in the fixture does not render.",
    ],
    render: () => (
      <div>
        <Property
          default={false}
          defaultLabel="initial"
          deprecated
          deprecatedLabel="retired"
          location="query"
          name="fetchPolicy"
          post={["experimental"]}
          pre={["Store6"]}
          required
          requiredLabel="mandatory"
          type="NetworkPolicy | null"
        >
          <p>
            Accepts <code>NetworkPolicy</code> values and arbitrary JSX descriptions.
          </p>
        </Property>
        <Property hidden name="internalOnly" type="never">
          This content must stay hidden.
        </Property>
        <div className="flex flex-wrap gap-2">
          <InfoPill prefix="type">
            <code>List&lt;String&gt;</code>
          </InfoPill>
          <RequiredPill label="required" />
          <DeprecatedPill label="deprecated" />
        </div>
      </div>
    ),
  },
  {
    id: "status-client-callbacks",
    name: "Status client callbacks",
    description: "Live callback coverage for Badge activation and ParamHead mount notification.",
    assertions: [
      "Keyboard activation invokes the button and linked Badge callbacks once and moves focus to the activated control.",
      "ParamHead calls onMount after the client component mounts.",
      "The generated heading link remains keyboard focusable and updates the fragment even when clipboard.writeText rejects.",
      "A rejected clipboard promise does not increment the unhandled rejection count.",
      "The explicit denial control restores the original clipboard descriptor on demand and fixture cleanup.",
    ],
    render: () => <InteractiveStatusFixture />,
  },
];
