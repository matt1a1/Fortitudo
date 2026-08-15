import { useState, useEffect, useRef } from "react";
import { useSettings } from "@/contexts/SettingsContext";

/* ── Tab config ──────────────────────────────────────────────────── */
interface TabConfig {
  id: string;
  label: string;
  code: string;
}

const DEFAULT_TABS: TabConfig[] = [
  { id: "anotacoes", label: "ANOTAÇÕES", code: "ANT" },
  { id: "cameras",   label: "CÂMERAS",   code: "CAM" },
  { id: "enigmas",   label: "ENIGMAS",   code: "ENI" },
  { id: "virtudes",  label: "VIRTUDES",  code: "VIR" },
  { id: "npc",       label: "NPC",       code: "NPC" },
];

interface EntryItem {
  id: string;
  text: string;
  timestamp: string;
  editedAt?: string;
  highlight?: boolean;
}

interface DashboardPageProps {
  profileId: string;
  onLogout: () => void;
}

function now() {
  return new Date().toISOString().replace("T", " ").substring(0, 19);
}
function uid() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
function labelToCode(label: string) {
  return label.replace(/\s+/g, "").toUpperCase().slice(0, 3);
}

/* ── Animated counter ────────────────────────────────────────────── */
function Counter({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const steps = 12; let i = 0; const from = display;
    const iv = setInterval(() => {
      i++;
      setDisplay(Math.round(from + (value - from) * (i / steps)));
      if (i >= steps) clearInterval(iv);
    }, 30);
    return () => clearInterval(iv);
  }, [value]);
  return <>{String(display).padStart(4, "0")}</>;
}

/* ── Entry row ───────────────────────────────────────────────────── */
function EntryRow({
  entry, index, total, onRemove, onEdit,
}: {
  entry: EntryItem; index: number; total: number;
  onRemove: () => void; onEdit: (newText: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(!entry.highlight);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(entry.text);
  const textareaRef           = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (entry.highlight) {
      const t = setTimeout(() => setVisible(true), 40);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [entry.highlight]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      const el = textareaRef.current;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [editing]);

  const autoGrow = () => {
    const el = textareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; }
  };
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
        display:"flex", alignItems:"flex-start", justifyContent:"space-between",
        backgroundColor: editing ? "var(--c-bg-edit)" : hovered ? "var(--c-bg-card-hover)" : "var(--c-bg-card)",
        border:`1px solid ${editing ? "rgba(var(--c-accent-rgb),0.4)" : hovered ? "rgba(var(--c-accent-rgb),0.28)" : "rgba(var(--c-accent-rgb),0.09)"}`,
        padding:"14px 18px", transition:"all 0.22s ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-12px)",
      }}
    >
      <div style={{ display:"flex", alignItems:"flex-start", gap:"20px", flex:1, minWidth:0 }}>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"4px", minWidth:"52px", flexShrink:0 }}>
          <span style={{ fontFamily:"monospace", fontSize:"9px", color:"rgba(var(--c-accent-rgb),0.2)", letterSpacing:"0.1em" }}>
            #{String(total - index).padStart(3,"0")}
          </span>
          <div style={{ width:"100%", height:"1px", backgroundColor:"rgba(var(--c-accent-rgb),0.08)" }} />
          <span style={{ fontFamily:"monospace", fontSize:"9px", color:"var(--c-accent)", letterSpacing:"0.05em" }}>{entry.id}</span>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          {editing ? (
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={e => { setDraft(e.target.value); autoGrow(); }}
              onKeyDown={e => {
                if (e.key === "Escape") cancelEdit();
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) saveEdit();
              }}
              rows={1}
              style={{
                width:"100%", fontFamily:"monospace", fontSize:"14px",
                color:"var(--c-text-entry-edit)", caretColor:"var(--c-accent)",
                backgroundColor:"transparent", border:"none", outline:"none",
                resize:"none", lineHeight:1.6, overflow:"hidden", whiteSpace:"pre-wrap",
              }}
            />
          ) : (
            <p
              style={{
                fontFamily:"monospace", fontSize:"14px", color:"var(--c-text-entry)",
                wordBreak:"break-word", lineHeight:1.6, whiteSpace:"pre-wrap", cursor:"text",
              }}
              onDoubleClick={() => { setDraft(entry.text); setEditing(true); }}
              title="Clique duas vezes para editar"
            >
              {entry.text}
            </p>
          )}
          <div style={{ display:"flex", alignItems:"center", gap:"10px", marginTop:"6px" }}>
            <p style={{ fontFamily:"monospace", fontSize:"9px", color:"rgba(var(--c-accent-rgb),0.22)", letterSpacing:"0.08em" }}>
              {entry.timestamp}
              {entry.editedAt && (
                <span style={{ color:"rgba(var(--c-accent-rgb),0.3)", marginLeft:"10px" }}>editado {entry.editedAt}</span>
              )}
            </p>
            {!editing && hovered && (
              <button
                onClick={() => { setDraft(entry.text); setEditing(true); }}
                style={{
                  fontFamily:"monospace", fontSize:"9px", letterSpacing:"0.12em",
                  color:"rgba(var(--c-accent-rgb),0.45)", background:"none", border:"none",
                  cursor:"pointer", padding:0, transition:"color 0.2s",
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color="var(--c-accent-lt)")}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color="rgba(var(--c-accent-rgb),0.45)")}
              >
                EDITAR
              </button>
            )}
            {editing && (
              <div style={{ display:"flex", gap:"8px" }}>
                <button onClick={saveEdit} style={{ fontFamily:"monospace", fontSize:"9px", letterSpacing:"0.12em", color:"#3db86a", background:"none", border:"1px solid rgba(61,184,106,0.3)", padding:"2px 10px", cursor:"pointer" }}>SALVAR</button>
                <button onClick={cancelEdit} style={{ fontFamily:"monospace", fontSize:"9px", letterSpacing:"0.12em", color:"rgba(180,180,180,0.4)", background:"none", border:"1px solid rgba(180,180,180,0.12)", padding:"2px 10px", cursor:"pointer" }}>CANCELAR</button>
                <span style={{ fontFamily:"monospace", fontSize:"9px", color:"rgba(var(--c-accent-rgb),0.2)", alignSelf:"center" }}>Ctrl+Enter · Esc</span>
              </div>
            )}
          </div>
        </div>
      </div>
      {!editing && (
        <button
          onClick={onRemove}
          style={{
            fontFamily:"monospace", fontSize:"9px", letterSpacing:"0.15em",
            color: hovered ? "#cc2200" : "transparent",
            border: hovered ? "1px solid rgba(204,34,0,0.35)" : "1px solid transparent",
            backgroundColor: hovered ? "rgba(204,34,0,0.08)" : "transparent",
            padding:"4px 10px", marginLeft:"16px",
            cursor:"pointer", flexShrink:0, transition:"all 0.2s ease",
          }}
        >
          REMOVER
        </button>
      )}
    </div>
  );
}

