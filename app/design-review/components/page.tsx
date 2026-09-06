import { notFound } from "next/navigation";
import { getMDXComponents } from "@/mdx-components";
import SerializableFixtures from "./serializable.mdx";
import { ClientFixtures } from "./ClientFixtures";
import StatusMdx from "@/components/docs/mintlify/status/serializable.mdx";
import DisclosureMdx from "@/components/docs/mintlify/disclosure/serializable.mdx";
import LayoutMdx from "@/components/docs/mintlify/layout/serializable.mdx";
import CodeMdx from "@/components/docs/mintlify/code/serializable.mdx";
import OverlaysMdx from "@/components/docs/mintlify/overlays/serializable.mdx";
import DiagramsMdx from "@/components/docs/mintlify/diagrams/serializable.mdx";

export const metadata = { title: "Component review", robots: { index: false, follow: false } };

export default function ComponentGallery() {
  if (process.env.DOCS_COMPONENT_GALLERY !== "1") notFound();
  return <main id="content" className="mx-auto min-w-0 max-w-5xl space-y-10 px-5 py-10">
    <h1 id="page-title" className="text-3xl font-semibold">Store component review</h1>
    <SerializableFixtures components={getMDXComponents()} />
    <section id="mdx-family-fixtures" className="space-y-8">
      <StatusMdx components={getMDXComponents()} />
      <DisclosureMdx components={getMDXComponents()} />
      <LayoutMdx components={getMDXComponents()} />
      <CodeMdx components={getMDXComponents()} />
      <OverlaysMdx components={getMDXComponents()} />
      <DiagramsMdx components={getMDXComponents()} />
    </section>
    <ClientFixtures />
  </main>;
}
