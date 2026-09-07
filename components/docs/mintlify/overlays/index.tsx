"use client";

import {
  Search as MintlifySearch,
  SearchButton as MintlifySearchButton,
  SearchProvider as MintlifySearchProvider,
  Tooltip as MintlifyTooltip,
  useSearch as MintlifyUseSearch,
  type SearchButtonProps,
  type SearchContextValue,
  type SearchProps,
  type SearchProviderProps,
  type SearchResult,
  type TooltipProps,
} from "@mintlify/components";
import { forwardRef, useEffect, useId, type Ref } from "react";

import { observeTooltipAccessibility } from "../tooltip-accessibility";

export type {
  SearchButtonProps,
  SearchContextValue,
  SearchProps,
  SearchProviderProps,
  SearchResult,
  TooltipProps,
};

const familyClass = (component: string, className?: string) =>
  ["store-mintlify-overlays", `store-mintlify-${component}`, className]
    .filter(Boolean)
    .join(" ");

/** Keeps the installed Base UI interaction model while identifying its trigger. */
export function Tooltip({ children, className, ...props }: TooltipProps) {
  const id = `store-tooltip-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  useEffect(() => {
    return observeTooltipAccessibility(() => {
      const trigger = document.getElementsByClassName(id)[0];
      const popup = Array.from(document.querySelectorAll('[data-component-part="tooltip-content"]')).find(element =>
        (!element.id || element.id === id + "-description") &&
        (element.querySelector('[data-component-part="tooltip-title"]')?.textContent ?? "") === (props.title ?? "") &&
        (element.querySelector('[data-component-part="tooltip-description"]')?.textContent ?? "") === (props.description ?? ""));
      return trigger ? [{ descriptionId: `${id}-description`, popup, trigger }] : [];
    });
  }, [id, props.title, props.description]);
  if (children == null) return null;
  return (
    <MintlifyTooltip
      {...props}
      className={familyClass("tooltip-trigger", [className, id].filter(Boolean).join(" "))}
    >
      {children}
    </MintlifyTooltip>
  );
}

function assignRef(ref: Ref<HTMLInputElement> | undefined, input: HTMLInputElement | null) {
  if (typeof ref === "function") ref(input);
  else if (ref) ref.current = input;
}

/** @internal Exported only so the DOM lifecycle can be verified without replacing native Search. */
export function observeSearchPortal(
  portalClass: string,
  onInput: (input: HTMLInputElement | null) => void,
) {
  if (typeof document === "undefined" || typeof MutationObserver === "undefined" || !document.body) {
    return () => {};
  }

  let currentInput: HTMLInputElement | null = null;
  const sync = () => {
    const portal = Array.from(document.getElementsByClassName(portalClass)).find(
      (element) => element.getAttribute("role") === "dialog",
    );
    const nextInput = portal?.querySelector<HTMLInputElement>('input[type="search"]') ?? null;
    if (portal) portal.setAttribute("aria-label", "Search documentation");
    if (nextInput === currentInput) return;
    currentInput = nextInput;
    onInput(nextInput);
  };
  const observer = new MutationObserver(sync);
  observer.observe(document.body, { childList: true, subtree: true });
  sync();

  return () => {
    observer.disconnect();
    if (currentInput) onInput(null);
    currentInput = null;
  };
}

function useSearchPortal(ref?: Ref<HTMLInputElement>) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const portalClass = `store-mintlify-search-portal-${id}`;
  useEffect(() => observeSearchPortal(portalClass, (input) => assignRef(ref, input)), [portalClass, ref]);
  return portalClass;
}

/** The installed Search owns its Headless UI dialog, focus trap, and body portal. */
function SearchAdapter({
  forwardedRef,
  ...props
}: SearchProps & { forwardedRef?: Ref<HTMLInputElement> }) {
  const portalClass = useSearchPortal(forwardedRef);
  return (
    <MintlifySearch
      {...props}
      className={familyClass("search", `${props.className ?? ""} ${portalClass}`)}
    />
  );
}

export const Search = forwardRef<HTMLInputElement, SearchProps>(function Search(props, ref) {
  return <SearchAdapter {...props} forwardedRef={ref} />;
});

/** Preserves native button attributes, shortcut rendering, click behavior, and ref. */
export const SearchButton = forwardRef<HTMLButtonElement, SearchButtonProps>(
  function SearchButton({ className, ...props }, ref) {
    return (
      <MintlifySearchButton
        {...props}
        className={familyClass("search-button", className)}
        ref={ref}
      />
    );
  },
);

/**
 * Fixture-facing provider for callers that supply their own result data and callbacks.
 * The production shell keeps its single CommandSearch provider and shortcut listener.
 */
function SearchProviderAdapter({ searchProps, ...props }: SearchProviderProps) {
  const portalClass = useSearchPortal();
  const nativeSearchProps = {
    ...searchProps,
    className: familyClass("search", `${searchProps.className ?? ""} ${portalClass}`),
  };
  return (
    <MintlifySearchProvider
      {...props}
      searchProps={nativeSearchProps}
    />
  );
}

export function SearchProvider(props: SearchProviderProps) {
  return <SearchProviderAdapter {...props} />;
}

/** This hook intentionally remains the hook paired with the installed provider. */
export const useSearch = MintlifyUseSearch;
