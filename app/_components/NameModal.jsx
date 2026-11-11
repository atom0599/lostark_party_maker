// 변경 기록에 남을 내 이름 설정
export default function NameModal({ value, onChange, onSave, onClose }) {
  return (
    <div onClick={() => onClose()} style={{ position: "fixed", inset: 0, zIndex: 97, background: "rgba(5,7,9,.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); onSave(); }} style={{ width: "min(340px,100%)", background: "#14181D", border: "1px solid #2C333C", borderRadius: 18, padding: 20, display: "flex", flexDirection: "column", gap: 12, animation: "popIn .3s cubic-bezier(.2,.7,.3,1) both" }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>내 이름</div>
        <div style={{ fontSize: 12, color: "#8B949E" }}>파티를 바꾸거나 클리어를 누르면 이 이름으로 기록됩니다. 이 브라우저에만 저장됩니다.</div>
        <input autoFocus value={value} onChange={(e) => onChange(e.target.value)} maxLength={20} placeholder="예: 이현" style={{ background: "#0F1318", border: "1px solid #2C333C", borderRadius: 10, padding: "11px 14px", color: "#E8EAEC", fontSize: 13 }} />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" onClick={() => onClose()} style={{ background: "transparent", color: "#8B949E", border: "1px solid #2C333C", borderRadius: 10, padding: "9px 14px", fontSize: 13, cursor: "pointer" }}>취소</button>
          <button type="submit" style={{ background: "#C8F24C", color: "#0B0D10", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>저장</button>
        </div>
      </form>
    </div>
  );
}
