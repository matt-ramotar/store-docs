import { Fragment } from "react";
import { codeToTokens } from "shiki";

import { storeCodeTheme } from "@/lib/shiki";

const FIRST_STORE = `val users = store<UserKey, User> {
    fetcher { key -> FakeApi.getUser(key.id) }
}

users.stream(UserKey("1")).collect { result -> render(result) }
val user = users.get(UserKey("2"))`;

export async function KeyEngineTrace() {
  const { tokens } = await codeToTokens(FIRST_STORE, {
    lang: "kotlin",
    theme: storeCodeTheme,
  });

  return (
    <figure className="min-w-0 rounded-[1.75rem] border border-store-code-foreground/15 bg-store-code-surface p-5 text-store-code-foreground shadow-surface sm:p-7">
      <div className="flex items-center justify-between gap-4 border-b border-store-code-foreground/15 pb-4">
        <p className="font-mono text-sm font-semibold text-store-code-function">Your first Store</p>
        <span className="rounded-full border border-store-code-foreground/20 px-3 py-1 text-xs font-medium text-store-code-comment">
          Illustrative shape
        </span>
      </div>
      <pre
        aria-label="Fetcher-only Store example"
        className="mt-6 min-w-0 overflow-x-auto font-mono text-sm leading-7 text-store-code-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-store-code-function sm:text-[15px]"
        tabIndex={0}
      >
        <code>{tokens.map((line, lineIndex) => (
          <Fragment key={lineIndex}>
            {lineIndex > 0 ? "\n" : null}
            {line.map((token, tokenIndex) => (
              <span key={tokenIndex} style={{ color: token.color }}>{token.content}</span>
            ))}
          </Fragment>
        ))}</code>
      </pre>
      <figcaption className="store-code-caption mt-6 border-t border-store-code-foreground/15 pt-5 text-sm leading-6 text-store-code-comment">
        The <code className="store-inline-code">store {"{}"}</code> block is verbatim from the executable Quickstart module. The
        two read lines are simplified illustrations of the same <code className="store-inline-code">stream</code> and <code className="store-inline-code">get</code> calls.
      </figcaption>
    </figure>
  );
}
