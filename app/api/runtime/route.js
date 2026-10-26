export async function GET() {
  return Response.json({
    nodeVersion: process.version,
    runtime: "nodejs",
  });
}