import { Chip, Link } from "@heroui/react";

const startHereItems = [
  {
    id: "quickstart",
    title: "Quickstart",
    description: "Build a fetcher-backed Store and make the first read.",
    experimental: false,
    links: [{ href: "/docs/store6/quickstart", label: "Quickstart" }],
  },
  {
    id: "important-defaults",
    title: "Important Defaults",
    description: "See what zero configuration already decides about freshness and failures.",
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

export function StartHereList() {
  return (
    <nav aria-label="Start here" className="my-6">
      <ul className="divide-y divide-separator border-y border-separator">
        {startHereItems.map((item) => (
          <li className="space-y-2 px-1 py-4" key={item.id}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-foreground">{item.title}</span>
              {item.experimental ? (
                <Chip color="warning" size="sm" variant="soft">
                  <Chip.Label>Experimental</Chip.Label>
                </Chip>
              ) : null}
            </div>
            <p className="text-sm leading-6 text-foreground-secondary">{item.description}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {item.links.map((link) => (
                <Link
                  className="inline-flex items-center gap-1 text-sm font-medium no-underline hover:no-underline"
                  href={link.href}
                  key={link.href}
                >
                  {link.label}
                  <Link.Icon className="size-3.5 shrink-0" />
                </Link>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </nav>
  );
}
