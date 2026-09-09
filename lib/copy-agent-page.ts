export async function copyAgentPage(
  url: string,
  dependencies: {
    fetchPage: typeof fetch;
    writeText: (value: string) => Promise<void>;
  },
) {
  const { fetchPage } = dependencies;
  const response = await fetchPage(url);
  if (!response.ok) throw new Error("Markdown could not be loaded.");
  if (response.headers.get("content-type")?.split(";")[0].trim() !== "text/markdown") {
    throw new Error("Markdown is unavailable for this page.");
  }

  const markdown = await response.text();
  await dependencies.writeText(markdown);
}
