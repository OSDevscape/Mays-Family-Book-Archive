export default async () => {
  return new Response(JSON.stringify({ ok: true, loggedIn: false }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const config = {
  path: "/api/me",
};