import { CodeBlock } from "@heroui-pro/react/code-block";

import { CopyCodeButton } from "@/components/shell/CopyCodeButton";
import { highlightCode } from "@/lib/shiki";

export type CodeSlabProps = {
  code: string;
  lang: string;
  title: string;
};

export async function CodeSlab({ code, lang, title }: CodeSlabProps) {
  const highlightedCode = await highlightCode(code, lang);

  return (
    <CodeBlock className="store-m-code store-m-code-slab" data-code-theme="dark">
      <CodeBlock.Header className="store-m-code-header">
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{title}</span>
        <span className="text-store-code-foreground/75 text-xs">{lang}</span>
        <CopyCodeButton code={code} />
      </CodeBlock.Header>
      <div
        className="[&_.shiki]:m-0 [&_.shiki]:overflow-x-auto [&_.shiki]:bg-transparent [&_.shiki]:p-4 [&_.shiki]:font-mono [&_.shiki]:text-sm [&_.shiki]:leading-6"
        dangerouslySetInnerHTML={{ __html: highlightedCode }}
      />
    </CodeBlock>
  );
}
