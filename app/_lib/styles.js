// 공통 인라인 스타일

export const pill = (active, accent = "#FF4B57") => ({
  borderRadius: 999, padding: "9px 15px", fontSize: 13, fontWeight: active ? 700 : 500, cursor: "pointer",
  whiteSpace: "nowrap", border: `1px solid ${active ? accent : "#262C34"}`,
  background: active ? accent : "transparent", color: active ? "#0B0D10" : "#A8B0B9"
});
export const card = { background: "#14181D", border: "1px solid #262C34", borderRadius: 18, padding: 18 };
export const h1 = { fontFamily: "'Archivo'", fontWeight: 800, fontSize: "clamp(26px,5vw,34px)" };
export const sub = { fontSize: 13, color: "#8B949E", marginTop: 4 };
export const input = { background: "#0F1318", border: "1px solid #2C333C", borderRadius: 10, padding: "11px 13px", color: "#E8EAEC", fontSize: 13 };
export const selectStyle = { ...input, padding: "8px 10px", fontSize: 12, cursor: "pointer" };
export const btnPrimary = { background: "#FF4B57", color: "#0B0D10", border: "none", borderRadius: 12, padding: "12px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" };
export const btnGhost = { background: "#1B2027", color: "#E8EAEC", border: "1px solid #333B45", borderRadius: 12, padding: "12px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" };
export const btnSmall = { background: "#252C34", color: "#C8D0D8", border: "1px solid #333B45", borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" };
export const mono = "'IBM Plex Mono'";
export const fadeUp = "fadeUp .45s cubic-bezier(.2,.7,.3,1) both";
