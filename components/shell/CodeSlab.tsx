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
    <figure className="bg-store-code-surface text-store-code-foreground my-6 overflow-hidden rounded-2xl">
      <figcaption className="flex min-h-11 items-center gap-3 px-4 py-2">
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{title}</span>
        <span className="text-store-code-foreground/75 text-xs">{lang}</span>
        <CopyCodeButton code={code} />
      </figcaption>
      <div
        className="[&_.shiki]:m-0 [&_.shiki]:overflow-x-auto [&_.shiki]:bg-transparent [&_.shiki]:p-4 [&_.shiki]:font-mono [&_.shiki]:text-sm [&_.shiki]:leading-6"
        dangerouslySetInnerHTML={{ __html: highlightedCode }}
      />
    </figure>
  );
}
