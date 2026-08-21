export async function GET() {
  return Response.json(
    {
      status: "ok",
      service: "cheese-study",
      time: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
