import { withSearchApiErrors } from "@/lib/api-problem";
import { searchIndex } from "@/lib/search-index";

export const dynamic = "force-static";

export const GET = withSearchApiErrors(searchIndex.staticGET);
