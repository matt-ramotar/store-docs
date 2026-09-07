/** Minimal typed boundary for the frozen package's bundled JavaScript-only Mermaid core. */
declare module "*/mermaid/dist/mermaid.core.js" {
  interface MermaidEngine {
    initialize(config: Record<string, unknown>): void;
    render(id: string, chart: string, container?: HTMLElement): Promise<{ svg: string }>;
    mermaidAPI: { getConfig(): { themeVariables?: { background?: string; textColor?: string } } };
  }
  const mermaid: MermaidEngine;
  export default mermaid;
}
