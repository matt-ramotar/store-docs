import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";

import { Step, Tab, Tabs } from "@/components/docs/mintlify-runtime";

export { Callout, Check, Danger, Info, Note, Tip, Warning } from "@/components/docs/Callout";

type ChildrenProps = { children?: ReactNode };

export function StepsGroup({ children, nested = "false" }: ChildrenProps & { nested?: string }) {
  const items = Children.toArray(children).filter(isValidElement) as ReactElement<StepItemProps>[];

  return (
    <ol
      aria-label={nested === "true" ? "Step branches" : "Steps"}
      className={nested === "true" ? "mt-4 mb-2 ml-3.5 list-none p-0" : "mt-10 mb-6 ml-3.5 list-none p-0"}
      data-step-group=""
      data-step-nested={nested}
      role="list"
    >
      {items.map((child, index) =>
        cloneElement(child, { isLast: index === items.length - 1 }),
      )}
    </ol>
  );
}

type StepItemProps = ChildrenProps & {
  isLast?: boolean;
  label: string;
  title: string;
};

export function StepItem({ children, isLast = false, label, title }: StepItemProps) {
  const childArray = Children.toArray(children);
  const nestedGroups = childArray.filter(
    (child) => isValidElement(child) && (child.props as { nested?: string }).nested === "true",
  );
  const body = childArray.filter(
    (child) => !(isValidElement(child) && (child.props as { nested?: string }).nested === "true"),
  );

  return (
    <li className="list-none" data-step-item="" data-step-label={label} role="listitem">
      <div className="sr-only" data-step-title="">
        <span aria-hidden="true">{label}.</span>
        <strong>{title}</strong>
      </div>
      <div data-step-body="">
        <Step isLast={isLast} title={title} {...stepMarker(label)}>
          {body}
        </Step>
        {nestedGroups}
      </div>
    </li>
  );
}

export function TabGroup({ children, label }: ChildrenProps & { label: string }) {
  const panels = Children.toArray(children).filter(isValidElement) as ReactElement<TabPanelProps>[];

  return (
    <section aria-label={label} className="my-6" data-tab-group="" role="group">
      <Tabs ariaLabel={label}>
        {panels.map((panel) => (
          <Tab key={panel.props.id} title={panel.props.label}>
            {panel}
          </Tab>
        ))}
      </Tabs>
    </section>
  );
}

type TabPanelProps = ChildrenProps & {
  id: string;
  label: string;
  language: string;
};

export function TabPanel({ children, id, label, language }: TabPanelProps) {
  const labelId = `${id}-label`;
  return (
    <section aria-labelledby={labelId} data-language={language} data-tab-panel="" id={id}>
      <p className="sr-only" data-tab-panel-label="" id={labelId}>
        <strong>{label}</strong>
      </p>
      {children}
    </section>
  );
}

export function ParamList({ children }: ChildrenProps) {
  return (
    <dl className="border-border bg-surface my-6 divide-y divide-separator rounded-2xl border" data-param-list="">
      {children}
    </dl>
  );
}

export function ParamField({
  children,
  name,
  required,
  type,
}: ChildrenProps & { name: string; required: "false" | "true"; type: string }) {
  return (
    <div
      className="grid gap-x-4 gap-y-2 p-5 sm:grid-cols-[8rem_minmax(0,1fr)]"
      data-param-field=""
      data-required={required}
    >
      <dt className="text-foreground font-semibold">Parameter</dt>
      <dd className="text-foreground-secondary min-w-0">
        <code>{name}</code>
      </dd>
      <dt className="text-foreground font-semibold">Type</dt>
      <dd className="text-foreground-secondary min-w-0">
        <code>{type}</code>
      </dd>
      <dt className="text-foreground font-semibold">Required</dt>
      <dd className="text-foreground-secondary">{required === "true" ? "Required" : "Optional"}</dd>
      <dt className="text-foreground font-semibold">Description</dt>
      <dd className="text-foreground-secondary min-w-0 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">{children}</dd>
    </div>
  );
}

export function UnavailableDestination({
  children,
  destination,
  status,
}: ChildrenProps & { destination: string; status: string }) {
  return (
    <aside
      aria-label="Unavailable documentation destination"
      className="border-warning bg-warning-soft text-warning-soft-foreground my-3 rounded-xl border px-4 py-3"
      data-unavailable-destination={destination}
      data-unavailable-status={status}
      role="note"
    >
      {children}
    </aside>
  );
}

function stepMarker(label: string): { icon?: ReactNode; stepNumber?: number } {
  const numeric = Number(label);
  if (Number.isFinite(numeric) && String(numeric) === label) return { stepNumber: numeric };
  return {
    icon: <span className="text-xs font-semibold">{label}</span>,
  };
}
