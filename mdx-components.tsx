import type { MDXComponents } from "mdx/types";

import { Button } from "@heroui/react/button";
import { Link } from "@heroui/react/link";
import { Segment } from "@heroui-pro/react/segment";
import { MdxH2, MdxH3, MdxH4, MdxH5, MdxH6 } from "@/components/docs/MdxHeroPrimitives";

import { ReadResolutionTable } from "@/components/overview/ReadResolutionTable";
import { StartHereList } from "@/components/overview/StartHereList";
import { SupportMatrix } from "@/components/overview/SupportMatrix";
import {
  Callout,
  Check,
  Danger,
  Info,
  Note,
  Tip,
  Warning,
} from "@/components/docs/Callout";
import {
  ParamField,
  ParamList,
  StepItem,
  StepsGroup,
  TabGroup,
  TabPanel,
  UnavailableDestination,
} from "@/components/docs/MigratedWidgets";
import {
  Accordion,
  AccordionGroup,
  Badge,
  Card,
  CardGroup,
  CodeBlock,
  CodeGroup,
  Color,
  Columns,
  Expandable,
  Frame,
  Icon,
  Mermaid,
  Panel,
  Property,
  Step,
  Steps,
  Tab,
  Tabs,
  Tile,
  Tooltip,
  Tree,
  Update,
} from "@/components/docs/mintlify-runtime";
import { EmWithVerifiedCommit } from "@/components/docs/LastVerified";
import { CodeSlab } from "@/components/shell/CodeSlab";

function mergeClassName(base: string, className?: string) {
  return className ? `${base} ${className}` : base;
}

/** Shared component map for every MDX rendering surface. */
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    Accordion,
    AccordionGroup,
    Badge,
    Button,
    Callout,
    Card,
    CardGroup,
    Check,
    CodeBlock,
    CodeGroup,
    CodeSlab,
    Color,
    Columns,
    Danger,
    Expandable,
    Frame,
    Icon,
    Info,
    Mermaid,
    Note,
    Panel,
    Property,
    Step,
    Steps,
    Tab,
    Tabs,
    Tile,
    Tip,
    Tooltip,
    Tree,
    Update,
    Warning,
    a: ({ className, ...props }) => (
      <a
        {...props}
        className={mergeClassName(
          "font-medium text-accent-strong underline decoration-separator decoration-1 underline-offset-4 transition-colors hover:decoration-accent-strong focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          className,
        )}
      />
    ),
    blockquote: ({ className, ...props }) => (
      <blockquote
        {...props}
        className={mergeClassName(
          "my-6 rounded-e-2xl border-s-4 border-accent bg-surface-secondary px-5 py-4 text-foreground-secondary [&>p:first-child]:mt-0 [&>p:last-child]:mb-0",
          className,
        )}
      />
    ),
    code: ({ className, ...props }) => (
      <code
        {...props}
        className={mergeClassName(
          "rounded-md bg-surface-secondary px-1.5 py-0.5 font-mono text-sm text-foreground",
          className,
        )}
      />
    ),
    em: EmWithVerifiedCommit,
    h2: MdxH2,
    h3: MdxH3,
    h4: MdxH4,
    h5: MdxH5,
    h6: MdxH6,
    hr: ({ className, ...props }) => (
      <hr {...props} className={mergeClassName("my-10 h-px border-0 bg-separator", className)} />
    ),
    img: ({ className, ...props }) => (
      <img
        {...props}
        className={mergeClassName(
          "my-6 block h-auto max-w-full rounded-2xl border border-border bg-surface",
          className,
        )}
      />
    ),
    li: ({ className, ...props }) => (
      <li {...props} className={mergeClassName("leading-7 text-foreground", className)} />
    ),
    Link,
    ol: ({ className, ...props }) => (
      <ol
        {...props}
        className={mergeClassName("my-4 list-decimal space-y-2 ps-6 marker:text-muted", className)}
      />
    ),
    p: ({ className, ...props }) => (
      <p {...props} className={mergeClassName("my-4 leading-7 text-foreground", className)} />
    ),
    ParamField,
    ParamList,
    pre: ({ className, ...props }) => (
      <pre
        {...props}
        className={mergeClassName(
          "not-prose my-6 overflow-x-auto rounded-2xl border border-border bg-store-code-surface p-4 font-mono text-sm leading-6 text-store-code-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&>code]:rounded-none [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-inherit",
          className,
        )}
      />
    ),
    ReadResolutionTable,
    Segment,
    StartHereList,
    StepItem,
    StepsGroup,
    SupportMatrix,
    TabGroup,
    TabPanel,
    table: ({ className, ...props }) => (
      <div
        role="region"
        aria-label="Scrollable table"
        tabIndex={0}
        className="my-6 max-w-full overflow-x-auto rounded-2xl border border-border bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <table
          {...props}
          className={mergeClassName("w-full min-w-[40rem] border-collapse text-left text-sm", className)}
        />
      </div>
    ),
    tbody: ({ className, ...props }) => (
      <tbody {...props} className={mergeClassName("divide-y divide-separator", className)} />
    ),
    td: ({ className, ...props }) => (
      <td
        {...props}
        className={mergeClassName("px-4 py-3 align-top leading-6 text-foreground-secondary", className)}
      />
    ),
    th: ({ className, ...props }) => (
      <th
        {...props}
        className={mergeClassName(
          "border-b border-border px-4 py-3 text-left align-top font-semibold text-foreground",
          className,
        )}
      />
    ),
    thead: ({ className, ...props }) => (
      <thead {...props} className={mergeClassName("bg-surface-secondary text-foreground", className)} />
    ),
    tr: ({ className, ...props }) => (
      <tr {...props} className={mergeClassName("align-top", className)} />
    ),
    ul: ({ className, ...props }) => (
      <ul
        {...props}
        className={mergeClassName("my-4 list-disc space-y-2 ps-6 marker:text-muted", className)}
      />
    ),
    UnavailableDestination,
    ...components,
  };
}
