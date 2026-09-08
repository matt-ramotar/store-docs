import { Fragment } from "react";
import { Link } from "@heroui/react/link";

import type { InlineToken } from "./content/inline";

export function InlineContent({ tokens }: { tokens: readonly InlineToken[] }) {
  return (
    <>
      {tokens.map((token, index) => (
        <Fragment key={index}>
          {typeof token === "string" ? (
            token
          ) : "code" in token ? (
            <code>{token.code}</code>
          ) : (
            <Link href={token.href}>{token.label}</Link>
          )}
        </Fragment>
      ))}
    </>
  );
}