/* ── Audit log ───────────────────────────────────────────────────── */
function logAudit(profileId: string, eventType: string, description: string) {
  fetch("/api/admin/audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profileId, eventType, description }),
  }).catch(() => {});
}

/* ── Storage helpers ─────────────────────────────────────────────── */
const STORAGE_KEY = (profileId: string) => `fortitude_data_v2_${profileId}`;
const API_BASE    = "/api";

type StoreShape = Record<string, unknown>;

function buildStore(tabs: TabConfig[], data: Record<string, EntryItem[]>): StoreShape {
  return { __tabs__: tabs, __savedAt__: now(), ...data };
}

function countEntries(data: Record<string, EntryItem[]>): number {
  return Object.values(data).reduce((sum, arr) => sum + arr.length, 0);
}

function parseStore(raw: StoreShape): { tabs: TabConfig[]; data: Record<string, EntryItem[]> } {
  const rawTabs = raw.__tabs__;
  const tabs: TabConfig[] = (Array.isArray(rawTabs) && rawTabs.length > 0)
    ? (rawTabs as TabConfig[])
    : DEFAULT_TABS;

  const data: Record<string, EntryItem[]> = {};
  // include current tabs
  for (const t of tabs) {
    data[t.id] = Array.isArray(raw[t.id]) ? (raw[t.id] as EntryItem[]) : [];
  }
  // include legacy default tab data if not already covered
  for (const dt of DEFAULT_TABS) {
    if (!(dt.id in data) && Array.isArray(raw[dt.id])) {
      data[dt.id] = raw[dt.id] as EntryItem[];
    }
  }
  return { tabs, data };
}

function loadLocal(profileId: string): { tabs: TabConfig[]; data: Record<string, EntryItem[]>; savedAt: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(profileId));
    if (raw) {
      const parsed = JSON.parse(raw) as StoreShape;
      const result = parseStore(parsed);
      const savedAt = typeof parsed.__savedAt__ === "string" ? parsed.__savedAt__ : null;
      for (const k of Object.keys(result.data)) {
        result.data[k] = result.data[k].map(e => ({ ...e, highlight: false }));
      }
      return { ...result, savedAt };
    }
  } catch {}
  return { tabs: DEFAULT_TABS, data: { anotacoes:[], cameras:[], enigmas:[], virtudes:[], npc:[] }, savedAt: null };
}

async function fetchRemote(profileId: string): Promise<{ tabs: TabConfig[]; data: Record<string, EntryItem[]>; savedAt: string | null } | null> {
  try {
    const res = await fetch(`${API_BASE}/profiles/${profileId}/data`);
    if (!res.ok) return null;
    const raw = await res.json() as StoreShape;
    const savedAt = typeof raw.__savedAt__ === "string" ? raw.__savedAt__ : null;
    const result = parseStore(raw);
    for (const k of Object.keys(result.data)) {
      result.data[k] = result.data[k].map(e => ({ ...e, highlight: false }));
    }
    return { ...result, savedAt };
  } catch {
    return null;
  }
}

