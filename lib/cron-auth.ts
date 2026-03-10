export function isAuthorizedCronRequest(req: Request) {
  const secret = process.env.CRON_SECRET;
  const url = new URL(req.url);
  const bearer = req.headers.get("authorization");
  const userAgent = req.headers.get("user-agent") || "";

  if (userAgent.includes("vercel-cron/1.0")) {
    return true;
  }

  if (!secret) {
    return true;
  }

  return bearer === `Bearer ${secret}` || url.searchParams.get("secret") === secret;
}
