"use client";

import { CodeBlock as ProCodeBlock } from "@heroui-pro/react/code-block";
import { Button } from "@heroui/react/button";
import {
  BaseCodeBlock as NativeBaseCodeBlock,
  CodeSnippet as NativeCodeSnippet,
  DropdownMenu as NativeDropdownMenu,
  DropdownMenuContent as NativeDropdownMenuContent,
  DropdownMenuItem as NativeDropdownMenuItem,
  DropdownMenuTrigger as NativeDropdownMenuTrigger,
  Icon,
} from "@mintlify/components";
import type {
  BaseCodeBlockProps, CodeBlockProps, CodeGroupProps, CodeGroupSelectProps,
  CodeSnippetProps, DropdownMenuContentProps, DropdownMenuItemProps,
  DropdownMenuProps, DropdownMenuTriggerProps,
} from "@mintlify/components";
import {
  Children, cloneElement, createElement, createContext, isValidElement, memo, useContext, useEffect, useId, useRef, useState,
  type ComponentPropsWithoutRef, type ReactElement, type ReactNode,
} from "react";
import { CopyCodeButton } from "../../../shell/CopyCodeButton";
import { highlightTidalCode } from "./highlight";

export type {
  BaseCodeBlockProps, CodeBlockProps, CodeGroupProps, CodeGroupSelectProps,
  CodeSnippetProps, DropdownMenuContentProps, DropdownMenuItemProps,
  DropdownMenuProps, DropdownMenuTriggerProps, ExampleCodeSnippet,
} from "@mintlify/components";

type SyntaxTheme = CodeBlockProps["codeBlockThemeObject"];
const tidalSyntax: SyntaxTheme = { theme: "css-variables" };
const isTidalSyntax = (theme: SyntaxTheme) => theme === undefined || (typeof theme === "object" && theme.theme === "css-variables");
const join = (...parts: Array<string | undefined | false>) => parts.filter(Boolean).join(" ");
const syntaxTheme = (props: Pick<CodeBlockProps, "codeBlockTheme" | "codeBlockThemeObject">) =>
  props.codeBlockThemeObject ?? props.codeBlockTheme ?? tidalSyntax;
const uiTheme = (theme: CodeBlockProps["codeBlockTheme"]) => theme ?? "dark";

/** Strings and compiled raw metadata are authoritative; React nodes are never stringified. */
export function codeSource(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return `${children}`;
  if (Array.isArray(children)) return children.map(codeSource).join("");
  if (isValidElement<{ children?: ReactNode; "data-raw-code"?: string }>(children)) {
    return children.props["data-raw-code"] ?? codeSource(children.props.children);
  }
  return "";
}

type CopyProps = NonNullable<CodeBlockProps["copyButtonProps"]>;
const ClipboardWriterContext = createContext<((text: string) => Promise<void>) | null>(null);
/** Gallery injection uses the same rejection handling as unavailable clipboard access. */
export function ClipboardWriterFixture({writeText, children}: {writeText: (text: string) => Promise<void>; children: ReactNode}) {
  return <ClipboardWriterContext.Provider value={writeText}>{children}</ClipboardWriterContext.Provider>;
}
/** Mintlify's full copy contract, with a visible and announced failure state. */
export function CodeCopyButton({
  textToCopy, onCopied, className, showTooltip = true, codeBlockTheme,
  copyButtonAriaLabel = "Copy code", tooltipCopyText = "Copy", tooltipCopiedText = "Copied!",
}: CopyProps) {
  const writeText = useContext(ClipboardWriterContext);
  const [result, setResult] = useState<"idle" | "success" | "error">("idle");
  const mounted = useRef(true);
  const attempt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; attempt.current += 1; if (timer.current) clearTimeout(timer.current); };
  }, []);
  async function copy() {
    const current = ++attempt.current;
    if (timer.current) clearTimeout(timer.current);
    setResult("idle");
    let outcome: "success" | "error";
    try {
      if (writeText) await writeText(textToCopy);
      else {
        if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(textToCopy);
      }
      outcome = "success";
    } catch { outcome = "error"; }
    if (!mounted.current || current !== attempt.current) return;
    setResult(outcome);
    timer.current = setTimeout(() => { setResult("idle"); timer.current = null; }, 2000);
    onCopied?.(outcome, textToCopy);
  }
  const label = result === "success" ? tooltipCopiedText : result === "error" ? "Copy failed" : tooltipCopyText;
  return <span className={join("store-m-code-copy", className)} data-code-theme={uiTheme(codeBlockTheme)} title={showTooltip ? label : undefined}>
    <Button aria-label={copyButtonAriaLabel} size="sm" variant="ghost" onPress={copy}
      data-testid="copy-code-button" data-copy-state={result}>
      <span aria-hidden="true">{label}</span>
    </Button>
    <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {result === "success" ? "Code copied." : result === "error" ? "Copy failed. Select the code and copy it manually." : ""}
    </span>
  </span>;
}

