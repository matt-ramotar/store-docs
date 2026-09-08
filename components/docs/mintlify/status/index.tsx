"use client";

import packageSlugify from "../../../../node_modules/@mintlify/components/dist/node_modules/.pnpm/@sindresorhus_slugify@2.2.1/node_modules/@sindresorhus/slugify/index.js";

import { Alert, AlertContent, AlertIndicator, AlertTitle, Chip } from "@heroui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, AlertCircleIcon, BulbIcon, CheckmarkCircle02Icon, InformationCircleIcon, Link04Icon, NoteIcon } from "@hugeicons/core-free-icons";
import { DocumentationIcon } from "../../../icons/DocumentationIcon";
import type {
  BadgeColor,
  BadgeProps as MintlifyBadgeProps,
  BadgeShape,
  BadgeSize,
  BadgeVariant,
  CalloutProps as MintlifyCalloutProps,
  CalloutVariant,
  DeprecatedPillProps,
  InfoPillProps,
  ParamHeadProps as MintlifyParamHeadProps,
  PropertyProps,
  RequiredPillProps,
} from "@mintlify/components";
import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect } from "react";

export type {
  BadgeColor,
  BadgeShape,
  BadgeSize,
  BadgeVariant,
  CalloutVariant,
  DeprecatedPillProps,
  InfoPillProps,
  PropertyProps,
  RequiredPillProps,
};

export type BadgeProps = MintlifyBadgeProps;
type IconLibrary = NonNullable<BadgeProps["iconLibrary"]>;
type IconType = NonNullable<BadgeProps["iconType"]>;
export type LegacyCalloutType =
  | "Info"
  | "Warning"
  | "Note"
  | "Tip"
  | "Check"
  | "Danger"
  | CalloutVariant;
export type CalloutProps = MintlifyCalloutProps & { type?: LegacyCalloutType };
export type ParamHeadProps = MintlifyParamHeadProps;

const calloutIcons = {
  check: CheckmarkCircle02Icon,
  danger: AlertCircleIcon,
  info: InformationCircleIcon,
  note: NoteIcon,
  tip: BulbIcon,
  warning: Alert02Icon,
};

const badgeColors: Record<BadgeColor, "accent" | "danger" | "default" | "success" | "warning"> = {
  blue: "accent",
  gray: "default",
  green: "success",
  orange: "warning",
  purple: "accent",
  red: "danger",
  surface: "default",
  "surface-destructive": "danger",
  white: "default",
  "white-destructive": "danger",
  yellow: "warning",
};

const badgeSizes: Record<BadgeSize, "sm" | "md" | "lg"> = {
  lg: "lg",
  md: "md",
  sm: "sm",
  xs: "sm",
};

const calloutStatuses: Record<CalloutVariant, "accent" | "danger" | "default" | "success" | "warning"> = {
  check: "success",
  custom: "default",
  danger: "danger",
  info: "accent",
  note: "default",
  tip: "success",
  warning: "warning",
};

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function StatusIcon({ icon, iconLibrary, iconType }: {
  icon: ReactNode;
  iconLibrary?: IconLibrary;
  iconType?: IconType;
}) {
  if (typeof icon !== "string") return <>{icon}</>;
  return <span aria-hidden="true" className="contents"><DocumentationIcon icon={icon} iconLibrary={iconLibrary} iconType={iconType} overrideColor overrideSize /></span>;
}

function BadgeIcon({
  icon,
  part,
  iconLibrary,
  iconType,
}: {
  icon: ReactNode;
  part: "lead" | "tail";
  iconLibrary?: IconLibrary;
  iconType?: IconType;
}) {
  if (!icon) return null;
  return (
    <span data-component-part={`${part}-icon`} data-icon-type={typeof icon === "string" ? "string" : "inline"}>
      <StatusIcon icon={icon} iconLibrary={iconLibrary} iconType={iconType} />
    </span>
  );
}

