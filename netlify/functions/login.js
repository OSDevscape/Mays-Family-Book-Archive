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

  const { username, password } = JSON.parse(event.body || "{}");

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

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: true,
        user: { id: user.id, username: user.username },
      }),
    };
  } finally {
    await db.end();
  }
};