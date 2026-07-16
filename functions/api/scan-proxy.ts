// Cloudflare Pages Function — server-side proxy for security scanner
// Routes: /api/scan-proxy?url=https://target.com
// Runs on Cloudflare edge, no CORS restrictions

export async function onRequest(context: { request: Request; env: Record<string, string> }) {
  const { request } = context;
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get("url");

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: "Missing ?url= parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const resp = await fetch(targetUrl, {
      method: "GET",
      redirect: "manual",
      headers: {
        "User-Agent": "IndraSecurityScanner/2.0 (Safe Passive Scan)",
        Accept: "*/*",
      },
      signal: AbortSignal.timeout(12000),
    });

    const headers: Record<string, string> = {};
    resp.headers.forEach((val, key) => {
      headers[key.toLowerCase()] = val;
    });

    const body = await resp.text();
    const truncated = body.length > 500000 ? body.slice(0, 500000) + "\n\n[TRUNCATED]" : body;

    return new Response(JSON.stringify({
      url: targetUrl,
      status: resp.status,
      statusText: resp.statusText,
      headers,
      body: truncated,
      bodySize: body.length,
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e: unknown) {
    const err = e as Error;
    return new Response(JSON.stringify({
      url: targetUrl,
      status: 0,
      statusText: "Error",
      headers: {},
      body: "",
      error: err.message || "Unknown error",
    }), {
      status: 502,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}
