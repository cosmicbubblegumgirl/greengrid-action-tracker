import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import {
  addActionToState,
  addStoryReaction,
  buildDashboard,
  createSeedState,
  joinChallenge,
  statusError,
  trackResource,
  updateProfilePrivacy,
  updateTeam
} from "./content.js";
import { readDatabase, updateDatabase } from "./store.js";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const dataFile = process.env.GREEN_GRID_DB || join(rootDir, "data", "greengrid-store.json");
const distDir = join(rootDir, "dist");
const port = Number(process.env.PORT || 4173);
const useVite = process.env.NODE_ENV !== "production";
const basePath = "/greengrid-action-tracker";

let vite;

if (useVite) {
  const { createServer: createViteServer } = await import("vite");
  vite = await createViteServer({
    root: rootDir,
    server: { middlewareMode: true },
    appType: "spa"
  });
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  try {
    if (url.pathname.startsWith("/api/")) {
      await handleApi(request, response, url);
      return;
    }

    if (vite) {
      await passToVite(request, response);
      return;
    }

    await serveStatic(response, url.pathname);
  } catch (error) {
    sendJson(response, error.status || 500, {
      error: error.status ? error.message : "Something went wrong."
    });
  }
});

server.listen(port, () => {
  console.log(`GreenGrid listening on http://localhost:${port}`);
});

async function handleApi(request, response, url) {
  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, { ok: true, service: "greengrid" });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/bootstrap") {
    const db = await readDatabase(dataFile, createSeedState);
    sendJson(response, 200, buildDashboard(db));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/actions") {
    const input = await readJsonBody(request);
    const result = await updateDatabase(dataFile, createSeedState, (db) => addActionToState(db, input));
    sendJson(response, 201, result);
    return;
  }

  const storyMatch = url.pathname.match(/^\/api\/stories\/([^/]+)\/reactions$/);
  if (request.method === "POST" && storyMatch) {
    const input = await readJsonBody(request);
    const dashboard = await updateDatabase(dataFile, createSeedState, (db) =>
      addStoryReaction(db, storyMatch[1], input.reaction)
    );
    sendJson(response, 200, dashboard);
    return;
  }

  const challengeMatch = url.pathname.match(/^\/api\/challenges\/([^/]+)\/join$/);
  if (request.method === "POST" && challengeMatch) {
    const dashboard = await updateDatabase(dataFile, createSeedState, (db) =>
      joinChallenge(db, challengeMatch[1])
    );
    sendJson(response, 200, dashboard);
    return;
  }

  const resourceMatch = url.pathname.match(/^\/api\/resources\/([^/]+)\/track$/);
  if (request.method === "POST" && resourceMatch) {
    const result = await updateDatabase(dataFile, createSeedState, (db) => trackResource(db, resourceMatch[1]));
    sendJson(response, 201, result);
    return;
  }

  if (request.method === "PATCH" && url.pathname === "/api/profile/privacy") {
    const input = await readJsonBody(request);
    const dashboard = await updateDatabase(dataFile, createSeedState, (db) =>
      updateProfilePrivacy(db, input.privacy)
    );
    sendJson(response, 200, dashboard);
    return;
  }

  if (request.method === "PATCH" && url.pathname === "/api/team") {
    const input = await readJsonBody(request);
    const dashboard = await updateDatabase(dataFile, createSeedState, (db) => updateTeam(db, input));
    sendJson(response, 200, dashboard);
    return;
  }

  throw statusError(404, "Route not found.");
}

function passToVite(request, response) {
  return new Promise((resolve, reject) => {
    vite.middlewares(request, response, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

async function serveStatic(response, pathName) {
  const pathWithoutBase = pathName.startsWith(basePath) ? pathName.slice(basePath.length) || "/" : pathName;
  const safePath = normalize(decodeURIComponent(pathWithoutBase)).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(distDir, safePath === "/" ? "index.html" : safePath);

  try {
    const details = await stat(filePath);
    if (details.isFile()) {
      streamFile(response, filePath);
      return;
    }
  } catch {
    streamFile(response, join(distDir, "index.html"));
    return;
  }

  streamFile(response, join(distDir, "index.html"));
}

function streamFile(response, filePath) {
  response.writeHead(200, {
    "Content-Type": contentType(filePath)
  });
  createReadStream(filePath).pipe(response);
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
    if (Buffer.concat(chunks).length > 1_000_000) {
      throw statusError(413, "Request body is too large.");
    }
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw statusError(400, "Send valid JSON.");
  }
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function contentType(filePath) {
  return {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".json": "application/json; charset=utf-8"
  }[extname(filePath).toLowerCase()] || "application/octet-stream";
}
