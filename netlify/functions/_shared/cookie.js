import cookie from "cookie";

export function makeAuthCookie(value) {
  const isProd = process.env.CONTEXT === "production";
  return cookie.serialize("auth_token", value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export function clearAuthCookie() {
  return cookie.serialize("auth_token", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function readCookie(event, name) {
  const raw = event.headers.cookie || event.headers.Cookie || "";
  const parsed = cookie.parse(raw);
  return parsed[name];
}
