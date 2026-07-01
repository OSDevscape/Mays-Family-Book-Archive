import bcrypt from "bcryptjs";
import { getDB } from "./_shared/db.js";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const { username, password, confirmPassword } = JSON.parse(event.body || "{}");

  if (!username || !password || !confirmPassword) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "All fields are required" }),
    };
  }

  if (password !== confirmPassword) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Passwords do not match" }),
    };
  }

  if (password.length < 8) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Password must be at least 8 characters" }),
    };
  }

  const db = await getDB();

  try {
    const [existing] = await db.execute(
      "SELECT id FROM users WHERE username = ? LIMIT 1",
      [username.trim()]
    );

    if (existing.length) {
      return {
        statusCode: 409,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Username already exists" }),
      };
    }

    const hash = await bcrypt.hash(password, 12);

    const [result] = await db.execute(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [username.trim(), hash]
    );

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: true,
        user: { id: result.insertId, username: username.trim() },
      }),
    };
  } finally {
    await db.end();
  }
};