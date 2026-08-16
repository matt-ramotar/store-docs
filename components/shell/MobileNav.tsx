"use client";

import type * as PageTree from "fumadocs-core/page-tree";
import { Button } from "@heroui/react";
import { Sheet } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { SideTree } from "@/components/shell/SideTree";
import { getActiveTabHref, topNavTabs } from "@/lib/nav";

export function MobileNav({
  currentPath,
  tree,
}: {
  currentPath: string;
  tree: PageTree.Root;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const activeTabHref = getActiveTabHref(currentPath);

  return (
    <Sheet isOpen={isOpen} placement="left" onOpenChange={setIsOpen}>
      <Sheet.Trigger>
        <Button
          aria-label="Open documentation navigation"
          className="lg:hidden"
          isIconOnly
          size="sm"
          variant="ghost"
        >
          <Icon className="size-5" icon="gravity-ui:bars" />
        </Button>
      </Sheet.Trigger>
      <Sheet.Backdrop>
        <Sheet.Content className="w-[85vw] max-w-96 rounded-none">
          <Sheet.Dialog className="flex h-full flex-col gap-5 overflow-y-auto p-4">
            <Sheet.Heading className="sr-only">Documentation navigation</Sheet.Heading>
            <ul className="border-separator flex flex-col gap-0.5 border-b pb-4">
              {topNavTabs.map((tab) => {
                const isActive = tab.href === activeTabHref;
                return (
                  <li key={tab.href}>
                    <Link
                      aria-current={isActive ? "page" : undefined}
                      className={`flex items-center rounded-xl px-2.5 py-1.5 text-sm transition-colors ${
                        isActive
                          ? "bg-accent-soft text-accent-soft-foreground font-semibold"
                          : "text-foreground-secondary hover:bg-default hover:text-foreground"
                      }`}
                      href={tab.href}
                    >
                      {tab.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <SideTree currentPath={currentPath} tree={tree} />
          </Sheet.Dialog>
        </Sheet.Content>
      </Sheet.Backdrop>
    </Sheet>
  );
}
