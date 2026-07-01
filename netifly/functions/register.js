import bcrypt from "bcryptjs";
import { getDB } from "./_shared/db.js";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { username, password, confirmPassword } = await req.json();

  if (!username || !password || !confirmPassword) {
    return new Response(JSON.stringify({ error: "All fields are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (password !== confirmPassword) {
    return new Response(JSON.stringify({ error: "Passwords do not match" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (password.length < 8) {
    return new Response(JSON.stringify({ error: "Password must be at least 8 characters" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const db = await getDB();

  const [existing] = await db.execute(
    "SELECT id FROM users WHERE username = ? LIMIT 1",
    [username.trim()]
  );

  if (existing.length > 0) {
    await db.end();
    return new Response(JSON.stringify({ error: "Username already exists" }), {
      status: 409,
      headers: { "Content-Type": "application/json" },
    });
  }

  const hash = await bcrypt.hash(password, 12);

  const [result] = await db.execute(
    "INSERT INTO users (username, password) VALUES (?, ?)",
    [username.trim(), hash]
  );

  await db.end();

  return new Response(JSON.stringify({ ok: true, userId: result.insertId }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const config = {
  path: "/api/register",
};