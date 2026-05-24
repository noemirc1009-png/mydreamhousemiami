const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");
let nodemailer = null;

try {
  nodemailer = require("nodemailer");
} catch (error) {
  nodemailer = null;
}

loadDotEnv();

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = __dirname;
const MLS_BASE_URL = trimTrailingSlash(process.env.MLS_BASE_URL || "");
const MLS_LISTINGS_PATH = process.env.MLS_LISTINGS_PATH || "/Property";
const MLS_TOKEN = process.env.MLS_TOKEN || "";
const MLS_PROVIDER = process.env.MLS_PROVIDER || "MLS feed";
const CACHE_SECONDS = Number(process.env.MLS_CACHE_SECONDS || 1800);
const EMAIL_WEBHOOK_URL = process.env.EMAIL_WEBHOOK_URL || "";
const LEAD_RECIPIENT_EMAIL = process.env.LEAD_RECIPIENT_EMAIL || "";
const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_SECURE = String(process.env.SMTP_SECURE || "true") !== "false";
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER || "";
const FORMSUBMIT_EMAIL = process.env.FORMSUBMIT_EMAIL || LEAD_RECIPIENT_EMAIL;

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
    if (request.method === "OPTIONS") {
      return sendCorsPreflight(response);
    }

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

    if (requestUrl.pathname === "/api/leads" && request.method === "POST") {
      return handleLead(request, response);
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

  const forwarded = await forwardNotification("search_alert_created", { alert: savedAlert });

  return sendJson(response, 201, {
    ok: true,
    alertId: savedAlert.id,
    emailAutomationConnected: forwarded
  });
}

async function handleLead(request, response) {
  const lead = await readJsonBody(request);
  const hasContact = String(lead.email || "").trim() || String(lead.phone || "").trim();
  const hasMessage = String(lead.message || lead.property || "").trim();

  if (!hasContact && !hasMessage) {
    return sendJson(response, 400, {
      error: "Missing lead details.",
      required: "Send at least an email, phone, message, or property."
    });
  }

  const savedLead = {
    id: `LEAD-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: "new",
    source: lead.source || "website",
    name: lead.name || "",
    email: lead.email || "",
    phone: lead.phone || "",
    property: lead.property || "",
    message: lead.message || "",
    page: lead.page || "",
    ...lead
  };

  await appendJsonRecord(path.join(__dirname, "data", "leads.json"), savedLead);
  const forwarded = await forwardNotification("lead_created", { lead: savedLead });

  return sendJson(response, 201, {
    ok: true,
    leadId: savedLead.id,
    emailAutomationConnected: forwarded
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
    ...corsHeaders(),
    ...headers
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, status, body) {
  response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8", ...corsHeaders() });
  response.end(body);
}

function sendCorsPreflight(response) {
  response.writeHead(204, corsHeaders());
  response.end();
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
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

async function forwardNotification(type, payload) {
  const notification = {
    type,
    source: "MYDreamHouse Peguero Real State.",
    recipientEmail: LEAD_RECIPIENT_EMAIL,
    createdAt: new Date().toISOString(),
    ...payload
  };

  if (await sendSmtpEmail(notification)) return true;
  if (await sendFormSubmitEmail(notification)) return true;

  if (!EMAIL_WEBHOOK_URL) return false;

  try {
    const response = await fetch(EMAIL_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(notification)
    });

    if (!response.ok) {
      console.error(`Email webhook failed with ${response.status}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Email webhook failed.", error);
    return false;
  }
}

async function sendFormSubmitEmail(notification) {
  if (!FORMSUBMIT_EMAIL) return false;

  const data = notification.lead || notification.alert || {};
  const payload = {
    _subject: notification.type === "search_alert_created"
      ? "New MyDreamHouse Search Alert"
      : "New MyDreamHouse Lead",
    _template: "table",
    _captcha: "false",
    source: notification.source,
    type: notification.type,
    createdAt: notification.createdAt,
    name: data.name || "",
    email: data.email || "",
    phone: data.phone || "",
    property: data.property || "",
    location: data.location || "",
    minPrice: data.minPrice || "",
    maxPrice: data.maxPrice || "",
    beds: data.beds || "",
    hoa: data.hoa || "",
    frequency: data.frequency || "",
    message: data.message || data.notes || "",
    page: data.page || "",
    recordId: data.id || ""
  };

  try {
    const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(FORMSUBMIT_EMAIL)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error(`FormSubmit failed with ${response.status}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("FormSubmit email failed.", error);
    return false;
  }
}

async function sendSmtpEmail(notification) {
  if (!nodemailer || !SMTP_HOST || !SMTP_USER || !SMTP_PASS || !LEAD_RECIPIENT_EMAIL) return false;

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });

  const subject = notification.type === "search_alert_created"
    ? "New MyDreamHouse Search Alert"
    : "New MyDreamHouse Lead";

  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: LEAD_RECIPIENT_EMAIL,
      subject,
      text: formatEmailText(notification),
      html: formatEmailHtml(notification)
    });
    return true;
  } catch (error) {
    console.error("SMTP email failed.", error);
    return false;
  }
}

function formatEmailText(notification) {
  const data = notification.lead || notification.alert || {};
  return [
    notification.source,
    `Type: ${notification.type}`,
    `Created: ${notification.createdAt}`,
    "",
    `Name: ${data.name || ""}`,
    `Email: ${data.email || ""}`,
    `Phone: ${data.phone || ""}`,
    `Property: ${data.property || ""}`,
    `Location: ${data.location || ""}`,
    `Price: ${data.minPrice || ""} - ${data.maxPrice || ""}`,
    `Beds: ${data.beds || ""}`,
    `HOA: ${data.hoa || ""}`,
    `Frequency: ${data.frequency || ""}`,
    "",
    `Message: ${data.message || data.notes || ""}`,
    "",
    `Page: ${data.page || ""}`,
    `Record ID: ${data.id || ""}`
  ].join("\n");
}

function formatEmailHtml(notification) {
  const data = notification.lead || notification.alert || {};
  const rows = [
    ["Type", notification.type],
    ["Created", notification.createdAt],
    ["Name", data.name],
    ["Email", data.email],
    ["Phone", data.phone],
    ["Property", data.property],
    ["Location", data.location],
    ["Min Price", data.minPrice],
    ["Max Price", data.maxPrice],
    ["Beds", data.beds],
    ["HOA", data.hoa],
    ["Frequency", data.frequency],
    ["Message", data.message || data.notes],
    ["Page", data.page],
    ["Record ID", data.id]
  ];

  return `
    <div style="font-family: Arial, sans-serif; color: #10252c;">
      <h2 style="margin: 0 0 12px;">${escapeHtml(notification.source)}</h2>
      <table cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
        ${rows.map(([label, value]) => `
          <tr>
            <td style="border: 1px solid #d8d1bd; font-weight: 700; width: 150px;">${escapeHtml(label)}</td>
            <td style="border: 1px solid #d8d1bd;">${escapeHtml(value || "")}</td>
          </tr>
        `).join("")}
      </table>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
