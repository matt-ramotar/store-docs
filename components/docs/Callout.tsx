import { Alert, AlertContent, AlertIndicator, AlertTitle } from "@heroui/react/alert";
import type { ReactNode } from "react";

type ChildrenProps = { children?: ReactNode };

type CalloutType = "Info" | "Note" | "Tip" | "Warning" | "Check" | "Danger";
type CalloutVariant = "info" | "warning" | "note" | "tip" | "check" | "danger";

const calloutVariants: Record<CalloutType, CalloutVariant> = {
  Check: "check",
  Danger: "danger",
  Info: "info",
  Note: "note",
  Tip: "tip",
  Warning: "warning",
};

/** Maps callout variants onto the HeroUI Alert status palette. */
const calloutStatuses: Record<CalloutVariant, "accent" | "danger" | "default" | "success" | "warning"> = {
  check: "success",
  danger: "danger",
  info: "accent",
  note: "default",
  tip: "success",
  warning: "warning",
};

export function Callout({
  children,
  title,
  type = "Note",
  variant,
}: ChildrenProps & {
  title?: string;
  type?: CalloutType;
  variant?: CalloutVariant;
}) {
  const resolved = variant ?? calloutVariants[type];

  return (
    <aside aria-label={`${type} callout`} className="my-6" data-callout-type={resolved} role="note">
      <p className="sr-only" data-callout-label="">
        {type}
      </p>
      <div data-callout-body="">
        <Alert status={calloutStatuses[resolved]}>
          <AlertIndicator />
          <AlertContent>
            {title ? <AlertTitle>{title}</AlertTitle> : null}
            {/* Alert.Description renders a span; MDX bodies are block content, so
                reuse the slot class on a div instead. */}
            <div className="alert__description w-full min-w-0 [&>:first-child]:mt-0 [&>:last-child]:mb-0">
              {children}
            </div>
          </AlertContent>
        </Alert>
      </div>
    </aside>
  );
}

function namedCallout(type: CalloutType) {
  return function NamedCallout({ children, title }: ChildrenProps & { title?: string }) {
    return (
      <Callout title={title} type={type}>
        {children}
      </Callout>
    );
  };
}

export const Check = namedCallout("Check");
export const Danger = namedCallout("Danger");
export const Info = namedCallout("Info");
export const Note = namedCallout("Note");
export const Tip = namedCallout("Tip");
export const Warning = namedCallout("Warning");
