import { useState } from "react";
import { useSettings, ACCENT_MAP, type AccentKey, type FontSize } from "@/contexts/SettingsContext";

const ACCENT_OPTS: { key: AccentKey; label: string }[] = [
  { key: "orange", label: "Laranja"  },
  { key: "blue",   label: "Azul"     },
  { key: "green",  label: "Verde"    },
  { key: "yellow", label: "Amarelo"  },
  { key: "rose",   label: "Rosa"     },
  { key: "violet", label: "Violeta"  },
];

const FONT_OPTS: { key: FontSize; label: string }[] = [
  { key: "sm", label: "Pequeno" },
  { key: "md", label: "Médio"   },
  { key: "lg", label: "Grande"  },
];

interface Props {
  profileId?: string;
}

export default function SettingsPanel({ profileId }: Props) {
  const { settings, update } = useSettings();
  const [open, setOpen] = useState(false);
  const a = ACCENT_MAP[settings.accent];
  const accentHex = settings.darkMode ? a.hex : a.dark;

  const [showPwForm, setShowPwForm] = useState(false);
  const [oldPw, setOldPw]         = useState("");
  const [newPw, setNewPw]         = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg]         = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const dm = settings.darkMode;
  const muted      = dm ? "rgba(200,200,200,0.35)" : "rgba(30,20,0,0.4)";
  const labelColor = dm ? "rgba(200,200,200,0.72)" : "rgba(20,10,0,0.72)";
  const panelBg    = dm ? "rgba(10,10,10,0.97)" : "rgba(242,240,234,0.99)";
  const inputBg    = dm ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)";
  const borderDim  = dm ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.1)";

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId) return;
    if (newPw !== confirmPw) { setPwMsg({ type: "err", text: "SENHAS NÃO COINCIDEM" }); return; }
    if (newPw.length < 4)   { setPwMsg({ type: "err", text: "MÍNIMO DE 4 CARACTERES" }); return; }
    setPwLoading(true); setPwMsg(null);
    try {
      const res = await fetch(`/api/profiles/${profileId}/password`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw }),
      });
      if (res.ok) {
        setPwMsg({ type: "ok", text: "SENHA ALTERADA COM SUCESSO" });
        setOldPw(""); setNewPw(""); setConfirmPw("");
        fetch("/api/admin/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileId, eventType: "senha_alterada", description: `Senha alterada no perfil "${profileId?.toUpperCase()}"` }),
        }).catch(() => {});
        setTimeout(() => { setShowPwForm(false); setPwMsg(null); }, 2200);
      } else {
        const body = await res.json() as { error?: string };
        setPwMsg({ type: "err", text: body.error?.toUpperCase() ?? "ERRO AO ALTERAR" });
      }
    } catch { setPwMsg({ type: "err", text: "ERRO DE CONEXÃO" }); }
    finally  { setPwLoading(false); }
  };

  const fieldStyle: React.CSSProperties = {
    width: "100%", padding: "8px 10px",
    fontFamily: "monospace", fontSize: "11px",
    backgroundColor: inputBg,
    border: `1px solid ${accentHex}22`,
    color: labelColor, outline: "none", letterSpacing: "0.05em",
  };

  return (
    <>
      {/* Gear button */}
      <button
        onClick={() => { setOpen(o => !o); if (open) { setShowPwForm(false); setPwMsg(null); } }}
        title="Configurações"
        style={{
          position:"fixed", bottom:"22px", right:"22px", zIndex:200,
          width:"42px", height:"42px", borderRadius:"50%",
          backgroundColor: open ? accentHex : (dm ? "rgba(20,20,20,0.92)" : "rgba(228,226,220,0.96)"),
          border: `1px solid ${open ? accentHex : (dm ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.12)")}`,
          color: open ? "#fff" : accentHex,
          cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
          backdropFilter:"blur(8px)", transition:"all 0.22s ease",
          boxShadow: open ? `0 0 22px ${accentHex}55` : "0 2px 12px rgba(0,0,0,0.2)",
        }}
        onMouseEnter={e => { if (!open) { (e.currentTarget as HTMLElement).style.borderColor = accentHex; (e.currentTarget as HTMLElement).style.boxShadow = `0 0 16px ${accentHex}44`; } }}
        onMouseLeave={e => { if (!open) { (e.currentTarget as HTMLElement).style.borderColor = dm ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.12)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.2)"; } }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ transition:"transform 0.4s ease", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}>
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      </button>

      {/* Panel */}
      <div style={{
        position:"fixed", bottom:"76px", right:"22px", zIndex:199,
        width:"268px",
        backgroundColor: panelBg,
        border: `1px solid ${accentHex}33`,
        backdropFilter:"blur(20px)",
        padding:"20px",
        boxShadow: `0 8px 40px rgba(0,0,0,0.3), 0 0 0 1px ${accentHex}0d`,
        opacity: open ? 1 : 0,
        transform: open ? "translateY(0) scale(1)" : "translateY(10px) scale(0.97)",
        pointerEvents: open ? "auto" : "none",
        transition:"opacity 0.2s ease, transform 0.2s ease",
        maxHeight:"92vh", overflowY:"auto",
      }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"20px", paddingBottom:"12px", borderBottom:`1px solid ${accentHex}20` }}>
          <div style={{ width:"6px", height:"6px", borderRadius:"50%", backgroundColor: accentHex }} />
          <span style={{ fontFamily:"monospace", fontSize:"10px", letterSpacing:"0.22em", color: accentHex }}>
            CONFIGURAÇÕES
          </span>
        </div>

        {/* Dark mode */}
        <div style={{ marginBottom:"20px" }}>
          <span style={{ fontFamily:"monospace", fontSize:"9px", letterSpacing:"0.16em", color: muted, display:"block", marginBottom:"10px" }}>MODO</span>
          <button
            onClick={() => update({ darkMode: !settings.darkMode })}
            style={{
              width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
              backgroundColor: dm ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)",
              border:`1px solid ${accentHex}20`, padding:"10px 14px", cursor:"pointer",
              fontFamily:"monospace", fontSize:"11px", letterSpacing:"0.1em",
              color: labelColor, transition:"all 0.2s",
            }}
          >
            <span>{dm ? "ESCURO" : "CLARO"}</span>
            <div style={{ width:"32px", height:"18px", borderRadius:"9px", backgroundColor: dm ? accentHex : "rgba(150,150,150,0.3)", position:"relative", transition:"background-color 0.25s" }}>
              <div style={{ position:"absolute", top:"3px", left: dm ? "17px" : "3px", width:"12px", height:"12px", borderRadius:"50%", backgroundColor: dm ? "#000" : "#fff", transition:"left 0.25s" }} />
            </div>
          </button>
        </div>

        {/* Font size */}
        <div style={{ marginBottom:"20px" }}>
          <span style={{ fontFamily:"monospace", fontSize:"9px", letterSpacing:"0.16em", color: muted, display:"block", marginBottom:"10px" }}>TAMANHO DO TEXTO</span>
          <div style={{ display:"flex", gap:"6px" }}>
            {FONT_OPTS.map(({ key, label }) => {
              const active = settings.fontSize === key;
              return (
                <button key={key} onClick={() => update({ fontSize: key })} style={{
                  flex:1, fontFamily:"monospace", fontSize:"9px", letterSpacing:"0.1em", padding:"7px 4px",
                  backgroundColor: active ? accentHex : "transparent",
                  color: active ? (dm ? "#000" : "#fff") : (dm ? "rgba(200,200,200,0.4)" : "rgba(30,20,0,0.45)"),
                  border:`1px solid ${active ? accentHex : borderDim}`,
                  cursor:"pointer", transition:"all 0.18s",
                }}>
                  {label.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Accent color — 2×3 grid */}
        <div style={{ marginBottom: profileId ? "20px" : "0" }}>
          <span style={{ fontFamily:"monospace", fontSize:"9px", letterSpacing:"0.16em", color: muted, display:"block", marginBottom:"10px" }}>COR PREDOMINANTE</span>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px" }}>
            {ACCENT_OPTS.map(({ key, label }) => {
              const active = settings.accent === key;
              const c = ACCENT_MAP[key];
              const swatchColor = dm ? c.hex : c.dark;
              return (
                <button key={key} onClick={() => update({ accent: key })} style={{
                  display:"flex", alignItems:"center", gap:"8px", padding:"8px 10px",
                  backgroundColor: active ? `${swatchColor}18` : "transparent",
                  border:`1px solid ${active ? swatchColor : borderDim}`,
                  cursor:"pointer", transition:"all 0.18s", textAlign:"left",
                }}>
                  <div style={{
                    width:"12px", height:"12px", borderRadius:"50%",
                    backgroundColor: swatchColor, flexShrink:0,
                    boxShadow: active ? `0 0 8px ${swatchColor}88` : "none",
                  }} />
                  <span style={{
                    fontFamily:"monospace", fontSize:"9px", letterSpacing:"0.1em",
                    color: active ? swatchColor : (dm ? "rgba(200,200,200,0.45)" : "rgba(30,20,0,0.52)"),
                    transition:"color 0.18s", whiteSpace:"nowrap",
                  }}>
                    {label.toUpperCase()}
                  </span>
                  {active && <div style={{ marginLeft:"auto", width:"5px", height:"5px", borderRadius:"50%", backgroundColor: swatchColor }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Mudar Senha ── */}
        {profileId && (
          <div style={{ paddingTop:"16px", borderTop:`1px solid ${accentHex}20` }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: showPwForm ? "14px" : "0" }}>
              <span style={{ fontFamily:"monospace", fontSize:"9px", letterSpacing:"0.16em", color: muted }}>CREDENCIAL</span>
              <button
                onClick={() => { setShowPwForm(v => !v); setPwMsg(null); }}
                style={{
                  fontFamily:"monospace", fontSize:"9px", letterSpacing:"0.12em",
                  color: showPwForm ? accentHex : (dm ? "rgba(200,200,200,0.4)" : "rgba(30,20,0,0.45)"),
                  background:"none", border:`1px solid ${showPwForm ? accentHex+"44" : "transparent"}`,
                  cursor:"pointer", padding:"3px 8px", transition:"all 0.18s",
                }}
              >
                {showPwForm ? "▲ FECHAR" : "MUDAR SENHA"}
              </button>
            </div>
            {showPwForm && (
              <form onSubmit={handleChangePw} style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                {(["SENHA ATUAL", "NOVA SENHA", "CONFIRMAR NOVA SENHA"] as const).map((lbl, i) => (
                  <div key={lbl}>
                    <label style={{ fontFamily:"monospace", fontSize:"8px", letterSpacing:"0.14em", color: muted, display:"block", marginBottom:"4px" }}>{lbl}</label>
                    <input
                      type="password" required autoComplete={i === 0 ? "current-password" : "new-password"}
                      value={i === 0 ? oldPw : i === 1 ? newPw : confirmPw}
                      onChange={e => { if (i === 0) setOldPw(e.target.value); else if (i === 1) setNewPw(e.target.value); else setConfirmPw(e.target.value); }}
                      style={fieldStyle}
                    />
                  </div>
                ))}
                {pwMsg && (
                  <p style={{ fontFamily:"monospace", fontSize:"9px", letterSpacing:"0.1em", color: pwMsg.type === "ok" ? "#3db86a" : "#cc2200", margin:"2px 0 0" }}>
                    {pwMsg.type === "ok" ? "✓ " : "✗ "}{pwMsg.text}
                  </p>
                )}
                <button type="submit" disabled={pwLoading} style={{
                  fontFamily:"monospace", fontSize:"9px", fontWeight:700, letterSpacing:"0.18em",
                  backgroundColor: pwLoading ? "transparent" : accentHex,
                  color: pwLoading ? muted : (dm ? "#000" : "#fff"),
                  border:`1px solid ${pwLoading ? accentHex+"33" : accentHex}`,
                  padding:"9px", cursor: pwLoading ? "not-allowed" : "pointer", marginTop:"4px", transition:"all 0.18s",
                }}>
                  {pwLoading ? "SALVANDO..." : "CONFIRMAR ALTERAÇÃO"}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </>
  );
}
