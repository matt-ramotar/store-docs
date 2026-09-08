"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
// Frozen package dependency: use its exact transliteration/slug algorithm for URL compatibility.
import slugify from "../../../../node_modules/@mintlify/components/dist/node_modules/.pnpm/@sindresorhus_slugify@2.2.1/node_modules/@sindresorhus/slugify/index.js";
import {
  Accordion as MintlifyAccordion,
  Icon,
  Expandable as MintlifyExpandable,
  Steps as MintlifySteps,
  Tabs as MintlifyTabs,
  Tree as MintlifyTree,
  type AccordionProps as PackageAccordionProps,
  type AccordionGroupProps,
  type ExpandableProps,
  type StepsProps,
  type StepsItemProps,
  type TabsProps,
  type TabsItemProps,
  type TreeProps,
  type TreeFileProps,
  type TreeFolderProps,
} from "@mintlify/components";

export type AccordionProps = Omit<PackageAccordionProps, "defaultOpen"> & {
  defaultOpen?: boolean | string;
};

const classes = (base: string, supplied?: string) => supplied ? `${base} ${supplied}` : base;

const AccordionAncestors = createContext<string[]>([]);

/** Independent DOM identity prevents collisions without changing URL slug ancestry. */
function AccordionRoot({
  title, description, defaultOpen = false, className, _disabled, icon, iconType,
  children, trackOpen, trackClose, onMount, topOffset = "-top-18",
  getInitialOpenFromUrl, onUrlStateChange, _onKeyDownCapture,
}: AccordionProps) {
  const instanceId = useId();
  const urlAnchorRef = useRef<HTMLSpanElement>(null);
  const parentIds = useContext(AccordionAncestors);
  const titleText = typeof title === "string" ? title : "";
  const urlId = typeof title === "string" ? slugify(title.split(":").join("-"), { decamelize: false }) : instanceId;
  const initialOpen = (getInitialOpenFromUrl?.(urlId, parentIds) === true) || defaultOpen === true || defaultOpen === "true";
  const [open, setOpen] = useState(initialOpen);
  const openRef = useRef(initialOpen);
  const labelId = `store-accordion-${instanceId}-label`;
  const panelId = `store-accordion-${instanceId}-content`;
  useEffect(() => {
    // Keep the package's public fragment on the first matching instance while
    // repeated titles retain independent, unique label and panel IDs.
    const anchor = urlAnchorRef.current;
    if (anchor && typeof title === "string" && !document.getElementById(urlId)) {
      anchor.id = urlId;
      if (window.location.hash === `#${encodeURIComponent(urlId)}` || window.location.hash === `#${urlId}`) {
        anchor.scrollIntoView({ block: "start" });
      }
    }
    if (getInitialOpenFromUrl?.(urlId, parentIds) === true && !openRef.current) {
      setOpen(true);
      openRef.current = true;
    }
    onMount?.();
    // These are initial-state/lifecycle callbacks, matching the installed package.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const transition = (next: boolean) => {
    if (_disabled || next === openRef.current) return;
    openRef.current = next;
    setOpen(next);
    onUrlStateChange?.(next, typeof title === "string" ? urlId : undefined, parentIds);
    if (next) trackOpen?.({ title: titleText });
    else trackClose?.({ title: titleText });
  };
  return <AccordionAncestors.Provider value={typeof title === "string" ? [...parentIds, urlId] : parentIds}>
    <details className={classes("store-disclosure store-disclosure-accordion", className)}
      data-component-part="accordion" open={open}
      onKeyDownCapture={(event) => {
        _onKeyDownCapture?.(event);
        if (_disabled && event.target === event.currentTarget.querySelector(":scope > summary") && (event.key === " " || event.key === "Enter")) event.preventDefault();
      }}
      onToggle={(event) => {
        if (_disabled) {
          event.currentTarget.open = openRef.current;
          return;
        }
        transition(event.currentTarget.open);
      }}>
      <summary id={labelId} aria-controls={panelId} aria-expanded={open}
        aria-disabled={_disabled || undefined} tabIndex={_disabled ? -1 : 0}
        data-component-part="accordion-button"
        onClick={(event) => {
          if (_disabled) event.preventDefault();
        }}>
        <span ref={urlAnchorRef} className={topOffset} data-accordion-url-id={typeof title === "string" ? urlId : undefined} aria-hidden="true" />
        <HugeiconsIcon data-component-part="accordion-caret-right" data-icon-library="hugeicons" aria-hidden="true" icon={open ? ArrowDown01Icon : ArrowRight01Icon} size={16} strokeWidth={1.5} className="shrink-0" />
        {icon && <span data-component-part="accordion-icon">{typeof icon === "string" ? <Icon icon={icon} iconType={iconType} /> : icon}</span>}
        <span data-component-part="accordion-title-container">
          <span data-component-part="accordion-title">{title}</span>
          {description && <span data-component-part="accordion-description">{description}</span>}
        </span>
      </summary>
      <div id={panelId} aria-labelledby={labelId} role="region" data-component-part="accordion-content">{children}</div>
    </details>
  </AccordionAncestors.Provider>;
}

export function AccordionGroup({ className, children }: Omit<AccordionGroupProps, "children"> & { children?: ReactNode }) {
  return <MintlifyAccordion.Group className={classes("store-disclosure store-disclosure-group", className)}>{children}</MintlifyAccordion.Group>;
}
export const Accordion = Object.assign(AccordionRoot, { Group: AccordionGroup });

export function Expandable({ className, ...props }: ExpandableProps) {
  return <MintlifyExpandable {...props} className={classes("store-disclosure", className)} />;
}

function StepsRoot({ className, ...props }: StepsProps) {
  return <MintlifySteps {...props} className={classes("store-disclosure", className)} />;
}
export function Step({ className, ...props }: StepsItemProps) {
  return <MintlifySteps.Item {...props} className={classes("store-disclosure", className)} />;
}
export const Steps = Object.assign(StepsRoot, { Item: Step });

function TabsRoot({ className, ...props }: TabsProps) {
  return <MintlifyTabs {...props} className={classes("store-disclosure store-disclosure-tabs", className)} />;
}
export function Tab(props: TabsItemProps) { return <MintlifyTabs.Item {...props} />; }
export const Tabs = Object.assign(TabsRoot, { Item: Tab });

function TreeRoot({ className, ...props }: TreeProps) {
  return <MintlifyTree {...props} className={classes("store-disclosure", className)} />;
}
export function TreeFile(props: TreeFileProps) { return <MintlifyTree.File {...props} />; }
export function TreeFolder(props: TreeFolderProps) { return <MintlifyTree.Folder {...props} />; }
export const Tree = Object.assign(TreeRoot, { File: TreeFile, Folder: TreeFolder });
