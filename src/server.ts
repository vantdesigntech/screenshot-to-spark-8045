import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import {
  searchLiveChollosCloud,
  searchLiveWatchPartsCloud,
} from "./lib/live-watch-engine";

const API_CORS_HEADERS: Record<string, string> = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "Content-Type, Authorization, X-User-Id, X-User-Role",
};

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
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);

      if (url.pathname.startsWith("/api/")) {
        if (request.method === "OPTIONS") {
          return new Response(null, { status: 204, headers: API_CORS_HEADERS });
        }

        if (url.pathname === "/api/health" || url.pathname === "/api") {
          return new Response(
            JSON.stringify({
              status: "ok",
              mode: "cloud-production",
              service: "ChronoParts Cloud Live Search & Chollos API",
              endpoints: ["/api/search?q=seiko+nh35", "/api/chollos?q=omega"],
            }),
            { status: 200, headers: API_CORS_HEADERS },
          );
        }

        if (url.pathname === "/api/search") {
          const q = (url.searchParams.get("q") || "").trim();
          const result = await searchLiveWatchPartsCloud(q);
          return new Response(
            JSON.stringify(result),
            { status: 200, headers: API_CORS_HEADERS },
          );
        }

        if (url.pathname === "/api/chollos") {
          const q = (url.searchParams.get("q") || "").trim();
          const items = await searchLiveChollosCloud(q);
          return new Response(
            JSON.stringify({ query: q, count: items.length, items }),
            { status: 200, headers: API_CORS_HEADERS },
          );
        }

        if (url.pathname.startsWith("/api/marketplace")) {
          return new Response(
            JSON.stringify({ status: "synced", mode: "cloud-production" }),
            { status: 200, headers: API_CORS_HEADERS },
          );
        }
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
