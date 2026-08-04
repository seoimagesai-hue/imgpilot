export type DocSlug =
  | "getting-started"
  | "uploads"
  | "validation"
  | "processing"
  | "ai-metadata"
  | "ai-batches"
  | "exports"
  | "billing"
  | "api"
  | "webhooks"
  | "wordpress"
  | "shopify"
  | "webflow"
  | "cloudinary"
  | "automation"
  | "collaboration";

export type DocDefinition = {
  path: string;
  title: string;
  description: string;
  sections: {h: string; p: string[]}[];
};

export const DOCS: Record<DocSlug, DocDefinition> = {
  "getting-started": {
    path: "/docs/getting-started",
    title: "Getting started",
    description: "Register, create a project, upload, validate, process, review metadata and export.",
    sections: [
      {
        h: "Steps",
        p: [
          "Register or sign in.",
          "Create a website project and choose metadata output language independently of the UI language.",
          "Upload private originals (direct-to-storage when R2 is configured).",
          "Wait for trusted validation.",
          "Run optimize, resize or convert jobs (single or bulk).",
          "Generate AI metadata drafts, edit, and approve.",
          "Export ZIP/CSV/JSON packages from approved metadata.",
        ],
      },
    ],
  },
  uploads: {
    path: "/docs/uploads",
    title: "Uploads",
    description: "Supported types, 25 MB limit, batch limits, private direct upload and quotas.",
    sections: [
      {
        h: "Limits and behaviour",
        p: [
          "Supported upload types include JPEG, PNG, WebP, GIF and AVIF within validation policy.",
          "Individual files are limited to 25 MB.",
          "Authorize batches are bounded (up to 500 file descriptors per authorize request).",
          "Uploads go to private object storage via short-lived signed PUT URLs when configured.",
          "Project quotas reserve and account for storage before and after confirmation.",
        ],
      },
    ],
  },
  validation: {
    path: "/docs/validation",
    title: "Validation",
    description: "Trusted decode, corrupt handling, dimension and pixel limits, animation policy.",
    sections: [
      {
        h: "Trusted validation",
        p: [
          "Server-side Sharp metadata plus full decode is required — client claims are not trusted alone.",
          "Corrupt or unsupported images fail with safe error codes.",
          "Width, height, pixel and animation limits are enforced by policy.",
          "Validated images can be promoted toward ready-for-processing.",
        ],
      },
    ],
  },
  processing: {
    path: "/docs/processing",
    title: "Processing",
    description: "Optimization, resize presets, conversion matrix, workers, retry and immutable originals.",
    sections: [
      {
        h: "Operations",
        p: [
          "Same-format optimization creates private derivatives; originals are never overwritten.",
          "Resize presets: 256, 512, 1024, 2048 max edge — no crop, stretch or upscale.",
          "Format conversion follows the allow-list matrix; PNG to JPEG is blocked.",
          "Bulk runs apply one operation type; background workers lease jobs with heartbeats.",
          "Eligible failures can be retried; queued work can be cancelled. Output may not always be smaller.",
        ],
      },
    ],
  },
  "ai-metadata": {
    path: "/docs/ai-metadata",
    title: "AI metadata",
    description: "Fields, languages, human review, approval, regeneration, privacy and limitations.",
    sections: [
      {
        h: "Human-reviewed drafts",
        p: [
          "Fields: alt text, title, caption, description, filename suggestion.",
          "Project metadata language is independent of interface locale (English/Urdu UI).",
          "AI drafts require explicit human approval before export defaults treat them as approved.",
          "Filename suggestions are not applied automatically to R2 keys.",
          "Provider availability is external; sensitive-trait inference is prohibited.",
        ],
      },
    ],
  },
  "ai-batches": {
    path: "/docs/ai-batches",
    title: "Bulk AI metadata batches",
    description:
      "Run template-based AI metadata across many images with preflight checks, progress tracking, and bulk human review.",
    sections: [
      {
        h: "Orchestration, not auto-publish",
        p: [
          "Bulk batches call the same single-image AI metadata service used elsewhere — they do not bypass human review or auto-approve output.",
          "Each eligible image is sent to the configured AI provider as a temporary analysis copy; originals remain in private R2 storage.",
          "Drafts must be reviewed and explicitly approved before they become approved metadata for exports or integrations.",
        ],
      },
      {
        h: "Templates and languages",
        p: [
          "Choose a fixed template: SEO, accessibility, or e-commerce. Templates define prompt version and output fields — there is no custom raw prompt field in the dashboard.",
          "Output language can be English or Urdu when supported by the template, independent of the interface locale.",
          "Preflight resolves ownership, eligibility, existing drafts, rate limits, and monthly AI allowance before a batch starts.",
        ],
      },
      {
        h: "Progress and review",
        p: [
          "Batch progress shows real counters: queued, running, draft, failed, cancelled, stale, and skipped items.",
          "Active batches can be cancelled; failed items can be retried when policy allows.",
          "When drafts are ready, open bulk review to inspect alt text, title, quality scores, and duplicate flags — then approve or reject selected rows with confirmation.",
        ],
      },
      {
        h: "Limits",
        p: [
          "Up to 50 images per batch and a small number of concurrently active batches per workspace.",
          "Monthly AI allowances and per-image/per-project daily generation limits still apply.",
          "Workflow automation can also trigger metadata batches via the generate_metadata_batch action.",
        ],
      },
    ],
  },
  exports: {
    path: "/docs/exports",
    title: "Exports",
    description: "ZIP, CSV, JSON, sidecars, CMS-ready kits, private downloads and expiry.",
    sections: [
      {
        h: "Packages",
        p: [
          "Supported packages include CSV, JSON, ZIP with optional images, HTML report and sidecars.",
          "CMS-ready kits prepare generic, WordPress, Shopify and Webflow import folders.",
          "Default source filter is approved metadata.",
          "Downloads use owner-only short-lived signed URLs. Packages do not call CMS APIs.",
        ],
      },
    ],
  },
  billing: {
    path: "/docs/billing",
    title: "Billing",
    description: "Checkout, Portal, usage resets, storage, cancellation, payment failure and downgrade.",
    sections: [
      {
        h: "Subscriptions",
        p: [
          "Free plan is always available with catalog limits.",
          "Paid Checkout requires configured Stripe Price IDs — prices are never invented in the app.",
          "Entitlements activate after Stripe webhook synchronization; success redirects are not payment proof.",
          "Physical storage does not reset monthly; monthly processing/AI/export allowances follow the billing period.",
          "Downgrade and past_due preserve data; new over-limit work may be restricted. Use Customer Portal for payment methods.",
        ],
      },
    ],
  },
  api: {
    path: "/docs/api",
    title: "API",
    description: "Bearer authentication, scopes, idempotency, rate limits, and pagination for the public REST API.",
    sections: [
      {
        h: "Authentication and scopes",
        p: [
          "Create scoped API keys from Dashboard → Settings → Developer → API keys. Raw keys are shown once at creation or rotation and are never recoverable afterward.",
          "Send the key as `Authorization: Bearer <key>` — keys are never accepted as a query parameter.",
          "Each key is granted an explicit list of scopes (e.g. projects:read, images:upload, metadata:generate, exports:create) from a fixed allow-list; requests missing a required scope fail with API_KEY_SCOPE_INSUFFICIENT.",
          "Keys are bound to exactly one workspace (personal or a single organization) and can never reach another workspace's data.",
        ],
      },
      {
        h: "Idempotency",
        p: [
          "Every write (POST) request requires an `Idempotency-Key` header (8-128 chars).",
          "Retrying the same key replays the original response byte-for-byte; reusing a key with a different request body is rejected.",
          "Long-running operations (processing jobs, AI metadata generation, exports) respond 202 Accepted and continue asynchronously via background workers — poll the returned resource to see completion.",
        ],
      },
      {
        h: "Rate limits and pagination",
        p: [
          "Each API key has a per-minute request limit determined by the workspace's plan; exceeding it returns API_RATE_LIMITED with a 429 status.",
          "List endpoints are cursor-paginated: pass the opaque `cursor` value from a response's `meta.nextCursor` to fetch the next page. Cursors are signed and bound to the issuing key's workspace.",
          "Every response is a JSON envelope with `ok`, `data`, an optional `meta`, and a `requestId` for support correlation.",
        ],
      },
      {
        h: "Reference",
        p: [
          "The full OpenAPI 3.1 document for every implemented route is served at /api/v1/openapi.",
          "See the Webhooks documentation for outbound event notifications and signature verification.",
        ],
      },
    ],
  },
  webhooks: {
    path: "/docs/webhooks",
    title: "Webhooks",
    description: "Registering endpoints, verification challenges, signature verification, retries, and safety limits.",
    sections: [
      {
        h: "Registering an endpoint",
        p: [
          "Add a webhook endpoint from Dashboard → Settings → Developer → Webhooks with a name, a public HTTPS URL on port 443, and the event types to receive.",
          "New endpoints start in pending_verification and receive no real events until they pass a verification challenge.",
          "URLs are validated against SSRF: only public HTTPS hostnames are allowed — no localhost, private/link-local ranges, or cloud metadata addresses — and this check is repeated immediately before every delivery (DNS rebinding protection).",
        ],
      },
      {
        h: "Verification and testing",
        p: [
          "Verifying sends a signed POST with a random challenge token; your endpoint must respond 2xx and echo `{ \"challenge\": \"<token>\" }` in its JSON body.",
          "Once active, use \"Send test event\" to confirm your receiver is reachable and correctly validates signatures before relying on real traffic.",
        ],
      },
      {
        h: "Signature verification",
        p: [
          "Every delivery includes `x-webhook-signature: v1=<hex hmac>` and `x-webhook-timestamp: <unix seconds>` headers.",
          "Recompute HMAC-SHA256 over `${timestamp}.${rawBody}` using your endpoint's signing secret, compare it to the provided signature using a constant-time comparison, and reject requests with a stale timestamp.",
          "The signing secret is shown once at creation or rotation time and is never retrievable afterward — rotate it immediately if it may have leaked.",
        ],
      },
      {
        h: "Retries and limits",
        p: [
          "Failed deliveries (5xx or a timeout) retry on an exponential backoff schedule up to 7 attempts before being marked exhausted.",
          "An endpoint that accumulates too many consecutive failures is automatically disabled and must be re-enabled after the underlying issue is fixed.",
          "Endpoint counts per workspace are limited by plan; see the API documentation for authentication and idempotency shared with the REST API.",
        ],
      },
    ],
  },
  wordpress: {
    path: "/docs/wordpress",
    title: "WordPress",
    description: "Connecting a self-hosted WordPress site, Application Passwords, and what publishing does and does not do.",
    sections: [
      {
        h: "Connecting a site",
        p: [
          "Only self-hosted WordPress sites reachable over a public HTTPS URL can be connected — no localhost, private/link-local ranges, or cloud metadata addresses, matching the same SSRF protections used for webhooks.",
          "Authentication uses a dedicated WordPress Application Password (Users → Profile → Application Passwords in wp-admin), never the account's main login password.",
          "New connections start pending and must pass a verification check (valid credentials, media upload capability, and a reachable media REST endpoint) before they can publish.",
        ],
      },
      {
        h: "What publishing does",
        p: [
          "Publishing uploads the image's active derivative (or the original, if no derivative is selected) to the site's Media Library and sets its title, alt text, caption and description from your approved metadata.",
          "Every publish is verified by re-reading the media item back from WordPress after upload; partial failures (e.g. metadata update failed but the upload succeeded) are reported separately from full failures.",
          "Uploads are never repeated once a remote media ID exists — retries resume from the metadata/verification step, they do not re-upload the file.",
        ],
      },
      {
        h: "What publishing does not do",
        p: [
          "SEO Images never creates, edits, or deletes WordPress posts or pages — only media library items it uploaded itself are touched.",
          "Nothing is ever deleted remotely on your WordPress site by this integration; disconnecting a connection only stops future publishing and destroys the locally stored credentials.",
          "Credentials (username and Application Password) are encrypted at rest and are never returned by any API response or shown again in the dashboard after they are saved.",
        ],
      },
      {
        h: "Limits and retries",
        p: [
          "Connection counts, monthly publish volume, and bulk publish batch size are limited by plan.",
          "Failures such as authentication or permission errors are not retried automatically; transient network or availability errors are retried with a bounded attempt count before a job is marked failed.",
        ],
      },
    ],
  },
  shopify: {
    path: "/docs/shopify",
    title: "Shopify",
    description: "Connecting a Shopify store with a Custom App access token, and what publishing does and does not do.",
    sections: [
      {
        h: "Connecting a store",
        p: [
          "Authentication uses a Shopify Custom App's Admin API access token (Settings → Apps and sales channels → Develop apps in Shopify admin) — Shopify OAuth apps are not supported.",
          "The shop must be a `*.myshopify.com` domain; custom storefront domains are not accepted when creating a connection.",
          "New connections start pending and must pass a verification check (a valid access token and a reachable Admin API) before they can publish.",
        ],
      },
      {
        h: "What publishing does",
        p: [
          "Publishing attaches the image's active derivative (or the original, if no derivative is selected) to a Shopify product you search for and select from your own store — it never creates a new product, variant, order, or inventory record.",
          "The image's alt text is set from your approved metadata, and every publish is verified by re-reading the product image back from Shopify after upload.",
          "Uploads are never repeated once a remote image ID exists — retries resume from the metadata/verification step, they do not re-upload the file.",
        ],
      },
      {
        h: "What publishing does not do",
        p: [
          "SEO Images never creates, edits, or deletes Shopify products, variants, orders, or inventory — only the product image it uploaded itself is touched.",
          "Nothing is ever deleted remotely on your Shopify store by this integration; disconnecting a connection or deleting the SaaS project only stops future publishing and destroys the locally stored access token.",
          "The Admin API access token is encrypted at rest and is never returned by any API response or shown again in the dashboard after it is saved.",
        ],
      },
      {
        h: "Limits and retries",
        p: [
          "Connection counts, monthly publish volume, and bulk publish batch size are limited by plan.",
          "Failures such as authentication or permission errors are not retried automatically; transient network or availability errors are retried with a bounded attempt count before a job is marked failed.",
        ],
      },
    ],
  },
  webflow: {
    path: "/docs/webflow",
    title: "Webflow",
    description: "Connecting a Webflow site with a Site access token, mapping CMS fields, and what publishing does and does not do.",
    sections: [
      {
        h: "Connecting a site",
        p: [
          "Authentication uses a Webflow Site access token (Site settings → Apps and integrations → API access in Webflow) — Webflow OAuth apps are not supported in this release.",
          "Generate the token with assets:read, assets:write, cms:read, and cms:write scopes; a token without these scopes will fail verification with a permission error.",
          "After connecting, select which Webflow site the connection targets from the sites your token can access — a connection targets exactly one site at a time.",
          "New connections start pending and must pass a verification check (a valid token and confirmed access to the selected site) before they can publish.",
        ],
      },
      {
        h: "Mapping CMS fields",
        p: [
          "Before publishing, an owner or admin must map an existing Webflow collection: choose the collection, discover its live field schema, and assign one Image field (required) plus optional PlainText/RichText fields for alt text, title, caption, and description.",
          "SEO Images never creates a collection or a field — mapping only binds a publish job to fields that already exist in your Webflow site.",
          "If a mapped field is later renamed or removed in Webflow, the mapping is marked stale and must be re-mapped before new jobs can use it; jobs already queued against the old mapping fail safely instead of writing to the wrong field.",
        ],
      },
      {
        h: "What publishing does",
        p: [
          "Publishing searches for and selects an EXISTING CMS collection item in your Webflow site, uploads the image's active derivative (or the original, if no derivative is selected) as a new Webflow asset, and updates only the mapped fields on that item — it never creates a collection or a CMS item.",
          "Every publish is verified by re-reading the asset and the CMS item back from Webflow after the update; partial failures (e.g. the asset uploaded but the CMS update failed) are reported separately from full failures.",
          "Assets are never re-uploaded once a remote asset id exists — retries resume from the CMS update/verification step.",
          "Images over Webflow's 4 MB asset limit are rejected before any upload is attempted.",
        ],
      },
      {
        h: "What publishing does not do",
        p: [
          "SEO Images never creates, edits, or deletes Webflow collections, CMS items outside the one you selected, or Designer/layout elements — only the mapped fields on the CMS item you chose are touched.",
          "Updating a CMS item's fields does not publish your live Webflow site — Webflow may require a separate, explicit site publish (from within Webflow) before the change is visible on your public domain. SEO Images never triggers a site-wide publish.",
          "Nothing is ever deleted remotely on your Webflow site by this integration; disconnecting a connection only stops future publishing and destroys the locally stored access token — assets and CMS field values already published to Webflow remain untouched.",
          "The Site access token is encrypted at rest and is never returned by any API response or shown again in the dashboard after it is saved.",
        ],
      },
      {
        h: "Limits and retries",
        p: [
          "Connection counts, monthly publish volume, and bulk publish batch size are limited by plan.",
          "Failures such as authentication or permission errors are not retried automatically; rate limits and transient network or availability errors are retried with a bounded attempt count before a job is marked failed.",
        ],
      },
    ],
  },
  cloudinary: {
    path: "/docs/cloudinary",
    title: "Cloudinary",
    description: "Connecting Cloudinary as an optional publish/delivery destination, public vs signed delivery, and what publishing does and does not do.",
    sections: [
      {
        h: "Connecting a Cloudinary account",
        p: [
          "Authentication uses your Cloudinary cloud name, API key, and API secret (from the Cloudinary Console) — never OAuth and never the `cloudinary` npm SDK; every call is a signed, server-side `fetch` request.",
          "R2 remains the private source of truth for every original and derivative image at all times. Cloudinary is an optional, additional remote destination — nothing is ever removed from or made dependent on R2.",
          "The API secret is encrypted at rest and is never returned by any API response or shown again in the dashboard after it is saved — not even right after you save it.",
          "New connections start pending and must pass a verification check (a valid cloud name, API key, and API secret confirmed against Cloudinary's ping endpoint) before they can publish.",
        ],
      },
      {
        h: "Public vs signed delivery",
        p: [
          "`upload` (public) delivery serves images from a predictable, unsigned URL under `res.cloudinary.com` — anyone with the link can view the image. This requires an explicit, one-time acknowledgement per connection before it can be used.",
          "`signed` delivery generates a fresh, server-computed signed URL for every request instead of trusting a stored signature, and does not require the public-delivery acknowledgement.",
          "Choosing `upload` delivery does not change anything about R2: your private originals in R2 are unaffected and remain inaccessible to the public regardless of what you publish to Cloudinary.",
        ],
      },
      {
        h: "What publishing does",
        p: [
          "Publishing uploads the image's active derivative (or the original, if no derivative is selected) to Cloudinary under a server-generated public ID and sets its alt text, caption, title, and description from your approved metadata as Cloudinary context metadata.",
          "Every publish is verified by re-reading the asset back from Cloudinary's Admin API after upload; partial failures (e.g. the upload succeeded but the metadata update failed) are reported separately from full failures.",
          "Assets are always uploaded with `overwrite=false` — an existing asset is never silently replaced — and are never re-uploaded once a remote asset id exists; retries resume from the metadata update/verification step.",
          "Only a fixed set of transformation presets (original, thumbnail, small, medium, large) can be requested for delivery — arbitrary or user-supplied transformation strings are never accepted.",
        ],
      },
      {
        h: "What publishing does not do",
        p: [
          "SEO Images never calls Cloudinary's destroy/delete APIs — nothing is ever deleted remotely on Cloudinary by this integration, whether you disconnect a connection or delete the SaaS project.",
          "Disconnecting a connection only stops future publishing and destroys the locally stored credentials; assets already published to Cloudinary remain there untouched.",
          "The browser never talks to Cloudinary directly — every upload, verification, metadata update, and signed delivery URL is generated by our servers.",
        ],
      },
      {
        h: "Limits and retries",
        p: [
          "Connection counts, monthly publish volume, and bulk publish batch size are limited by plan.",
          "Failures such as authentication or permission errors are not retried automatically; rate limits and transient network or availability errors are retried with a bounded attempt count before a job is marked failed.",
        ],
      },
    ],
  },
  automation: {
    path: "/docs/automation",
    title: "Automation workflows",
    description:
      "Orchestration-only workflows that chain existing image features — triggers, conditions, and actions. Not AI agents; R2 remains the source of truth.",
    sections: [
      {
        h: "Orchestration only — not AI agents",
        p: [
          "Workflows automate sequences of features that already exist in SEO Images: validation, processing, metadata approval, exports, Cloudinary publish, and webhooks.",
          "They do not replace R2 object storage, invent new processing engines, or run autonomous AI agents. Every step delegates to the same server-owned services used by the dashboard and public API.",
          "Disabling or deleting a workflow never deletes images, derivatives, or metadata in R2.",
        ],
      },
      {
        h: "Triggers",
        p: [
          "Event triggers fire when domain events occur: image uploaded, validated, metadata approved, processing completed, bulk processing completed, or image published to an integration.",
          "Manual triggers let authorized members queue a run from the dashboard (optionally scoped to a project and image).",
          "Scheduled triggers run on an hourly, daily, or weekly interval for workspace-wide maintenance tasks such as batch exports.",
        ],
      },
      {
        h: "Conditions and actions",
        p: [
          "Condition steps filter the run context — format, dimensions, byte size, metadata language, approval state, or publish state — before subsequent actions execute.",
          "Action steps call fixed allow-listed operations: validate, optimize, resize (256/512/1024/2048 presets), convert format, generate metadata, wait for metadata approval, publish to Cloudinary, export CSV/JSON, send webhook, update status, or notify a user.",
          "Each action step declares onFailure behaviour: fail the run, skip the step, or retry according to the workflow's retry policy.",
        ],
      },
      {
        h: "Runs, limits, and permissions",
        p: [
          "Workflow definitions must be disabled before editing steps or metadata. Enabling requires at least one valid step.",
          "Run history records step-level logs, error codes, and durations. Failed runs can be retried when policy allows.",
          "Availability, concurrent runs, monthly run quotas, and maximum workflow count depend on your plan. View and manage permissions follow the workspace role matrix (view, manage, run).",
        ],
      },
    ],
  },
  collaboration: {
    path: "/docs/collaboration",
    title: "Team collaboration",
    description:
      "Project activity feed and plain-text review comments with @mentions — dashboard session API only in v1; no WebSockets or email.",
    sections: [
      {
        h: "Activity feed",
        p: [
          "Team-visible events are stored separately from personal analytics — approvals, AI batches, comments, and thread resolution appear on the project Activity page.",
          "Activity summaries never include storage keys, signed URLs, or secrets.",
          "Viewers can read activity; editors and above perform actions that emit events.",
        ],
      },
      {
        h: "Comment threads",
        p: [
          "Threads attach to review subjects: project, image, metadata generation, AI batch, or batch item.",
          "Comments are plain text only — HTML is stripped, whitespace collapsed, and length is capped.",
          "Mention teammates with @email; matched org members receive stored mentions (no email in v1).",
          "Comments are soft-deleted; threads can be resolved and reopened by members with resolve permission.",
          "Comments never auto-approve metadata.",
        ],
      },
      {
        h: "API access",
        p: [
          "Dashboard session routes: GET/POST /api/projects/{projectId}/activity, GET/POST /api/projects/{projectId}/comments, POST delete and thread resolve endpoints.",
          "Public API v1 activity read is deferred — use the dashboard feed until a dedicated scope ships.",
          "Webhooks: comment.created and thread.resolved with safe payloads.",
        ],
      },
    ],
  },
};

export function getDoc(slug: DocSlug): DocDefinition {
  return DOCS[slug];
}
