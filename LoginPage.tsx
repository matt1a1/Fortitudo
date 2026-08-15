import { useState, useEffect, useRef } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { EstrangeiroFlow, EstrangeirosAdmin } from "./EstrangeiroFlow";

interface Profile {
  id: string;
  label: string;
  code: string;
  password: string | null;
  image: string | null;
  color: string;
  glowColor: string;
  bgFrom: string;
  bgTo: string;
  particleRgb: string;
}

const PROFILES: Profile[] = [
  {
    id: "fortitudo",
    label: "Fortitudo",
    code: "FOR",
    password: "fortitudeomelhor68",
    image: null,
    color: "#ff6600",
    glowColor: "rgba(255,100,0,0.18)",
    bgFrom: "rgba(255,80,0,0.12)",
    bgTo: "rgba(255,140,0,0.04)",
    particleRgb: "255,100,0",
  },
  {
    id: "temperantia",
    label: "Temperantia",
    code: "TEM",
    password: null,
    image: null,
    color: "#6ab4f0",
    glowColor: "rgba(100,180,255,0.16)",
    bgFrom: "rgba(80,160,255,0.10)",
    bgTo: "rgba(140,210,255,0.04)",
    particleRgb: "100,180,255",
  },
  {
    id: "prudentia",
    label: "Prudentia",
    code: "PRU",
    password: null,
    image: null,
    color: "#5ecb7a",
    glowColor: "rgba(80,200,100,0.16)",
    bgFrom: "rgba(60,190,90,0.10)",
    bgTo: "rgba(100,220,120,0.04)",
    particleRgb: "80,200,100",
  },
  {
    id: "iustitia",
    label: "Iustitia",
    code: "IUS",
    password: null,
    image: null,
    color: "#f5d060",
    glowColor: "rgba(240,210,60,0.16)",
    bgFrom: "rgba(240,200,40,0.10)",
    bgTo: "rgba(255,230,80,0.04)",
    particleRgb: "240,210,60",
  },
];

/* ── Particle canvas ─────────────────────────────────────────────────── */
function ParticleCanvas({ rgb }: { rgb: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const rgbRef = useRef(rgb);

  useEffect(() => {
    rgbRef.current = rgb;
  }, [rgb]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const count = 55;
    const pts = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.4 + 0.4,
      a: Math.random() * 0.5 + 0.15,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const c = rgbRef.current;
      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${c},${p.a * 0.5})`;
        ctx.fill();
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(${c},${(1 - dist / 120) * 0.07})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}
    />
  );
}

/* ── Typed label ────────────────────────────────────────────────────── */
function TypedLabel({ text, delay = 0 }: { text: string; delay?: number }) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    let i = 0;
    const t = setTimeout(() => {
      const iv = setInterval(() => {
        i++;
        setShown(text.slice(0, i));
        if (i >= text.length) clearInterval(iv);
      }, 36);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(t);
  }, [text, delay]);
  return (
    <span>
      {shown}
      {shown.length < text.length && (
        <span style={{ display: "inline-block", color: "#aaa", animation: "blink 0.9s step-end infinite" }}>_</span>
      )}
    </span>
  );
}

/* ── Profile card ────────────────────────────────────────────────────── */
function ProfileCard({
  profile,
  onClick,
  index,
  onHover,
}: {
  profile: Profile;
  onClick: () => void;
  index: number;
  onHover: (p: Profile | null) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 110 + 250);
    return () => clearTimeout(t);
  }, [index]);

  const handleMouseEnter = () => {
    setHovered(true);
    onHover(profile);
  };
  const handleMouseLeave = () => {
    setHovered(false);
    onHover(null);
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "14px",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(22px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}
    >
      {/* Avatar box */}
      <div
        style={{
          width: "172px",
          height: "172px",
          backgroundColor: hovered ? "#1a1a1a" : "#181818",
          border: `1px solid ${hovered ? profile.color : "rgba(160,160,160,0.18)"}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          transition: "border-color 0.3s ease, box-shadow 0.35s ease, transform 0.28s ease, background-color 0.3s ease",
          boxShadow: hovered ? `0 0 30px ${profile.glowColor}, 0 0 8px ${profile.glowColor}` : "none",
          transform: hovered ? "scale(1.05) translateY(-4px)" : "scale(1)",
        }}
      >
        {profile.image ? (
          <img src={profile.image} alt={profile.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <>
            <div style={{
              width: "60px",
              height: "60px",
              border: `1px solid ${hovered ? profile.color + "88" : "rgba(150,150,150,0.2)"}`,
              backgroundColor: hovered ? profile.color + "14" : "rgba(120,120,120,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "10px",
              transition: "all 0.3s ease",
            }}>
              <span style={{
                fontFamily: "monospace",
                fontSize: "16px",
                fontWeight: 700,
                color: hovered ? profile.color : "rgba(160,160,160,0.5)",
                letterSpacing: "0.1em",
                transition: "color 0.3s ease",
              }}>
                {profile.code}
              </span>
            </div>
            <span style={{
              fontFamily: "monospace",
              fontSize: "9px",
              color: hovered ? "rgba(200,200,200,0.25)" : "rgba(120,120,120,0.25)",
              letterSpacing: "0.2em",
            }}>
              SEM IMAGEM
            </span>
          </>
        )}

        {/* Corner accents on hover */}
        {hovered && (
          <>
            <div style={{ position: "absolute", top: 0, left: 0, width: "13px", height: "1px", backgroundColor: profile.color, transition: "all 0.2s" }} />
            <div style={{ position: "absolute", top: 0, left: 0, width: "1px", height: "13px", backgroundColor: profile.color }} />
            <div style={{ position: "absolute", top: 0, right: 0, width: "13px", height: "1px", backgroundColor: profile.color }} />
            <div style={{ position: "absolute", top: 0, right: 0, width: "1px", height: "13px", backgroundColor: profile.color }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, width: "13px", height: "1px", backgroundColor: profile.color }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, width: "1px", height: "13px", backgroundColor: profile.color }} />
            <div style={{ position: "absolute", bottom: 0, right: 0, width: "13px", height: "1px", backgroundColor: profile.color }} />
            <div style={{ position: "absolute", bottom: 0, right: 0, width: "1px", height: "13px", backgroundColor: profile.color }} />
          </>
        )}

      </div>

      {/* Name */}
      <span style={{
        fontFamily: "monospace",
        fontSize: "12px",
        fontWeight: hovered ? 700 : 400,
        letterSpacing: "0.2em",
        color: hovered ? profile.color : "rgba(160,160,160,0.45)",
        transition: "color 0.28s ease, font-weight 0.2s",
      }}>
        {profile.label.toUpperCase()}
      </span>
    </button>
  );
}

