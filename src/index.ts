import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import http from "node:http";
import fs from "node:fs";
import nodePath from "node:path";
import { URL, fileURLToPath } from "node:url";
import { createServer } from "./server.js";
import {
  handleProtectedResourceMetadata,
  handleAuthServerMetadata,
  handleAuthorize,
  handleToken,
  handleRegister,
  handleCors,
} from "./oauth/handlers.js";

const __dirname = nodePath.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = nodePath.resolve(__dirname, "../public/logo.png");

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3100;

const httpServer = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (req.method === "OPTIONS") {
    handleCors(req, res);
    return;
  }

  // ── OAuth 2.0 ────────────────────────────────────────────────────

  if (pathname === "/.well-known/oauth-protected-resource" && req.method === "GET") {
    handleProtectedResourceMetadata(req, res);
    return;
  }

  if (pathname === "/.well-known/oauth-authorization-server" && req.method === "GET") {
    handleAuthServerMetadata(req, res);
    return;
  }

  if (pathname === "/oauth/authorize") {
    await handleAuthorize(req, res);
    return;
  }

  if (pathname === "/oauth/token" && req.method === "POST") {
    await handleToken(req, res);
    return;
  }

  if (pathname === "/oauth/register" && req.method === "POST") {
    await handleRegister(req, res);
    return;
  }

  // ── Static assets ────────────────────────────────────────────────

  if (pathname === "/assets/logo.png" && req.method === "GET") {
    try {
      const img = fs.readFileSync(LOGO_PATH);
      res.writeHead(200, {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
        "Content-Length": img.length,
      }).end(img);
    } catch {
      res.writeHead(404).end("Not found");
    }
    return;
  }

  // ── MCP endpoint ─────────────────────────────────────────────────

  if (req.method === "POST" && pathname === "/mcp") {
    const authHeader = req.headers["authorization"] ?? "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : null;

    if (!token) {
      res.writeHead(401, { "Content-Type": "application/json" }).end(
        JSON.stringify({ error: "Missing Authorization header" }),
      );
      return;
    }

    const server = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on("close", () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res);
    return;
  }

  // ── Health check ─────────────────────────────────────────────────

  if (pathname === "/" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" }).end(
      JSON.stringify({ status: "ok", server: "bedo-test-mcp", version: "0.1.0" }),
    );
    return;
  }

  res.writeHead(404).end("Not found");
});

httpServer.listen(PORT, () => {
  console.log(`MCP server running at http://localhost:${PORT}`);
  console.log(`OAuth authorize: http://localhost:${PORT}/oauth/authorize`);
});
