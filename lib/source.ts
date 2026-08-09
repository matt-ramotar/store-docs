import { loader } from "fumadocs-core/source";

import { docs } from "@/.source/server";

/** Shared headless source for page lookup, navigation, and static parameters. */
export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
});
