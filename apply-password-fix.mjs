import fs from "fs";
const p = "server/index.mjs";
let t = fs.readFileSync(p, "utf8");
let n = 0;

if (!t.includes("/api/profiles/:id/password")) {
  const needle = 'm = match(url, "/api/profiles/:id/data");';
  if (!t.includes(needle)) throw new Error("profiles data marker missing");
  const block = `m = match(url, "/api/profiles/:id/password");
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

    m = match(url, "/api/profiles/:id/data");`;
  t = t.replace(needle, block);
  n++;
  console.log("+ /api/profiles/:id/password");
}

if (!t.includes('url === "/api/admin/audit"') && !t.includes("url === \"/api/admin/audit\")")) {
  const needle = 'if (method === "POST" && url === "/api/admin/audit/list")';
  if (t.includes(needle)) {
    t = t.replace(needle, `if (method === "POST" && url === "/api/admin/audit") {
      const body = await parseBody(req);
      await appendAudit({
        profileId: body.profileId || "system",
        eventType: body.eventType || "evento",
        description: body.description || "",
      });
      return send(res, 200, { ok: true });
    }

    if (method === "POST" && url === "/api/admin/audit/list")`);
    n++;
    console.log("+ /api/admin/audit");
  }
}

if (!t.includes("/api/estrangeiros/admin/users/:id")) {
  const needle = 'm = match(url, "/api/estrangeiros/:id");\n    if (method === "DELETE" && m) {';
  if (!t.includes(needle)) throw new Error("estrangeiros delete marker missing");
  const block = `m = match(url, "/api/estrangeiros/admin/users/:id/password");
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
    if (method === "DELETE" && m) {`;
  t = t.replace(needle, block);
  n++;
  console.log("+ estrangeiros admin users password/delete");
}

const old = `if (!VALID_PROFILES.includes(m.id))
        return send(res, 404, { error: "Perfil invalido" });
      const passwords = await getPasswords();
      passwords[m.id] = body.newPassword;`;
const neu = `if (!VALID_PROFILES.includes(m.id))
        return send(res, 404, { error: "Perfil invalido" });
      if (!body.newPassword || String(body.newPassword).length < 4)
        return send(res, 400, { error: "Nova senha invalida (minimo 4 caracteres)" });
      const passwords = await getPasswords();
      passwords[m.id] = String(body.newPassword);`;
if (t.includes(old)) {
  t = t.replace(old, neu);
  n++;
  console.log("+ harden admin passwords PUT");
}

fs.writeFileSync(p, t);
console.log(n ? `OK — ${n} fix(es) de senha aplicados` : "OK — rotas de senha ja estavam presentes");
