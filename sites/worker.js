const withSecurityHeaders = (response) => {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), geolocation=(), payment=()");
  headers.set("X-Frame-Options", "DENY");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
};

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    let response = await env.ASSETS.fetch(request);

    const isPageNavigation =
      (request.method === "GET" || request.method === "HEAD") &&
      request.headers.get("Accept")?.includes("text/html");

    if (response.status === 404 && isPageNavigation && !url.pathname.includes(".")) {
      const fallbackUrl = new URL("/index.html", url);
      response = await env.ASSETS.fetch(new Request(fallbackUrl, request));
    }

    return withSecurityHeaders(response);
  }
};

export default worker;
