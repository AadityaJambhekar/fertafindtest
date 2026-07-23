import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { computeRedirect } from "./lib/redirects";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as {
      unhandled?: unknown;
      message?: unknown;
    };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

function requestParts(request: Request): {
  host: string | null;
  pathname: string;
  search: string;
} {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    const url = new URL(request.url);
    return { host, pathname: url.pathname, search: url.search };
  } catch {
    return { host, pathname: "/", search: "" };
  }
}

// Canonical-host (apex -> www) and /partners -> /suppliers permanent redirects.
function canonicalRedirectResponse(request: Request): Response | null {
  const { host, pathname, search } = requestParts(request);
  const redirect = computeRedirect({ host, pathname, search });
  if (!redirect) return null;
  return new Response(null, {
    status: redirect.status,
    headers: { location: redirect.location },
  });
}

// Customer-specific recommendation pages must never be indexed, even by crawlers
// that ignore the in-document robots meta. Deliver noindex as a response header too.
function applyIndexingHeaders(request: Request, response: Response): Response {
  const { pathname } = requestParts(request);
  if (!pathname.startsWith("/results/")) return response;
  const headers = new Headers(response.headers);
  headers.set("X-Robots-Tag", "noindex, nofollow");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const redirect = canonicalRedirectResponse(request);
    if (redirect) return redirect;

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return applyIndexingHeaders(request, await normalizeCatastrophicSsrResponse(response));
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