function TidalHighlight({ source, language, highlight, focus, cssVariables = false }: { source: string; language?: string; highlight?: string; focus?: string; cssVariables?: boolean }) {
  const [rendered, setRendered] = useState<{ source: string; html: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    highlightTidalCode(source, language, highlight, focus, cssVariables).then(html => { if (!cancelled) setRendered({ source, html }); }).catch(() => { if (!cancelled) setRendered(null); });
    return () => { cancelled = true; };
  }, [source, language, highlight, focus, cssVariables]);
  return rendered?.source === source
    ? <div className="store-m-code-highlight" dangerouslySetInnerHTML={{ __html: rendered.html }} />
    : <pre className="shiki"><code>{source}</code></pre>;
}

export function BaseCodeBlock(props: BaseCodeBlockProps) {
  const [expanded, setExpanded] = useState(false);
  const regionId = useId();
  const theme = syntaxTheme(props);
  const tidal = isTidalSyntax(theme);
  const source = codeSource(props.children);
  const lineCount = props.numberOfLines ?? source.split("\n").length;
  const language = props.shouldHighlight === false ? "text" : props.lang ?? props.language ?? /language-([\w+-]+)/.exec(props.className ?? "")?.[1] ?? "text";
  return <div className="store-m-code-body" data-code-theme={uiTheme(props.codeBlockTheme)}
    data-code-syntax={tidal ? props.codeBlockThemeObject === undefined ? "tidal" : "css-variables" : "explicit"} data-small-text={props.isSmallText || undefined}>
    <div id={regionId} className="store-m-code-expand-region" style={props.expandable && !expanded ? { maxHeight: lineCount < 7 ? 45 : 190, overflowY: "hidden" } : undefined}>
    {tidal ? <NativeBaseCodeBlock {...props} codeBlockTheme={uiTheme(props.codeBlockTheme)} codeBlockThemeObject="dark"
      shouldHighlight={false} forceExtract={false} expandable={false} numberOfLines={lineCount}>
      {typeof props.children === "string" || props.forceExtract ? <TidalHighlight source={source} language={language} highlight={props.highlight} focus={props.focus} cssVariables={props.codeBlockThemeObject !== undefined} /> : props.children}
    </NativeBaseCodeBlock> : <NativeBaseCodeBlock {...props} expandable={false} codeBlockTheme={uiTheme(props.codeBlockTheme)} codeBlockThemeObject={theme} />}
    </div>
    {props.expandable && <div data-component-part="code-block-footer"><Button variant="ghost" size="sm" aria-expanded={expanded} aria-controls={regionId} onPress={() => setExpanded(value => !value)}>{expanded ? "Collapse" : `See all ${lineCount} line${lineCount === 1 ? "" : "s"}`}</Button></div>}
  </div>;
}

function CodeActions({ props, source }: { props: CodeBlockProps; source: string }) {
  return <div className="store-m-code-actions">
    {props.feedbackButton}
    <CodeCopyButton textToCopy={source} codeBlockTheme={uiTheme(props.codeBlockTheme)} {...props.copyButtonProps} />
    {!props.hideAskAiButton && props.askAiButton}
  </div>;
}

