import fs from "fs";
const paths = [
  "client/src/pages/DashboardPage.tsx",
  "DashboardPage.tsx",
].filter((p) => fs.existsSync(p));
if (!paths.length) {
  console.error("DashboardPage.tsx nao encontrado");
  process.exit(1);
}
for (const p of paths) {
  let t = fs.readFileSync(p, "utf8");
  if (t.includes('border: "none",\n                    borderRadius: 0,\n                    borderBottom: active ? "2px solid var(--c-accent)"')) {
    console.log(p, "ja sem borda cinza");
    continue;
  }
  const old = `borderBottom: active ? "2px solid var(--c-accent)" : "2px solid transparent",
                    backgroundColor: active ? "rgba(var(--c-accent-rgb),0.06)" : "transparent",`;
  const neu = `border: "none",
                    borderRadius: 0,
                    borderBottom: active ? "2px solid var(--c-accent)" : "2px solid transparent",
                    backgroundColor: active ? "rgba(var(--c-accent-rgb),0.06)" : "transparent",
                    boxShadow: "none",
                    WebkitAppearance: "none",
                    appearance: "none",`;
  if (!t.includes(old)) {
    console.error("padrao de aba nao encontrado em", p);
    process.exit(1);
  }
  t = t.replace(old, neu);
  fs.writeFileSync(p, t);
  console.log("OK", p);
}
console.log("OK — bordas cinza das abas removidas");
