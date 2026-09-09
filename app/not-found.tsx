import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-lg leading-8 text-foreground-secondary">This URL does not identify a page on the Store documentation site. Start with the documentation index or use the sitemap to find a page.</p>
      <ul className="space-y-3 text-accent-strong underline">
        <li><Link href="/docs">Documentation index</Link></li>
        <li><Link href="/docs/store6">Store 6 documentation</Link></li>
        <li><a href="/llms.txt">Agent index</a></li>
        <li><a href="/sitemap.xml">Sitemap</a></li>
        <li><a href="/openapi.json">HTTP API specification</a></li>
      </ul>
    </main>
  );
}
