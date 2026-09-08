"use client";

import { Dropdown } from "@heroui/react";
import { ArrowDown01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import {
  getVersionSwitcherItem,
  versionSwitcherItems,
  type DocsVersion,
} from "@/lib/nav";

/** Version names and destinations without inferred release or support status. */
export function VersionMenu({ version }: { version: DocsVersion }) {
  const current = getVersionSwitcherItem(version);

  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label={`Documentation version: ${current.name}`}
        className="text-foreground hover:bg-default flex min-h-11 items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold transition-colors"
      >
        {current.name.replace("Store ", "")}
        <HugeiconsIcon aria-hidden className="text-muted size-3.5" icon={ArrowDown01Icon} strokeWidth={1.5} />
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
              textValue={item.name}
            >
              <span className="truncate text-sm font-medium">{item.name}</span>
              <HugeiconsIcon
                aria-hidden
                className="ms-auto size-4 shrink-0 text-foreground opacity-0 in-data-selected:opacity-100"
                icon={Tick02Icon}
                strokeWidth={1.5}
              />
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
