import { NextRequest, NextResponse } from "next/server";

import routes from "./lib/agent-routes.generated.json";
import { apiMethodNotAllowed, apiOptions } from "./lib/api-problem";
import { CONTENT_VARY, markdownNotFound, negotiateContent } from "./lib/content-negotiation";

const pages = new Set(routes.pages);
const markdownPages = new Set(routes.markdown);
const markdownFiles = new Set(routes.markdown.map((path) => `/agent-markdown/${path === "/" ? "index" : path.slice(1)}.md`));
const publicFiles = new Set(routes.publicFiles);

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/api/search" && request.method === "OPTIONS") return apiOptions();
  if (path === "/api/search" && !["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    return apiMethodNotAllowed(request);
  }
  if (path.startsWith("/agent-markdown/")) {
    return markdownFiles.has(path) ? NextResponse.next() : markdownNotFound(request.method);
  }
  if (path === "/api" || path.startsWith("/api/") || publicFiles.has(path)) {
    return NextResponse.next();
  }
  if (!["GET", "HEAD"].includes(request.method)) return NextResponse.next();

  const accept = request.headers.get("accept");
  const representation = negotiateContent(accept);
  const flight = request.headers.get("rsc") === "1" || request.nextUrl.searchParams.has("_rsc");
  const explicitHtml = /(?:^|,)\s*text\/html(?=\s*(?:;|,|$))/i.test(accept ?? "");
  if (!pages.has(path) && !flight && (representation !== "html" || !explicitHtml)) {
    return markdownNotFound(request.method);
  }
  if (!markdownPages.has(path) || flight) {
    const response = NextResponse.next();
    response.headers.set("Vary", CONTENT_VARY);
    return response;
  }
  if (representation === null) {
    return new Response(request.method === "HEAD" ? null : "This page is available as text/html or text/markdown. Send an Accept header containing one of those media types.\n", {
      status: 406,
      headers: { "Content-Type": "text/plain; charset=utf-8", Vary: CONTENT_VARY, "Cache-Control": "no-store" },
    });
  }
  const response = representation === "markdown"
    ? NextResponse.rewrite(new URL(`/agent-markdown/${path === "/" ? "index" : path.slice(1)}.md`, request.url))
    : NextResponse.next();
  response.headers.set("Vary", CONTENT_VARY);
  if (representation === "markdown") {
    response.headers.set("Content-Type", "text/markdown; charset=utf-8");
    response.headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  }
  return response;
}

export const config = { matcher: ["/((?!_next/).*)"] };