export function CodeBlock(props: CodeBlockProps) {
  return <ProCodeBlock ref={props.anchorRef} className={join("store-m-code", props.className)}
    data-code-theme={uiTheme(props.codeBlockTheme)} data-feedback-open={props.feedbackModalOpen || undefined}>
    <ProCodeBlock.Header className="store-m-code-header">
      <span className="store-m-code-title">
        {props.icon && <Icon icon={props.icon} overrideColor />}
        {props.filename ?? props.lang ?? props.language ?? "Code"}
      </span>
      <CodeActions props={props} source={codeSource(props.children)} />
    </ProCodeBlock.Header>
    <BaseCodeBlock {...props} />
  </ProCodeBlock>;
}

export const CodeSnippet = memo(function CodeSnippet(props: CodeSnippetProps) {
  const tidal = isTidalSyntax(props.codeBlockThemeObject);
  return <div className="store-m-code-snippet" data-code-syntax={tidal ? props.codeBlockThemeObject === undefined ? "tidal" : "css-variables" : "explicit"}>
    {tidal && typeof props.children === "string" ? <TidalHighlight source={props.children} language={props.language} cssVariables={props.codeBlockThemeObject !== undefined} /> :
      <NativeCodeSnippet {...props} codeBlockThemeObject={tidal ? "dark" : props.codeBlockThemeObject} />}
  </div>;
});

/** Native Mintlify joins className before Base UI can evaluate state functions.
 * Apply those functions at Base UI's render boundary instead. */
function renderStateClass<State>(
  render: ReactElement | ((props: Record<string, unknown>, state: State) => ReactElement) | undefined,
  inputProps: object, state: State, className: string | undefined, tag: "button" | "div",
): ReactElement {
  const nativeProps = inputProps as Record<string, unknown>;
  const props: Record<string, unknown> = { ...nativeProps, className: join(nativeProps.className as string | undefined, className) };
  if (typeof render === "function") return render(props, state);
  if (!render) return createElement(tag, props);
  const authored = render.props as Record<string, unknown>;
  const merged = { ...props, ...authored, className: join(props.className as string, authored.className as string | undefined),
    style: { ...(props.style as object), ...(authored.style as object) } } as Record<string, unknown>;
  for (const key of Object.keys(props)) {
    if (/^on[A-Z]/.test(key) && typeof props[key] === "function" && typeof authored[key] === "function") {
      merged[key] = (event: { nativeEvent?: unknown; baseUIHandlerPrevented?: boolean; preventBaseUIHandler?: () => void }) => {
        if (event && typeof event === "object" && "nativeEvent" in event) event.preventBaseUIHandler = () => { event.baseUIHandlerPrevented = true; };
        (authored[key] as (event: unknown) => void)(event);
        if (!event?.baseUIHandlerPrevented) (props[key] as (event: unknown) => void)(event);
      };
    }
  }
  if (nativeProps.ref && authored.ref && nativeProps.ref !== authored.ref) {
    merged.ref = (node: unknown) => {
      const cleanups = [nativeProps.ref, authored.ref].map(ref => {
        if (typeof ref === "function") return ref(node);
        (ref as { current: unknown }).current = node;
      });
      return () => { [nativeProps.ref, authored.ref].forEach((ref, index) => {
        if (typeof cleanups[index] === "function") cleanups[index]();
        else if (typeof ref === "function") ref(null);
        else (ref as { current: unknown }).current = null;
      }); };
    };
  }
  return cloneElement(render, merged);
}

