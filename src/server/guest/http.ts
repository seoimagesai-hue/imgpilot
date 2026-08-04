import {GuestDomainError, httpStatusForGuestError, type SafeGuestErrorCode} from "@/server/guest/errors";

export function guestJson(
  body: Record<string, unknown>,
  init?: {status?: number; headers?: HeadersInit},
): Response {
  return Response.json(body, {
    status: init?.status ?? 200,
    headers: init?.headers,
  });
}

export function guestOk(data: Record<string, unknown>, init?: {headers?: HeadersInit}): Response {
  return guestJson({ok: true, ...data}, {status: 200, headers: init?.headers});
}

export function guestFail(
  code: SafeGuestErrorCode,
  status?: number,
): Response {
  return guestJson(
    {ok: false, error: code},
    {status: status ?? httpStatusForGuestError(code)},
  );
}

export function guestCatch(error: unknown): Response {
  if (error instanceof GuestDomainError) {
    return guestFail(error.code);
  }
  console.error("[guest] unhandled", error instanceof Error ? error.message : "unknown");
  return guestFail("INTERNAL_ERROR");
}

export function clientIpFromRequest(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    return first || null;
  }
  return request.headers.get("x-real-ip");
}

/** Hash IP for privacy — never store raw IP. */
export async function hashIpHint(ip: string | null): Promise<string | null> {
  if (!ip) return null;
  const {createHash} = await import("node:crypto");
  return createHash("sha256").update(ip, "utf8").digest("hex").slice(0, 32);
}
