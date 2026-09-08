import type { TOCItemType } from "fumadocs-core/toc";
import { SeparatorRoot as Separator } from "@heroui/react/separator";
import { getBreadcrumbItems } from "fumadocs-core/breadcrumb";
import { findNeighbour } from "fumadocs-core/page-tree";
import { notFound } from "next/navigation";

import { AgentPageActions } from "@/components/docs/AgentPageActions";
import { AppShell } from "@/components/shell/AppShell";
import { Breadcrumbs } from "@/components/shell/Breadcrumbs";
import { OnThisPage } from "@/components/shell/OnThisPage";
import { PageFooterNav } from "@/components/shell/PageFooterNav";
import { getMDXComponents } from "@/mdx-components";
import { getDocsVersion, getVersionTrees } from "@/lib/nav";
import { source } from "@/lib/source";
import agentDocsManifest from "@/public/llms/store6-manifest.json";

function findAgentPage(pageUrl: string) {
  return agentDocsManifest.pages.find(
    (entry) => new URL(entry.canonicalUrl).pathname === pageUrl,
  );
}

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

  const versionTree = getVersionTrees(source.pageTree)[getDocsVersion(page.url)];
  const breadcrumbItems = getBreadcrumbItems(page.url, versionTree, { includePage: true });
  const { previous, next } = findNeighbour(versionTree, page.url);
  const agentPage = findAgentPage(page.url);

  return (
    <AppShell currentPath={page.url} pageTree={source.pageTree} toc={toc}>
      <article className="mx-auto w-full min-w-0 max-w-3xl">
        <header className="space-y-4">
          <Breadcrumbs items={breadcrumbItems} />
          <h1 id="page-title" className="text-4xl font-semibold tracking-tight">
            {page.data.title}
          </h1>
          {page.data.description ? (
            <p className="text-foreground-secondary max-w-2xl text-lg leading-8">
              {page.data.description}
            </p>
          ) : null}
          {agentPage ? (
            <AgentPageActions markdownUrl={new URL(agentPage.markdownUrl).pathname} />
          ) : null}
          <OnThisPage items={toc} compact />
          <Separator />
        </header>
        <div id="content" className="mt-8 min-w-0 leading-7">
          <MDX components={getMDXComponents()} />
        </div>
        <PageFooterNav
          next={next?.url ? { name: next.name, url: next.url } : undefined}
          previous={previous?.url ? { name: previous.name, url: previous.url } : undefined}
        />
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
  const agentPage = findAgentPage(page.url);

  return {
    title: page.data.title,
    description: page.data.description,
    alternates: agentPage
      ? { types: { "text/markdown": agentPage.markdownUrl } }
      : undefined,
  };
}
