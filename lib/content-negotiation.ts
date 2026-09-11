type Representation = "html" | "markdown";

// An explicit exclusion overrides a wildcard, even when the wildcard has a higher q.
function quality(accept: string, mediaType: string) {
  let match = { specificity: -1, quality: 0, order: Number.POSITIVE_INFINITY };
  for (const [order, range] of accept.split(",").entries()) {
    const [type, ...parameters] = range.trim().toLowerCase().split(";").map((part) => part.trim());
    let q = 1;
    let supportedParameters = true;
    const mediaParameters = new Set<string>();
    for (const parameter of parameters) {
      const [name, value] = parameter.split("=").map((part) => part.trim());
      if (name === "q") {
        q = /^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/.test(value ?? "") ? Number(value) : 0;
        break;
      }
      if (name !== "charset" || value?.replaceAll('"', "") !== "utf-8") supportedParameters = false;
      mediaParameters.add(name);
    }
    if (!supportedParameters) continue;
    const typeSpecificity = type === mediaType ? 2 : type === "text/*" ? 1 : type === "*/*" ? 0 : -1;
    if (typeSpecificity < 0) continue;
    const specificity = typeSpecificity * 2 + mediaParameters.size;
    if (specificity > match.specificity || (specificity === match.specificity && q > match.quality)) {
      match = { specificity, quality: q, order };
    }
  }
  return match;
}

export function negotiateContent(accept: string | null): Representation | null {
  if (!accept?.trim()) return "html";
  const html = quality(accept, "text/html");
  const markdown = quality(accept, "text/markdown");
  if (html.quality === 0 && markdown.quality === 0) return null;
  if (markdown.quality > html.quality) return "markdown";
  if (markdown.quality === html.quality && markdown.specificity > html.specificity) return "markdown";
  if (markdown.quality === html.quality && markdown.specificity === html.specificity && markdown.order < html.order) return "markdown";
  return "html";
}

export const CONTENT_VARY = "Accept, Accept-Encoding, RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch";
export const RECOVERY_MARKDOWN = "# Page not found\n\nThis URL does not identify a page on the Store documentation site.\n\n- [Documentation index](/docs)\n- [Store 6 documentation](/docs/store6)\n- [Agent index](/llms.txt)\n- [Sitemap](/sitemap.xml)\n- [HTTP API specification](/openapi.json)\n";

export function markdownNotFound(method = "GET") {
  return new Response(method === "HEAD" ? null : RECOVERY_MARKDOWN, {
    status: 404,
    headers: { "Content-Type": "text/markdown; charset=utf-8", Vary: CONTENT_VARY, "Cache-Control": "no-store" },
  });
}
