import bcrypt from "bcryptjs";
import { getDB } from "./_shared/db.js";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { username, password } = await req.json();

  if (!username || !password) {
    return new Response(JSON.stringify({ error: "Username and password are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const db = await getDB();

  const [rows] = await db.execute(
    "SELECT id, username, password FROM users WHERE username = ? LIMIT 1",
    [username.trim()]
  );

  await db.end();

  if (rows.length === 0) {
    return new Response(JSON.stringify({ error: "Invalid credentials" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password);

  if (!ok) {
    return new Response(JSON.stringify({ error: "Invalid credentials" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({
    ok: true,
    user: { id: user.id, username: user.username }
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const config = {
  path: "/api/login",
};