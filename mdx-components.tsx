import type { MDXComponents } from "mdx/types";

import { Button, Link, Typography } from "@heroui/react";
import { Segment } from "@heroui-pro/react";

import { ReadResolutionTable } from "@/components/overview/ReadResolutionTable";
import { StartHereList } from "@/components/overview/StartHereList";
import { SupportMatrix } from "@/components/overview/SupportMatrix";
import { CodeSlab } from "@/components/shell/CodeSlab";

/** Shared component map for every MDX rendering surface. */
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    Button,
    CodeSlab,
    h2: ({ className, ...props }) => (
      <Typography.Heading
        {...props}
        className={`mt-12 mb-4 scroll-mt-24 text-foreground ${className ?? ""}`.trim()}
        level={2}
      />
    ),
    Link,
    ReadResolutionTable,
    Segment,
    StartHereList,
    SupportMatrix,
    ...components,
  };
}
