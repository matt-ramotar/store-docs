"use client";

import type { ComponentFixture } from "../fixture-contract";
import { Mermaid, usePanZoom, ZoomControls } from "./index";

const flowchart = "flowchart LR\n  A[Local source] --> B{Fresh?}\n  B -->|Yes| C[Return value]\n  B -->|No| D[Fetch remote]\n  D --> C";
const sequence = "sequenceDiagram\n  participant Store\n  participant Cache\n  Store->>Cache: Read key\n  Cache-->>Store: Cached value";
const placements = ["top-left", "top-right", "bottom-left", "bottom-right"] as const;

function PanZoomFixture() {
  const { style, zoomIn, zoomOut, reset, pan, panStep } = usePanZoom();
  return <div className="store-diagrams" data-actions="true" data-placement="bottom-right" data-pan-step={panStep}>
    <div className="store-diagrams-viewport">
      <div data-component-part="mermaid-diagram" style={style}>
        <svg role="img" aria-label="Standalone pan and zoom target" viewBox="0 0 300 120" width="300" height="120">
          <rect x="60" y="20" width="180" height="80" rx="12" fill="var(--accent-soft)" stroke="var(--muted)" />
          <text x="150" y="65" fill="var(--foreground)" textAnchor="middle">Store</text>
        </svg>
      </div>
      <output data-fixture-transform="">{style.transform}</output>
      <output data-fixture-transition="">{style.transition ?? "unset"}</output>
    </div>
    <ZoomControls onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={reset} onPan={pan} panStep={panStep} placement="bottom-right" />
  </div>;
}

export const fixtures: ComponentFixture[] = [
  {
    id: "c6-diagrams-default", name: "Mermaid defaults and multiple instances",
    description: "Flowchart, sequence, and repeated flowchart rendering with default Tidal theme and automatic controls.",
    assertions: ["Rendered SVG text, nodes and edges use Tidal defaults", "All IDs and references remain unique across repeated charts", "Default controls appear only when diagram content is at least 120px tall", "Accessible diagram names match the supplied ariaLabel", "No temporary rendering nodes remain after completion"],
    render: () => <><Mermaid chart={flowchart} ariaLabel="Default data flow" /><Mermaid chart={sequence} ariaLabel="Cache sequence" /><Mermaid chart={flowchart} ariaLabel="Repeated data flow" /></>,
  },
  {
    id: "c6-diagrams-actions", name: "Mermaid placement and actions states",
    description: "Every placement with forced controls, explicit no-actions, and automatic action behavior.",
    assertions: ["All four placements position controls within the diagram frame", "Explicit actions=false hides controls regardless of chart size", "Native control buttons work with Enter and Space", "Keyboard focus remains visible and controls fit a narrow viewport"],
    render: () => <>{placements.map((placement) => <Mermaid key={placement} chart={sequence} placement={placement} actions ariaLabel={`Controls at ${placement}`} />)}<Mermaid chart={flowchart} actions={false} ariaLabel="Diagram without controls" /></>,
  },
  {
    id: "c6-diagrams-authored", name: "Mermaid authored colors and theme",
    description: "Explicit node/link colors, an init theme directive, and frontmatter theme configuration retain author choices.",
    assertions: ["Authored #8B5CF6 node fill and #FFFFFF text survive rendering", "Authored #D97706 link stroke survives rendering", "Explicit dark and forest themes are not replaced with Tidal variables", "The authored diagram background supports the authored theme"],
    render: () => <>
      <Mermaid chart={'flowchart LR\n A[Author color] --> B[Default color]\n style A fill:#8B5CF6,color:#FFFFFF,stroke:#6D28D9\n linkStyle 0 stroke:#D97706,stroke-width:3px'} ariaLabel="Authored node and edge colors" />
      <Mermaid chart={'%%{init: {"theme": "dark"}}%%\nflowchart LR\n A[Dark author theme] --> B[Preserved]'} ariaLabel="Authored dark theme" />
      <Mermaid chart={'---\nconfig:\n  theme: forest\n---\nflowchart LR\n A[Forest author theme] --> B[Preserved]'} ariaLabel="Authored frontmatter theme" />
    </>,
  },
  {
    id: "c6-diagrams-invalid", name: "Mermaid invalid input",
    description: "Invalid syntax reports a scoped accessible error while a neighboring valid chart still renders.",
    assertions: ["Invalid input produces role=alert with a readable error", "The render queue recovers so the neighboring valid diagram renders", "Temporary Mermaid error SVGs are removed", "Long error messages wrap within narrow screens"],
    render: () => <><Mermaid chart={"flowchart LR\n A[Unclosed node"} ariaLabel="Invalid chart" /><Mermaid chart={"flowchart LR\n A[Queue recovered] --> B[Valid]"} ariaLabel="Valid chart after invalid chart" /></>,
  },
  {
    id: "c6-pan-zoom", name: "ZoomControls and usePanZoom",
    description: "Standalone public hook and controls expose the live transform for zoom, four-direction pan and reset checks.",
    assertions: ["Keyboard activation of Pan up, Zoom in, Pan left, Reset view, Pan right, Pan down and Zoom out updates the exposed transform in that order", "Zoom in changes scale in 0.15 steps and clamps at 4 after repeated activation", "Zoom out changes scale in 0.15 steps and clamps at 0.25 after repeated activation", "Pan uses the declared 50px step and preserves scale", "Reset restores translate(0px, 0px) scale(1)", "Changing prefers-reduced-motion to reduce changes the exposed transition to none; changing it back restores transform 0.15s ease-out", "All seven controls have explicit accessible names and work with Enter and Space"],
    render: () => <PanZoomFixture />,
  },
];
