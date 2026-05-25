const adminCredentials = {
  username: "Peguero26",
  password: "MyHouse26"
};

const adminElements = {
  login: document.querySelector("#adminLogin"),
  dashboard: document.querySelector("#adminDashboard"),
  form: document.querySelector("#adminForm"),
  user: document.querySelector("#adminUser"),
  password: document.querySelector("#adminPassword"),
  status: document.querySelector("#adminStatus"),
  body: document.querySelector("#adminRegistryBody"),
  exportButton: document.querySelector("#exportAdminRegistry")
};

adminElements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const username = adminElements.user.value.trim();
  const password = adminElements.password.value;

  if (username !== adminCredentials.username || password !== adminCredentials.password) {
    adminElements.status.textContent = "Incorrect access. Acceso incorrecto.";
    return;
  }

  sessionStorage.setItem("mdhAdmin", "true");
  openDashboard();
});

adminElements.exportButton.addEventListener("click", exportRegistry);

if (sessionStorage.getItem("mdhAdmin") === "true") {
  openDashboard();
}

function openDashboard() {
  adminElements.login.classList.add("hidden");
  adminElements.dashboard.classList.remove("hidden");
  renderRegistry();
}

function getRegistry() {
  const records = [];
  const latest = localStorage.getItem("mdhClientRegistration");
  if (latest) records.push(JSON.parse(latest));
  return records;
}

function renderRegistry() {
  const registry = getRegistry();
  if (!registry.length) return;
  adminElements.body.innerHTML = registry.map((client) => `
    <tr>
      <td>${escapeHtml(formatDate(client.createdAt))}</td>
      <td>${escapeHtml(client.name || "")}</td>
      <td><a href="tel:${escapeHtml(client.phone || "")}">${escapeHtml(client.phone || "")}</a></td>
      <td><a href="mailto:${escapeHtml(client.email || "")}">${escapeHtml(client.email || "")}</a></td>
      <td>${escapeHtml(client.intent || "")}</td>
    </tr>
  `).join("");
}

function exportRegistry() {
  const registry = getRegistry();
  if (!registry.length) return;
  const rows = [["Date", "Name", "Phone", "Email", "Looking To"], ...registry.map((client) => [
    formatDate(client.createdAt),
    client.name || "",
    client.phone || "",
    client.email || "",
    client.intent || ""
  ])];
  const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `mydreamhouse-local-admin-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[character]));
}