export const DropdownMenu = NativeDropdownMenu;
export function DropdownMenuTrigger({ className, render, ...props }: DropdownMenuTriggerProps) {
  return <NativeDropdownMenuTrigger {...props}
    className={join("store-m-code-menu-trigger", typeof className === "string" ? className : undefined)}
    render={typeof className === "function" ? (nativeProps, state) => renderStateClass(render, nativeProps, state, className(state), "button") : render} />;
}
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";
export function DropdownMenuContent({ className, render, ...props }: DropdownMenuContentProps) {
  return <NativeDropdownMenuContent {...props}
    className={join("store-m-code-menu", typeof className === "string" ? className : undefined)}
    render={typeof className === "function" ? (nativeProps, state) => renderStateClass(render, nativeProps, state, className(state), "div") : render} />;
}
DropdownMenuContent.displayName = "DropdownMenuContent";
export function DropdownMenuItem({ className, render, isSelected, ...props }: DropdownMenuItemProps) {
  return <NativeDropdownMenuItem {...props} isSelected={isSelected} data-selected={isSelected || undefined}
    className={join("store-m-code-menu-item", typeof className === "string" ? className : undefined)}
    render={typeof className === "function" ? (nativeProps, state) => renderStateClass(render, nativeProps, state, className(state), "div") : render} />;
}
DropdownMenuItem.displayName = "DropdownMenuItem";

function CodeSelect({ label, options, selected, onSelect }: {
  label: string; options: string[]; selected?: string; onSelect: (value: string) => void;
}) {
  return <DropdownMenu>
    <DropdownMenuTrigger aria-label={label} disabled={options.length === 0}>{selected ?? "No examples"}<span aria-hidden="true">⌄</span></DropdownMenuTrigger>
    <DropdownMenuContent>
      {options.map(option => <DropdownMenuItem key={option} isSelected={option === selected} onSelect={() => onSelect(option)}>{option}</DropdownMenuItem>)}
    </DropdownMenuContent>
  </DropdownMenu>;
}

export function CodeGroup(props: CodeGroupProps) {
  const items = Children.toArray(props.children).filter(isValidElement) as ReactElement<CodeBlockProps>[];
  const [selection, setSelection] = useState(() => Math.min(Math.max(0, props.initialSelectedTab ?? 0), Math.max(0, items.length - 1)));
  const selected = Math.min(selection, Math.max(0, items.length - 1));
  const id = useId();
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  if (!items.length) return null;
  const active = items[selected];
  function select(index: number) { if (index !== selected) { setSelection(index); props.onSelectedTabChange?.(index); } }
  const actions: CodeBlockProps = { ...props, children: active.props.children };
  return <ProCodeBlock ref={props.anchorRef} className={join("store-m-code store-m-code-group", props.noMargins && "store-m-code-no-margins", props.className)}
    data-code-theme={uiTheme(props.codeBlockTheme)} data-feedback-open={props.feedbackModalOpen || undefined}>
    <ProCodeBlock.Header className="store-m-code-header">
      {props.dropdown ? <CodeSelect label="Code language" options={items.map((item, index) => `${index + 1}. ${item.props.language ?? item.props.lang ?? item.props.filename ?? "Code"}`)}
        selected={`${selected + 1}. ${active.props.language ?? active.props.lang ?? active.props.filename ?? "Code"}`}
        onSelect={value => select(Number.parseInt(value, 10) - 1)} /> :
        <div role="tablist" aria-label="Code examples" className="store-m-code-tabs">
          {items.map((item, index) => <button key={index} type="button" role="tab" id={`${id}-tab-${index}`}
            aria-controls={`${id}-panel-${index}`} aria-selected={selected === index} tabIndex={selected === index ? 0 : -1}
            ref={element => { tabs.current[index] = element; }} onClick={() => select(index)}
            onKeyDown={event => {
              const next = event.key === "ArrowRight" ? (index + 1) % items.length : event.key === "ArrowLeft" ? (index - 1 + items.length) % items.length : event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : undefined;
              if (next !== undefined) { event.preventDefault(); select(next); tabs.current[next]?.focus(); }
            }}>
            {item.props.icon && <Icon icon={item.props.icon} overrideColor />}
            {item.props.filename ?? item.props.language ?? item.props.lang ?? `Example ${index + 1}`}
          </button>)}
        </div>}
      <CodeActions props={actions} source={codeSource(active.props.children)} />
    </ProCodeBlock.Header>
    {items.map((item, index) => <div key={index} role={props.dropdown ? "region" : "tabpanel"} id={`${id}-panel-${index}`}
      aria-labelledby={props.dropdown ? undefined : `${id}-tab-${index}`} aria-label={props.dropdown ? (item.props.filename ?? "Code example") : undefined}
      hidden={selected !== index}>
      {selected === index && <BaseCodeBlock {...item.props} isParentCodeGroup isSmallText={props.isSmallText ?? item.props.isSmallText}
        codeBlockTheme={props.codeBlockTheme ?? item.props.codeBlockTheme}
        codeBlockThemeObject={props.codeBlockThemeObject ?? item.props.codeBlockThemeObject} />}
    </div>)}
  </ProCodeBlock>;
}

