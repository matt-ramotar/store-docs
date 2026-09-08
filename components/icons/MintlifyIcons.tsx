"use client";

import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { forwardRef, type SVGProps } from "react";
import { documentationIcons } from "./DocumentationIcon";

type IconProps = Omit<SVGProps<SVGSVGElement>, "ref" | "strokeWidth"> & { size?: number | string; strokeWidth?: number; absoluteStrokeWidth?: boolean };

function iconComponent(name: string, className = "", label?: string, size = 18) {
  const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon({ className: customClass, ...props }, ref) {
    const accessibleLabel = props["aria-label"] ?? label;
    return <HugeiconsIcon icon={documentationIcons[name] as IconSvgElement}
      size={size} strokeWidth={1.5} aria-hidden={accessibleLabel ? undefined : true}
      aria-label={accessibleLabel} role={accessibleLabel ? "img" : undefined} focusable="false"
      {...props} ref={ref}
      className={["store-hugeicon", className, customClass].filter(Boolean).join(" ")}
      data-icon-library="hugeicons" data-icon-name={name} />;
  });
  Icon.displayName = `DocumentationIcon(${name})`;
  return Icon;
}

export const InfoIcon = iconComponent("circle-info", "size-5 flex-none text-stone-800 dark:text-stone-300", "Info");
export const WarningIcon = iconComponent("warning", "size-5 flex-none text-yellow-800 dark:text-yellow-300", "Warning");
export const DangerIcon = iconComponent("danger", "size-4 flex-none text-red-800 dark:text-red-300", "Danger");
export const TipIcon = iconComponent("lightbulb", "size-4 text-green-800 dark:text-green-300", "Tip");
export const NoteIcon = iconComponent("circle-info", "size-4 text-blue-800 dark:text-blue-300", "Note");
export const CheckIcon = iconComponent("check", "size-4 text-green-800 dark:text-green-300", "Check");
export const ArrowRightIcon = iconComponent("chevron-right", "h-5 rotate-0 overflow-visible");
export const FileIcon = iconComponent("file");
export const Folder2Icon = iconComponent("folder");
export const Folder2OpenIcon = iconComponent("folder-open");
export const LinkIcon = iconComponent("link", "", undefined, 12);
export const FrameTitleIcon = iconComponent("hand-point-right", "size-4 flex-none text-stone-400 dark:text-stone-300", undefined, 16);

const CopyIcon = iconComponent("copy", "size-4", "Copy", 16);
const CopiedIcon = iconComponent("check", "size-4", "Copied", 16);
type CopyIconProps = { codeBlockTheme?: "system" | "dark" };
export function CopyButtonIcon({ codeBlockTheme = "system" }: CopyIconProps) {
  return <CopyIcon className={codeBlockTheme === "dark"
    ? "text-white/40 group-hover/copy-button:text-white/60"
    : "text-stone-400 group-hover/copy-button:text-stone-500 dark:text-white/40 dark:group-hover/copy-button:text-white/60"} />;
}
export function ActiveCopyButtonIcon({ codeBlockTheme = "system" }: CopyIconProps) {
  return <CopiedIcon className={codeBlockTheme === "dark" ? "text-primary-light" : "text-primary dark:text-primary-light"} />;
}

export const ChevronDownIcon = iconComponent("chevron-down", "", undefined, 24);
export const ChevronLeftIcon = iconComponent("chevron-left", "", undefined, 24);
export const ChevronRightIcon = iconComponent("chevron-right", "", undefined, 24);
export const ChevronUpIcon = iconComponent("chevron-up", "", undefined, 24);
export const ChevronsUpDownIcon = iconComponent("chevrons-up-down", "", undefined, 24);
export const ArrowUpRightIcon = iconComponent("arrow-up-right", "", undefined, 24);
export const CheckmarkIcon = iconComponent("check", "", undefined, 24);
export const EllipsisIcon = iconComponent("ellipsis", "", undefined, 24);
export const LoaderCircleIcon = iconComponent("loader-circle", "", undefined, 24);
export const RotateCcwIcon = iconComponent("rotate-ccw", "", undefined, 24);
export const SearchIcon = iconComponent("search", "", undefined, 24);
export const SearchXIcon = iconComponent("search-x", "", undefined, 24);
export const ZoomInIcon = iconComponent("zoom-in", "", undefined, 24);
export const ZoomOutIcon = iconComponent("zoom-out", "", undefined, 24);