export function Badge({
  children,
  className,
  color = "gray",
  shape = "rounded",
  variant: variantProp,
  stroke,
  disabled = false,
  size = "md",
  leadIcon,
  tailIcon: tailIconProp,
  icon,
  iconType,
  iconLibrary = "fontawesome",
  onClick,
  href,
}: BadgeProps) {
  const variant = variantProp ?? (stroke ? "outline" : "solid");
  const tailIcon = tailIconProp ?? icon;
  const content = (
    <>
      <BadgeIcon icon={leadIcon} iconLibrary={iconLibrary} iconType={iconType} part="lead" />
      <Chip.Label>{children}</Chip.Label>
      <BadgeIcon icon={tailIcon} iconLibrary={iconLibrary} iconType={iconType} part="tail" />
    </>
  );
  const shared = {
    children: content,
    className: classes("store-status-badge", className),
    color: badgeColors[color],
    "data-badge-color": color,
    "data-badge-shape": shape,
    "data-badge-size": size,
    "data-badge-variant": variant,
    size: badgeSizes[size],
    variant: variant === "outline" ? ("secondary" as const) : ("primary" as const),
  };

  if (href && !disabled) {
    return <Chip<"a"> {...shared} href={href} onClick={onClick} render={(props) => <a {...props} />} />;
  }
  if (onClick && !disabled) {
    return <Chip<"button"> {...shared} onClick={onClick} render={(props) => <button {...props} />} type="button" />;
  }
  return <Chip {...shared} aria-disabled={disabled || undefined} data-disabled={disabled || undefined} />;
}

function normalizeLegacyType(type: LegacyCalloutType | undefined): CalloutVariant | undefined {
  if (!type) return undefined;
  return type.toLowerCase() as CalloutVariant;
}

function calloutLabel(variant: CalloutVariant) {
  return variant === "custom" ? "Callout" : `${variant[0].toUpperCase()}${variant.slice(1)}`;
}

export function Callout({
  children,
  title,
  variant,
  type,
  icon,
  iconType,
  iconLibrary,
  color,
  className,
  ariaLabel,
}: CalloutProps) {
  const resolved = variant ?? normalizeLegacyType(type) ?? "custom";
  const label = calloutLabel(resolved);
  const style = color ? ({ "--store-status-custom": color } as CSSProperties) : undefined;

  return (
    <aside
      aria-label={ariaLabel ?? `${label} callout`}
      className={classes("store-status-callout", className)}
      data-callout-type={resolved}
      role="note"
      style={style}
    >
      <span className="sr-only" data-callout-label="">
        {label}
      </span>
      <div data-callout-body="">
        <Alert className="store-status-callout__alert" status={calloutStatuses[resolved]}>
          {resolved === "custom" && icon ? (
            <AlertIndicator data-component-part="callout-icon">
              <StatusIcon icon={icon} iconLibrary={iconLibrary} iconType={iconType} />
            </AlertIndicator>
          ) : resolved === "custom" ? null : (
            <AlertIndicator data-component-part="callout-icon">
              <HugeiconsIcon aria-hidden="true" icon={calloutIcons[resolved]} size={20} strokeWidth={1.5} data-icon-library="hugeicons" />
            </AlertIndicator>
          )}
          <AlertContent>
            {title ? <AlertTitle data-component-part="callout-title">{title}</AlertTitle> : null}
            <div className="alert__description store-status-callout__body" data-component-part="callout-content">
              {children}
            </div>
          </AlertContent>
        </Alert>
      </div>
    </aside>
  );
}

type NamedCalloutProps = Omit<CalloutProps, "type" | "variant">;

function namedCallout(variant: Exclude<CalloutVariant, "custom">) {
  return function NamedCallout(props: NamedCalloutProps) {
    return <Callout {...props} variant={variant} />;
  };
}

export const Info = namedCallout("info");
export const Warning = namedCallout("warning");
export const Note = namedCallout("note");
export const Tip = namedCallout("tip");
export const Check = namedCallout("check");
export const Danger = namedCallout("danger");

function slugify(value: string) {
  return packageSlugify(value, { decamelize: true });
}

function serializePropertyDefault(value: unknown) {
  if (value !== null && typeof value === "object" && Object.values(value).some((item) => item !== null && typeof item === "object")) {
    return null;
  }
  try {
    const serialized = JSON.stringify(value);
    return serialized && serialized.length < 50 ? serialized : null;
  } catch {
    return null;
  }
}