export function CodeGroupSelect(props: CodeGroupSelectProps) {
  const languages = Object.keys(props.snippets);
  const [language, setLanguage] = useState(languages[0]);
  const selectedLanguage = languages.includes(language) ? language : languages[0];
  const examples = props.snippets[selectedLanguage] ?? {};
  const labels = Object.keys(examples);
  const [example, setExample] = useState(labels[0]);
  const selectedExample = labels.includes(example) ? example : labels[0];
  const snippet = examples[selectedExample];
  useEffect(() => {
    if (props.syncedLabel && props.syncedLabel !== selectedExample && labels.includes(props.syncedLabel)) {
      setExample(props.syncedLabel);
      props.setSelectedExampleIndex?.(labels.indexOf(props.syncedLabel));
    }
  }, [props.syncedLabel, selectedExample, labels.join("\u0000"), props.setSelectedExampleIndex]);
  function selectExample(value: string) {
    setExample(value);
    props.setSelectedExampleIndex?.(Math.max(0, labels.indexOf(value)));
    if (value !== props.syncedLabel) props.setSyncedLabel?.(value);
  }
  function selectLanguage(value: string) {
    setLanguage(value);
    const first = Object.keys(props.snippets[value] ?? {})[0];
    setExample(first);
    if (first !== undefined) {
      props.setSelectedExampleIndex?.(0);
      if (first !== props.syncedLabel) props.setSyncedLabel?.(first);
    }
  }
  return <ProCodeBlock className={join("store-m-code store-m-code-select", props.className)} data-testid="code-group-select" data-code-theme={uiTheme(props.codeBlockTheme)}>
    <ProCodeBlock.Header className="store-m-code-header">
      <CodeSelect label="Snippet language" options={languages} selected={selectedLanguage} onSelect={selectLanguage} />
      <CodeSelect label="Snippet example" options={labels} selected={selectedExample} onSelect={selectExample} />
      <CodeActions props={props} source={snippet?.code ?? ""} />
    </ProCodeBlock.Header>
    <section aria-label={props.codeSnippetAriaLabel ?? "Code snippet"}>
      {snippet?.audioUrl ? <div className="store-m-code-audio"><audio controls src={snippet.audioUrl}><track kind="captions" /></audio></div> :
        <BaseCodeBlock language={snippet?.language} codeBlockTheme={props.codeBlockTheme} codeBlockThemeObject={props.codeBlockThemeObject} isParentCodeGroup isSmallText>{snippet?.code}</BaseCodeBlock>}
    </section>
  </ProCodeBlock>;
}

export type FencedCodeBlockProps = ComponentPropsWithoutRef<"pre"> & {
  "data-raw-code"?: string;
  "data-language"?: string;
};
/** The compiler carries raw text independently of its rendered token tree. */
export function FencedCodeBlock({ children, className, title, "data-raw-code": raw, "data-language": language, ...props }: FencedCodeBlockProps) {
  return <ProCodeBlock className="store-m-code store-m-code-fence" data-code-theme="dark">
    <ProCodeBlock.Header className="store-m-code-header">
      <span className="store-m-code-title">{title ?? language ?? "Code"}</span>
      {raw !== undefined && <CopyCodeButton code={raw} />}
    </ProCodeBlock.Header>
    <pre {...props} className={join("store-m-code-compiled", className)} data-raw-code={raw} data-language={language} tabIndex={props.tabIndex ?? 0}>{children}</pre>
  </ProCodeBlock>;
}
