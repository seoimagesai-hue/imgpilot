import {readGuestRawTokenFromCookie} from "@/server/guest/cookie";
import {resolveGuestSessionFromRawToken} from "@/server/guest/session-service";
import type {GuestSession} from "@/db/schema";

export async function requireGuestSession(): Promise<{
  session: GuestSession;
  rawToken: string;
}> {
  const rawToken = await readGuestRawTokenFromCookie();
  const session = await resolveGuestSessionFromRawToken(rawToken);
  return {session, rawToken: rawToken!};
}

export async function requireGuestSessionFromRequest(request: Request): Promise<{
  session: GuestSession;
  rawToken: string;
}> {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const {getGuestCookieName} = await import("@/server/guest/cookie");
  const name = getGuestCookieName();
  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  const rawToken = match ? decodeURIComponent(match.slice(name.length + 1)) : null;
  const session = await resolveGuestSessionFromRawToken(rawToken);
  return {session, rawToken: rawToken!};
}
