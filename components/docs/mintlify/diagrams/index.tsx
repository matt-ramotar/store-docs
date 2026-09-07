"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  ZoomControls as MintlifyZoomControls, usePanZoom as mintlifyUsePanZoom,
  type MermaidProps, type ZoomControlsProps, type UsePanZoomReturn,
} from "@mintlify/components";
import { diagramConfig, hasAuthoredTheme, namespaceSvgIds, queueDiagramRender } from "./rendering";

export function usePanZoom(): UsePanZoomReturn {
  const controls = mintlifyUsePanZoom();
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return { ...controls, style: { ...controls.style, ...(reducedMotion ? { transition: "none" } : {}) } };
}

export function ZoomControls(props: ZoomControlsProps) {
  return <div className="store-diagrams-controls"><MintlifyZoomControls {...props} /></div>;
}

export function Mermaid({ chart, className, ariaLabel = "Mermaid diagram", placement = "bottom-right", actions }: MermaidProps) {
  const [rendered, setRendered] = useState<{ svg: string; background?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAutomaticActions, setShowAutomaticActions] = useState(false);
  const diagram = useRef<HTMLDivElement>(null);
  const instanceId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const generation = useRef(0);
  const { style, zoomIn, zoomOut, reset, pan, panStep } = usePanZoom();
  useEffect(() => {
    let cancelled = false;
    const renderId = `store-mermaid-${instanceId}-${++generation.current}`;
    setError(null);
    setRendered(null);
    queueDiagramRender(async () => {
      if (cancelled) return;
      // Frozen @mintlify/components@1.0.18 implementation dependency; no public engine export exists.
      const { default: engine } = await import("../../../../node_modules/@mintlify/components/dist/node_modules/.pnpm/mermaid@11.15.0/node_modules/mermaid/dist/mermaid.core.js");
      if (cancelled) return;
      const temporary = document.createElement("div");
      temporary.style.cssText = "position:absolute;left:-9999px;top:-9999px";
      temporary.setAttribute("aria-hidden", "true");
      document.body.appendChild(temporary);
      try {
        engine.initialize(diagramConfig(chart));
        const { svg } = await engine.render(renderId, chart, temporary);
        const background = hasAuthoredTheme(chart) ? engine.mermaidAPI.getConfig().themeVariables?.background : undefined;
        if (!cancelled) setRendered({ svg: namespaceSvgIds(svg, renderId), background });
      } finally {
        temporary.remove();
      }
    }).catch((reason: unknown) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : "Failed to render diagram");
    });
    return () => { cancelled = true; };
  }, [chart, instanceId]);
  useEffect(() => {
    if (actions !== undefined || !diagram.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) setShowAutomaticActions(entry.contentRect.height >= 120);
    });
    observer.observe(diagram.current);
    return () => observer.disconnect();
  }, [actions, error]);
  const showActions = actions === true || (actions === undefined && showAutomaticActions);
  const familyClass = `store-diagrams${className ? ` ${className}` : ""}`;
  if (error) return <div className={familyClass} data-component-part="mermaid-error" role="alert">
    <p data-component-part="mermaid-error-title">Failed to render diagram</p>
    <p data-component-part="mermaid-error-message">{error}</p>
  </div>;
  return <div className={familyClass} data-component-part="mermaid" data-actions={showActions} data-placement={placement}>
    {showActions && <ZoomControls onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={reset} onPan={pan} panStep={panStep} placement={placement} />}
    <div className="store-diagrams-viewport" style={rendered?.background ? { backgroundColor: rendered.background } : undefined}>
      {!rendered && <p className="store-diagrams-loading" role="status">Rendering diagram…</p>}
      <div ref={diagram} role="img" aria-label={ariaLabel} aria-busy={!rendered}
        data-component-part="mermaid-diagram" style={style}
        dangerouslySetInnerHTML={{ __html: rendered?.svg ?? "" }} />
    </div>
  </div>;
}
