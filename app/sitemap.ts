import type { MetadataRoute } from "next";
import routes from "@/lib/agent-routes.generated.json";

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.markdown.map((path) => ({ url: `https://store.mattramotar.dev${path}` }));
}
