import { mono, btnSmall } from "../_lib/styles";

// 원정대 갱신 후 레벨이 올라 새로 갈 수 있게 된 레이드 알림
export default function RaidNoticesModal({ notices, onClose, onOpenConfig }) {
  return (
    <div onClick={() => onClose()} style={{ position: "fixed", inset: 0, zIndex: 95, background: "rgba(5,7,9,.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(460px,100%)", maxHeight: "80vh", background: "#14181D", border: "1px solid #2C333C", borderRadius: 18, padding: 20, display: "flex", flexDirection: "column", gap: 14, animation: "popIn .3s cubic-bezier(.2,.7,.3,1) both" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>🎉 새로 갈 수 있는 레이드</div>
            <div style={{ fontSize: 12, color: "#8B949E", marginTop: 4 }}>레벨이 올라 입장 가능해진 레이드입니다. 참여하려면 ⚙ 설정에서 체크해 주세요.</div>
          </div>
          <button onClick={() => onClose()} style={{ background: "transparent", border: "none", color: "#6B737C", fontSize: 18, cursor: "pointer", padding: "2px 6px" }}>×</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
          {notices.map(n => (
            <div key={`${n.owner}-${n.charName}`} style={{ background: "#0F1318", border: "1px solid #262C34", borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, wordBreak: "break-all" }}>
                  {n.charName} <span style={{ fontSize: 11, fontWeight: 500, color: "#8B949E" }}>{n.className} · {n.owner}</span>
                </div>
                <div style={{ fontFamily: mono, fontSize: 11, color: "#8B949E", marginTop: 2 }}>
                  {n.isNew ? <span style={{ color: "#2FD3B7" }}>새 캐릭터 · </span> : <>Lv.{n.from} → </>}<span style={{ color: "#C8F24C" }}>Lv.{n.to}</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                  {n.raids.map(r => (
                    <span key={r.name} style={{ fontSize: 11, fontWeight: 600, color: "#C8F24C", background: "rgba(200,242,76,.1)", border: "1px solid rgba(200,242,76,.3)", borderRadius: 6, padding: "2px 7px" }}>{r.name}</span>
                  ))}
                </div>
              </div>
              <button onClick={() => onOpenConfig(n)} style={btnSmall}>⚙ 설정</button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={() => onClose()} style={{ background: "#C8F24C", color: "#0B0D10", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>확인</button>
        </div>
      </div>
    </div>
  );
}
