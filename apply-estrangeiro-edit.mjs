import fs from "fs";

const paths = [
  "EstrangeiroFlow.tsx",
  "client/src/pages/EstrangeiroFlow.tsx",
].filter((p) => fs.existsSync(p));

if (!paths.length) {
  console.error("EstrangeiroFlow.tsx nao encontrado");
  process.exit(1);
}

for (const p of paths) {
  let t = fs.readFileSync(p, "utf8");

  if (t.includes("function EstrangeiroEntry")) {
    console.log(p, "ja tem edicao");
    continue;
  }

  t = t.replace(
    "interface EntryItem {\n  id: string;\n  text: string;\n  timestamp: string;\n}",
    "interface EntryItem {\n  id: string;\n  text: string;\n  timestamp: string;\n  editedAt?: string;\n}"
  );

  if (!t.includes("const handleEdit")) {
    const marker = `  const handleRemove = (entryId: string) => {
    if (!user) return;
    const updated = tabs.map(t =>
      t.id === activeTab ? { ...t, entries: (t.entries ?? []).filter(e => e.id !== entryId) } : t
    );
    setTabs(updated);
    persistTabs(updated, user.id);
  };`;
    const insert = marker + `

  const handleEdit = (entryId: string, newText: string) => {
    if (!user) return;
    const updated = tabs.map(t =>
      t.id === activeTab
        ? {
            ...t,
            entries: (t.entries ?? []).map(e =>
              e.id === entryId ? { ...e, text: newText, editedAt: nowStr() } : e
            ),
          }
        : t
    );
    setTabs(updated);
    persistTabs(updated, user.id);
  };`;
    if (!t.includes(marker)) {
      console.error("handleRemove block not found in", p);
      process.exit(1);
    }
    t = t.replace(marker, insert);
  }

  const component = `
function EstrangeiroEntry({
  entry, index, total, accent, fg, sub, brd, dm, onRemove, onEdit,
}: {
  entry: EntryItem; index: number; total: number;
  accent: string; fg: string; sub: string; brd: string; dm: boolean;
  onRemove: () => void; onEdit: (text: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.text);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (editing && textareaRef.current) {
      const el = textareaRef.current;
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [editing]);

  const saveEdit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== entry.text) onEdit(trimmed);
    else setDraft(entry.text);
    setEditing(false);
  };
  const cancelEdit = () => { setDraft(entry.text); setEditing(false); };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "flex-start", gap: "18px",
        padding: "14px 18px",
        border: "1px solid " + (editing ? accent + "66" : brd),
        backgroundColor: editing
          ? (dm ? "rgba(106,180,240,0.06)" : "rgba(106,180,240,0.08)")
          : (dm ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.015)"),
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", minWidth: "48px" }}>
        <span style={{ fontSize: "9px", color: accent + "66", letterSpacing: "0.1em" }}>
          #{"" + String(total - index).padStart(3, "0")}
        </span>
        <div style={{ width: "100%", height: "1px", backgroundColor: accent + "22" }} />
        <span style={{ fontSize: "9px", color: accent, letterSpacing: "0.05em" }}>{entry.id}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={e => {
              setDraft(e.target.value);
              const el = e.target;
              el.style.height = "auto";
              el.style.height = el.scrollHeight + "px";
            }}
            onKeyDown={e => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); saveEdit(); }
              if (e.key === "Escape") cancelEdit();
            }}
            style={{
              width: "100%", boxSizing: "border-box",
              fontFamily: "monospace", fontSize: "14px", lineHeight: 1.6,
              color: accent, background: "transparent", border: "none", outline: "none",
              resize: "none", caretColor: accent, padding: 0,
            }}
          />
        ) : (
          <p
            onDoubleClick={() => { setDraft(entry.text); setEditing(true); }}
            title="Clique duas vezes para editar"
            style={{
              margin: 0, fontSize: "14px", color: fg, lineHeight: 1.6,
              whiteSpace: "pre-wrap", wordBreak: "break-word", cursor: "text",
            }}
          >{entry.text}</p>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "7px" }}>
          <span style={{ fontSize: "9px", color: sub, letterSpacing: "0.08em" }}>
            {entry.timestamp}
            {entry.editedAt && (
              <span style={{ marginLeft: "10px", color: accent + "88" }}>editado {entry.editedAt}</span>
            )}
          </span>
          {!editing && hovered && (
            <button
              onClick={() => { setDraft(entry.text); setEditing(true); }}
              style={{
                fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.12em",
                color: accent + "99", background: "none", border: "none", cursor: "pointer", padding: 0,
              }}
            >EDITAR</button>
          )}
          {editing && (
            <>
              <button onClick={saveEdit} style={{
                fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.12em",
                color: "#5ecb7a", background: "none", border: "1px solid rgba(94,203,122,0.35)",
                padding: "2px 10px", cursor: "pointer",
              }}>SALVAR</button>
              <button onClick={cancelEdit} style={{
                fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.12em",
                color: sub, background: "none", border: "1px solid " + brd,
                padding: "2px 10px", cursor: "pointer",
              }}>CANCELAR</button>
            </>
          )}
        </div>
      </div>
      {!editing && (
        <button
          onClick={onRemove}
          style={{
            fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.12em",
            color: sub, border: "1px solid " + brd, background: "none",
            padding: "4px 9px", cursor: "pointer", flexShrink: 0,
          }}
        >REMOVER</button>
      )}
    </div>
  );
}

`;

  t = t.replace("export function EstrangeiroFlow", component + "export function EstrangeiroFlow");

  const oldBlock = `{(currentTab.entries ?? []).map((entry, index, entries) => (
                  <div key={entry.id} style={{
                    display: "flex", alignItems: "flex-start", gap: "18px",
                    padding: "14px 18px", border: \`1px solid \${brd}\`,
                    backgroundColor: dm ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.015)",
                  }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", minWidth: "48px" }}>
                      <span style={{ fontSize: "9px", color: \`\${ACCENT}66\`, letterSpacing: "0.1em" }}>
                        #\${String(entries.length - index).padStart(3, "0")}
                      </span>
                      <div style={{ width: "100%", height: "1px", backgroundColor: \`\${ACCENT}22\` }} />
                      <span style={{ fontSize: "9px", color: ACCENT, letterSpacing: "0.05em" }}>{entry.id}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        margin: 0, fontSize: "14px", color: fg, lineHeight: 1.6,
                        whiteSpace: "pre-wrap", wordBreak: "break-word",
                      }}>{entry.text}</p>
                      <p style={{ margin: "7px 0 0", fontSize: "9px", color: sub, letterSpacing: "0.08em" }}>
                        {entry.timestamp}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemove(entry.id)}
                      style={{
                        fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.12em",
                        color: sub, border: \`1px solid \${brd}\`, background: "none",
                        padding: "4px 9px", cursor: "pointer", flexShrink: 0,
                      }}
                    >
                      REMOVER
                    </button>
                  </div>
                ))}`;

  // Use regex flexible match for entry block
  const re = /\{\(currentTab\.entries \?\? \[\]\)\.map\(\(entry, index, entries\) => \([\s\S]*?REMOVER[\s\S]*?<\/button>[\s\S]*?<\/div>[\s\S]*?\)\)\}/;
  if (!re.test(t)) {
    console.error("entry block not found in", p);
    process.exit(1);
  }
  const newBlock = `{(currentTab.entries ?? []).map((entry, index, entries) => (
                  <EstrangeiroEntry
                    key={entry.id}
                    entry={entry}
                    index={index}
                    total={entries.length}
                    accent={ACCENT}
                    fg={fg}
                    sub={sub}
                    brd={brd}
                    dm={dm}
                    onRemove={() => handleRemove(entry.id)}
                    onEdit={(text) => handleEdit(entry.id, text)}
                  />
                ))}`;
  t = t.replace(re, newBlock);

  t = t.replace(
    "Duplo clique na aba para renomear · × para excluir · + para nova aba · Ctrl+Enter para registrar · salvo automaticamente",
    "Duplo clique no texto ou EDITAR · aba: duplo clique renomeia · × exclui · + nova · Ctrl+Enter registra · salvo auto"
  );

  fs.writeFileSync(p, t);
  console.log("OK", p);
}
console.log("OK — edicao de anotacoes estrangeiros ativada");