async function saveRemote(profileId: string, store: StoreShape): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/profiles/${profileId}/data`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(store),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/* ── Dashboard ───────────────────────────────────────────────────── */
export default function DashboardPage({ profileId, onLogout }: DashboardPageProps) {
  const { isMobile } = useSettings();

  // Load initial state from localStorage
  const initial = loadLocal(profileId);
  const [tabs, setTabs]         = useState<TabConfig[]>(initial.tabs);
  const [data, setData]         = useState<Record<string, EntryItem[]>>(initial.data);
  const [activeTab, setActiveTab] = useState<string>(initial.tabs[0]?.id ?? "anotacoes");
  const [tabVisible, setTabVisible] = useState(true);
  const [input, setInput]       = useState("");
  const [clock, setClock]       = useState(now());
  const [syncing, setSyncing]   = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle"|"saving"|"saved"|"error">("idle");
  const pendingStoreRef = useRef<StoreShape | null>(null);

  // Tab editing state
  const [editMode, setEditMode]         = useState(false);
  const [addingTab, setAddingTab]       = useState(false);
  const [newTabName, setNewTabName]     = useState("");
  const [renamingId, setRenamingId]     = useState<string | null>(null);
  const [renameVal, setRenameVal]       = useState("");
  const newTabInputRef                  = useRef<HTMLInputElement>(null);
  const renameInputRef                  = useRef<HTMLInputElement>(null);

  // Save refs to avoid stale closures
  const tabsRef = useRef<TabConfig[]>(tabs);
  const dataRef = useRef<Record<string, EntryItem[]>>(data);
  useEffect(() => { tabsRef.current = tabs; }, [tabs]);
  useEffect(() => { dataRef.current = data; }, [data]);

  const saveTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender   = useRef(true);
  const isFirstTabRender = useRef(true);

  // On mount: fetch from server and smart-merge with localStorage
  useEffect(() => {
    setSyncing(true);
    fetchRemote(profileId).then(async remote => {
      const localRaw = (() => { try { const r = localStorage.getItem(STORAGE_KEY(profileId)); return r ? JSON.parse(r) as StoreShape : null; } catch { return null; } })();
      const localTs  = localRaw && typeof localRaw.__savedAt__ === "string" ? localRaw.__savedAt__ : null;
      const remoteTs = remote?.savedAt ?? null;

      // Decide which data source wins
      const localCount  = countEntries(initial.data);
      const remoteCount = remote ? countEntries(remote.data) : 0;

      // Local wins if: no remote, or local is newer (by timestamp), or local has more entries
      const localWins = !remote || (localTs && remoteTs ? localTs > remoteTs : localCount > remoteCount);

      if (localWins && localCount > 0) {
        // Local has newer/more data — keep it and upload to server
        const store = buildStore(initial.tabs, initial.data);
        try { localStorage.setItem(STORAGE_KEY(profileId), JSON.stringify(store)); } catch {}
        setSaveStatus("saving");
        const ok = await saveRemote(profileId, store);
        setSaveStatus(ok ? "saved" : "error");
        if (ok) setTimeout(() => setSaveStatus(s => s === "saved" ? "idle" : s), 3000);
      } else if (remote) {
        // Remote has newer/more data — use it
        setTabs(remote.tabs);
        setData(remote.data);
        setActiveTab(prev => remote.tabs.find(t => t.id === prev) ? prev : (remote.tabs[0]?.id ?? prev));
        try { localStorage.setItem(STORAGE_KEY(profileId), JSON.stringify(buildStore(remote.tabs, remote.data))); } catch {}
      }
      setSyncing(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  // Shared save function with status tracking
  const doSave = async (store: StoreShape) => {
    setSaveStatus("saving");
    pendingStoreRef.current = store;
    const ok = await saveRemote(profileId, store);
    // only update if this is still the latest store
    if (pendingStoreRef.current === store) {
      setSaveStatus(ok ? "saved" : "error");
      if (ok) setTimeout(() => setSaveStatus(s => s === "saved" ? "idle" : s), 3000);
    }
  };

  // Retry save (used by error button)
  const retrySave = () => {
    const store = buildStore(tabsRef.current, dataRef.current);
    void doSave(store);
  };

  // Save on data change (debounced 800ms)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const store = buildStore(tabsRef.current, data);
    try { localStorage.setItem(STORAGE_KEY(profileId), JSON.stringify(store)); } catch {}
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus("saving");
    saveTimerRef.current = setTimeout(() => void doSave(store), 800);
  }, [data, profileId]);

  // Save on tabs change (immediate)
  useEffect(() => {
    if (isFirstTabRender.current) { isFirstTabRender.current = false; return; }
    const store = buildStore(tabs, dataRef.current);
    try { localStorage.setItem(STORAGE_KEY(profileId), JSON.stringify(store)); } catch {}
    void doSave(store);
  }, [tabs, profileId]);

  // Sync across same-machine tabs
  useEffect(() => {
    const key = STORAGE_KEY(profileId);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key || e.newValue === null) return;
      try {
        const parsed = JSON.parse(e.newValue) as StoreShape;
        const result = parseStore(parsed);
        for (const k of Object.keys(result.data)) {
          result.data[k] = result.data[k].map(en => ({ ...en, highlight: false }));
        }
        setTabs(result.tabs);
        setData(result.data);
      } catch {}
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [profileId]);

  // Live clock
  useEffect(() => {
    const iv = setInterval(() => setClock(now()), 1000);
    return () => clearInterval(iv);
  }, []);

  // Focus new tab input when addingTab becomes true
  useEffect(() => {
    if (addingTab) setTimeout(() => newTabInputRef.current?.focus(), 60);
  }, [addingTab]);

  // Focus rename input when renamingId is set
  useEffect(() => {
    if (renamingId) setTimeout(() => {
      const el = renameInputRef.current;
      if (el) { el.focus(); el.select(); }
    }, 60);
  }, [renamingId]);

  /* ── Tab switching ── */
  const switchTab = (id: string) => {
    if (id === activeTab) return;
    setTabVisible(false);
    setTimeout(() => { setActiveTab(id); setTabVisible(true); }, 180);
  };

  /* ── Tab CRUD ── */
  const handleAddTab = () => {
    const name = newTabName.trim().toUpperCase();
    if (!name) { setAddingTab(false); setNewTabName(""); return; }
    const id   = `t_${uid().toLowerCase()}`;
    const code = labelToCode(name);
    const newTab: TabConfig = { id, label: name, code };
    setTabs(prev => [...prev, newTab]);
    setData(prev => ({ ...prev, [id]: [] }));
    switchTab(id);
    setNewTabName("");
    setAddingTab(false);
    logAudit(profileId, "aba_criada", `Aba criada: "${name}"`);
  };

  const handleDeleteTab = (tabId: string) => {
    if (tabs.length <= 1) return;
    const tabLabel = tabs.find(t => t.id === tabId)?.label ?? tabId;
    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);
    if (activeTab === tabId) {
      const idx = tabs.findIndex(t => t.id === tabId);
      const fallback = newTabs[Math.max(0, idx - 1)]?.id ?? newTabs[0].id;
      setTabVisible(false);
      setTimeout(() => { setActiveTab(fallback); setTabVisible(true); }, 180);
    }
    setData(prev => { const next = { ...prev }; delete next[tabId]; return next; });
    logAudit(profileId, "aba_excluida", `Aba excluída: "${tabLabel}"`);
  };

  const startRename = (tab: TabConfig) => {
    setRenamingId(tab.id);
    setRenameVal(tab.label);
  };

  const commitRename = () => {
    if (!renamingId) return;
    const oldLabel = tabs.find(t => t.id === renamingId)?.label ?? renamingId;
    const label = renameVal.trim().toUpperCase();
    if (label) {
      const code = labelToCode(label);
      setTabs(prev => prev.map(t => t.id === renamingId ? { ...t, label, code } : t));
      if (label !== oldLabel) logAudit(profileId, "aba_renomeada", `Aba renomeada: "${oldLabel}" → "${label}"`);
    }
    setRenamingId(null);
    setRenameVal("");
  };

  /* ── Entry CRUD ── */
  const handleAdd = () => {
    if (!input.trim()) return;
    const entry: EntryItem = { id: uid(), text: input.trim(), timestamp: now(), highlight: true };
    setData(prev => ({ ...prev, [activeTab]: [entry, ...(prev[activeTab] ?? [])] }));
    setInput("");
    const tabLabel = tabs.find(t => t.id === activeTab)?.label ?? activeTab;
    logAudit(profileId, "entrada_adicionada", `Entrada adicionada na aba "${tabLabel}": "${input.trim().slice(0, 60)}${input.trim().length > 60 ? "…" : ""}"`);
  };

  const handleRemove = (tab: string, id: string) => {
    const tabLabel = tabs.find(t => t.id === tab)?.label ?? tab;
    const entryText = data[tab]?.find(e => e.id === id)?.text ?? "";
    setData(prev => ({ ...prev, [tab]: (prev[tab] ?? []).filter(e => e.id !== id) }));
    logAudit(profileId, "entrada_removida", `Entrada removida da aba "${tabLabel}": "${entryText.slice(0, 60)}${entryText.length > 60 ? "…" : ""}"`);
  };

  const handleEdit = (tab: string, id: string, newText: string) => {
    const tabLabel = tabs.find(t => t.id === tab)?.label ?? tab;
    setData(prev => ({
      ...prev,
      [tab]: (prev[tab] ?? []).map(e =>
        e.id === id ? { ...e, text: newText, editedAt: now(), highlight: false } : e
      ),
    }));
    logAudit(profileId, "entrada_editada", `Entrada editada na aba "${tabLabel}": "${newText.slice(0, 60)}${newText.length > 60 ? "…" : ""}"`);
  };

  const activeTabDef  = tabs.find(t => t.id === activeTab) ?? tabs[0];
  const currentItems  = data[activeTab] ?? [];
  const totalItems    = Object.values(data).reduce((s, a) => s + (a?.length ?? 0), 0);

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", backgroundColor:"var(--c-bg-page)" }}>

      {/* Grid bg */}
      <div style={{
        position:"fixed", inset:0, pointerEvents:"none", zIndex:0,
        backgroundImage:"linear-gradient(rgba(var(--c-accent-rgb),0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--c-accent-rgb),0.025) 1px, transparent 1px)",
        backgroundSize:"50px 50px",
      }} />

      {/* ── Header ── */}
      <header style={{
        position:"sticky", top:0, zIndex:20, display:"flex", alignItems:"center",
        justifyContent:"space-between",
        padding: isMobile ? "0 16px" : "0 32px",
        height: isMobile ? "48px" : "56px",
        borderBottom:"1px solid rgba(var(--c-accent-rgb),0.13)",
        backgroundColor:"var(--c-header-bg)", backdropFilter:"blur(8px)",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap: isMobile ? "10px" : "20px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <span style={{ width:"8px", height:"8px", borderRadius:"50%", backgroundColor:"var(--c-accent)", display:"inline-block", animation:"pulse 1.6s ease-in-out infinite" }} />
            <span style={{ fontFamily:"monospace", fontSize: isMobile ? "13px" : "15px", fontWeight:700, color:"var(--c-accent-lt)", letterSpacing:"0.22em" }}>FORTITUDE</span>
          </div>
          {!isMobile && <>
            <div style={{ width:"1px", height:"18px", backgroundColor:"rgba(var(--c-accent-rgb),0.18)" }} />
            <span style={{ fontFamily:"monospace", fontSize:"10px", color:"rgba(var(--c-accent-rgb),0.35)", letterSpacing:"0.12em" }}>GESTÃO OPERACIONAL</span>
            <div style={{ width:"1px", height:"18px", backgroundColor:"rgba(var(--c-accent-rgb),0.18)" }} />
            <span style={{ fontFamily:"monospace", fontSize:"10px", letterSpacing:"0.12em" }}>
              <span style={{ color:"rgba(var(--c-accent-rgb),0.35)" }}>OPERADOR: </span>
              <span style={{ color:"var(--c-accent)" }}>{profileId.toUpperCase()}</span>
            </span>
          </>}
          {isMobile && <span style={{ fontFamily:"monospace", fontSize:"9px", color:"var(--c-accent)", letterSpacing:"0.12em" }}>{profileId.toUpperCase()}</span>}
        </div>

        <div style={{ display:"flex", alignItems:"center", gap: isMobile ? "12px" : "24px" }}>
          {!isMobile && (
            <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
              <span style={{ fontFamily:"monospace", fontSize:"10px", color:"rgba(var(--c-accent-rgb),0.3)", letterSpacing:"0.12em" }}>REGISTROS:</span>
              <span style={{ fontFamily:"monospace", fontSize:"13px", fontWeight:700, color:"var(--c-accent)" }}><Counter value={totalItems} /></span>
            </div>
          )}
          <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
            {saveStatus === "error" ? (
              <>
                <span style={{ width:"6px", height:"6px", borderRadius:"50%", backgroundColor:"#cc2200", display:"inline-block", flexShrink:0 }} />
                {!isMobile && (
                  <>
                    <span style={{ fontFamily:"monospace", fontSize:"9px", letterSpacing:"0.1em", color:"rgba(204,34,0,0.8)" }}>NÃO SALVO</span>
                    <button
                      onClick={retrySave}
                      style={{ fontFamily:"monospace", fontSize:"8px", letterSpacing:"0.1em", color:"#cc2200", border:"1px solid rgba(204,34,0,0.4)", backgroundColor:"rgba(204,34,0,0.08)", padding:"2px 8px", cursor:"pointer", transition:"all 0.18s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor="rgba(204,34,0,0.18)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor="rgba(204,34,0,0.08)"; }}
                    >TENTAR NOVAMENTE</button>
                  </>
                )}
              </>
            ) : (
              <>
                <span style={{
                  width:"6px", height:"6px", borderRadius:"50%", display:"inline-block", flexShrink:0,
                  backgroundColor: syncing || saveStatus==="saving" ? "#f5d060" : "#3db86a",
                  animation: syncing || saveStatus==="saving" ? "pulse 0.8s ease-in-out infinite" : "none",
                }} />
                {!isMobile && <span style={{ fontFamily:"monospace", fontSize:"9px", letterSpacing:"0.1em", color: syncing || saveStatus==="saving" ? "rgba(245,208,96,0.5)" : "rgba(61,184,106,0.4)" }}>
                  {syncing ? "CARREGANDO" : saveStatus==="saving" ? "SALVANDO..." : "SALVO ✓"}
                </span>}
              </>
            )}
          </div>
          {!isMobile && <span style={{ fontFamily:"monospace", fontSize:"10px", color:"rgba(var(--c-accent-rgb),0.25)", letterSpacing:"0.08em" }}>{clock}</span>}
          <button
            onClick={onLogout}
            style={{ fontFamily:"monospace", fontSize: isMobile ? "9px" : "10px", fontWeight:700, letterSpacing:"0.12em", color:"rgba(var(--c-accent-rgb),0.45)", border:"1px solid rgba(var(--c-accent-rgb),0.18)", backgroundColor:"transparent", padding: isMobile ? "6px 10px" : "6px 16px", cursor:"pointer", transition:"all 0.2s ease" }}
            onMouseEnter={e => { e.currentTarget.style.color="#ff4400"; e.currentTarget.style.borderColor="#ff4400"; e.currentTarget.style.backgroundColor="rgba(255,68,0,0.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.color="rgba(var(--c-accent-rgb),0.45)"; e.currentTarget.style.borderColor="rgba(var(--c-accent-rgb),0.18)"; e.currentTarget.style.backgroundColor="transparent"; }}
          >
            {isMobile ? "SAIR" : "ENCERRAR SESSÃO"}
          </button>
        </div>
      </header>

      {/* ── Tab bar ── */}
      <div style={{
        position:"sticky", top: isMobile ? "48px" : "56px", zIndex:19,
        borderBottom:`1px solid ${editMode ? "rgba(var(--c-accent-rgb),0.3)" : "rgba(var(--c-accent-rgb),0.13)"}`,
        backgroundColor:"var(--c-tab-bg)", backdropFilter:"blur(8px)",
        display:"flex", alignItems:"stretch",
        paddingLeft: isMobile ? "0" : "32px",
        gap:0,
        overflowX: isMobile ? "auto" : "visible",
        scrollbarWidth:"none",
        transition:"border-color 0.2s",
      }}>
        {/* Existing tabs */}
        {tabs.map((tab, i) => {
          const active  = tab.id === activeTab;
          const count   = (data[tab.id] ?? []).length;
          const renaming = renamingId === tab.id;

          return (
            <div
              key={tab.id}
              style={{
                display:"flex", alignItems:"stretch",
                borderRight: i < tabs.length - 1 ? "1px solid rgba(var(--c-accent-rgb),0.07)" : "none",
                flexShrink: 0, position:"relative",
              }}
            >
              {/* Delete button in edit mode */}
              {editMode && tabs.length > 1 && (
                <button
                  onClick={() => handleDeleteTab(tab.id)}
                  title="Excluir aba"
                  style={{
                    position:"absolute", top:"6px", right:"4px", zIndex:2,
                    width:"16px", height:"16px", borderRadius:"50%",
                    backgroundColor:"rgba(204,34,0,0.75)", color:"#fff",
                    border:"none", cursor:"pointer", fontSize:"10px", lineHeight:"16px",
                    textAlign:"center", fontWeight:700, padding:0,
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}
                >
                  ×
                </button>
              )}

              {renaming ? (
                /* Inline rename input */
                <input
                  ref={renameInputRef}
                  value={renameVal}
                  onChange={e => setRenameVal(e.target.value.toUpperCase())}
                  onKeyDown={e => {
                    if (e.key === "Enter") { e.preventDefault(); commitRename(); }
                    if (e.key === "Escape") { setRenamingId(null); }
                  }}
                  onBlur={commitRename}
                  style={{
                    fontFamily:"monospace", fontSize: isMobile ? "10px" : "11px",
                    fontWeight:700, letterSpacing: isMobile ? "0.08em" : "0.14em",
                    padding: isMobile ? "12px 10px" : "14px 16px",
                    color:"var(--c-accent-lt)", backgroundColor:"rgba(var(--c-accent-rgb),0.08)",
                    border:"none", borderBottom:"2px solid var(--c-accent)",
                    outline:"none", width: `${Math.max(60, renameVal.length * 9 + 32)}px`,
                    minWidth:"60px",
                  }}
                />
              ) : (
                /* Normal tab button */
                <button
                  onClick={() => { if (editMode) startRename(tab); else switchTab(tab.id); }}
                  title={editMode ? "Clique para renomear" : tab.label}
                  style={{
                    fontFamily:"monospace",
                    fontSize: isMobile ? "10px" : "11px",
                    fontWeight: active ? 700 : 400,
                    letterSpacing: isMobile ? "0.08em" : "0.16em",
                    padding: isMobile ? "12px 14px" : "14px 22px",
                    paddingRight: editMode && tabs.length > 1 ? (isMobile ? "28px" : "32px") : undefined,
                    whiteSpace:"nowrap",
                    color: editMode ? (active ? "var(--c-accent-lt)" : "rgba(var(--c-accent-rgb),0.5)") : (active ? "var(--c-accent-lt)" : "rgba(var(--c-accent-rgb),0.32)"),
                    borderBottom: active ? "2px solid var(--c-accent)" : "2px solid transparent",
                    backgroundColor: active ? "rgba(var(--c-accent-rgb),0.06)" : "transparent",
                    cursor: editMode ? "text" : "pointer",
                    display:"flex", alignItems:"center", gap: isMobile ? "6px" : "10px",
                    transition:"all 0.2s ease",
                    outline: editMode ? `1px dashed rgba(var(--c-accent-rgb),0.2)` : "none",
                    outlineOffset:"2px",
                  }}
                  onMouseEnter={e => { if (!active && !editMode) { e.currentTarget.style.color="rgba(var(--c-accent-rgb),0.6)"; e.currentTarget.style.backgroundColor="rgba(var(--c-accent-rgb),0.03)"; } }}
                  onMouseLeave={e => { if (!active && !editMode) { e.currentTarget.style.color="rgba(var(--c-accent-rgb),0.32)"; e.currentTarget.style.backgroundColor="transparent"; } }}
                >
                  <span style={{ fontFamily:"monospace", fontSize:"9px", color: active ? "var(--c-accent)" : "rgba(var(--c-accent-rgb),0.2)", letterSpacing:"0.05em" }}>
                    {tab.code}
                  </span>
                  {tab.label}
                  {count > 0 && (
                    <span style={{
                      fontFamily:"monospace", fontSize:"9px",
                      backgroundColor: active ? "rgba(var(--c-accent-rgb),0.18)" : "rgba(var(--c-accent-rgb),0.07)",
                      color: active ? "var(--c-accent-lt)" : "rgba(var(--c-accent-rgb),0.3)",
                      padding:"1px 7px",
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              )}
            </div>
          );
        })}

        {/* Add tab inline input or button */}
        {editMode && (
          addingTab ? (
            <div style={{ display:"flex", alignItems:"center", gap:"6px", padding: isMobile ? "8px 10px" : "10px 14px", borderLeft:"1px solid rgba(var(--c-accent-rgb),0.12)" }}>
              <input
                ref={newTabInputRef}
                value={newTabName}
                onChange={e => setNewTabName(e.target.value.toUpperCase())}
                placeholder="NOME DA ABA"
                maxLength={20}
                onKeyDown={e => {
                  if (e.key === "Enter") { e.preventDefault(); handleAddTab(); }
                  if (e.key === "Escape") { setAddingTab(false); setNewTabName(""); }
                }}
                style={{
                  fontFamily:"monospace", fontSize:"10px", letterSpacing:"0.1em",
                  padding:"5px 8px", width:"120px",
                  backgroundColor:"rgba(var(--c-accent-rgb),0.06)",
                  border:"1px solid rgba(var(--c-accent-rgb),0.3)",
                  color:"var(--c-accent-lt)", outline:"none", caretColor:"var(--c-accent)",
                }}
              />
              <button
                onClick={handleAddTab}
                style={{
                  fontFamily:"monospace", fontSize:"9px", letterSpacing:"0.1em", fontWeight:700,
                  backgroundColor:"var(--c-accent)", color:"#000", border:"none",
                  padding:"5px 10px", cursor:"pointer",
                }}
              >
                OK
              </button>
              <button
                onClick={() => { setAddingTab(false); setNewTabName(""); }}
                style={{
                  fontFamily:"monospace", fontSize:"9px", letterSpacing:"0.1em",
                  backgroundColor:"transparent", color:"rgba(var(--c-accent-rgb),0.4)",
                  border:"1px solid rgba(var(--c-accent-rgb),0.15)",
                  padding:"5px 8px", cursor:"pointer",
                }}
              >
                ×
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingTab(true)}
              title="Nova aba"
              style={{
                fontFamily:"monospace", fontSize:"13px", fontWeight:700,
                padding: isMobile ? "10px 14px" : "12px 18px",
                color:"rgba(var(--c-accent-rgb),0.5)",
                backgroundColor:"transparent",
                border:"none",
                borderLeft:"1px solid rgba(var(--c-accent-rgb),0.12)",
                cursor:"pointer", flexShrink:0,
                transition:"color 0.18s",
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color="var(--c-accent)")}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color="rgba(var(--c-accent-rgb),0.5)")}
            >
              +
            </button>
          )
        )}

        {/* Edit mode toggle */}
        <button
          onClick={() => {
            setEditMode(v => !v);
            setAddingTab(false);
            setNewTabName("");
            setRenamingId(null);
          }}
          title={editMode ? "Concluir edição" : "Editar abas"}
          style={{
            marginLeft:"auto",
            fontFamily:"monospace", fontSize:"9px", letterSpacing:"0.14em", fontWeight: editMode ? 700 : 400,
            padding: isMobile ? "10px 12px" : "12px 16px",
            color: editMode ? "var(--c-accent)" : "rgba(var(--c-accent-rgb),0.25)",
            backgroundColor: editMode ? "rgba(var(--c-accent-rgb),0.07)" : "transparent",
            border:"none",
            borderLeft:"1px solid rgba(var(--c-accent-rgb),0.1)",
            cursor:"pointer", flexShrink:0,
            transition:"all 0.18s",
          }}
        >
          {editMode ? "✓ CONCLUIR" : (isMobile ? "✎" : "✎ ABAS")}
        </button>
      </div>

      {/* Edit mode hint */}
      {editMode && (
        <div style={{
          textAlign:"center", padding:"8px",
          backgroundColor:"rgba(var(--c-accent-rgb),0.05)",
          borderBottom:"1px solid rgba(var(--c-accent-rgb),0.1)",
        }}>
          <span style={{ fontFamily:"monospace", fontSize:"9px", letterSpacing:"0.16em", color:"rgba(var(--c-accent-rgb),0.4)" }}>
            CLIQUE NA ABA PARA RENOMEAR · × PARA EXCLUIR · + PARA ADICIONAR
          </span>
        </div>
      )}

      {/* ── Main content ── */}
      <main style={{
        flex:1,
        padding: isMobile ? "20px 16px" : "36px 40px",
        maxWidth:"1100px", width:"100%", margin:"0 auto",
        position:"relative", zIndex:1,
        opacity: tabVisible ? 1 : 0,
        transform: tabVisible ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.2s ease, transform 0.2s ease",
      }}>
        {/* Section title */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"24px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
            <div style={{ width:"16px", height:"1px", backgroundColor:"var(--c-accent)" }} />
            <span style={{ fontFamily:"monospace", fontSize:"11px", letterSpacing:"0.22em", color:"rgba(var(--c-accent-rgb),0.45)" }}>
              MÓDULO {activeTabDef?.code ?? "---"}
            </span>
          </div>
          <span style={{ fontFamily:"monospace", fontSize:"10px", color:"rgba(var(--c-accent-rgb),0.22)", letterSpacing:"0.08em" }}>
            {currentItems.length} entrada(s)
          </span>
        </div>

        {/* Input row */}
        <div style={{ display:"flex", gap:"12px", marginBottom:"28px", alignItems:"flex-start" }}>
          <div style={{
            flex:1, display:"flex", alignItems:"flex-start",
            border:"1px solid rgba(var(--c-accent-rgb),0.2)", backgroundColor:"var(--c-bg-input)",
            transition:"border-color 0.25s ease",
          }}
            onFocusCapture={e => (e.currentTarget.style.borderColor = "rgba(var(--c-accent-rgb),0.45)")}
            onBlurCapture={e => (e.currentTarget.style.borderColor = "rgba(var(--c-accent-rgb),0.2)")}
          >
            <span style={{ padding:"16px 14px", fontFamily:"monospace", fontSize:"15px", color:"var(--c-accent)", flexShrink:0 }}>&gt;</span>
            <textarea
              value={input}
              onChange={e => {
                setInput(e.target.value);
                const el = e.target as HTMLTextAreaElement;
                el.style.height = "auto";
                el.style.height = `${el.scrollHeight}px`;
              }}
              onKeyDown={e => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleAdd(); }
              }}
              placeholder={`Registrar em ${activeTabDef?.label ?? ""}... (Ctrl+Enter)`}
              rows={1}
              style={{
                flex:1, padding:"16px 14px 16px 0", outline:"none", background:"transparent",
                fontFamily:"monospace", fontSize:"14px", color:"var(--c-accent-lt)", caretColor:"var(--c-accent)",
                border:"none", resize:"none", lineHeight:1.6, overflow:"hidden", minHeight:"52px",
              }}
            />
          </div>
          <button
            onClick={handleAdd}
            style={{
              fontFamily:"monospace", fontSize:"11px", fontWeight:700, letterSpacing:"0.22em",
              backgroundColor:"var(--c-accent)", color:"#000", border:"none", padding:"0 28px",
              cursor:"pointer", transition:"all 0.18s ease", height:"52px", flexShrink:0,
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor="var(--c-accent-lt)"; e.currentTarget.style.transform="scale(1.03)"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor="var(--c-accent)"; e.currentTarget.style.transform="scale(1)"; }}
          >
            + REGISTRAR
          </button>
        </div>

        {/* Divider */}
        <div style={{ display:"flex", alignItems:"center", gap:"14px", marginBottom:"18px" }}>
          <div style={{ flex:1, height:"1px", backgroundColor:"rgba(var(--c-accent-rgb),0.08)" }} />
          <span style={{ fontFamily:"monospace", fontSize:"9px", letterSpacing:"0.22em", color:"rgba(var(--c-accent-rgb),0.2)" }}>LOG DE ENTRADAS</span>
          <div style={{ flex:1, height:"1px", backgroundColor:"rgba(var(--c-accent-rgb),0.08)" }} />
        </div>

        {/* Entries */}
        {currentItems.length === 0 ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 0", border:"1px dashed rgba(var(--c-accent-rgb),0.09)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(var(--c-accent-rgb),0.18)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom:"14px" }}>
              <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 21V9"/>
            </svg>
            <p style={{ fontFamily:"monospace", fontSize:"11px", letterSpacing:"0.22em", color:"rgba(var(--c-accent-rgb),0.2)" }}>
              SEM REGISTROS
            </p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
            {currentItems.map((entry, i) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                index={i}
                total={currentItems.length}
                onRemove={() => handleRemove(activeTab, entry.id)}
                onEdit={(newText) => handleEdit(activeTab, entry.id, newText)}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Status bar ── */}
      <div style={{
        position:"sticky", bottom:0, zIndex:20,
        padding:"8px 32px", display:"flex", alignItems:"center", justifyContent:"space-between",
        borderTop:"1px solid rgba(var(--c-accent-rgb),0.09)", backgroundColor:"var(--c-tab-bg)",
      }}>
        <span style={{ fontFamily:"monospace", fontSize:"9px", color:"rgba(var(--c-accent-rgb),0.18)", letterSpacing:"0.16em" }}>
          ACESSO AUTORIZADO — SESSÃO ATIVA
        </span>
        <div style={{ display:"flex", gap:"16px", flexWrap:"wrap", justifyContent:"flex-end" }}>
          {tabs.map(t => (
            <span key={t.id} style={{ fontFamily:"monospace", fontSize:"9px", color: (data[t.id]?.length ?? 0) > 0 ? "rgba(var(--c-accent-rgb),0.35)" : "rgba(var(--c-accent-rgb),0.15)", letterSpacing:"0.1em" }}>
              {t.code}:{String(data[t.id]?.length ?? 0).padStart(2,"0")}
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
      `}</style>
    </div>
  );
}
