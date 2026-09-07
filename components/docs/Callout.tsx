import { Callout as CompatibleCallout, type CalloutProps } from "./mintlify/status";

export { Check, Danger, Info, Note, Tip, Warning } from "./mintlify/status";
export type { CalloutProps, LegacyCalloutType } from "./mintlify/status";

/** The existing MDX facade defaults to Note; explicit package variants take precedence. */
export function Callout({ type, variant, ...props }: CalloutProps) {
  return <CompatibleCallout {...props} type={type ?? (variant === undefined ? "Note" : undefined)} variant={variant} />;
}
