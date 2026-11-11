// 관리자 로그인
export default function AdminLoginModal({ password, onPasswordChange, error, onSubmit, onClose }) {
  return (
    <div onClick={() => onClose()} style={{ position: "fixed", inset: 0, zIndex: 97, background: "rgba(5,7,9,.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); onSubmit(); }} style={{ width: "min(340px,100%)", background: "#14181D", border: "1px solid #2C333C", borderRadius: 18, padding: 20, display: "flex", flexDirection: "column", gap: 12, animation: "popIn .3s cubic-bezier(.2,.7,.3,1) both" }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>관리자 로그인</div>
        <div style={{ fontSize: 12, color: "#8B949E" }}>파티 편성(자동 조합 · 수동 편집), 원정대 삭제, 레이드 삭제와 목록 초기화는 관리자만 할 수 있습니다.</div>
        <input autoFocus type="password" inputMode="numeric" value={password} onChange={(e) => onPasswordChange(e.target.value)} placeholder="비밀번호" style={{ background: "#0F1318", border: "1px solid #2C333C", borderRadius: 10, padding: "11px 14px", color: "#E8EAEC", fontSize: 13 }} />
        {error && <div style={{ fontSize: 12, color: "#E1424F" }}>{error}</div>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" onClick={() => onClose()} style={{ background: "transparent", color: "#8B949E", border: "1px solid #2C333C", borderRadius: 10, padding: "9px 14px", fontSize: 13, cursor: "pointer" }}>취소</button>
          <button type="submit" style={{ background: "#C8F24C", color: "#0B0D10", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>로그인</button>
        </div>
      </form>
    </div>
  );
}
