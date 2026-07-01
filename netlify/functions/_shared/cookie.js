import cookie from "cookie";

export function makeAuthCookie(value) {
  return cookie.serialize("auth_token", value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}