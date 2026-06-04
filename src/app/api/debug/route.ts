export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({
    hasClientId: !!process.env.KEYSTATIC_GITHUB_CLIENT_ID,
    hasClientSecret: !!process.env.KEYSTATIC_GITHUB_CLIENT_SECRET,
    hasSecret: !!process.env.KEYSTATIC_SECRET,
  });
}
