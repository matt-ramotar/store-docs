import type * as PageTree from "fumadocs-core/page-tree";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getMDXComponents } from "@/mdx-components";
import { source } from "@/lib/source";

function TreeNodes({ nodes }: { nodes: PageTree.Node[] }) {
  return (
    <ul style={{ listStyle: "none", paddingLeft: "1rem", margin: 0 }}>
      {nodes.map((node, i) => {
        if (node.type === "page") {
          return (
            <li key={node.url}>
              <Link href={node.url}>{node.name}</Link>
            </li>
          );
        }
        if (node.type === "folder") {
          return (
            <li key={i}>
              <span>{node.name}</span>
              <TreeNodes nodes={node.children} />
            </li>
          );
        }
        return <li key={i}>{node.name}</li>;
      })}
    </ul>
  );
}

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <div style={{ display: "flex", gap: "2rem", padding: "2rem" }}>
      <nav aria-label="Docs" style={{ minWidth: "14rem" }}>
        <TreeNodes nodes={source.pageTree.children} />
      </nav>
      <article style={{ maxWidth: "48rem" }}>
        <h1>{page.data.title}</h1>
        <MDX components={getMDXComponents()} />
      </article>
    </div>
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
