import { useState, useEffect, useCallback, useRef } from "react";
import { useSettings } from "@/contexts/SettingsContext";

interface EstrangeiroUser {
  id: string;
  name: string;
  discordNick: string;
  createdAt: string;
}

interface EntryItem {
  id: string;
  text: string;
  timestamp: string;
}

interface TabItem {
  id: string;
  label: string;
  entries?: EntryItem[];
  /** Formato antigo, mantido apenas para migrar dados já existentes. */
  content?: string;
}

function nowStr() {
  return new Date().toISOString().replace("T", " ").substring(0, 19);
}
function entryUid() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

interface EstrangeiroFlowProps {
  onBack: () => void;
}

const ACCENT = "#6ab4f0";

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

export function EstrangeiroFlow({ onBack }: EstrangeiroFlowProps) {
  const { settings } = useSettings();
  const dm = settings.darkMode;
  const fontSize = settings.fontSize;
  const [view, setView] = useState<"auth" | "dashboard">("auth");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [user, setUser] = useState<EstrangeiroUser | null>(null);

  // Auth fields
  const [name, setName]               = useState("");
  const [password, setPassword]       = useState("");
  const [discordNick, setDiscordNick] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError]     = useState("");

  // Dashboard tabs
  const [tabs, setTabs]       = useState<TabItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");
  const [input, setInput]     = useState("");
  const [saving, setSaving]   = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Rename state
  const [renamingId, setRenamingId]     = useState<string | null>(null);
  const [renameValue, setRenameValue]   = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bg  = dm ? "#050505" : "#f5f5f5";
  const fg  = dm ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.82)";
  const sub = dm ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.38)";
  const brd = dm ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.12)";
  const inp = dm ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  const fz  = fontSize === "sm" ? "11px" : fontSize === "lg" ? "14px" : "12px";

  const loadData = useCallback(async (u: EstrangeiroUser) => {
    try {
      const r = await fetch(`/api/estrangeiros/${u.id}/data`);
      if (r.ok) {
        const d = await r.json() as { tabs?: TabItem[] };
        const normalized = (d.tabs ?? []).map(tab => {
          if (Array.isArray(tab.entries)) return { id: tab.id, label: tab.label, entries: tab.entries };
          const oldContent = typeof tab.content === "string" ? tab.content.trim() : "";
          return {
            id: tab.id,
            label: tab.label,
            entries: oldContent
              ? [{ id: `legacy-${tab.id}`, text: oldContent, timestamp: "registro anterior" }]
              : [],
          };
        });
        setTabs(normalized);
        setActiveTab(normalized[0]?.id ?? "");
      }
    } catch { /* ignore */ }
  }, []);

  const persistTabs = useCallback((newTabs: TabItem[], userId: string) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      setSaving(true);
      try {
        await fetch(`/api/estrangeiros/${userId}/data`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tabs: newTabs }),
        });
        setSaveMsg("salvo ✓");
        setTimeout(() => setSaveMsg(""), 1800);
      } catch { /* ignore */ } finally {
        setSaving(false);
      }
    }, 800);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authLoading) return;
    setAuthError("");
    setAuthLoading(true);
    try {
      const endpoint = authMode === "login" ? "/api/estrangeiros/login" : "/api/estrangeiros/register";
      const body: Record<string, string> = { name: name.trim(), password };
      if (authMode === "register") body.discordNick = discordNick.trim();
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json() as { user?: EstrangeiroUser; error?: string };
      if (!r.ok) { setAuthError(data.error ?? "Erro desconhecido"); return; }
      const u = data.user!;
      setUser(u);
      await loadData(u);
      setView("dashboard");
    } catch {
      setAuthError("Falha na conexão");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdd = () => {
    if (!user || !input.trim()) return;
    const entry: EntryItem = { id: entryUid(), text: input.trim(), timestamp: nowStr() };
    const updated = tabs.map(t =>
      t.id === activeTab ? { ...t, entries: [entry, ...(t.entries ?? [])] } : t
    );
    setTabs(updated);
    setInput("");
    persistTabs(updated, user.id);
  };

  const handleRemove = (entryId: string) => {
    if (!user) return;
    const updated = tabs.map(t =>
      t.id === activeTab ? { ...t, entries: (t.entries ?? []).filter(e => e.id !== entryId) } : t
    );
    setTabs(updated);
    persistTabs(updated, user.id);
  };

  const addTab = () => {
    if (!user) return;
    const id = genId();
    const newTab: TabItem = { id, label: "Nova Aba", entries: [] };
    const updated = [...tabs, newTab];
    setTabs(updated);
    setActiveTab(id);
    setRenamingId(id);
    setRenameValue("Nova Aba");
    persistTabs(updated, user.id);
  };

  const finishRename = () => {
    if (!user || !renamingId) return;
    const label = renameValue.trim() || "Sem título";
    const updated = tabs.map(t => t.id === renamingId ? { ...t, label } : t);
    setTabs(updated);
    setRenamingId(null);
    persistTabs(updated, user.id);
  };

  const deleteTab = (id: string) => {
    if (!user) return;
    const updated = tabs.filter(t => t.id !== id);
    setTabs(updated);
    if (activeTab === id) setActiveTab(updated[0]?.id ?? "");
    setConfirmDelete(null);
    persistTabs(updated, user.id);
  };

  const currentTab = tabs.find(t => t.id === activeTab);

  // ── AUTH SCREEN ──────────────────────────────────────────────────────────
  if (view === "auth") {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        minHeight: "100vh", backgroundColor: bg, fontFamily: "monospace",
        padding: "24px",
      }}>
        {/* Back */}
        <button onClick={onBack} style={{
          position: "fixed", top: "28px", left: "28px",
          background: "none", border: "none", cursor: "pointer",
          fontFamily: "monospace", fontSize: "10px", letterSpacing: "0.2em",
          color: sub, display: "flex", alignItems: "center", gap: "6px",
        }}>
          ← VOLTAR
        </button>

        <div style={{
          width: "min(420px, 94vw)",
          border: `1px solid ${brd}`,
          backgroundColor: dm ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
        }}>
          {/* Header */}
          <div style={{
            padding: "22px 28px 18px",
            borderBottom: `1px solid ${brd}`,
            display: "flex", alignItems: "center", gap: "10px",
          }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: ACCENT }} />
            <span style={{ fontSize: "10px", letterSpacing: "0.28em", color: ACCENT, fontWeight: 700 }}>
              ESTRANGEIRO
            </span>
          </div>

          {/* Mode toggle */}
          <div style={{ display: "flex", borderBottom: `1px solid ${brd}` }}>
            {(["login", "register"] as const).map(m => (
              <button key={m} onClick={() => { setAuthMode(m); setAuthError(""); }} style={{
                flex: 1, fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.2em",
                padding: "11px", border: "none", cursor: "pointer", transition: "all 0.15s",
                backgroundColor: authMode === m ? `${ACCENT}14` : "transparent",
                color: authMode === m ? ACCENT : sub,
                borderBottom: authMode === m ? `1px solid ${ACCENT}` : "1px solid transparent",
                marginBottom: "-1px",
              }}>
                {m === "login" ? "ENTRAR" : "CADASTRAR"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "9px", letterSpacing: "0.18em", color: sub, marginBottom: "6px" }}>
                NOME
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Seu nome…"
                autoFocus
                style={{
                  width: "100%", boxSizing: "border-box",
                  fontFamily: "monospace", fontSize: fz,
                  padding: "10px 12px",
                  backgroundColor: inp,
                  border: `1px solid ${brd}`,
                  color: fg, caretColor: ACCENT, outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "9px", letterSpacing: "0.18em", color: sub, marginBottom: "6px" }}>
                SENHA
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%", boxSizing: "border-box",
                  fontFamily: "monospace", fontSize: fz,
                  padding: "10px 12px",
                  backgroundColor: inp,
                  border: `1px solid ${brd}`,
                  color: fg, caretColor: ACCENT, outline: "none",
                }}
              />
            </div>

            {authMode === "register" && (
              <div>
                <label style={{ display: "block", fontSize: "9px", letterSpacing: "0.18em", color: sub, marginBottom: "6px" }}>
                  NICK DO DISCORD
                </label>
                <input
                  value={discordNick}
                  onChange={e => setDiscordNick(e.target.value)}
                  placeholder="usuario#0000 ou @usuario"
                  style={{
                    width: "100%", boxSizing: "border-box",
                    fontFamily: "monospace", fontSize: fz,
                    padding: "10px 12px",
                    backgroundColor: inp,
                    border: `1px solid ${brd}`,
                    color: fg, caretColor: ACCENT, outline: "none",
                  }}
                />
              </div>
            )}

            {authError && (
              <p style={{ margin: 0, fontSize: "10px", letterSpacing: "0.1em", color: "#cc2200" }}>
                ✗ {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={authLoading || !name.trim() || !password || (authMode === "register" && !discordNick.trim())}
              style={{
                fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.22em", fontWeight: 700,
                padding: "13px", border: `1px solid ${ACCENT}55`,
                backgroundColor: authLoading ? "transparent" : `${ACCENT}18`,
                color: authLoading ? sub : ACCENT,
                cursor: authLoading ? "not-allowed" : "pointer",
                transition: "all 0.15s",
              }}
            >
              {authLoading ? "AGUARDE…" : authMode === "login" ? "ENTRAR" : "CADASTRAR"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── DASHBOARD ────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      backgroundColor: bg, fontFamily: "monospace", color: fg,
    }}>
      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", height: "52px",
        borderBottom: `1px solid ${brd}`,
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: ACCENT }} />
          <span style={{ fontSize: "10px", letterSpacing: "0.24em", color: ACCENT, fontWeight: 700 }}>
            {user?.name.toUpperCase()}
          </span>
          {user?.discordNick && (
            <span style={{ fontSize: "9px", color: sub, letterSpacing: "0.08em" }}>
              {user.discordNick}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {(saving || saveMsg) && (
            <span style={{ fontSize: "9px", color: saving ? sub : "#5ecb7a", letterSpacing: "0.1em" }}>
              {saving ? "salvando…" : saveMsg}
            </span>
          )}
          <button onClick={onBack} style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.18em", color: sub,
          }}>
            ← INÍCIO
          </button>
          <button onClick={() => { setView("auth"); setUser(null); setTabs([]); setName(""); setPassword(""); onBack(); }} style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.18em", color: sub,
          }}>
            SAIR
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display: "flex", alignItems: "center",
        borderBottom: `1px solid ${brd}`,
        overflowX: "auto", flexShrink: 0,
        scrollbarWidth: "none",
      }}>
        {tabs.map(tab => (
          <div key={tab.id} style={{
            display: "flex", alignItems: "center",
            borderRight: `1px solid ${brd}`,
            backgroundColor: activeTab === tab.id ? `${ACCENT}10` : "transparent",
            borderBottom: activeTab === tab.id ? `1px solid ${ACCENT}` : "1px solid transparent",
            marginBottom: "-1px",
            flexShrink: 0,
          }}>
            {renamingId === tab.id ? (
              <input
                autoFocus
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onBlur={finishRename}
                onKeyDown={e => { if (e.key === "Enter") finishRename(); if (e.key === "Escape") setRenamingId(null); }}
                style={{
                  fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.14em",
                  padding: "12px 14px",
                  background: "none", border: "none", outline: "none",
                  color: ACCENT, width: "100px",
                }}
              />
            ) : (
              <button
                onClick={() => setActiveTab(tab.id)}
                onDoubleClick={() => { setRenamingId(tab.id); setRenameValue(tab.label); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.14em",
                  padding: "12px 14px",
                  color: activeTab === tab.id ? ACCENT : sub,
                  whiteSpace: "nowrap",
                }}
              >
                {tab.label}
              </button>
            )}
            {/* Delete button */}
            {tabs.length > 1 && (
              confirmDelete === tab.id ? (
                <div style={{ display: "flex", gap: "2px", paddingRight: "8px" }}>
                  <button onClick={() => deleteTab(tab.id)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "monospace", fontSize: "9px", color: "#cc2200", padding: "2px 4px" }}>
                    ✓
                  </button>
                  <button onClick={() => setConfirmDelete(null)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "monospace", fontSize: "9px", color: sub, padding: "2px 4px" }}>
                    ✗
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(tab.id)} style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: sub, fontSize: "10px", padding: "0 10px 0 0", lineHeight: 1,
                  opacity: activeTab === tab.id ? 0.6 : 0.3,
                }}>×</button>
              )
            )}
          </div>
        ))}
        {/* Add tab */}
        <button onClick={addTab} style={{
          background: "none", border: "none", cursor: "pointer",
          fontFamily: "monospace", fontSize: "14px", color: sub,
          padding: "8px 16px", lineHeight: 1, flexShrink: 0,
        }}>+</button>
      </div>

      {/* Content area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px 24px", gap: "12px" }}>
        {tabs.length === 0 ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "10px", letterSpacing: "0.18em", color: sub }}>
              NENHUMA ABA — CLIQUE EM + PARA CRIAR
            </span>
          </div>
        ) : currentTab ? (
          <>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <div style={{
                flex: 1, display: "flex", alignItems: "flex-start",
                border: `1px solid ${brd}`, backgroundColor: inp,
              }}>
                <span style={{ padding: "16px 14px", fontSize: "15px", color: ACCENT, flexShrink: 0 }}>&gt;</span>
                <textarea
                  value={input}
                  onChange={e => {
                    setInput(e.target.value);
                    const el = e.target;
                    el.style.height = "auto";
                    el.style.height = `${el.scrollHeight}px`;
                  }}
                  onKeyDown={e => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      handleAdd();
                    }
                  }}
                  placeholder={`Registrar em ${currentTab.label}... (Ctrl+Enter)`}
                  rows={1}
                  style={{
                    flex: 1, padding: "16px 14px 16px 0", outline: "none",
                    background: "transparent", fontFamily: "monospace", fontSize: "14px",
                    color: ACCENT, caretColor: ACCENT, border: "none", resize: "none",
                    lineHeight: 1.6, overflow: "hidden", minHeight: "52px",
                  }}
                />
              </div>
              <button
                onClick={handleAdd}
                style={{
                  fontFamily: "monospace", fontSize: "11px", fontWeight: 700,
                  letterSpacing: "0.22em", backgroundColor: ACCENT, color: "#080808",
                  border: "none", padding: "0 28px", cursor: "pointer",
                  height: "52px", flexShrink: 0,
                }}
              >
                + REGISTRAR
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "16px" }}>
              <div style={{ flex: 1, height: "1px", backgroundColor: brd }} />
              <span style={{ fontSize: "9px", letterSpacing: "0.22em", color: sub }}>LOG DE ENTRADAS</span>
              <div style={{ flex: 1, height: "1px", backgroundColor: brd }} />
            </div>

            {(currentTab.entries ?? []).length === 0 ? (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                minHeight: "180px", border: `1px dashed ${brd}`,
              }}>
                <span style={{ fontSize: "10px", letterSpacing: "0.18em", color: sub }}>SEM REGISTROS</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {(currentTab.entries ?? []).map((entry, index, entries) => (
                  <div key={entry.id} style={{
                    display: "flex", alignItems: "flex-start", gap: "18px",
                    padding: "14px 18px", border: `1px solid ${brd}`,
                    backgroundColor: dm ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.015)",
                  }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", minWidth: "48px" }}>
                      <span style={{ fontSize: "9px", color: `${ACCENT}66`, letterSpacing: "0.1em" }}>
                        #{String(entries.length - index).padStart(3, "0")}
                      </span>
                      <div style={{ width: "100%", height: "1px", backgroundColor: `${ACCENT}22` }} />
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
                        color: sub, border: `1px solid ${brd}`, background: "none",
                        padding: "4px 9px", cursor: "pointer", flexShrink: 0,
                      }}
                    >
                      REMOVER
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Bottom hint */}
      <div style={{
        padding: "10px 24px",
        borderTop: `1px solid ${brd}`,
        fontSize: "9px", letterSpacing: "0.12em", color: sub,
        flexShrink: 0,
      }}>
        Duplo clique na aba para renomear · × para excluir · + para nova aba · Ctrl+Enter para registrar · salvo automaticamente
      </div>
    </div>
  );
}

