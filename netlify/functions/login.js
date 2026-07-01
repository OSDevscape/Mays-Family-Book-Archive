import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDB } from "./_shared/db.js";
import { makeAuthCookie } from "./_shared/cookie.js";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Invalid JSON body" }),
    };
  }

  const { username, password } = body;

  if (!username || !password) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Username and password are required" }),
    };
  }

  const db = await getDB();

  try {
    const [rows] = await db.execute(
      "SELECT id, username, password FROM users WHERE username = ? LIMIT 1",
      [username.trim()]
    );

    if (!rows.length) {
      return {
        statusCode: 401,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Invalid credentials" }),
      };
    }

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);

    if (!ok) {
      return {
        statusCode: 401,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Invalid credentials" }),
      };
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "14d" }
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": makeAuthCookie(token),
      },
      body: JSON.stringify({
        ok: true,
        user: { id: user.id, username: user.username },
      }),
    };
  } finally {
    await db.end();
  }
};