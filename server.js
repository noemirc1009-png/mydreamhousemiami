const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");

loadDotEnv();

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = __dirname;
const MLS_BASE_URL = trimTrailingSlash(process.env.MLS_BASE_URL || "");
const MLS_LISTINGS_PATH = process.env.MLS_LISTINGS_PATH || "/Property";
const MLS_TOKEN = process.env.MLS_TOKEN || "";
const MLS_PROVIDER = process.env.MLS_PROVIDER || "MLS feed";
const CACHE_SECONDS = Number(process.env.MLS_CACHE_SECONDS || 3600);
const EMAIL_WEBHOOK_URL = process.env.EMAIL_WEBHOOK_URL || "";

let cachedListings = null;
let cachedAt = 0;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);

    if (requestUrl.pathname === "/api/health") {
      return sendJson(response, 200, {
        ok: true,
        provider: MLS_PROVIDER,
        mlsConfigured: Boolean(MLS_BASE_URL && MLS_TOKEN)
      });
    }

    if (requestUrl.pathname === "/api/listings") {
      return handleListings(requestUrl, response);
    }

    if (requestUrl.pathname === "/api/search-alerts" && request.method === "POST") {
      return handleSearchAlert(request, response);
    }

    return serveStatic(requestUrl.pathname, response);
  } catch (error) {
    console.error(error);
    return sendJson(response, 500, { error: "Unexpected server error." });
  }
});

server.listen(PORT, () => {
  console.log(`MyDreamHouse running at http://localhost:${PORT}`);
});

async function handleSearchAlert(request, response) {
  const alert = await readJsonBody(request);
  const requiredFields = ["name", "email", "location"];
  const missing = requiredFields.filter((field) => !String(alert[field] || "").trim());

  if (missing.length) {
    return sendJson(response, 400, {
      error: "Missing required alert fields.",
      missing
    });
  }

  const savedAlert = {
    id: `ALERT-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: "active",
    ...alert
  };

  await appendJsonRecord(path.join(__dirname, "data", "search-alerts.json"), savedAlert);

  if (EMAIL_WEBHOOK_URL) {
    await fetch(EMAIL_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "search_alert_created",
        source: "MYDreamHouse Peguero Real State.",
        alert: savedAlert
      })
    });
  }

  return sendJson(response, 201, {
    ok: true,
    alertId: savedAlert.id,
    emailAutomationConnected: Boolean(EMAIL_WEBHOOK_URL)
  });
}

async function handleListings(requestUrl, response) {
  if (!MLS_BASE_URL || !MLS_TOKEN) {
    return sendJson(response, 503, {
      error: "MLS feed is not configured.",
      setup: "Add MLS_BASE_URL and MLS_TOKEN to .env, then restart the server."
    });
  }

  const now = Date.now();
  if (cachedListings && now - cachedAt < CACHE_SECONDS * 1000) {
    return sendJson(response, 200, cachedListings, {
      "X-MLS-Provider": MLS_PROVIDER,
      "X-Cache": "HIT"
    });
  }

  const feedUrl = buildMlsUrl(requestUrl);
  const mlsResponse = await fetch(feedUrl, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${MLS_TOKEN}`
    }
  });

  const payload = await mlsResponse.json().catch(() => ({}));

  if (!mlsResponse.ok) {
    return sendJson(response, mlsResponse.status, {
      error: "MLS request failed.",
      status: mlsResponse.status,
      details: payload.error?.message || payload.message || "Check your MLS endpoint, token, and agreement permissions."
    });
  }

  cachedListings = payload;
  cachedAt = now;

  return sendJson(response, 200, payload, {
    "X-MLS-Provider": MLS_PROVIDER,
    "X-Cache": "MISS"
  });
}

function buildMlsUrl(requestUrl) {
  const url = new URL(`${MLS_BASE_URL}${MLS_LISTINGS_PATH}`);
  const city = requestUrl.searchParams.get("city");
  const top = requestUrl.searchParams.get("top") || process.env.MLS_TOP || "50";
  const status = process.env.MLS_STATUS || "Active";

  url.searchParams.set("$top", top);
  url.searchParams.set("$orderby", process.env.MLS_ORDER_BY || "ModificationTimestamp desc");

  const filters = [`StandardStatus eq '${escapeOData(status)}'`];
  if (city) filters.push(`City eq '${escapeOData(city)}'`);
  if (process.env.MLS_EXTRA_FILTER) filters.push(process.env.MLS_EXTRA_FILTER);
  url.searchParams.set("$filter", filters.join(" and "));

  return url;
}

function serveStatic(pathname, response) {
  const cleanPath = pathname === "/" ? "/index.html" : pathname;
  const requestedPath = path.normalize(decodeURIComponent(cleanPath)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(PUBLIC_DIR, requestedPath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    return sendText(response, 403, "Forbidden");
  }

  fs.readFile(filePath, (error, data) => {
    if (error) return sendText(response, 404, "Not found");
    const contentType = mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    response.writeHead(200, { "Content-Type": contentType });
    response.end(data);
  });
}

function sendJson(response, status, payload, headers = {}) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, status, body) {
  response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(body);
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy();
        reject(new Error("Request body is too large."));
      }
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

async function appendJsonRecord(filePath, record) {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  let records = [];

  try {
    records = JSON.parse(await fs.promises.readFile(filePath, "utf8"));
    if (!Array.isArray(records)) records = [];
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  records.push(record);
  await fs.promises.writeFile(filePath, JSON.stringify(records, null, 2));
}

function loadDotEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function escapeOData(value) {
  return String(value).replace(/'/g, "''");
}
