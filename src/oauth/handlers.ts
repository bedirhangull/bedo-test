import type { IncomingMessage, ServerResponse } from "node:http";
import { URL } from "node:url";
import {
  generateAuthCode,
  consumeAuthCode,
  registerClient,
  verifyPkce,
} from "./store.js";
import { getAuthorizationPageHtml } from "./page.js";

const BASE_URL = process.env.MCP_BASE_URL ?? "https://mcp.hrpanda.co";
const DASHBOARD_URL = process.env.HIREG_DASHBOARD_URL ?? "";

function detectLang(req: IncomingMessage, url: URL): "en" | "tr" {
  const explicit = url.searchParams.get("lang");
  if (explicit === "tr" || explicit === "en") return explicit;
  const accept = req.headers["accept-language"] ?? "";
  if (accept.toLowerCase().startsWith("tr")) return "tr";
  return "en";
}

function json(res: ServerResponse, status: number, data: unknown) {
  res
    .writeHead(status, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    })
    .end(JSON.stringify(data));
}

function html(res: ServerResponse, status: number, body: string) {
  res
    .writeHead(status, { "Content-Type": "text/html; charset=utf-8" })
    .end(body);
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk: Buffer) => (body += chunk));
    req.on("end", () => resolve(body));
  });
}

// RFC 9728 – OAuth Protected Resource Metadata
export function handleProtectedResourceMetadata(
  _req: IncomingMessage,
  res: ServerResponse,
) {
  json(res, 200, {
    resource: BASE_URL,
    authorization_servers: [BASE_URL],
    bearer_methods_supported: ["header"],
  });
}

