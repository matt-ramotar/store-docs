import type { InlineToken } from "./inline";

export const readOrigins = [
  {
    label: "Origin.MEMORY",
    boundary: "Resident replay",
    meaning: "The collector receives a value already resident in this engine.",
    chipClass: "bg-store-origin-memory-soft text-foreground",
    dotClass: "bg-store-origin-memory",
  },
  {
    label: "Origin.SOT",
    boundary: "Source of truth",
    meaning: "A source-of-truth read or write supplied the confirmed value.",
    chipClass: "bg-store-origin-sot-soft text-foreground",
    dotClass: "bg-store-origin-sot",
  },
  {
    label: "Origin.FETCHER",
    boundary: "Fetcher",
    meaning: "The configured fetcher produced or revalidated the authoritative value.",
    chipClass: "bg-store-origin-fetcher-soft text-foreground",
    dotClass: "bg-store-origin-fetcher",
  },
  {
    label: "Origin.OVERLAY",
    boundary: "Stream projection",
    meaning: "An overlay projected over confirmed residence or confirmed absence for streams.",
    chipClass: "bg-store-origin-overlay-soft text-foreground",
    dotClass: "bg-store-origin-overlay",
  },
] as const;

export const readNotice = {
  type: "Info",
  title: "Important default",
  body: [
    "With Store 6's default freshness validator, wall-clock age alone never makes",
    { code: " Freshness.CachedOrFetch" },
    " fetch. It fetches when no resident value exists, freshness metadata is missing, the resident is invalidated, or durable status marks it stale. Use ",
    { code: "Freshness.MaxAge" },
    " when elapsed age should participate. A custom",
    { code: " FreshnessValidator" },
    " may plan differently, and",
    { code: " Freshness.MustBeFresh" },
    " follows different serving and failure rules.",
  ] satisfies readonly InlineToken[],
} as const;

export const readParagraphs = [
  [
    "With Store 6's default freshness validator and",
    { code: " Freshness.CachedOrFetch" },
    ", the first cold stream after restart serves a durably invalidated persisted row as",
    { code: " Data(origin=Origin.SOT, isStale=true, refreshing=true)" },
    ". If its refresh fails, the stream emits ",
    { code: "Error(StoreError.Fetch, servedStale=true)" },
    " without an intervening ",
    { code: "Loading" },
    ", and the stream stays live.",
  ],
  [
    { code: "Bookkeeper.recordFailure" },
    " completes before that fetch error is emitted. Hydrated resident metadata does not reuse the persisted ETag, so a fetch planned from that state sees ",
    { code: "etag=null" },
    ". After the first hydrated emission, a later resident emission may use ",
    { code: "Origin.MEMORY" },
    ".",
  ],
  [
    "Read the ",
    { href: "/docs/store6/concepts/read-contract", label: "read contract" },
    " for the complete stream and point-read semantics. Use the ",
    { href: "/docs/store6/concepts/freshness", label: "freshness policies" },
    " to choose when a fetch participates.",
  ],
] as const satisfies readonly (readonly InlineToken[])[];