function displayDefault(value: unknown) {
  if (typeof value === "string") return value === "" ? '\"\"' : value;
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

export function InfoPill({ children, prefix, className }: InfoPillProps) {
  return (
    <span className={classes("store-status-pill store-status-pill--info", className)} data-component-part="field-info-pill">
      {prefix ? <span className="store-status-pill__prefix">{prefix}</span> : null}
      <span>{children}</span>
    </span>
  );
}

export function RequiredPill({ label }: RequiredPillProps) {
  return label ? (
    <span className="store-status-pill store-status-pill--required" data-component-part="field-required-pill">
      {label}
    </span>
  ) : null;
}

export function DeprecatedPill({ label }: DeprecatedPillProps) {
  return label ? (
    <span className="store-status-pill store-status-pill--deprecated" data-component-part="field-deprecated-pill">
      {label}
    </span>
  ) : null;
}

export function ParamHead({
  name,
  type,
  location,
  hidden,
  default: defaultValue,
  required,
  deprecated,
  id: idProp,
  pre,
  post,
  className,
  onMount,
  navigateToHeaderAriaLabel = "Navigate to header",
  defaultLabel = "default",
  requiredLabel = "required",
  deprecatedLabel = "deprecated",
}: ParamHeadProps) {
  const id = idProp ?? slugify(name);
  useEffect(() => {
    if (!hidden) onMount?.();
  }, [hidden, onMount]);

  const navigate = useCallback(() => {
    if (!id || typeof window === "undefined") return;
    const target = `${window.location.href.split("#")[0]}#${id}`;
    void navigator.clipboard?.writeText(target).catch(() => {});
    window.location.hash = id;
  }, [id]);

  if (hidden || name == null) return null;
  const renderedDefault = defaultValue == null ? null : displayDefault(defaultValue);

  return (
    <div className={classes("store-status-param-head", className)} id={id || undefined}>
      <a
        aria-label={navigateToHeaderAriaLabel}
        className="store-status-param-head__anchor"
        href={id ? `#${id}` : undefined}
        onClick={navigate}
      >
        <HugeiconsIcon aria-hidden="true" icon={Link04Icon} size={16} strokeWidth={1.5} data-icon-library="hugeicons" />
      </a>
      <div className="store-status-param-head__content">
        <div className="store-status-param-head__row">
          {pre?.map((value, index) => (
            <span data-component-part="field-meta-pre" key={`${value}-${index}`}>
              {value}
            </span>
          ))}
          <a data-component-part="field-name" href={id ? `#${id}` : undefined} onClick={navigate}>
            {name}
          </a>
          <span className="store-status-param-head__meta" data-component-part="field-meta">
            {type ? <InfoPill>{type}</InfoPill> : null}
            {location ? <InfoPill>{location}</InfoPill> : null}
            {renderedDefault != null ? <InfoPill prefix={defaultLabel}>{renderedDefault}</InfoPill> : null}
            {required ? <RequiredPill label={requiredLabel} /> : null}
            {deprecated ? <DeprecatedPill label={deprecatedLabel} /> : null}
            {post?.map((value, index) => (
              <span data-component-part="field-meta-post" key={`${value}-${index}`}>
                {value}
              </span>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}

export function Property({
  name,
  type,
  location,
  hidden,
  default: defaultValue,
  required,
  deprecated,
  children,
  id,
  pre,
  post,
  className,
  onMount,
  navigateToHeaderAriaLabel,
  defaultLabel,
  requiredLabel,
  deprecatedLabel,
}: PropertyProps) {
  if (hidden) return null;
  const serializedDefault = serializePropertyDefault(defaultValue);

  return (
    <div className={classes("store-status-property", className)}>
      <ParamHead
        default={serializedDefault}
        defaultLabel={defaultLabel}
        deprecated={deprecated}
        deprecatedLabel={deprecatedLabel}
        id={id}
        location={location}
        name={name}
        navigateToHeaderAriaLabel={navigateToHeaderAriaLabel}
        onMount={onMount}
        post={post}
        pre={pre}
        required={required}
        requiredLabel={requiredLabel}
        type={type}
      />
      {children ? (
        <div className="store-status-property__content" data-component-part="field-content">
          {children}
        </div>
      ) : null}
    </div>
  );
}
