import http from "http";
import fs from "fs/promises";
import { createReadStream, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const PORT = Number(process.env.PORT || 3001);
const ADMIN_PASSWORD = "Maraca";
const VALID_PROFILES = ["fortitudo", "temperantia", "prudentia", "iustitia"];

const DEFAULT_PASSWORDS = {
  fortitudo: "fortitudeomelhor68",
  temperantia: "temperantia42",
  prudentia: "prudentia15",
  iustitia: "iustitia73",
};

async function ensureData() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const files = {
    passwords: DEFAULT_PASSWORDS,
    tabs: {},
    entries: {},
    audit: [],
    users: [],
    stores: {},
  };
  for (const [name, def] of Object.entries(files)) {
    const p = path.join(DATA_DIR, `${name}.json`);
    try {
      await fs.access(p);
    } catch {
      await fs.writeFile(p, JSON.stringify(def, null, 2));
    }
  }
}

async function readJSON(name, fallback) {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, `${name}.json`), "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJSON(name, data) {
  await fs.writeFile(path.join(DATA_DIR, `${name}.json`), JSON.stringify(data, null, 2));
}

async function getPasswords() {
  return readJSON("passwords", { ...DEFAULT_PASSWORDS });
}
async function savePasswords(p) {
  return writeJSON("passwords", p);
}
async function getTabs() {
  return readJSON("tabs", {});
}
async function saveTabs(t) {
  return writeJSON("tabs", t);
}
async function getEntries() {
  return readJSON("entries", {});
}
async function saveEntries(e) {
  return writeJSON("entries", e);
}
async function getAudit() {
  return readJSON("audit", []);
}
async function appendAudit(entry) {
  const list = await getAudit();
  list.unshift({
    id: list.length + 1,
    createdAt: new Date().toISOString(),
    ...entry,
  });
  await writeJSON("audit", list.slice(0, 500));
}
async function getUsers() {
  return readJSON("users", []);
}
async function saveUsers(u) {
  return writeJSON("users", u);
}

function send(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(body);
}

function parseBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function match(url, pattern) {
  const parts = pattern.split("/");
  const segs = url.split("?")[0].split("/");
  if (parts.length !== segs.length) return null;
  const params = {};
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith(":")) params[parts[i].slice(1)] = segs[i];
    else if (parts[i] !== segs[i]) return null;
  }
  return params;
}

