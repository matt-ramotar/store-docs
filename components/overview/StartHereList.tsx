import { Link } from "@heroui/react";

const startHereItems = [
  {
    id: "quickstart",
    title: "Quickstart",
    description: "Build a fetcher-backed Store and make the first read.",
    href: "/docs/store6/quickstart",
  },
  {
    id: "important-defaults",
    title: "Important Defaults",
    description: "Learn the zero-configuration freshness and failure behavior.",
    href: "/docs/store6/important-defaults",
  },
  {
    id: "compose",
    title: "Compose",
    description: "Collect Store results as Compose Multiplatform state.",
    href: "/docs/store6/compose",
  },
  {
    id: "sqldelight",
    title: "SQLDelight",
    description: "Persist values and freshness metadata with SQLDelight.",
    href: "/docs/store6/sqldelight",
  },
] as const;

export function StartHereList() {
  return (
    <nav aria-label="Start here" className="my-6">
      <ul className="divide-y divide-separator border-y border-separator">
        {startHereItems.map((item) => (
          <li key={item.id}>
            <Link
              className="flex w-full items-start justify-between gap-4 px-1 py-4 no-underline hover:no-underline"
              href={item.href}
            >
              <span className="flex min-w-0 flex-col gap-1">
                <span className="font-semibold text-foreground">{item.title}</span>
                <span className="text-sm leading-6 text-foreground-secondary">
                  {item.description}
                </span>
              </span>
              <Link.Icon className="mt-1 size-4 shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
