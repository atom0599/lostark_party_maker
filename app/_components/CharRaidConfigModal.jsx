import { mono } from "../_lib/styles";

// 캐릭터별 레이드(난이도) 선택 · 클리어 체크
// target: { owner, char }
export default function CharRaidConfigModal({ target, raids, onToggle, onClose }) {
  return (
    <div onClick={() => onClose()} style={{ position: "fixed", inset: 0, zIndex: 96, background: "rgba(5,7,9,.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(520px,100%)", background: "#14181D", border: "1px solid #2C333C", borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 16, animation: "popIn .35s cubic-bezier(.2,.7,.3,1) both" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: ".14em", color: "#FF4B57", marginBottom: 6 }}>RAID SETTINGS</div>
            <div style={{ fontFamily: "'Archivo'", fontWeight: 800, fontSize: 22, wordBreak: "break-all", lineHeight: 1.25 }}>{target.char.charName}</div>
            <div style={{ fontSize: 12, color: "#8B949E", marginTop: 4 }}>
              {target.owner} 원정대 · {target.char.className} · <span style={{ fontFamily: mono, color: "#C8F24C" }}>Lv.{target.char.level}</span>
            </div>
          </div>
          <button onClick={() => onClose()} style={{ background: "transparent", border: "none", color: "#6B737C", fontSize: 18, cursor: "pointer", padding: "2px 6px" }}>×</button>
        </div>
        <div style={{ fontSize: 12, color: "#8B949E", lineHeight: 1.6 }}>
          이 캐릭터가 매칭될 레이드를 선택하세요. <b style={{ color: "#C6CDD4" }}>이미 다녀온 레이드(클리어)</b>는 체크를 해제하면 파티 매칭에서 제외됩니다. 같은 레이드 계열은 하나만 선택됩니다.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: "52vh", overflowY: "auto", paddingRight: 2 }}>
          {raids.map((raid) => {
            const isLevelMet = target.char.level >= raid.minLevel;
            const allowedRaids = target.char.allowedRaids || [];
            const isChecked = allowedRaids.includes(raid.id);
            return (
              <label
                key={raid.id}
                data-row={isLevelMet ? "1" : undefined}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, borderRadius: 12, padding: "11px 14px",
                  background: isChecked ? "rgba(200,242,76,.08)" : "#1B2027",
                  border: `1px solid ${isChecked ? "rgba(200,242,76,.35)" : "#262C34"}`,
                  opacity: isLevelMet ? 1 : .38, cursor: isLevelMet ? "pointer" : "not-allowed"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <input
                    type="checkbox"
                    disabled={!isLevelMet}
                    checked={isChecked}
                    onChange={() => onToggle(raid.id)}
                    style={{ width: 15, height: 15, accentColor: "#C8F24C", cursor: isLevelMet ? "pointer" : "not-allowed", flex: "none" }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{raid.name}</div>
                    <div style={{ fontFamily: mono, fontSize: 10, color: "#6B737C" }}>권장 Lv.{raid.minLevel} · {raid.type}인</div>
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", color: !isLevelMet ? "#E1424F" : isChecked ? "#C8F24C" : "#2FD3B7" }}>
                  {isLevelMet ? (isChecked ? "매칭 참여" : "✓ 클리어(제외)") : "레벨 미달"}
                </span>
              </label>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={() => onClose()} style={{ background: "#C8F24C", color: "#0B0D10", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>확인 및 완료</button>
        </div>
      </div>
    </div>
  );
}
