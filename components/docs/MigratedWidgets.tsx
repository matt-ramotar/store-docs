import type { ReactNode } from "react";

type ChildrenProps = { children?: ReactNode };

export function StepsGroup({ children, nested = "false" }: ChildrenProps & { nested?: string }) {
  return (
    <ol
      data-step-group=""
      data-step-nested={nested}
      aria-label={nested === "true" ? "Step branches" : "Steps"}
      className={nested === "true" ? "my-4 space-y-3 ps-5" : "my-8 space-y-5 ps-0"}
    >
      {children}
    </ol>
  );
}

export function StepItem({
  children,
  label,
  title,
}: ChildrenProps & { label: string; title: string }) {
  return (
    <li data-step-item="" data-step-label={label} className="list-none rounded-2xl border border-border bg-surface p-5">
      <div data-step-title="" className="flex items-baseline gap-2 font-semibold text-foreground">
        <span aria-hidden="true" className="text-muted">
          {label}.
        </span>
        <strong>{title}</strong>
      </div>
      <div data-step-body="" className="mt-3 min-w-0">
        {children}
      </div>
    </li>
  );
}

export function TabGroup({ children, label }: ChildrenProps & { label: string }) {
  return (
    <section
      role="group"
      aria-label={label}
      data-tab-group=""
      className="my-6 space-y-5 rounded-2xl border border-border bg-surface p-4"
    >
      {children}
    </section>
  );
}

export function TabPanel({
  children,
  id,
  label,
  language,
}: ChildrenProps & { id: string; label: string; language: string }) {
  const labelId = `${id}-label`;
  return (
    <section
      id={id}
      aria-labelledby={labelId}
      data-tab-panel=""
      data-language={language}
      className="min-w-0 border-t border-separator pt-4 first:border-t-0 first:pt-0"
    >
      <p id={labelId} data-tab-panel-label="" className="mb-3 text-base text-foreground">
        <strong>{label}</strong>
      </p>
      {children}
    </section>
  );
}

export function Callout({ children, type }: ChildrenProps & { type: "Info" | "Note" | "Tip" }) {
  const normalizedType = type.toLowerCase();
  return (
    <aside
      role="note"
      aria-label={`${type} callout`}
      data-callout-type={normalizedType}
      className="my-6 rounded-2xl border-s-4 border-accent bg-surface-secondary px-5 py-4 text-foreground-secondary"
    >
      <p data-callout-label="" className="my-0 font-semibold text-foreground">
        {type}
      </p>
      <div data-callout-body="" className="mt-2 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
        {children}
      </div>
    </aside>
  );
}

export function ParamList({ children }: ChildrenProps) {
  return <dl data-param-list="" className="my-6 divide-y divide-separator rounded-2xl border border-border bg-surface">{children}</dl>;
}

export function ParamField({
  children,
  name,
  required,
  type,
}: ChildrenProps & { name: string; required: "false" | "true"; type: string }) {
  return (
    <div data-param-field="" data-required={required} className="grid gap-x-4 gap-y-2 p-5 sm:grid-cols-[8rem_minmax(0,1fr)]">
      <dt className="font-semibold text-foreground">Parameter</dt>
      <dd className="min-w-0 text-foreground-secondary"><code>{name}</code></dd>
      <dt className="font-semibold text-foreground">Type</dt>
      <dd className="min-w-0 text-foreground-secondary"><code>{type}</code></dd>
      <dt className="font-semibold text-foreground">Required</dt>
      <dd className="text-foreground-secondary">{required === "true" ? "Required" : "Optional"}</dd>
      <dt className="font-semibold text-foreground">Description</dt>
      <dd className="min-w-0 text-foreground-secondary [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">{children}</dd>
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
      role="note"
      aria-label="Unavailable documentation destination"
      data-unavailable-destination={destination}
      data-unavailable-status={status}
      className="my-3 rounded-xl border border-warning bg-warning-soft px-4 py-3 text-warning-soft-foreground"
    >
      {children}
    </aside>
  );
}