// RFC 8414 – OAuth Authorization Server Metadata
export function handleAuthServerMetadata(
  _req: IncomingMessage,
  res: ServerResponse,
) {
  json(res, 200, {
    issuer: BASE_URL,
    authorization_endpoint: `${BASE_URL}/oauth/authorize`,
    token_endpoint: `${BASE_URL}/oauth/token`,
    registration_endpoint: `${BASE_URL}/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    token_endpoint_auth_methods_supported: ["client_secret_post", "none"],
    code_challenge_methods_supported: ["S256", "plain"],
    scopes_supported: ["mcp:read", "mcp:read_write"],
  });
}

// GET  → render authorization page
// POST → process form, issue auth code, redirect
export async function handleAuthorize(
  req: IncomingMessage,
  res: ServerResponse,
) {
  const url = new URL(req.url!, `http://${req.headers.host}`);

  if (req.method === "GET") {
    const lang = detectLang(req, url);
    const params = {
      clientId: url.searchParams.get("client_id") ?? "",
      redirectUri: url.searchParams.get("redirect_uri") ?? "",
      state: url.searchParams.get("state") ?? "",
      codeChallenge: url.searchParams.get("code_challenge") ?? "",
      codeChallengeMethod:
        url.searchParams.get("code_challenge_method") ?? "plain",
      scope: url.searchParams.get("scope") ?? "",
      dashboardUrl: DASHBOARD_URL,
      baseUrl: BASE_URL,
      lang,
    };
    html(res, 200, getAuthorizationPageHtml(params));
    return;
  }

  if (req.method === "POST") {
    const body = await readBody(req);
    const form = new URLSearchParams(body);

    const token = form.get("token")?.trim();
    const clientId = form.get("client_id") ?? "";
    const redirectUri = form.get("redirect_uri") ?? "";
    const state = form.get("state") ?? "";
    const codeChallenge = form.get("code_challenge") ?? "";
    const codeChallengeMethod = form.get("code_challenge_method") ?? "plain";

    if (!token) {
      const lang = detectLang(req, url);
      const errorMsg =
        lang === "tr"
          ? "Lütfen MCP tokeninizi girin."
          : "Please enter your MCP token.";
      html(
        res,
        200,
        getAuthorizationPageHtml({
          clientId,
          redirectUri,
          state,
          codeChallenge,
          codeChallengeMethod,
          scope: "",
          dashboardUrl: DASHBOARD_URL,
          baseUrl: BASE_URL,
          lang,
          error: errorMsg,
        }),
      );
      return;
    }

    if (!redirectUri) {
      json(res, 400, {
        error: "invalid_request",
        error_description: "redirect_uri is required",
      });
      return;
    }

    const code = generateAuthCode({
      token,
      clientId,
      redirectUri,
      codeChallenge: codeChallenge || undefined,
      codeChallengeMethod: codeChallengeMethod || undefined,
    });

    const redirect = new URL(redirectUri);
    redirect.searchParams.set("code", code);
    if (state) redirect.searchParams.set("state", state);

    res.writeHead(302, { Location: redirect.toString() }).end();
    return;
  }

  res.writeHead(405).end("Method not allowed");
}

// POST /oauth/token – exchange authorization code for access token
export async function handleToken(
  req: IncomingMessage,
  res: ServerResponse,
) {
  if (req.method !== "POST") {
    res.writeHead(405).end("Method not allowed");
    return;
  }

  const raw = await readBody(req);

  // Accept both form-urlencoded and JSON bodies
  let params: URLSearchParams;
  const ct = req.headers["content-type"] ?? "";
  if (ct.includes("application/json")) {
    try {
      const obj = JSON.parse(raw) as Record<string, string>;
      params = new URLSearchParams(obj);
    } catch {
      json(res, 400, {
        error: "invalid_request",
        error_description: "Invalid JSON body",
      });
      return;
    }
  } else {
    params = new URLSearchParams(raw);
  }

  const grantType = params.get("grant_type");
  if (grantType !== "authorization_code") {
    json(res, 400, { error: "unsupported_grant_type" });
    return;
  }

  const code = params.get("code");
  if (!code) {
    json(res, 400, {
      error: "invalid_request",
      error_description: "code is required",
    });
    return;
  }

  const authCode = consumeAuthCode(code);
  if (!authCode) {
    json(res, 400, {
      error: "invalid_grant",
      error_description: "Invalid or expired authorization code",
    });
    return;
  }

  // PKCE verification
  if (authCode.codeChallenge) {
    const codeVerifier = params.get("code_verifier");
    if (!codeVerifier) {
      json(res, 400, {
        error: "invalid_request",
        error_description: "code_verifier is required",
      });
      return;
    }
    if (
      !verifyPkce(
        codeVerifier,
        authCode.codeChallenge,
        authCode.codeChallengeMethod ?? "plain",
      )
    ) {
      json(res, 400, {
        error: "invalid_grant",
        error_description: "PKCE verification failed",
      });
      return;
    }
  }

  // Verify redirect_uri matches the one used during authorization
  const redirectUri = params.get("redirect_uri");
  if (redirectUri && redirectUri !== authCode.redirectUri) {
    json(res, 400, {
      error: "invalid_grant",
      error_description: "redirect_uri mismatch",
    });
    return;
  }

  // The user's MCP token becomes the OAuth access token
  json(res, 200, {
    access_token: authCode.token,
    token_type: "Bearer",
    scope: "mcp:read_write",
  });
}

// POST /oauth/register – RFC 7591 Dynamic Client Registration
export async function handleRegister(
  req: IncomingMessage,
  res: ServerResponse,
) {
  if (req.method !== "POST") {
    res.writeHead(405).end("Method not allowed");
    return;
  }

  const raw = await readBody(req);

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw);
  } catch {
    json(res, 400, {
      error: "invalid_request",
      error_description: "Invalid JSON",
    });
    return;
  }

  const redirectUris = data.redirect_uris as string[] | undefined;
  if (!Array.isArray(redirectUris) || redirectUris.length === 0) {
    json(res, 400, {
      error: "invalid_request",
      error_description: "redirect_uris is required",
    });
    return;
  }

  const registration = registerClient(
    redirectUris,
    data.client_name as string | undefined,
  );

  json(res, 201, {
    client_id: registration.clientId,
    client_secret: registration.clientSecret,
    client_name: registration.clientName,
    redirect_uris: registration.redirectUris,
    grant_types: ["authorization_code"],
    response_types: ["code"],
    token_endpoint_auth_method: "client_secret_post",
  });
}

// OPTIONS preflight for CORS
export function handleCors(_req: IncomingMessage, res: ServerResponse) {
  res
    .writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    })
    .end();
}
