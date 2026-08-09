import { Separator } from "@heroui/react";
import { AppLayout, Navbar } from "@heroui-pro/react";

import { VersionSwitcher } from "@/components/shell/VersionSwitcher";
import { primaryNavItems, type DocsVersion } from "@/lib/nav";

export type TopNavProps = {
  currentPath: string;
  version: DocsVersion;
};

export function TopNav({ currentPath, version }: TopNavProps) {
  return (
    <Navbar aria-label="Primary" maxWidth="full" position="static">
      <Navbar.Header className="gap-2 px-4 lg:px-6">
        <AppLayout.MenuToggle
          aria-label="Open documentation navigation"
          tooltip="Open documentation navigation"
        />
        <Navbar.Content className="hidden gap-0 lg:flex">
          {primaryNavItems.map((item) => (
            <Navbar.Item
              key={item.href}
              className="px-2"
              href={item.href}
              isCurrent={isCurrentPath(currentPath, item.href)}
            >
              {item.label}
            </Navbar.Item>
          ))}
        </Navbar.Content>
        <Navbar.Spacer />
        <Navbar.Content>
          <Separator className="hidden h-6 sm:block" orientation="vertical" />
          <VersionSwitcher version={version} />
        </Navbar.Content>
      </Navbar.Header>
    </Navbar>
  );
}

function isCurrentPath(currentPath: string, href: string): boolean {
  return currentPath === href || (href !== "/docs" && currentPath.startsWith(`${href}/`));
}
