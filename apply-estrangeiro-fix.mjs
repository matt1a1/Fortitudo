import fs from "fs";
const p = "server/index.mjs";
let t = fs.readFileSync(p, "utf8");

if (!t.includes("/api/estrangeiros/:id/data")) {
  const marker = 'm = match(url, "/api/estrangeiros/:id/tabs");';
  const block = `m = match(url, "/api/estrangeiros/:id/data");
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
      user.tabs = Array.isArray(body.tabs) ? body.tabs : (user.tabs || []);
      await saveUsers(users);
      return send(res, 200, { ok: true, tabs: user.tabs });
    }

    m = match(url, "/api/estrangeiros/:id/tabs");`;
  if (!t.includes(marker)) throw new Error("marker not found");
  t = t.replace(marker, block);
}

t = t.replace(
  "return send(res, 200, user);\n    }\n\n    if (method === \"POST\" && url === \"/api/estrangeiros/register\")",
  "return send(res, 200, { user });\n    }\n\n    if (method === \"POST\" && url === \"/api/estrangeiros/register\")"
);
t = t.replace(
  "return send(res, 200, user);\n    }\n\n    if (method === \"POST\" && url === \"/api/estrangeiros/admin\")",
  "return send(res, 200, { user });\n    }\n\n    if (method === \"POST\" && url === \"/api/estrangeiros/admin\")"
);

t = t.replace(
  "tabs: [],\n      };\n      users.push(user);",
  `tabs: [
          { id: "anotacoes", label: "Anotacoes", entries: [] },
          { id: "enigmas", label: "Enigmas", entries: [] },
          { id: "teorias", label: "Teorias", entries: [] },
        ],
      };
      users.push(user);`
);

if (!t.includes("/api/estrangeiros/admin/users/:id")) {
  const ins = `m = match(url, "/api/estrangeiros/admin/users/:id/password");
    if (method === "PUT" && m) {
      const body = await parseBody(req);
      if (body.password !== ADMIN_PASSWORD) return send(res, 401, { error: "Acesso negado" });
      const users = await getUsers();
      const user = users.find((u) => u.id === m.id);
      if (!user) return send(res, 404, { error: "Usuario nao encontrado" });
      user.password = body.newPassword || user.password;
      await saveUsers(users);
      return send(res, 200, { ok: true });
    }
    m = match(url, "/api/estrangeiros/admin/users/:id");
    if (method === "DELETE" && m) {
      const body = await parseBody(req);
      if (body.password !== ADMIN_PASSWORD) return send(res, 401, { error: "Acesso negado" });
      const users = await getUsers();
      const filtered = users.filter((u) => u.id !== m.id);
      if (filtered.length === users.length) return send(res, 404, { error: "Usuario nao encontrado" });
      await saveUsers(filtered);
      return send(res, 200, { ok: true });
    }

    m = match(url, "/api/estrangeiros/:id");`;
  t = t.replace('m = match(url, "/api/estrangeiros/:id");', ins);
}

fs.writeFileSync(p, t);
console.log("OK — estrangeiros patch aplicado");
