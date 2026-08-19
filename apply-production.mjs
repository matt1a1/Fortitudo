import fs from "fs";

const p = "server/index.mjs";
let t = fs.readFileSync(p, "utf8");

if (!t.includes("createReadStream")) {
  t = t.replace(
    'import fs from "fs/promises";',
    'import fs from "fs/promises";\nimport { createReadStream, existsSync } from "fs";'
  );
  console.log("+ import fs sync");
}

if (!t.includes("client\", \"dist\")") && !t.includes("client', 'dist')") && !t.includes('"..", "client", "dist"')) {
  const needle = 'send(res, 404, { error: "Not found" });';
  const idx = t.lastIndexOf(needle);
  if (idx < 0) throw new Error("404 marker not found");
  const block = `// Production: serve built frontend (client/dist)
    const distDir = path.join(__dirname, "..", "client", "dist");
    if (method === "GET" && !url.startsWith("/api") && existsSync(distDir)) {
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

    send(res, 404, { error: "Not found" });`;
  t = t.slice(0, idx) + block + t.slice(idx + needle.length);
  console.log("+ static dist serve");
}

fs.writeFileSync(p, t);
console.log("OK — servidor pronto para producao (API + site na mesma porta)");
