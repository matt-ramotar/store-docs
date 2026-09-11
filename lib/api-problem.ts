type Problem = {
  status: 404 | 405 | 500;
  title: string;
  detail: string;
  instance: string;
  code: string;
  resolution: string;
};

function problemResponse(problem: Problem, options: { head?: boolean; allow?: string } = {}) {
  const headers = new Headers({
    "Content-Type": "application/problem+json",
    "Cache-Control": "no-store",
  });
  if (options.allow) headers.set("Allow", options.allow);

  return new Response(options.head ? null : JSON.stringify({ type: "about:blank", ...problem }), {
    status: problem.status,
    headers,
  });
}

export function apiNotFound(request: Request) {
  return problemResponse({
    status: 404,
    title: "Not Found",
    detail: "This API endpoint does not exist.",
    instance: new URL(request.url).pathname,
    code: "API_NOT_FOUND",
    resolution: "Read /openapi.json for the available API, or use /llms.txt and /docs to find documentation.",
  }, { head: request.method === "HEAD" });
}

export function apiMethodNotAllowed(request: Request) {
  return problemResponse({
    status: 405,
    title: "Method Not Allowed",
    detail: "This API endpoint only supports GET, HEAD, and OPTIONS.",
    instance: new URL(request.url).pathname,
    code: "METHOD_NOT_ALLOWED",
    resolution: "Use GET /api/search to download the search index. Read /openapi.json for its response format.",
  }, { allow: "GET, HEAD, OPTIONS" });
}

export function apiOptions() {
  return new Response(null, {
    status: 204,
    headers: { Allow: "GET, HEAD, OPTIONS" },
  });
}

export function withSearchApiErrors(get: () => Response | Promise<Response>) {
  return async function GET() {
    try {
      return await get();
    } catch (error) {
      // A failed static export must fail the build, not silently remove the search artifact.
      if (process.env.NEXT_PHASE === "phase-production-build") throw error;

      return problemResponse({
        status: 500,
        title: "Internal Server Error",
        detail: "The documentation search index could not be generated.",
        instance: "/api/search",
        code: "SEARCH_INDEX_UNAVAILABLE",
        resolution: "Retry later, or use /llms.txt and /docs to find documentation.",
      });
    }
  };
}
