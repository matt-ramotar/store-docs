import { loadStoreDiagram, type StoreDiagramId } from "@/lib/store-diagrams";

/** Static inline SVG is available in the initial HTML, including without JavaScript. */
export async function StoreDiagram({ id }: { id: StoreDiagramId }) {
  const { svg, title, description } = await loadStoreDiagram(id);
  return (
    <figure className="store-designed-diagram" data-diagram={id}>
      <div
        className="store-designed-diagram-viewport"
        role="region"
        aria-label={`${title}; scroll horizontally on small screens`}
        tabIndex={0}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <figcaption>
        <span dangerouslySetInnerHTML={{ __html: description }} />
        <a className="font-medium text-accent-strong underline decoration-separator decoration-1 underline-offset-4" href={`/diagrams/${id}.html`} aria-label={`Open ${title} at full size`}>Open full size</a>
      </figcaption>
    </figure>
  );
}
