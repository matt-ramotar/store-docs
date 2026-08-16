"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  Accordion as MintlifyAccordion,
  Badge,
  Card as MintlifyCard,
  CodeBlock as MintlifyCodeBlock,
  CodeGroup as MintlifyCodeGroup,
  Color,
  Columns,
  Expandable,
  Frame as MintlifyFrame,
  Icon,
  Mermaid,
  Panel,
  Property,
  Steps as MintlifySteps,
  Tabs as MintlifyTabs,
  Tile,
  Tooltip,
  Tree,
  Update as MintlifyUpdate,
  type AccordionProps,
  type CardComponentProps,
  type CodeBlockProps,
  type CodeGroupProps,
  type ColumnsProps,
  type FrameProps,
  type StepsItemProps,
  type TabsItemProps,
  type UpdateProps,
} from "@mintlify/components";

export {
  Badge,
  Color,
  Columns,
  Expandable,
  Icon,
  Mermaid,
  Panel,
  Property,
  Tile,
  Tooltip,
  Tree,
};

export const Steps = MintlifySteps;
export const Tabs = MintlifyTabs;

const storeHighlighting = { theme: "css-variables" as const };

export function CodeBlock({
  codeBlockTheme = "dark",
  codeBlockThemeObject = storeHighlighting,
  hideAskAiButton = true,
  ...props
}: CodeBlockProps) {
  return (
    <MintlifyCodeBlock
      {...props}
      codeBlockTheme={codeBlockTheme}
      codeBlockThemeObject={codeBlockThemeObject}
      hideAskAiButton={hideAskAiButton}
    />
  );
}

export function CodeGroup({
  codeBlockTheme = "dark",
  codeBlockThemeObject = storeHighlighting,
  ...props
}: CodeGroupProps) {
  return (
    <MintlifyCodeGroup
      {...props}
      codeBlockTheme={codeBlockTheme}
      codeBlockThemeObject={codeBlockThemeObject}
    />
  );
}

export function Accordion({
  defaultOpen = false,
  ...props
}: Omit<AccordionProps, "defaultOpen"> & { defaultOpen?: boolean | string }) {
  return (
    <MintlifyAccordion
      {...props}
      defaultOpen={defaultOpen === true || defaultOpen === "true"}
    />
  );
}

export function AccordionGroup({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return <MintlifyAccordion.Group className={className}>{children}</MintlifyAccordion.Group>;
}

export function Card({ href, ...props }: CardComponentProps) {
  const internal = typeof href === "string" && href.startsWith("/");
  return <MintlifyCard {...props} as={internal ? Link : undefined} href={href} />;
}

export function CardGroup({
  children,
  className,
  cols = 2,
}: {
  children?: ReactNode;
  className?: string;
  cols?: ColumnsProps["cols"];
}) {
  return (
    <Columns className={className} cols={cols}>
      {children}
    </Columns>
  );
}

export function Frame({
  as = "div",
  children,
  className = "",
  description,
  renderDescription,
  style = {},
  title,
}: Partial<FrameProps> & { children?: ReactNode }) {
  return (
    <MintlifyFrame
      as={as ?? "div"}
      className={className}
      description={description}
      renderDescription={renderDescription}
      style={style}
      title={title}
    >
      {children}
    </MintlifyFrame>
  );
}

export function Step(props: StepsItemProps) {
  return <MintlifySteps.Item {...props} />;
}

export function Tab(props: TabsItemProps) {
  return <MintlifyTabs.Item {...props} />;
}

export function Update({ isVisible = true, ...props }: Omit<UpdateProps, "isVisible"> & { isVisible?: boolean }) {
  return <MintlifyUpdate {...props} isVisible={isVisible} />;
}
