import {cookies} from "next/headers";
import {getServerEnv} from "@/lib/env";
import {GUEST_COOKIE_NAME_DEFAULT} from "@/server/guest/guest-policy";

export function getGuestCookieName(): string {
  const env = getServerEnv();
  return env.GUEST_COOKIE_NAME?.trim() || GUEST_COOKIE_NAME_DEFAULT;
}

export async function readGuestRawTokenFromCookie(): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(getGuestCookieName())?.value;
  return value && value.length > 0 ? value : null;
}

export async function setGuestSessionCookie(params: {
  rawToken: string;
  expiresAt: Date;
}): Promise<void> {
  const jar = await cookies();
  const maxAge = Math.max(1, Math.floor((params.expiresAt.getTime() - Date.now()) / 1000));
  jar.set(getGuestCookieName(), params.rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: params.expiresAt,
    maxAge,
  });
}

export async function clearGuestSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(getGuestCookieName());
}

/** Build Set-Cookie header for Route Handlers that return Response directly. */
export function buildGuestSetCookieHeader(rawToken: string, expiresAt: Date): string {
  const name = getGuestCookieName();
  const maxAge = Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  const parts = [
    `${name}=${rawToken}`,
    "Path=/",
    `Expires=${expiresAt.toUTCString()}`,
    `Max-Age=${maxAge}`,
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}
