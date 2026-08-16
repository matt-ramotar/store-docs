"use client";

import { Chip, Dropdown } from "@heroui/react";
import { Icon } from "@iconify/react";

import {
  getVersionSwitcherItem,
  versionSwitcherItems,
  type DocsVersion,
} from "@/lib/nav";

/** Compact version picker next to the logo, e.g. "6 v" with a Latest/Legacy menu. */
export function VersionMenu({ version }: { version: DocsVersion }) {
  const current = getVersionSwitcherItem(version);

  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label={`Documentation version: ${current.name}`}
        className="text-foreground hover:bg-default flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold transition-colors"
      >
        {current.name.replace("Store ", "")}
        <Icon className="text-muted size-3.5" icon="gravity-ui:chevron-down" />
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom start">
        <Dropdown.Menu
          aria-label="Documentation version"
          selectedKeys={new Set([version])}
          selectionMode="single"
        >
          {versionSwitcherItems.map((item) => (
            <Dropdown.Item
              key={item.id}
              href={item.href}
              id={item.id}
              textValue={`${item.name} ${item.badge}`}
            >
              <span className="truncate text-sm font-medium">{item.name}</span>
              <Chip
                className="pointer-events-none"
                color={item.badge === "Latest" ? "accent" : "default"}
                size="sm"
                variant="soft"
              >
                {item.badge}
              </Chip>
              <Icon
                className="ms-auto size-4 shrink-0 text-foreground opacity-0 in-data-selected:opacity-100"
                icon="gravity-ui:check"
              />
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
