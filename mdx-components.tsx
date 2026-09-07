import type { MDXComponents } from "mdx/types";
import type { ComponentProps } from "react";

import { Button } from "@heroui/react/button";
import { Link } from "@heroui/react/link";
import { Table } from "@heroui/react/table";
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
  BaseCodeBlock,
  Card,
  CardGroup,
  CodeBlock,
  CodeGroup,
  CodeGroupSelect,
  CodeSnippet,
  Color,
  ColorRow,
  ColorItem,
  Columns,
  DeprecatedPill,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Expandable,
  FencedCodeBlock,
  Frame,
  Icon,
  InfoPill,
  Mermaid,
  Panel,
  ParamHead,
  Property,
  RequiredPill,
  Search,
  SearchButton,
  SearchProvider,
  Step,
  Steps,
  Tab,
  Tabs,
  Tile,
  Tooltip,
  Tree,
  TreeFile,
  TreeFolder,
  Update,
  View,
  ZoomControls,
} from "@/components/docs/mintlify-runtime";
import { EmWithVerifiedCommit } from "@/components/docs/LastVerified";
import { CodeSlab } from "@/components/shell/CodeSlab";
import { StoreDiagram } from "@/components/docs/diagrams/StoreDiagram";

const MdxAccordion = Object.assign((props: ComponentProps<typeof Accordion>) => <Accordion {...props} />, { Group: AccordionGroup });
const MdxSteps = Object.assign((props: ComponentProps<typeof Steps>) => <Steps {...props} />, { Item: Step });
const MdxTabs = Object.assign((props: ComponentProps<typeof Tabs>) => <Tabs {...props} />, { Item: Tab });
const MdxTree = Object.assign((props: ComponentProps<typeof Tree>) => <Tree {...props} />, { File: TreeFile, Folder: TreeFolder });
const MdxColor = Object.assign((props: ComponentProps<typeof Color>) => <Color {...props} />, { Row: ColorRow, Item: ColorItem });

function mergeClassName(base: string, className?: string) {
  return className ? `${base} ${className}` : base;
}

/** Shared component map for every MDX rendering surface. */
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    Accordion: MdxAccordion,
    AccordionGroup,
    Badge,
    BaseCodeBlock,
    Button,
    Callout,
    Card,
    CardGroup,
    Check,
    CodeBlock,
    CodeGroup,
    CodeGroupSelect,
    CodeSnippet,
    CodeSlab,
    Color: MdxColor,
    ColorRow,
    ColorItem,
    Columns,
    Danger,
    DeprecatedPill,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    Expandable,
    Frame,
    Icon,
    Info,
    InfoPill,
    Mermaid,
    Note,
    Panel,
    ParamHead,
    Property,
    RequiredPill,
    Search,
    SearchButton,
    SearchProvider,
    Step,
    Steps: MdxSteps,
    Tab,
    Tabs: MdxTabs,
    Tile,
    Tip,
    Tooltip,
    Tree: MdxTree,
    Update,
    View,
    Warning,
    ZoomControls,
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
          "store-inline-code",
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
    pre: FencedCodeBlock,
    ReadResolutionTable,
    Segment,
    StartHereList,
    StepItem,
    StepsGroup,
    SupportMatrix,
    StoreDiagram,
    TabGroup,
    TabPanel,
    // Native MDX cells retain rich content and HTML attributes inside HeroUI's table shell.
    table: ({ className, ...props }) => (
      <Table className="my-6 max-w-full" variant="secondary">
        <Table.ScrollContainer
          role="region"
          aria-label="Scrollable table"
          tabIndex={0}
        >
          <table
            {...props}
            className={mergeClassName("table__content min-w-[40rem] text-left", className)}
          />
        </Table.ScrollContainer>
      </Table>
    ),
    tbody: ({ className, ...props }) => (
      <tbody {...props} className={mergeClassName("table__body", className)} />
    ),
    td: ({ className, ...props }) => (
      <td
        {...props}
        className={mergeClassName("table__cell align-top leading-6", className)}
      />
    ),
    th: ({ className, ...props }) => (
      <th
        {...props}
        className={mergeClassName("table__column align-top", className)}
      />
    ),
    thead: ({ className, ...props }) => (
      <thead {...props} className={mergeClassName("table__header", className)} />
    ),
    tr: ({ className, ...props }) => (
      <tr {...props} className={mergeClassName("table__row align-top", className)} />
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
