import type { MDXComponents } from "mdx/types";

import { Button } from "@heroui/react";
import { Segment } from "@heroui-pro/react";

import { CodeSlab } from "@/components/shell/CodeSlab";

/** Shared component map for every MDX rendering surface. */
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    Button,
    CodeSlab,
    Segment,
    ...components,
  };
}