await ensureData();

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  const url = req.url || "/";
  const method = req.method || "GET";

  try {
    if (method === "GET" && (url === "/api/healthz" || url.startsWith("/api/healthz?"))) {
      return send(res, 200, { ok: true });
    }

    let m = match(url, "/api/profiles/:id/auth");
    if (method === "POST" && m) {
      if (!VALID_PROFILES.includes(m.id))
        return send(res, 404, { error: "Perfil invalido" });
      const body = await parseBody(req);
      const passwords = await getPasswords();
      if (body.password === passwords[m.id]) return send(res, 200, { ok: true });
      return send(res, 401, { error: "Senha incorreta" });
    }

    m = match(url, "/api/profiles/:id/password");
    if (method === "PUT" && m) {
      if (!VALID_PROFILES.includes(m.id))
        return send(res, 404, { error: "Perfil invalido" });
      const body = await parseBody(req);
      const passwords = await getPasswords();
      if (!body.oldPassword || body.oldPassword !== passwords[m.id])
        return send(res, 401, { error: "Senha atual incorreta" });
      if (!body.newPassword || String(body.newPassword).length < 4)
        return send(res, 400, { error: "Nova senha invalida (minimo 4 caracteres)" });
      passwords[m.id] = String(body.newPassword);
      await savePasswords(passwords);
      await appendAudit({
        profileId: m.id,
        eventType: "senha_alterada",
        description: "Senha alterada no perfil " + m.id,
      });
      return send(res, 200, { ok: true });
    }

    m = match(url, "/api/profiles/:id/data");
    if (method === "GET" && m) {
      if (!VALID_PROFILES.includes(m.id))
        return send(res, 404, { error: "Perfil invalido" });
      const stores = await readJSON("stores", {});
      const store = stores[m.id] || {
        __tabs__: [
          { id: "anotacoes", label: "ANOTACOES", code: "ANT" },
          { id: "cameras", label: "CAMERAS", code: "CAM" },
          { id: "enigmas", label: "ENIGMAS", code: "ENI" },
          { id: "virtudes", label: "VIRTUDES", code: "VIR" },
          { id: "npc", label: "NPC", code: "NPC" },
        ],
        __savedAt__: null,
        anotacoes: [],
        cameras: [],
        enigmas: [],
        virtudes: [],
        npc: [],
      };
      return send(res, 200, store);
    }
    if (method === "PUT" && m) {
      if (!VALID_PROFILES.includes(m.id))
        return send(res, 404, { error: "Perfil invalido" });
      const body = await parseBody(req);
      const stores = await readJSON("stores", {});
      const prev = stores[m.id] || {};
      const savedAt = body.__savedAt__ || new Date().toISOString().replace("T", " ").substring(0, 19);
      stores[m.id] = { ...body, __savedAt__: savedAt };
      await writeJSON("stores", stores);
      return send(res, 200, { ok: true, __savedAt__: savedAt });
    }

    m = match(url, "/api/profiles/:id/tabs");
    if (method === "GET" && m) {
      if (!VALID_PROFILES.includes(m.id))
        return send(res, 404, { error: "Perfil invalido" });
      const tabs = await getTabs();
      return send(res, 200, tabs[m.id] || []);
    }
    if (method === "POST" && m) {
      if (!VALID_PROFILES.includes(m.id))
        return send(res, 404, { error: "Perfil invalido" });
      const body = await parseBody(req);
      const tabs = await getTabs();
      const list = tabs[m.id] || [];
      const tab = {
        id: randomUUID(),
        label: body.label || "Nova aba",
        createdAt: new Date().toISOString(),
      };
      list.push(tab);
      tabs[m.id] = list;
      await saveTabs(tabs);
      return send(res, 200, tab);
    }

    m = match(url, "/api/profiles/:id/tabs/:tabId");
    if (method === "PUT" && m) {
      const body = await parseBody(req);
      const tabs = await getTabs();
      const list = tabs[m.id] || [];
      const tab = list.find((t) => t.id === m.tabId);
      if (!tab) return send(res, 404, { error: "Aba nao encontrada" });
      if (body.label) tab.label = body.label;
      tabs[m.id] = list;
      await saveTabs(tabs);
      return send(res, 200, tab);
    }
    if (method === "DELETE" && m) {
      const tabs = await getTabs();
      const list = tabs[m.id] || [];
      const tab = list.find((t) => t.id === m.tabId);
      if (!tab) return send(res, 404, { error: "Aba nao encontrada" });
      tabs[m.id] = list.filter((t) => t.id !== m.tabId);
      await saveTabs(tabs);
      return send(res, 200, { ok: true });
    }

    m = match(url, "/api/profiles/:id/tabs/:tabId/entries");
    if (method === "GET" && m) {
      const entries = await getEntries();
      return send(res, 200, (entries[m.id] && entries[m.id][m.tabId]) || []);
    }
    if (method === "POST" && m) {
      const body = await parseBody(req);
      const entries = await getEntries();
      if (!entries[m.id]) entries[m.id] = {};
      if (!entries[m.id][m.tabId]) entries[m.id][m.tabId] = [];
      const entry = {
        id: randomUUID(),
        text: body.text || "",
        timestamp: new Date().toISOString(),
      };
      entries[m.id][m.tabId].push(entry);
      await saveEntries(entries);
      return send(res, 200, entry);
    }

    m = match(url, "/api/profiles/:id/tabs/:tabId/entries/:entryId");
    if (method === "PUT" && m) {
      const body = await parseBody(req);
      const entries = await getEntries();
      const list = (entries[m.id] && entries[m.id][m.tabId]) || [];
      const entry = list.find((e) => e.id === m.entryId);
      if (!entry) return send(res, 404, { error: "Entrada nao encontrada" });
      if (body.text !== undefined) entry.text = body.text;
      await saveEntries(entries);
      return send(res, 200, entry);
    }
    if (method === "DELETE" && m) {
      const entries = await getEntries();
      const list = (entries[m.id] && entries[m.id][m.tabId]) || [];
      entries[m.id][m.tabId] = list.filter((e) => e.id !== m.entryId);
      await saveEntries(entries);
      return send(res, 200, { ok: true });
    }

    if (method === "POST" && url === "/api/admin/audit") {
      const body = await parseBody(req);
      await appendAudit({
        profileId: body.profileId || "system",
        eventType: body.eventType || "evento",
        description: body.description || "",
      });
      return send(res, 200, { ok: true });
    }

    if (method === "POST" && url === "/api/admin/audit/list") {
      const body = await parseBody(req);
      if (body.password !== ADMIN_PASSWORD)
        return send(res, 401, { error: "Acesso negado" });
      return send(res, 200, await getAudit());
    }

    if (method === "POST" && url === "/api/admin/passwords") {
      const body = await parseBody(req);
      if (body.password !== ADMIN_PASSWORD)
        return send(res, 401, { error: "Acesso negado" });
      return send(res, 200, await getPasswords());
    }

    m = match(url, "/api/admin/passwords/:id");
    if (method === "PUT" && m) {
      const body = await parseBody(req);
      if (body.password !== ADMIN_PASSWORD)
        return send(res, 401, { error: "Acesso negado" });
      if (!VALID_PROFILES.includes(m.id))
        return send(res, 404, { error: "Perfil invalido" });
      if (!body.newPassword || String(body.newPassword).length < 4)
        return send(res, 400, { error: "Nova senha invalida" });
      const passwords = await getPasswords();
      passwords[m.id] = String(body.newPassword);
      await savePasswords(passwords);
      await appendAudit({
        profileId: m.id,
        eventType: "senha_alterada",
        description: "Senha alterada para " + m.id,
      });
      return send(res, 200, { ok: true });
    }

    if (method === "POST" && url === "/api/admin/backup") {
      const body = await parseBody(req);
      if (body.password !== ADMIN_PASSWORD)
        return send(res, 401, { error: "Acesso negado" });
      const passwords = await getPasswords();
      const stores = await readJSON("stores", {});
      const perfis = {};
      for (const id of VALID_PROFILES) {
        const store = stores[id] || {};
        perfis[id] = {
          senha: passwords[id],
          abas: store.__tabs__ || [],
          conteudo: store,
          ultima_sync: store.__savedAt__ || null,
        };
      }
      return send(res, 200, {
        versao: "2.1",
        gerado_em: new Date().toISOString(),
        perfis,
      });
    }

    if (method === "POST" && url === "/api/estrangeiros/login") {
      const body = await parseBody(req);
      const users = await getUsers();
      const user = users.find(
        (u) =>
          u.name &&
          u.name.toLowerCase() === (body.name || "").toLowerCase() &&
          u.password === body.password
      );
      if (!user) return send(res, 401, { error: "Credenciais invalidas" });
      return send(res, 200, { user });
    }

    if (method === "POST" && url === "/api/estrangeiros/register") {
      const body = await parseBody(req);
      const users = await getUsers();
      if (users.some((u) => u.name && u.name.toLowerCase() === (body.name || "").toLowerCase()))
        return send(res, 409, { error: "Nome ja existe" });
      const user = {
        id: randomUUID(),
        name: body.name || "",
        discordNick: body.discordNick || "",
        password: body.password || "",
        createdAt: new Date().toISOString(),
        tabs: [
          { id: "anotacoes", label: "Anotacoes", entries: [] },
          { id: "enigmas", label: "Enigmas", entries: [] },
          { id: "teorias", label: "Teorias", entries: [] },
        ],
      };
      users.push(user);
      await saveUsers(users);
      return send(res, 200, { user });
    }

    if (method === "POST" && url === "/api/estrangeiros/admin") {
      const body = await parseBody(req);
      if (body.password !== ADMIN_PASSWORD)
        return send(res, 401, { error: "Acesso negado" });
      return send(res, 200, { users: await getUsers(), audit: [] });
    }

    m = match(url, "/api/estrangeiros/:id/data");
    if (method === "GET" && m) {
      const users = await getUsers();
      const user = users.find((u) => u.id === m.id);
      if (!user) return send(res, 404, { error: "Usuario nao encontrado" });
      return send(res, 200, { tabs: user.tabs || [] });
    }
    if (method === "PUT" && m) {
      const body = await parseBody(req);
      const users = await getUsers();
      const user = users.find((u) => u.id === m.id);
      if (!user) return send(res, 404, { error: "Usuario nao encontrado" });
      user.tabs = Array.isArray(body.tabs) ? body.tabs : user.tabs || [];
      await saveUsers(users);
      return send(res, 200, { ok: true, tabs: user.tabs });
    }

    m = match(url, "/api/estrangeiros/:id/tabs");
    if (method === "GET" && m) {
      const users = await getUsers();
      const user = users.find((u) => u.id === m.id);
      if (!user) return send(res, 404, { error: "Usuario nao encontrado" });
      return send(res, 200, user.tabs || []);
    }
    if (method === "POST" && m) {
      const body = await parseBody(req);
      const users = await getUsers();
      const user = users.find((u) => u.id === m.id);
      if (!user) return send(res, 404, { error: "Usuario nao encontrado" });
      const tab = {
        id: randomUUID(),
        label: body.label || "Nova aba",
        entries: [],
      };
      user.tabs = user.tabs || [];
      user.tabs.push(tab);
      await saveUsers(users);
      return send(res, 200, tab);
    }

    m = match(url, "/api/estrangeiros/admin/users/:id/password");
    if (method === "PUT" && m) {
      const body = await parseBody(req);
      if (body.password !== ADMIN_PASSWORD)
        return send(res, 401, { error: "Acesso negado" });
      const users = await getUsers();
      const user = users.find((u) => u.id === m.id);
      if (!user) return send(res, 404, { error: "Usuario nao encontrado" });
      if (!body.newPassword || String(body.newPassword).length < 4)
        return send(res, 400, { error: "Nova senha invalida" });
      user.password = String(body.newPassword);
      await saveUsers(users);
      return send(res, 200, { ok: true });
    }

    m = match(url, "/api/estrangeiros/admin/users/:id");
    if (method === "DELETE" && m) {
      const body = await parseBody(req);
      if (body.password !== ADMIN_PASSWORD)
        return send(res, 401, { error: "Acesso negado" });
      const users = await getUsers();
      const filtered = users.filter((u) => u.id !== m.id);
      if (filtered.length === users.length)
        return send(res, 404, { error: "Usuario nao encontrado" });
      await saveUsers(filtered);
      return send(res, 200, { ok: true });
    }

    m = match(url, "/api/estrangeiros/:id");
    if (method === "DELETE" && m) {
      const body = await parseBody(req);
      if (body.password !== ADMIN_PASSWORD)
        return send(res, 401, { error: "Acesso negado" });
      const users = await getUsers();
      const filtered = users.filter((u) => u.id !== m.id);
      if (filtered.length === users.length)
        return send(res, 404, { error: "Usuario nao encontrado" });
      await saveUsers(filtered);
      return send(res, 200, { ok: true });
    }

    // Serve frontend (client/dist)
    const distDir = path.join(__dirname, "..", "client", "dist");
    if (method === "GET" && !url.startsWith("/api")) {
      if (!existsSync(distDir)) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(
          "<!doctype html><html><body style=\"font-family:monospace;background:#0a0a0a;color:#ff6600;padding:40px\">" +
            "<h1>FORTITUDE</h1><p>API ok, mas client/dist nao existe. Rebuild no Railway.</p>" +
            "<p>health: <a href=\"/api/healthz\" style=\"color:#ff8c00\">/api/healthz</a></p></body></html>"
        );
        return;
      }
      let filePath = path.join(distDir, url === "/" ? "index.html" : url.split("?")[0]);
      if (!existsSync(filePath) || (await fs.stat(filePath).catch(() => null))?.isDirectory()) {
        filePath = path.join(distDir, "index.html");
      }
      if (existsSync(filePath)) {
        const ext = path.extname(filePath).toLowerCase();
        const types = {
          ".html": "text/html; charset=utf-8",
          ".js": "application/javascript; charset=utf-8",
          ".css": "text/css; charset=utf-8",
          ".svg": "image/svg+xml",
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".ico": "image/x-icon",
          ".json": "application/json",
          ".woff": "font/woff",
          ".woff2": "font/woff2",
        };
        res.writeHead(200, {
          "Content-Type": types[ext] || "application/octet-stream",
          "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=86400",
        });
        createReadStream(filePath).pipe(res);
        return;
      }
    }

    send(res, 404, { error: "Not found" });
  } catch (err) {
    console.error(err);
    send(res, 500, { error: "Internal error" });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("[Fortitude] http://0.0.0.0:" + PORT);
  const distDir = path.join(__dirname, "..", "client", "dist");
  console.log("[Fortitude] dist exists:", existsSync(distDir));
});
