import { ListView } from "@heroui-pro/react";

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
    <ListView aria-label="Start here" className="my-6" variant="secondary">
      {startHereItems.map((item) => (
        <ListView.Item key={item.id} href={item.href} id={item.id} textValue={item.title}>
          <ListView.ItemContent>
            <div className="flex min-w-0 flex-col">
              <ListView.Title>{item.title}</ListView.Title>
              <ListView.Description>{item.description}</ListView.Description>
            </div>
          </ListView.ItemContent>
        </ListView.Item>
      ))}
    </ListView>
  );
}