// ── ESTRANGEIROS ADMIN PANEL ─────────────────────────────────────────────────

interface AdminUser {
  id: string;
  name: string;
  discordNick: string;
  password: string;
  createdAt: string;
  tabs: TabItem[];
}

function getEntries(tab: TabItem): EntryItem[] {
  if (Array.isArray(tab.entries)) return tab.entries;
  const oldContent = typeof tab.content === "string" ? tab.content.trim() : "";
  return oldContent
    ? [{ id: `legacy-${tab.id}`, text: oldContent, timestamp: "registro anterior" }]
    : [];
}

interface AdminAuditEntry {
  type: "register" | "login";
  userId: string;
  name: string;
  discordNick?: string;
  timestamp: string;
}

interface EstrangeirosAdminProps {
  onClose: () => void;
}

export function EstrangeirosAdmin({ onClose }: EstrangeirosAdminProps) {
  const [loading, setLoading]           = useState(true);
  const [users, setUsers]               = useState<AdminUser[]>([]);
  const [audit, setAudit]               = useState<AdminAuditEntry[]>([]);
  const [tab, setTab]                   = useState<"usuarios" | "historico">("usuarios");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [expandedTab, setExpandedTab]   = useState<string | null>(null);
  const [error, setError]               = useState("");
  const [pwEdit, setPwEdit]             = useState<Record<string, string>>({});
  const [pwMsg, setPwMsg]               = useState<Record<string, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/estrangeiros/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: "Maraca" }),
        });
        if (!r.ok) { setError("Acesso negado"); return; }
        const d = await r.json() as { users: AdminUser[]; audit: AdminAuditEntry[] };
        setUsers(d.users ?? []);
        setAudit((d.audit ?? []).slice().reverse());
      } catch { setError("Falha na conexão"); } finally { setLoading(false); }
    })();
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)",
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        display: "flex", flexDirection: "column",
        width: "min(740px, 96vw)", maxHeight: "88vh",
        backgroundColor: "rgba(6,6,6,0.99)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 22px", borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: ACCENT }} />
            <span style={{ fontFamily: "monospace", fontSize: "10px", letterSpacing: "0.26em", color: "rgba(255,255,255,0.45)" }}>
              PAINEL ESTRANGEIROS
            </span>
            <span style={{ fontFamily: "monospace", fontSize: "9px", color: "rgba(255,255,255,0.2)" }}>
              ({users.length} cadastros)
            </span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", cursor: "pointer", fontFamily: "monospace", fontSize: "16px", lineHeight: 1, padding: "0 2px" }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          {(["usuarios", "historico"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.22em",
              padding: "11px", border: "none", cursor: "pointer", transition: "all 0.15s",
              backgroundColor: tab === t ? `${ACCENT}14` : "transparent",
              color: tab === t ? ACCENT : "rgba(255,255,255,0.3)",
              borderBottom: tab === t ? `1px solid ${ACCENT}` : "1px solid transparent",
              marginBottom: "-1px",
            }}>
              {t === "usuarios" ? `PERFIS (${users.length})` : `HISTÓRICO (${audit.length})`}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading && (
            <div style={{ padding: "40px", textAlign: "center", fontFamily: "monospace", fontSize: "10px", color: "rgba(255,255,255,0.25)", letterSpacing: "0.18em" }}>
              CARREGANDO…
            </div>
          )}
          {error && (
            <div style={{ padding: "40px", textAlign: "center", fontFamily: "monospace", fontSize: "10px", color: "#cc2200", letterSpacing: "0.18em" }}>
              {error}
            </div>
          )}

          {/* PERFIS */}
          {!loading && !error && tab === "usuarios" && (
            users.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", fontFamily: "monospace", fontSize: "10px", color: "rgba(255,255,255,0.2)", letterSpacing: "0.18em" }}>
                NENHUM CADASTRO AINDA
              </div>
            ) : users.map(u => (
              <div key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <button onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)} style={{
                  width: "100%", display: "flex", alignItems: "center", gap: "14px",
                  padding: "14px 22px", background: "none", border: "none", cursor: "pointer",
                  textAlign: "left",
                }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: ACCENT, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "monospace", fontSize: "12px", color: "rgba(220,220,220,0.9)", letterSpacing: "0.08em" }}>
                      {u.name}
                    </div>
                    <div style={{ fontFamily: "monospace", fontSize: "9px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em", marginTop: "3px" }}>
                      {u.discordNick} · senha: <span style={{ color: "rgba(255,255,255,0.5)" }}>{u.password}</span> · cadastro: {new Date(u.createdAt).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <span style={{ fontFamily: "monospace", fontSize: "9px", color: "rgba(255,255,255,0.2)" }}>
                    {expandedUser === u.id ? "▲" : "▼"}
                  </span>
                </button>

                {expandedUser === u.id && (
                  <div style={{ padding: "0 22px 16px 42px" }}>

                    {/* ── Actions ── */}
                    <div style={{ display: "flex", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
                      {/* Change password inline */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <input
                          value={pwEdit[u.id] ?? ""}
                          onChange={e => setPwEdit(p => ({ ...p, [u.id]: e.target.value }))}
                          placeholder="nova senha"
                          style={{
                            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
                            color: "rgba(220,220,220,0.9)", fontFamily: "monospace", fontSize: "10px",
                            padding: "5px 9px", letterSpacing: "0.06em", outline: "none", width: "120px",
                          }}
                        />
                        <button
                          onClick={async () => {
                            const np = (pwEdit[u.id] ?? "").trim();
                            if (np.length < 4) { setPwMsg(p => ({ ...p, [u.id]: "mínimo 4 chars" })); return; }
                            const r = await fetch(`/api/estrangeiros/admin/users/${u.id}/password`, {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ password: "Maraca", newPassword: np }),
                            });
                            if (r.ok) {
                              setUsers(us => us.map(x => x.id === u.id ? { ...x, password: np } : x));
                              setPwEdit(p => ({ ...p, [u.id]: "" }));
                              setPwMsg(p => ({ ...p, [u.id]: "✓ atualizada" }));
                              setTimeout(() => setPwMsg(p => ({ ...p, [u.id]: "" })), 2000);
                            } else {
                              setPwMsg(p => ({ ...p, [u.id]: "erro" }));
                            }
                          }}
                          style={{
                            background: "none", border: "1px solid rgba(255,200,50,0.3)", cursor: "pointer",
                            fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.16em",
                            color: "rgba(255,200,50,0.7)", padding: "5px 10px",
                          }}
                        >
                          MUDAR SENHA
                        </button>
                        {pwMsg[u.id] && (
                          <span style={{ fontFamily: "monospace", fontSize: "9px", color: pwMsg[u.id]?.startsWith("✓") ? "#5ecb7a" : "#cc2200" }}>
                            {pwMsg[u.id]}
                          </span>
                        )}
                      </div>

                      {/* Delete user */}
                      {deleteConfirm === u.id ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontFamily: "monospace", fontSize: "9px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em" }}>confirmar?</span>
                          <button
                            onClick={async () => {
                              const r = await fetch(`/api/estrangeiros/admin/users/${u.id}`, {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ password: "Maraca" }),
                              });
                              if (r.ok) {
                                setUsers(us => us.filter(x => x.id !== u.id));
                                setExpandedUser(null);
                              }
                              setDeleteConfirm(null);
                            }}
                            style={{
                              background: "none", border: "1px solid rgba(200,40,40,0.4)", cursor: "pointer",
                              fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.16em",
                              color: "rgba(200,60,60,0.9)", padding: "5px 10px",
                            }}
                          >SIM, APAGAR</button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            style={{
                              background: "none", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer",
                              fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.12em",
                              color: "rgba(255,255,255,0.3)", padding: "5px 10px",
                            }}
                          >CANCELAR</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(u.id)}
                          style={{
                            background: "none", border: "1px solid rgba(200,40,40,0.3)", cursor: "pointer",
                            fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.16em",
                            color: "rgba(200,60,60,0.6)", padding: "5px 10px",
                          }}
                        >APAGAR PERFIL</button>
                      )}
                    </div>

                    {/* ── Tabs content ── */}
                    <div style={{ fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.25)", marginBottom: "10px" }}>
                      ABAS ({u.tabs.length})
                    </div>
                    {u.tabs.length === 0 ? (
                      <p style={{ fontFamily: "monospace", fontSize: "10px", color: "rgba(255,255,255,0.18)", margin: 0 }}>nenhuma aba</p>
                    ) : u.tabs.map(t => {
                      const key = `${u.id}:${t.id}`;
                      const entries = getEntries(t);
                      return (
                        <div key={t.id} style={{ marginBottom: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <button onClick={() => setExpandedTab(expandedTab === key ? null : key)} style={{
                            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "9px 14px", background: "none", border: "none", cursor: "pointer",
                          }}>
                            <span style={{ fontFamily: "monospace", fontSize: "10px", color: ACCENT, letterSpacing: "0.1em" }}>
                              {t.label}
                            </span>
                            <span style={{ fontFamily: "monospace", fontSize: "9px", color: "rgba(255,255,255,0.2)" }}>
                              {entries.length ? `${entries.length} entrada${entries.length === 1 ? "" : "s"} · ` : "vazia · "}{expandedTab === key ? "▲" : "▼"}
                            </span>
                          </button>
                          {expandedTab === key && entries.length > 0 && (
                            <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                              {entries.map(entry => (
                                <div key={entry.id} style={{
                                  padding: "10px 14px",
                                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                                  fontFamily: "monospace", fontSize: "11px",
                                  color: "rgba(200,200,200,0.75)", lineHeight: 1.7,
                                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                                }}>
                                  <div>{entry.text}</div>
                                  <div style={{ marginTop: "5px", fontSize: "9px", color: "rgba(255,255,255,0.2)" }}>{entry.timestamp}</div>
                                </div>
                              ))}
                            </div>
                          )}
                          {expandedTab === key && entries.length === 0 && (
                            <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.05)", fontFamily: "monospace", fontSize: "10px", color: "rgba(255,255,255,0.18)" }}>
                              (sem conteúdo)
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}

          {/* HISTÓRICO */}
          {!loading && !error && tab === "historico" && (
            audit.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", fontFamily: "monospace", fontSize: "10px", color: "rgba(255,255,255,0.2)", letterSpacing: "0.18em" }}>
                NENHUMA ATIVIDADE AINDA
              </div>
            ) : audit.map((entry, i) => {
              const dot = entry.type === "register" ? "#5ecb7a" : ACCENT;
              const label = entry.type === "register" ? "CADASTRO" : "ENTRADA";
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: "14px",
                  padding: "10px 22px", borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: dot, marginTop: "4px", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "monospace", fontSize: "11px", color: "rgba(220,220,220,0.85)", margin: 0, lineHeight: 1.5 }}>
                      <span style={{ color: dot }}>{label}</span>
                      {" — "}{entry.name}
                      {entry.discordNick ? ` (${entry.discordNick})` : ""}
                    </p>
                    <span style={{ fontFamily: "monospace", fontSize: "9px", color: "rgba(255,255,255,0.2)", letterSpacing: "0.08em" }}>
                      {new Date(entry.timestamp).toLocaleString("pt-BR")}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
