import type { TOCItemType } from "fumadocs-core/toc";
import { Separator } from "@heroui/react";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/shell/AppShell";
import { getMDXComponents } from "@/mdx-components";
import { source } from "@/lib/source";

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const toc: TOCItemType[] =
    page.data.toc.length > 0
      ? page.data.toc
      : [{ depth: 2, title: page.data.title, url: "#page-title" }];

  return (
    <AppShell currentPath={page.url} pageTree={source.pageTree} toc={toc}>
      <article className="mx-auto max-w-3xl">
        <header className="space-y-4">
          <h1 id="page-title" className="text-4xl font-semibold tracking-tight">
            {page.data.title}
          </h1>
          {page.data.description ? (
            <p className="text-foreground-secondary max-w-2xl text-lg leading-8">
              {page.data.description}
            </p>
          ) : null}
          <Separator />
        </header>
        <div className="mt-8 leading-7">
          <MDX components={getMDXComponents()} />
        </div>
      </article>
    </AppShell>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
