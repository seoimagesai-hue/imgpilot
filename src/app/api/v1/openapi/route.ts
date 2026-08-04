/**
 * Public API v1 — OpenAPI 3.1 document for the implemented `/api/v1/*` routes.
 * No authentication required; contains no real secrets (example keys only).
 */
import openapiDocument from "@/server/api/openapi-v1.json";

export const runtime = "nodejs";
export const dynamic = "force-static";

export async function GET() {
  return Response.json(openapiDocument, {
    headers: {
      "Cache-Control": "public, max-age=300",
    },
  });
}
