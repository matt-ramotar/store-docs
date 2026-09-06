"use client";

import Link from "next/link";
import {
  Card as MintlifyCard,
  Color as MintlifyColor,
  Columns as MintlifyColumns,
  Frame as MintlifyFrame,
  Icon as MintlifyIcon,
  Panel as MintlifyPanel,
  Tile as MintlifyTile,
  Update as MintlifyUpdate,
  View as MintlifyView,
  type CardComponentProps,
  type CardIconProps,
  type CardProps,
  type CardPropsBase,
  type ColorItemProps,
  type ColorProps,
  type ColorRowProps,
  type ColumnsProps,
  type FrameProps,
  type IconProps,
  type PanelProps,
  type TileProps,
  type UpdateProps,
  type ViewProps,
} from "@mintlify/components";
import {
  forwardRef,
  useEffect,
  useId,
  type AnchorHTMLAttributes,
  type ReactNode,
} from "react";

import { observeNativeColorTooltips } from "../tooltip-accessibility";

export type {
  CardComponentProps,
  CardIconProps,
  CardProps,
  CardPropsBase,
  ColorItemProps,
  ColorProps,
  ColorRowProps,
  ColumnsProps,
  FrameProps,
  IconProps,
  PanelProps,
  TileProps,
  UpdateProps,
  ViewProps,
};

const familyClass = (component: string, className?: string) =>
  ["store-mintlify-layout", `store-mintlify-${component}`, className]
    .filter(Boolean)
    .join(" ");

const ProtocolRelativeAnchor = forwardRef<
  HTMLAnchorElement,
  AnchorHTMLAttributes<HTMLAnchorElement>
>(function ProtocolRelativeAnchor({ rel = "noreferrer", target = "_blank", ...props }, ref) {
  return <a {...props} ref={ref} rel={rel} target={target} />;
});

export function Card({ as, className, href, ...props }: CardComponentProps) {
  const isLocalRoute = typeof href === "string" && href.startsWith("/") && !href.startsWith("//");
  const isProtocolRelative = typeof href === "string" && href.startsWith("//");
  const component = as ?? (isLocalRoute ? Link : isProtocolRelative ? ProtocolRelativeAnchor : undefined);

  return (
    <MintlifyCard
      {...props}
      as={component}
      className={familyClass("card", className)}
      href={href}
    />
  );
}

export function Columns({ className, ...props }: ColumnsProps) {
  return <MintlifyColumns {...props} className={familyClass("columns", className)} />;
}

export interface CardGroupProps {
  children?: ReactNode;
  className?: string;
  cols?: ColumnsProps["cols"];
}

export function CardGroup({ children, className, cols = 2 }: CardGroupProps) {
  return (
    <Columns className={familyClass("card-group", className)} cols={cols}>
      {children}
    </Columns>
  );
}

export type FrameAdapterProps = Partial<FrameProps> & { children?: ReactNode };

export function Frame({
  as = "div",
  children,
  className,
  description,
  renderDescription,
  style = {},
  title,
}: FrameAdapterProps) {
  return (
    <MintlifyFrame
      as={as ?? "div"}
      className={familyClass("frame", className)}
      description={description}
      renderDescription={renderDescription}
      style={style}
      title={title}
    >
      {children}
    </MintlifyFrame>
  );
}

export function Panel({ className, ...props }: PanelProps) {
  return <MintlifyPanel {...props} className={familyClass("panel", className)} />;
}

export function Tile({ className, ...props }: TileProps) {
  return <MintlifyTile {...props} className={familyClass("tile", className)} />;
}

export type UpdateAdapterProps = Omit<UpdateProps, "isVisible"> & { isVisible?: boolean };

export const Update = forwardRef<HTMLDivElement, UpdateAdapterProps>(function Update(
  { className, isVisible = true, ...props },
  ref,
) {
  return (
    <MintlifyUpdate
      {...props}
      className={familyClass("update", className)}
      isVisible={isVisible}
      ref={ref}
    />
  );
});

export const View = forwardRef<HTMLDivElement, ViewProps>(function View(
  { className, ...props },
  ref,
) {
  return <MintlifyView {...props} className={familyClass("view", className)} ref={ref} />;
});

export function ColorRow(props: ColorRowProps) {
  return <MintlifyColor.Row {...props} />;
}

export function ColorItem(props: ColorItemProps) {
  return <MintlifyColor.Item {...props} />;
}

const ColorRoot = ({ className, ...props }: ColorProps) => {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const scopeClass = `store-mintlify-color-tooltips-${id}`;
  useEffect(
    () => observeNativeColorTooltips(scopeClass, `${scopeClass}-description`),
    [scopeClass],
  );
  return (
    <MintlifyColor
      {...props}
      className={familyClass("color", [className, scopeClass].filter(Boolean).join(" "))}
    />
  );
};

export const Color = Object.assign(ColorRoot, { Row: ColorRow, Item: ColorItem });

export function Icon({ className, ...props }: IconProps) {
  return <MintlifyIcon {...props} className={familyClass("icon", className)} />;
}
