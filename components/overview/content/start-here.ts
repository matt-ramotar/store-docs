export const startHereItems = [
  {
    id: "quickstart",
    title: "Build your first store",
    description: "Build a fetcher-backed Store and make the first read.",
    experimental: false,
    links: [{ href: "/docs/store6/quickstart", label: "Quickstart" }],
  },
  {
    id: "important-defaults",
    title: "Important Defaults",
    description: "See the freshness and failure behavior you get with zero configuration.",
    experimental: false,
    links: [{ href: "/docs/store6/important-defaults", label: "Important Defaults" }],
  },
  {
    id: "read-contract",
    title: "Read contract",
    description: "Choose stream or point reads and interpret origins and lifecycle state.",
    experimental: false,
    links: [{ href: "/docs/store6/concepts/read-contract", label: "Read contract" }],
  },
  {
    id: "data-seams",
    title: "Fetchers and persistence",
    description: "Add the two seams most applications need after the first store.",
    experimental: false,
    links: [
      { href: "/docs/store6/guides/fetchers", label: "Fetchers" },
      { href: "/docs/store6/guides/persistence", label: "Persistence" },
    ],
  },
  {
    id: "mutations",
    title: "Mutations",
    description: "Adopt the journalled write path and its acknowledgement contract.",
    experimental: true,
    links: [{ href: "/docs/store6/mutations", label: "Mutations" }],
  },
  {
    id: "migration",
    title: "Migrate from Store 5",
    description: "Move one Store 5 screen at a time while both major lines coexist.",
    experimental: false,
    links: [{ href: "/docs/store6/migration/from-store5", label: "Migration guide" }],
  },
] as const;
