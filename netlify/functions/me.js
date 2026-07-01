import jwt from "jsonwebtoken";
import { readCookie } from "./_shared/cookie.js";

export const handler = async (event) => {
  const token = readCookie(event, "auth_token");

  if (!token) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loggedIn: false }),
    };
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        loggedIn: true,
        user: { id: user.id, username: user.username },
      }),
    };
  } catch (err) {
    // Invalid or expired token
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loggedIn: false }),
    };
  }
};