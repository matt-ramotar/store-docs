"use client";

import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  Alert01Icon,
  AlertCircleIcon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowRight02Icon,
  ArrowUp01Icon,
  ArrowUpDownIcon,
  ArrowUpRight01Icon,
  CheckmarkCircle02Icon,
  CodeIcon,
  CommandLineIcon,
  Copy01Icon,
  DatabaseIcon,
  File01Icon,
  Folder01Icon,
  FolderOpenIcon,
  GithubIcon,
  HandPointingRight01Icon,
  HelpCircleIcon,
  Idea01Icon,
  InformationCircleIcon,
  JavaIcon,
  JavaScriptIcon,
  Link01Icon,
  Loading03Icon,
  MoreHorizontalIcon,
  PythonIcon,
  RotateCcwIcon,
  Search01Icon,
  SearchXIcon,
  SparklesIcon,
  Tick02Icon,
  Typescript01Icon,
  WaveSquareIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "@hugeicons/core-free-icons";
import type { IconProps } from "@mintlify/components";
import type { CSSProperties } from "react";

// Deliberately bounded: authored legacy names resolve locally without downloading
// a font library or importing the entire Hugeicons collection at runtime.
export const documentationIcons: Readonly<Record<string, IconSvgElement>> = {
  "angle-right": ArrowRight01Icon,
  "caret-right": ArrowRight01Icon,
  "chevron-right": ArrowRight01Icon,
  "chevron-left": ArrowLeft01Icon,
  "chevron-up": ArrowUp01Icon,
  "chevron-down": ArrowDown01Icon,
  "chevrons-up-down": ArrowUpDownIcon,
  "arrow-right": ArrowRight02Icon,
  "arrow-up-right": ArrowUpRight01Icon,
  check: Tick02Icon,
  "circle-check": CheckmarkCircle02Icon,
  "check-circle": CheckmarkCircle02Icon,
  "circle-info": InformationCircleIcon,
  info: InformationCircleIcon,
  information: InformationCircleIcon,
  "circle-exclamation": AlertCircleIcon,
  "triangle-exclamation": Alert01Icon,
  "alert-triangle": Alert01Icon,
  warning: Alert01Icon,
  danger: AlertCircleIcon,
  lightbulb: Idea01Icon,
  copy: Copy01Icon,
  database: DatabaseIcon,
  file: File01Icon,
  folder: Folder01Icon,
  "folder-open": FolderOpenIcon,
  github: GithubIcon,
  "hand-point-right": HandPointingRight01Icon,
  link: Link01Icon,
  "loader-circle": Loading03Icon,
  ellipsis: MoreHorizontalIcon,
  "rotate-ccw": RotateCcwIcon,
  search: Search01Icon,
  "search-x": SearchXIcon,
  sparkles: SparklesIcon,
  "wave-square": WaveSquareIcon,
  "zoom-in": ZoomInIcon,
  "zoom-out": ZoomOutIcon,
  code: CodeIcon,
  terminal: CommandLineIcon,
  bash: CommandLineIcon,
  curl: CommandLineIcon,
  shell: CommandLineIcon,
  sh: CommandLineIcon,
  powershell: CommandLineIcon,
  java: JavaIcon,
  javascript: JavaScriptIcon,
  js: JavaScriptIcon,
  node: JavaScriptIcon,
  nodejs: JavaScriptIcon,
  "node.js": JavaScriptIcon,
  python: PythonIcon,
  py: PythonIcon,
  typescript: Typescript01Icon,
  ts: Typescript01Icon,
  kotlin: CodeIcon,
  kt: CodeIcon,
  "circle-question": HelpCircleIcon,
};

const iconTypes = new Set([
  "brands", "duotone", "light", "regular", "sharp-duotone-solid", "sharp-light",
  "sharp-regular", "sharp-solid", "sharp-thin", "solid", "thin",
]);

function legacyCdnIconName(icon: string) {
  if (!/^https:\/\/(?:d3gk2c5xim1je2\.cloudfront\.net|mintlify\.b-cdn\.net)\//i.test(icon)) return;
  return icon.split("/").at(-1)?.split(/[?#]/)[0]?.replace(/\.svg$/i, "");
}

export function DocumentationIcon({
  icon, iconType, color, colorLight, colorDark, overrideColor, size = 16,
  overrideSize, className, basePath,
}: IconProps) {
  if (iconType && !iconTypes.has(iconType)) return null;
  const themed = Boolean(colorLight && colorDark);
  const style = {
    ...(!overrideSize && { width: size, height: size }),
    display: "inline-block",
    verticalAlign: "middle",
    backgroundColor: "transparent",
    ...(themed ? { "--color-light": colorLight, "--color-dark": colorDark } : color ? { color } : {}),
  } as CSSProperties;
  const name = (legacyCdnIconName(icon) ?? icon).toLowerCase();
  const glyph = Object.hasOwn(documentationIcons, name) ? documentationIcons[name] : undefined;
  const classes = [
    "mintlify-icon", "inline", "store-hugeicon",
    themed && "text-(--color-light) dark:text-(--color-dark)",
    !(color || themed || overrideColor) && "text-primary dark:text-primary-light",
    className,
  ].filter(Boolean).join(" ");

  // Author-supplied images remain assets; legacy library CDN URLs become local SVGs.
  if (name === icon.toLowerCase() && /^(?:[a-z][a-z\d+.-]*:|\/)/i.test(icon)) {
    const src = icon.startsWith("/") && !icon.startsWith("//") && basePath ? `${basePath.replace(/\/$/, "")}${icon}` : icon;
    return <img alt={icon} className={classes} data-component-part="icon-image" src={src} style={style} />;
  }

  return (
    <HugeiconsIcon
      icon={glyph ?? HelpCircleIcon}
      size={size}
      strokeWidth={1.5}
      width={overrideSize ? undefined : size}
      height={overrideSize ? undefined : size}
      aria-hidden="true"
      focusable="false"
      className={classes}
      data-component-part="icon-svg"
      data-icon-library="hugeicons"
      data-icon-name={name}
      data-icon-type={iconType}
      data-icon-dual-color={themed ? "true" : undefined}
      data-icon-fallback={glyph ? undefined : "true"}
      style={style}
    />
  );
}

export function LanguageIcon({ language, className }: { language: string; className?: string }) {
  const name = language.toLowerCase();
  const glyph = Object.hasOwn(documentationIcons, name) ? documentationIcons[name] : undefined;
  return <HugeiconsIcon icon={glyph ?? CodeIcon}
    size={14} strokeWidth={1.5} aria-hidden="true" focusable="false"
    className={["store-hugeicon size-3.5 shrink-0", className].filter(Boolean).join(" ")}
    data-icon-library="hugeicons" data-icon-name={language.toLowerCase()} />;
}