/* ── Main component ──────────────────────────────────────────────────── */
interface LoginPageProps {
  onLogin: (profileId: string) => void;
}

const NEUTRAL_RGB = "150,150,150";

export default function LoginPage({ onLogin }: LoginPageProps) {
  const { settings } = useSettings();
  const dm = settings.darkMode;
  const [selected, setSelected]     = useState<Profile | null>(null);
  const [hoveredProfile, setHover]  = useState<Profile | null>(null);
  const [password, setPassword]     = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [error, setError]           = useState(false);
  const [attempts, setAttempts]     = useState(0);
  const [shaking, setShaking]       = useState(false);
  const [entering, setEntering]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Entry screen ─────────────────────────────────────────────────
  const [entryView, setEntryView] = useState<"entry" | "virtude" | "estrangeiro">("entry");
  const [showEstAdm, setShowEstAdm] = useState(false);

  // ── Admin backdoor ──────────────────────────────────────────────
  const ADM_TRIGGER       = "entradaADM";
  const EST_ADM_TRIGGER   = "estrangeirosADM";
  const BUFFER_MAX        = Math.max(ADM_TRIGGER.length, EST_ADM_TRIGGER.length);
  const ADM_PASSWORD = "Maraca";
  const [admBuffer, setAdmBuffer]         = useState("");
  const [showAdmPrompt, setShowAdmPrompt] = useState(false);
  const [admInput, setAdmInput]           = useState("");
  const [admError, setAdmError]           = useState(false);
  const [adminMode, setAdminMode]         = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupDone, setBackupDone]       = useState(false);
  const [showAudit, setShowAudit]           = useState(false);
  const [auditLog, setAuditLog]             = useState<Array<{id:number; profileId:string; eventType:string; description:string; createdAt:string}>>([]);
  const [backupContent, setBackupContent]   = useState("");
  const [backupFileName, setBackupFileName] = useState("");
  const [adminTab, setAdminTab]             = useState<"historico"|"senhas">("historico");
  const [adminPasswords, setAdminPasswords] = useState<Record<string,string>>({});
  const [pwInputs, setPwInputs]             = useState<Record<string,string>>({});
  const [pwSaving, setPwSaving]             = useState<Record<string,boolean>>({});
  const [pwMsg, setPwMsg]                   = useState<Record<string,{ok:boolean;text:string}>>({});
  const admInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "Enter") {
        if (admBuffer.endsWith(ADM_TRIGGER)) {
          setShowAdmPrompt(true);
          setAdmInput("");
          setAdmError(false);
          setTimeout(() => admInputRef.current?.focus(), 80);
        } else if (admBuffer.endsWith(EST_ADM_TRIGGER)) {
          setShowEstAdm(true);
        }
        setAdmBuffer("");
        return;
      }
      if (e.key.length === 1) {
        setAdmBuffer(prev => (prev + e.key).slice(-BUFFER_MAX));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [admBuffer, BUFFER_MAX, ADM_TRIGGER, EST_ADM_TRIGGER]);

  const handleAdmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (admInput === ADM_PASSWORD) {
      setAdminMode(true);
      setShowAdmPrompt(false);
      setAdmInput("");
    } else if (admInput.toLowerCase() === "backup") {
      setAdmInput("");
      setBackupLoading(true);
      try {
        const [auditRes, backupRes, pwRes, estrangeiroRes] = await Promise.all([
          fetch("/api/admin/audit/list",  { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: ADM_PASSWORD }) }),
          fetch("/api/admin/backup",      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: ADM_PASSWORD }) }),
          fetch("/api/admin/passwords",   { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: ADM_PASSWORD }) }),
          fetch("/api/estrangeiros/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: ADM_PASSWORD }) }),
        ]);
        if (!auditRes.ok || !backupRes.ok) throw new Error("Falha");
        if (pwRes.ok) {
          const pws = await pwRes.json() as Record<string,string>;
          setAdminPasswords(pws);
          setPwInputs(Object.fromEntries(Object.entries(pws).map(([k,v]) => [k, v])));
        }
        const logs = await auditRes.json() as Array<{id:number; profileId:string; eventType:string; description:string; createdAt:string}>;
        const data = await backupRes.json();
        const estrangeiroData = estrangeiroRes.ok
          ? await estrangeiroRes.json() as { users: Array<{ id: string; name: string; discordNick: string; password: string; createdAt: string; tabs: Array<{ id: string; label: string; content?: string; entries?: Array<{ text: string; timestamp?: string }> }> }>; audit: unknown[] }
           : null;
        setAuditLog(logs);

        // Build document content for download button
        const ts     = new Date();
        const dateStr = ts.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
        const timeStr = ts.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        const sep  = "═".repeat(60);
        const sep2 = "─".repeat(60);
        const lines: string[] = [];
        lines.push(sep);
        lines.push("  SISTEMA FORTITUDE — DOCUMENTO DE BACKUP");
        lines.push(`  Gerado em: ${dateStr} às ${timeStr}`);
        lines.push(`  Versão: ${data.versao as string}`);
        lines.push(sep);
        lines.push("");

        const perfis = data.perfis as Record<string, {
          senha: string;
          abas: Array<{ id: string; label: string }>;
          conteudo: Record<string, Array<{ text?: string; value?: string; label?: string }>>;
          ultima_sync: string | null;
        }>;
        for (const [id, perfil] of Object.entries(perfis)) {
          lines.push(`▌ PERFIL: ${id.toUpperCase()}`);
          lines.push(sep2);
          lines.push(`  Senha:        ${perfil.senha}`);
          lines.push(`  Última sync:  ${perfil.ultima_sync ? new Date(perfil.ultima_sync).toLocaleString("pt-BR") : "nunca"}`);
          lines.push("");
          if (perfil.abas?.length > 0) {
            lines.push("  ABAS CONFIGURADAS:");
            for (const aba of perfil.abas) lines.push(`    • ${aba.label}`);
            lines.push("");
          }
          if (perfil.conteudo && Object.keys(perfil.conteudo).length > 0) {
            lines.push("  CONTEÚDO:");
            for (const [tabId, entries] of Object.entries(perfil.conteudo)) {
              const abaLabel = perfil.abas?.find(a => a.id === tabId)?.label ?? tabId;
              lines.push(`    [ ${abaLabel} ] — ${entries.length} entr${entries.length === 1 ? "ada" : "adas"}`);
              for (const entry of entries) {
                const txt = entry.text ?? entry.value ?? entry.label ?? JSON.stringify(entry);
                lines.push(`      › ${txt}`);
              }
            }
          } else {
            lines.push("  Sem conteúdo registrado.");
          }
          lines.push(""); lines.push("");
        }

        if (estrangeiroData && estrangeiroData.users.length > 0) {
          lines.push(sep);
          lines.push("  ESTRANGEIROS — PERFIS CADASTRADOS");
          lines.push(sep);
          lines.push("");
           for (const eu of estrangeiroData.users) {
            lines.push(`▌ ESTRANGEIRO: ${eu.name.toUpperCase()}`);
            lines.push(sep2);
            lines.push(`  Discord:   ${eu.discordNick || "—"}`);
            lines.push(`  Senha:     ${eu.password}`);
            lines.push(`  Cadastro:  ${new Date(eu.createdAt).toLocaleString("pt-BR")}`);
            lines.push("");
            if (eu.tabs.length > 0) {
              lines.push("  ABAS:");
             for (const et of eu.tabs) {
                lines.push(`    [ ${et.label} ]`);
                const entries = Array.isArray(et.entries)
                  ? et.entries
                  : (et.content && et.content.trim()
                    ? [{ text: et.content, timestamp: "registro anterior" }]
                    : []);
                if (entries.length > 0) {
                  for (const entry of entries) {
                    lines.push(`      [${entry.timestamp ?? "sem data"}] ${entry.text ?? ""}`);
                  }
                } else {
                  lines.push("      (vazia)");
                }
              }
            } else {
              lines.push("  Sem abas.");
            }
            lines.push(""); lines.push("");
          }
        }

        if (logs.length > 0) {
          lines.push(sep);
          lines.push("  HISTÓRICO DE ALTERAÇÕES (VIRTUDES)");
          lines.push(sep);
          for (const log of logs) {
            const d = new Date(log.createdAt).toLocaleString("pt-BR");
            lines.push(`  [${d}] [${log.profileId.toUpperCase()}] ${log.description}`);
          }
          lines.push("");
        }
        lines.push(sep); lines.push("  FIM DO DOCUMENTO"); lines.push(sep);

        setBackupContent(lines.join("\n"));
        setBackupFileName(`fortitude-backup-${ts.toISOString().slice(0, 10)}.txt`);
        setShowAdmPrompt(false);
        setShowAudit(true);
      } catch {
        setAdmError(true);
      } finally {
        setBackupLoading(false);
      }
    } else {
      setAdmError(true);
      setAdmInput("");
    }
  };
  // ────────────────────────────────────────────────────────────────

  const activeProfile = hoveredProfile; // controls bg scenery

  const handleSelectProfile = (p: Profile) => {
    if (adminMode) { onLogin(p.id); return; }
    setSelected(p);
    setPassword("");
    setShowPw(false);
    setError(false);
    setAttempts(0);
    setEntering(true);
    setTimeout(() => inputRef.current?.focus(), 350);
  };

  const handleBack = () => {
    setEntering(false);
    setTimeout(() => { setSelected(null); setHover(null); }, 350);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || loading) return;
    if (adminMode) { onLogin(selected.id); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/profiles/${selected.id}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        onLogin(selected.id);
      } else {
        setAttempts(a => a + 1);
        setError(true);
        setPassword("");
        shake();
      }
    } catch {
      setAttempts(a => a + 1);
      setError(true);
      setPassword("");
      shake();
    } finally {
      setLoading(false);
    }
  };

  const shake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 480);
  };

  const particleRgb = activeProfile?.particleRgb ?? NEUTRAL_RGB;

  if (entryView === "estrangeiro") {
    return (
      <>
        <EstrangeiroFlow onBack={() => setEntryView("entry")} />
        {showEstAdm && <EstrangeirosAdmin onClose={() => setShowEstAdm(false)} />}
      </>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "var(--c-login-bg)",
      }}
    >
      {/* Animated background glow — changes per hovered profile */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: activeProfile
          ? `radial-gradient(ellipse 75% 55% at 50% 50%, ${activeProfile.bgFrom} 0%, transparent 65%)`
          : "radial-gradient(ellipse 60% 45% at 50% 50%, rgba(140,140,140,0.05) 0%, transparent 65%)",
        transition: "background 0.6s ease",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* Bottom warm vignette */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "35%",
        background: `linear-gradient(to top, var(--c-login-vignette) 0%, transparent 100%)`,
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* Grid */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `linear-gradient(${activeProfile ? activeProfile.color + (dm ? "09" : "12") : "var(--c-login-grid)"} 1px, transparent 1px), linear-gradient(90deg, ${activeProfile ? activeProfile.color + (dm ? "09" : "12") : "var(--c-login-grid)"} 1px, transparent 1px)`,
        backgroundSize: "50px 50px",
        pointerEvents: "none",
        zIndex: 0,
        transition: "background-image 0.5s ease",
      }} />

      <ParticleCanvas rgb={particleRgb} />

      {/* Corner marks */}
      {(["tl", "tr", "bl", "br"] as const).map(k => (
        <div key={k} style={{
          position: "absolute",
          top: k.startsWith("t") ? "22px" : undefined,
          bottom: k.startsWith("b") ? "22px" : undefined,
          left: k.endsWith("l") ? "22px" : undefined,
          right: k.endsWith("r") ? "22px" : undefined,
          width: "36px", height: "36px",
          pointerEvents: "none",
          opacity: 0.22,
          zIndex: 1,
        }}>
          <div style={{ position: "absolute", top: k.startsWith("t") ? 0 : "auto", bottom: k.startsWith("b") ? 0 : "auto", left: k.endsWith("l") ? 0 : "auto", right: k.endsWith("r") ? 0 : "auto", width: "14px", height: "1px", backgroundColor: activeProfile?.color ?? "#888" }} />
          <div style={{ position: "absolute", top: k.startsWith("t") ? 0 : "auto", bottom: k.startsWith("b") ? 0 : "auto", left: k.endsWith("l") ? 0 : "auto", right: k.endsWith("r") ? 0 : "auto", width: "1px", height: "14px", backgroundColor: activeProfile?.color ?? "#888" }} />
        </div>
      ))}

      {/* Top status bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: "38px", display: "flex", alignItems: "center",
        padding: "0 28px", justifyContent: "space-between",
        borderBottom: "1px solid rgba(140,140,140,0.1)",
        backgroundColor: "rgba(10,10,10,0.88)",
        backdropFilter: "blur(8px)",
        zIndex: 10,
      }}>
        <span style={{ fontFamily: "monospace", fontSize: "10px", color: "rgba(150,150,150,0.4)", letterSpacing: "0.16em" }}>
          SISTEMA FORTITUDE v2.1
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{
            width: "6px", height: "6px", borderRadius: "50%", display: "inline-block",
            backgroundColor: selected ? (selected.color) : (hoveredProfile?.color ?? "#888"),
            animation: "blink 1.4s ease-in-out infinite",
            transition: "background-color 0.4s ease",
          }} />
          <span style={{
            fontFamily: "monospace", fontSize: "10px",
            color: selected ? selected.color : (hoveredProfile?.color ?? "rgba(150,150,150,0.45)"),
            letterSpacing: "0.12em",
            transition: "color 0.4s ease",
          }}>
            {selected
              ? `PERFIL SELECIONADO: ${selected.label.toUpperCase()}`
              : hoveredProfile
                ? `IDENTIFICANDO: ${hoveredProfile.label.toUpperCase()}`
                : "AGUARDANDO SELEÇÃO"}
          </span>
        </div>
      </div>

      {/* ── Entry screen (choose Estrangeiro / Virtude) ── */}
      {entryView === "entry" && (
        <div style={{
          position: "relative", zIndex: 10,
          display: "flex", flexDirection: "column", alignItems: "center",
          width: "100%", padding: "0 32px",
        }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "10px" }}>
              <div style={{ height: "1px", width: "36px", backgroundColor: "#555", opacity: 0.6 }} />
              <span style={{ fontFamily: "monospace", fontSize: "10px", letterSpacing: "0.25em", color: "rgba(150,150,150,0.4)" }}>
                SISTEMA FORTITUDE
              </span>
              <div style={{ height: "1px", width: "36px", backgroundColor: "#555", opacity: 0.6 }} />
            </div>
            <h1 style={{ fontFamily: "monospace", fontSize: "30px", fontWeight: 700, letterSpacing: "0.12em", color: "rgba(210,210,210,0.85)", margin: 0, lineHeight: 1.1 }}>
              QUEM É VOCÊ?
            </h1>
          </div>
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", justifyContent: "center", maxWidth: "640px", width: "100%" }}>
            {/* Estrangeiro card */}
            <button
              onClick={() => setEntryView("estrangeiro")}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#6ab4f055"; (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(106,180,240,0.07)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.09)"; (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
              style={{
                flex: "1 1 220px", minHeight: "180px", maxWidth: "280px",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "14px",
                background: "transparent", border: "1px solid rgba(255,255,255,0.09)",
                cursor: "pointer", fontFamily: "monospace", transition: "all 0.22s ease",
                padding: "32px 24px",
              }}
            >
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#6ab4f0" }} />
              <div>
                <div style={{ fontSize: "13px", letterSpacing: "0.22em", fontWeight: 700, color: "#6ab4f0", marginBottom: "6px" }}>
                  ESTRANGEIRO
                </div>
                <div style={{ fontSize: "9px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.28)" }}>
                  Acesso via nome · anotações e enigmas
                </div>
              </div>
            </button>
            {/* Virtude card */}
            <button
              onClick={() => setEntryView("virtude")}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#ff660055"; (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,102,0,0.07)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.09)"; (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
              style={{
                flex: "1 1 220px", minHeight: "180px", maxWidth: "280px",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "14px",
                background: "transparent", border: "1px solid rgba(255,255,255,0.09)",
                cursor: "pointer", fontFamily: "monospace", transition: "all 0.22s ease",
                padding: "32px 24px",
              }}
            >
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#ff6600" }} />
              <div>
                <div style={{ fontSize: "13px", letterSpacing: "0.22em", fontWeight: 700, color: "#ff6600", marginBottom: "6px" }}>
                  VIRTUDE
                </div>
                <div style={{ fontSize: "9px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.28)" }}>
                  Acesso restrito · 4 perfis das virtudes
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ── Back to entry (virtude) ── */}
      {entryView === "virtude" && !selected && (
        <button
          onClick={() => { setEntryView("entry"); setHover(null); }}
          style={{
            position: "fixed", top: "54px", left: "28px", zIndex: 20,
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "monospace", fontSize: "10px", letterSpacing: "0.2em",
            color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", gap: "6px",
            transition: "color 0.15s",
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)")}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.3)")}
        >
          ← VOLTAR
        </button>
      )}

      {/* ── Profile selection ── */}
      {entryView === "virtude" && <div style={{
        position: selected ? "absolute" : "relative",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        padding: "0 32px",
        opacity: entering ? 0 : 1,
        transform: entering ? "translateX(-40px)" : "translateX(0)",
        transition: "opacity 0.35s ease, transform 0.35s ease",
        pointerEvents: selected ? "none" : "auto",
      }}>
        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: "52px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "8px" }}>
            <div style={{ height: "1px", width: "36px", backgroundColor: activeProfile?.color ?? "#555", opacity: 0.6, transition: "background-color 0.5s ease" }} />
            <span style={{ fontFamily: "monospace", fontSize: "10px", letterSpacing: "0.25em", color: "rgba(150,150,150,0.4)" }}>
              <TypedLabel text="IDENTIFICAÇÃO DE OPERADOR" delay={200} />
            </span>
            <div style={{ height: "1px", width: "36px", backgroundColor: activeProfile?.color ?? "#555", opacity: 0.6, transition: "background-color 0.5s ease" }} />
          </div>
          <h1 style={{
            fontFamily: "monospace",
            fontSize: "34px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "rgba(210,210,210,0.85)",
            lineHeight: 1.1,
          }}>
            QUEM ESTÁ ACESSANDO?
          </h1>
        </div>

        {/* Cards */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "36px" }}>
          {PROFILES.map((p, i) => (
            <ProfileCard
              key={p.id}
              profile={p}
              index={i}
              onClick={() => handleSelectProfile(p)}
              onHover={setHover}
            />
          ))}
        </div>
      </div>}

      {/* ── Password panel ── */}
      {selected && entryView === "virtude" && (
        <div
          className={shaking ? "animate-shake" : ""}
          style={{
            position: "relative",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            maxWidth: "460px",
            padding: "0 24px",
            opacity: entering ? 1 : 0,
            transform: entering ? "translateX(0)" : "translateX(40px)",
            transition: "opacity 0.35s ease, transform 0.35s ease",
          }}
        >
          {/* Profile avatar */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "28px" }}>
            <div style={{
              width: "118px", height: "118px",
              border: `1px solid ${selected.color}55`,
              backgroundColor: "#1a1a1a",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              marginBottom: "14px",
              boxShadow: `0 0 40px ${selected.glowColor}`,
              animation: "profileGlow 2.5s ease-in-out infinite alternate",
            }}>
              {selected.image ? (
                <img src={selected.image} alt={selected.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <>
                  <div style={{ width: "50px", height: "50px", border: `1px solid ${selected.color}44`, backgroundColor: selected.color + "12", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "8px" }}>
                    <span style={{ fontFamily: "monospace", fontSize: "15px", fontWeight: 700, color: selected.color, letterSpacing: "0.1em" }}>
                      {selected.code}
                    </span>
                  </div>
                  <span style={{ fontFamily: "monospace", fontSize: "9px", color: "rgba(160,160,160,0.22)", letterSpacing: "0.15em" }}>SEM IMAGEM</span>
                </>
              )}
            </div>
            <span style={{ fontFamily: "monospace", fontSize: "20px", fontWeight: 700, color: selected.color, letterSpacing: "0.18em" }}>
              {selected.label.toUpperCase()}
            </span>
          </div>

          {/* Form */}
          <div style={{ width: "100%", backgroundColor: "#131313", border: "1px solid rgba(150,150,150,0.12)", padding: "28px" }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ fontFamily: "monospace", fontSize: "10px", letterSpacing: "0.18em", color: "rgba(160,160,160,0.4)", display: "block", marginBottom: "8px" }}>
                    CREDENCIAL DE ACESSO
                  </label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontFamily: "monospace", fontSize: "14px", color: selected.color }}>
                      &gt;
                    </span>
                    <input
                      ref={inputRef}
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(false); }}
                      placeholder="••••••••••••••••"
                      style={{
                        width: "100%",
                        paddingLeft: "36px", paddingRight: "48px", paddingTop: "13px", paddingBottom: "13px",
                        outline: "none",
                        fontFamily: "monospace", fontSize: "14px",
                        backgroundColor: dm ? "#0c0c0c" : "#f0eeea",
                        border: error ? "1px solid #cc2200" : `1px solid ${selected.color}33`,
                        color: selected.color,
                        caretColor: selected.color,
                        transition: "border-color 0.25s ease",
                      }}
                      onFocus={e => { if (!error) e.target.style.borderColor = selected.color + "88"; }}
                      onBlur={e => { if (!error) e.target.style.borderColor = selected.color + "33"; }}
                    />
                    {/* Show/hide password toggle */}
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      title={showPw ? "Ocultar senha" : "Mostrar senha"}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: showPw ? selected.color : `${selected.color}55`,
                        padding: "2px",
                        display: "flex",
                        alignItems: "center",
                        transition: "color 0.2s",
                      }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = selected.color)}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = showPw ? selected.color : `${selected.color}55`)}
                    >
                      {showPw ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  {error && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                      <div style={{ width: "10px", height: "1px", backgroundColor: "#cc2200" }} />
                      <p style={{ fontFamily: "monospace", fontSize: "10px", color: "#cc2200", letterSpacing: "0.12em" }}>
                        CREDENCIAL INVÁLIDA — TENTATIVA {attempts}
                      </p>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    fontFamily: "monospace", fontSize: "12px", fontWeight: 700, letterSpacing: "0.26em",
                    backgroundColor: loading ? "rgba(150,150,150,0.15)" : selected.color,
                    color: loading ? "rgba(150,150,150,0.45)" : "#000",
                    border: loading ? "1px solid rgba(150,150,150,0.18)" : "none",
                    padding: "15px", cursor: loading ? "not-allowed" : "pointer",
                    transition: "opacity 0.2s ease, transform 0.2s ease, background-color 0.2s ease",
                  }}
                  onMouseEnter={e => { if (!loading) { e.currentTarget.style.opacity = "0.85"; e.currentTarget.style.transform = "scale(1.015)"; } }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}
                >
                  {loading ? "VERIFICANDO..." : "AUTENTICAR"}
                </button>
            </form>
          </div>

          <button
            onClick={handleBack}
            style={{
              marginTop: "20px",
              fontFamily: "monospace", fontSize: "11px", letterSpacing: "0.15em",
              color: "rgba(150,150,150,0.32)",
              background: "none", border: "none", cursor: "pointer",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "rgba(200,200,200,0.7)")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "rgba(150,150,150,0.32)")}
          >
            ← TROCAR PERFIL
          </button>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          15%,45%,75%{transform:translateX(-7px)}
          30%,60%,90%{transform:translateX(7px)}
        }
        .animate-shake { animation: shake 0.48s ease-in-out; }
        @keyframes profileGlow {
          from { box-shadow: 0 0 18px rgba(100,100,100,0.08); }
          to   { box-shadow: 0 0 48px rgba(100,100,100,0.22); }
        }
        @keyframes blink {
          0%,100%{opacity:1} 50%{opacity:0.2}
        }
      `}</style>

      {/* ── Admin prompt (hidden, triggered by "entradaADM" + Enter) ── */}
      {showAdmPrompt && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
          backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
        }}
          onClick={e => {
            if (e.target === e.currentTarget && !backupLoading) {
              setShowAdmPrompt(false); setAdmInput(""); setAdmError(false); setBackupDone(false);
            }
          }}
        >
          <form
            onSubmit={handleAdmSubmit}
            style={{
              display: "flex", flexDirection: "column", gap: "14px",
              padding: "28px 32px",
              backgroundColor: "rgba(6,6,6,0.98)",
              border: `1px solid ${backupDone ? "rgba(80,220,120,0.3)" : "rgba(255,255,255,0.07)"}`,
              minWidth: "280px",
              transition: "border-color 0.3s",
            }}
          >
            <span style={{ fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.28em", color: "rgba(255,255,255,0.25)" }}>
              ACESSO RESTRITO
            </span>

            {backupDone ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", padding: "10px 0" }}>
                <span style={{ fontFamily: "monospace", fontSize: "22px", color: "#50dc78" }}>✓</span>
                <span style={{ fontFamily: "monospace", fontSize: "10px", letterSpacing: "0.18em", color: "#50dc78" }}>
                  BACKUP SALVO
                </span>
              </div>
            ) : (
              <>
                <input
                  ref={admInputRef}
                  type="password"
                  value={admInput}
                  onChange={e => { setAdmInput(e.target.value); setAdmError(false); }}
                  placeholder="••••••••"
                  autoComplete="off"
                  disabled={backupLoading}
                  style={{
                    fontFamily: "monospace", fontSize: "14px",
                    padding: "11px 14px",
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: `1px solid ${admError ? "#cc2200" : "rgba(255,255,255,0.1)"}`,
                    color: "#ffffff", caretColor: "#ffffff", outline: "none",
                    transition: "border-color 0.2s",
                    opacity: backupLoading ? 0.5 : 1,
                  }}
                />
                {admError && (
                  <span style={{ fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.14em", color: "#cc2200" }}>
                    CREDENCIAL INVÁLIDA
                  </span>
                )}
                <button type="submit" disabled={backupLoading} style={{
                  fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.2em", fontWeight: 700,
                  padding: "10px", backgroundColor: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)",
                  cursor: backupLoading ? "not-allowed" : "pointer",
                  transition: "all 0.18s",
                  opacity: backupLoading ? 0.5 : 1,
                }}>
                  {backupLoading ? "GERANDO BACKUP..." : "VERIFICAR"}
                </button>
              </>
            )}
          </form>
        </div>
      )}

      {/* ── Admin panel (backup + senhas) ── */}
      {showAudit && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
          backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
        }}
          onClick={e => { if (e.target === e.currentTarget) setShowAudit(false); }}
        >
          <div style={{
            display: "flex", flexDirection: "column",
            width: "min(700px, 96vw)", maxHeight: "88vh",
            backgroundColor: "rgba(6,6,6,0.99)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 22px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#ff6600" }} />
                <span style={{ fontFamily: "monospace", fontSize: "10px", letterSpacing: "0.26em", color: "rgba(255,255,255,0.45)" }}>
                  PAINEL DE ADMINISTRAÇÃO
                </span>
              </div>
              <button onClick={() => setShowAudit(false)}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", cursor: "pointer", fontFamily: "monospace", fontSize: "16px", lineHeight: 1, padding: "0 2px" }}>×</button>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {(["historico", "senhas"] as const).map(tab => (
                <button key={tab} onClick={() => setAdminTab(tab)} style={{
                  flex: 1, fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.22em",
                  padding: "12px", border: "none", cursor: "pointer", transition: "all 0.15s",
                  backgroundColor: adminTab === tab ? "rgba(255,102,0,0.12)" : "transparent",
                  color: adminTab === tab ? "#ff6600" : "rgba(255,255,255,0.3)",
                  borderBottom: adminTab === tab ? "1px solid #ff6600" : "1px solid transparent",
                  marginBottom: "-1px",
                }}>
                  {tab === "historico" ? `HISTÓRICO (${auditLog.length})` : "SENHAS"}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ flex: 1, overflowY: "auto" }}>

              {/* ── HISTÓRICO ── */}
              {adminTab === "historico" && (
                auditLog.length === 0 ? (
                  <div style={{ padding: "40px 22px", textAlign: "center", fontFamily: "monospace", fontSize: "10px", color: "rgba(255,255,255,0.2)", letterSpacing: "0.18em" }}>
                    NENHUMA ALTERAÇÃO REGISTRADA AINDA
                  </div>
                ) : auditLog.map(log => {
                  const d = new Date(log.createdAt).toLocaleString("pt-BR");
                  const typeColor: Record<string, string> = {
                    senha_alterada: "#f5d060", aba_criada: "#5ecb7a", aba_excluida: "#cc2200",
                    aba_renomeada: "#6ab4f0", entrada_adicionada: "#5ecb7a", entrada_removida: "#cc2200", entrada_editada: "#6ab4f0",
                  };
                  const dot = typeColor[log.eventType] ?? "#888";
                  return (
                    <div key={log.id} style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "10px 22px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: dot, marginTop: "4px", flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontFamily: "monospace", fontSize: "11px", color: "rgba(220,220,220,0.85)", margin: 0, wordBreak: "break-word", lineHeight: 1.5 }}>{log.description}</p>
                        <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                          <span style={{ fontFamily: "monospace", fontSize: "9px", color: "rgba(255,255,255,0.2)", letterSpacing: "0.08em" }}>{d}</span>
                          <span style={{ fontFamily: "monospace", fontSize: "9px", color: dot + "88", letterSpacing: "0.1em" }}>{log.profileId.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* ── SENHAS ── */}
              {adminTab === "senhas" && (
                <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  {["fortitudo","temperantia","prudentia","iustitia"].map(pid => {
                    const colors: Record<string,string> = { fortitudo: "#ff6600", temperantia: "#6ab4f0", prudentia: "#5ecb7a", iustitia: "#c084fc" };
                    const c = colors[pid] ?? "#aaa";
                    const msg = pwMsg[pid];
                    const saving = pwSaving[pid];
                    return (
                      <div key={pid} style={{ padding: "18px 20px", border: `1px solid ${c}22`, backgroundColor: `${c}06` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                          <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: c }} />
                          <span style={{ fontFamily: "monospace", fontSize: "11px", letterSpacing: "0.18em", color: c, fontWeight: 700 }}>
                            {pid.toUpperCase()}
                          </span>
                          <span style={{ fontFamily: "monospace", fontSize: "9px", color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em" }}>
                            atual: <span style={{ color: "rgba(255,255,255,0.55)" }}>{adminPasswords[pid] ?? "…"}</span>
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <input
                            type="text"
                            value={pwInputs[pid] ?? ""}
                            onChange={e => setPwInputs(prev => ({ ...prev, [pid]: e.target.value }))}
                            placeholder="Nova senha…"
                            style={{
                              flex: 1, fontFamily: "monospace", fontSize: "12px",
                              padding: "9px 12px",
                              backgroundColor: "rgba(255,255,255,0.04)",
                              border: `1px solid ${msg ? (msg.ok ? "#5ecb7a55" : "#cc220055") : "rgba(255,255,255,0.12)"}`,
                              color: "#fff", caretColor: "#fff", outline: "none",
                            }}
                          />
                          <button
                            disabled={saving || !pwInputs[pid] || pwInputs[pid] === adminPasswords[pid]}
                            onClick={async () => {
                              const newPw = pwInputs[pid];
                              if (!newPw || newPw === adminPasswords[pid]) return;
                              setPwSaving(p => ({ ...p, [pid]: true }));
                              setPwMsg(p => ({ ...p, [pid]: { ok: false, text: "" } }));
                              try {
                                const r = await fetch(`/api/admin/passwords/${pid}`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ password: ADM_PASSWORD, newPassword: newPw }),
                                });
                                if (r.ok) {
                                  setAdminPasswords(p => ({ ...p, [pid]: newPw }));
                                  setPwMsg(p => ({ ...p, [pid]: { ok: true, text: "SALVO ✓" } }));
                                } else {
                                  setPwMsg(p => ({ ...p, [pid]: { ok: false, text: "ERRO" } }));
                                }
                              } catch {
                                setPwMsg(p => ({ ...p, [pid]: { ok: false, text: "ERRO" } }));
                              } finally {
                                setPwSaving(p => ({ ...p, [pid]: false }));
                                setTimeout(() => setPwMsg(p => ({ ...p, [pid]: { ok: false, text: "" } })), 2500);
                              }
                            }}
                            style={{
                              fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.18em", fontWeight: 700,
                              padding: "9px 18px", border: `1px solid ${c}55`,
                              backgroundColor: saving ? "rgba(255,255,255,0.04)" : `${c}18`,
                              color: saving ? "rgba(255,255,255,0.3)" : c,
                              cursor: saving ? "not-allowed" : "pointer", transition: "all 0.15s",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {saving ? "…" : "SALVAR"}
                          </button>
                        </div>
                        {msg?.text && (
                          <span style={{ fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.12em", color: msg.ok ? "#5ecb7a" : "#cc2200", marginTop: "6px", display: "block" }}>
                            {msg.text}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "14px 22px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  const blob = new Blob([backupContent], { type: "text/plain;charset=utf-8" });
                  const url  = URL.createObjectURL(blob);
                  const a    = document.createElement("a");
                  a.href = url; a.download = backupFileName; a.click();
                  URL.revokeObjectURL(url);
                }}
                style={{
                  fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.22em", fontWeight: 700,
                  padding: "11px 24px", backgroundColor: "#ff6600", color: "#000",
                  border: "none", cursor: "pointer", transition: "opacity 0.18s",
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = "0.82")}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = "1")}
              >
                ↓ SALVAR DOCUMENTO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Admin mode indicator (subtle, top-left) ── */}
      {adminMode && (
        <div style={{
          position: "fixed", top: "14px", left: "50%", transform: "translateX(-50%)",
          zIndex: 9998, fontFamily: "monospace", fontSize: "8px", letterSpacing: "0.22em",
          color: "rgba(255,255,255,0.18)", pointerEvents: "none",
        }}>
          ADM ●
        </div>
      )}

      {/* ── Estrangeiros admin panel ── */}
      {showEstAdm && <EstrangeirosAdmin onClose={() => setShowEstAdm(false)} />}
    </div>
  );
}
