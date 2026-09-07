/** Mermaid computes derived colors, so its theme configuration requires resolved sRGB values. */
export const tidalDiagramTheme = Object.freeze({
  background: "#FFFFFF", primaryColor: "#E3F0E9", primaryTextColor: "#172C2A", primaryBorderColor: "#596A65",
  secondaryColor: "#F7F6F0", secondaryTextColor: "#172C2A", secondaryBorderColor: "#596A65",
  tertiaryColor: "#FFFFFF", tertiaryTextColor: "#172C2A", tertiaryBorderColor: "#596A65",
  textColor: "#172C2A", lineColor: "#596A65", arrowheadColor: "#596A65", defaultLinkColor: "#596A65",
  mainBkg: "#E3F0E9", nodeBkg: "#E3F0E9", nodeBorder: "#596A65", nodeTextColor: "#172C2A",
  clusterBkg: "#F7F6F0", clusterBorder: "#596A65", titleColor: "#172C2A", edgeLabelBackground: "#FFFFFF",
  actorBkg: "#E3F0E9", actorBorder: "#596A65", actorTextColor: "#172C2A", actorLineColor: "#596A65",
  signalColor: "#596A65", signalTextColor: "#172C2A", labelBoxBkgColor: "#F7F6F0", labelBoxBorderColor: "#596A65",
  labelTextColor: "#172C2A", loopTextColor: "#172C2A", activationBkgColor: "#E3F0E9", activationBorderColor: "#596A65",
  noteBkgColor: "#FFF2D9", noteTextColor: "#80520C", noteBorderColor: "#80520C", sequenceNumberColor: "#FFFFFF",
  classText: "#172C2A", attributeBackgroundColorOdd: "#FFFFFF", attributeBackgroundColorEven: "#F7F6F0",
  compositeBackground: "#F7F6F0", compositeTitleBackground: "#E3F0E9", altBackground: "#FFFFFF",
  errorBkgColor: "#FCECEC", errorTextColor: "#A43E40", personBkg: "#E3F0E9", personBorder: "#596A65",
  sectionBkgColor: "#E3F0E9", sectionBkgColor2: "#F7F6F0", altSectionBkgColor: "#FFFFFF", excludeBkgColor: "#F7F6F0",
  taskBkgColor: "#E3F0E9", taskBorderColor: "#596A65", taskTextColor: "#172C2A", taskTextOutsideColor: "#172C2A",
  taskTextLightColor: "#172C2A", taskTextDarkColor: "#172C2A", activeTaskBkgColor: "#E3F0E9", activeTaskBorderColor: "#13766D",
  doneTaskBkgColor: "#EAF3E9", doneTaskBorderColor: "#23683F", critBkgColor: "#FCECEC", critBorderColor: "#A43E40",
  todayLineColor: "#A43E40", vertLineColor: "#596A65", gridColor: "#DCE2DC",
  pie1: "#E3F0E9", pie2: "#FFF2D9", pie3: "#FCECEC", pie4: "#EAF3E9", pie5: "#F7F6F0",
  pieTitleTextColor: "#172C2A", pieSectionTextColor: "#172C2A", pieLegendTextColor: "#172C2A", pieStrokeColor: "#596A65",
  cScale0: "#E3F0E9", cScale1: "#FFF2D9", cScale2: "#FCECEC", cScale3: "#EAF3E9", cScale4: "#F7F6F0",
  cScaleLabel0: "#172C2A", cScaleLabel1: "#172C2A", cScaleLabel2: "#172C2A", cScaleLabel3: "#172C2A", cScaleLabel4: "#172C2A",
  ...Object.fromEntries(Array.from({ length: 12 }, (_, index) => [
    [`pie${index + 1}`, ["#E3F0E9", "#FFF2D9", "#FCECEC", "#EAF3E9", "#F7F6F0", "#FFFFFF"][index % 6]],
    [`cScale${index}`, ["#E3F0E9", "#FFF2D9", "#FCECEC", "#EAF3E9", "#F7F6F0", "#FFFFFF"][index % 6]],
    [`cScaleLabel${index}`, "#172C2A"],
  ]).flat()),
});

/** Only configuration blocks count; a node label containing "theme:" is ordinary content. */
export function hasAuthoredTheme(chart: string): boolean {
  const frontmatter = chart.match(/^\s*---\s*\n[\s\S]*?\n---(?:\s*\n|$)/)?.[0] ?? "";
  const directives = chart.match(/%%\{[\s\S]*?\}%%/g) ?? [];
  return /(?:^|[\s,{])["']?theme["']?\s*:/.test([frontmatter, ...directives].join("\n"));
}

export function diagramConfig(chart: string) {
  return {
    startOnLoad: false, fontFamily: "inherit", gantt: { useWidth: 800 },
    ...(hasAuthoredTheme(chart) ? { theme: "default" } : { theme: "base", themeVariables: { ...tidalDiagramTheme } }),
  };
}

/** Isolate all SVG identities, including nodes, accessibility labels and marker definitions. */
export function namespaceSvgIds(svg: string, prefix: string): string {
  const ids = new Map<string, string>();
  for (const match of svg.matchAll(/(?:^|\s)id=(["'])([^"']+)\1/g)) ids.set(match[2], `${prefix}-${match[2]}`);
  const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let result = svg.replace(/(^|\s)id=(["'])([^"']+)\2/g, (_match, space, quote, id) => `${space}id=${quote}${ids.get(id) ?? id}${quote}`);
  result = result.replace(/\b(aria-labelledby|aria-describedby|aria-controls)=(["'])([^"']+)\2/g,
    (_match, attr, quote, value: string) => `${attr}=${quote}${value.split(/\s+/).map((id) => ids.get(id) ?? id).join(" ")}${quote}`);
  for (const [original, replacement] of ids) {
    const escaped = escape(original);
    result = result.replace(new RegExp(`url\\(\\s*(["']?)#${escaped}\\1\\s*\\)`, "g"), `url(#${replacement})`);
    result = result.replace(new RegExp(`((?:xlink:)?href=["'])#${escaped}(["'])`, "g"), `$1#${replacement}$2`);
  }
  // Rewrite only stylesheet selectors, never declaration values such as authored #fff colors.
  return result.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/g, (tag, css: string) => {
    const updated = css.replace(/(^|[{}])([^{}]+)\{/g, (_match, boundary, selector: string) => {
      let scoped = selector;
      for (const [original, replacement] of ids) scoped = scoped.replace(new RegExp(`#${escape(original)}(?=[^\\w-]|$)`, "g"), `#${replacement}`);
      return `${boundary}${scoped}{`;
    });
    return tag.replace(css, updated);
  });
}

/** Mermaid configuration is a singleton; initialization and rendering form one serial transaction. */
export function createRenderQueue() {
  let previous: Promise<unknown> = Promise.resolve();
  return <T,>(work: () => Promise<T>): Promise<T> => {
    const next = previous.then(work, work);
    previous = next.catch(() => undefined);
    return next;
  };
}

export const queueDiagramRender = createRenderQueue();
