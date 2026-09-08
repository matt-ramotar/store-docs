import type { Metadata } from "next";

import { SideTree } from "@/components/shell/SideTree";
import { TopNav } from "@/components/shell/TopNav";
import { getVersionTrees } from "@/lib/nav";
import { source } from "@/lib/source";
import { loadStoreDiagram, storeDiagramIds } from "@/lib/store-diagrams";

import styles from "./styles.module.css";

const description = "Explore Store architecture, data flows, and lifecycle diagrams.";

export const metadata: Metadata = { title: "Diagrams", description };

export default async function DiagramsPage() {
  const tree = getVersionTrees(source.pageTree).store6;
  const diagrams = await Promise.all(
    storeDiagramIds.map(async (id) => ({ id, ...await loadStoreDiagram(id) })),
  );

  return (
    <>
      <a className="skip-to-content" href="#main-content">Skip to content</a>
      <TopNav currentPath="/diagrams" tree={tree} version="store6" />
      <div className="flex w-full">
        <aside
          aria-label="Documentation sidebar"
          className="sticky top-[97px] hidden h-[calc(100svh-97px)] w-64 shrink-0 overflow-y-auto px-3 py-6 lg:block"
        >
          <SideTree currentPath="/diagrams" tree={tree} />
        </aside>
        <main id="main-content" tabIndex={-1} className="mx-auto min-w-0 max-w-5xl flex-1 px-6 py-10 sm:py-12">
          <header className="mb-8 space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight">Diagrams</h1>
            <p className="text-foreground-secondary text-lg leading-7">{description}</p>
          </header>
          <ul className="border-separator border-t" role="list">
            {diagrams.map(({ id, svg, title, description }) => (
              <li key={id} className={styles.row} data-diagram={id}>
                <div
                  aria-hidden="true"
                  inert
                  className={`store-designed-diagram ${styles.thumbnail}`}
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold leading-7 tracking-tight">
                    <a
                      className={styles.titleLink}
                      href={`/diagrams/${id}.html`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${title} (opens in a new tab)`}
                    >
                      {title}
                    </a>
                  </h2>
                  <p className="text-foreground-secondary mt-3 leading-7">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </main>
      </div>
    </>
  );
}
