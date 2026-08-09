"use client";

import { Segment } from "@heroui-pro/react";
import { useRouter } from "next/navigation";

import { docsVersions, type DocsVersion } from "@/lib/nav";

export function VersionSwitcher({ version }: { version: DocsVersion }) {
  const router = useRouter();

  return (
    <Segment
      aria-label="Documentation version"
      selectedKey={version}
      size="sm"
      onSelectionChange={(key) => {
        const destination = docsVersions.find((item) => item.id === key);
        if (destination && destination.id !== version) router.push(destination.href);
      }}
    >
      {docsVersions.map((item) => (
        <Segment.Item key={item.id} id={item.id}>
          {item.label}
        </Segment.Item>
      ))}
    </Segment>
  );
}
