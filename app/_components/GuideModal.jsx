import { mono } from "../_lib/styles";

// 사용 가이드
export default function GuideModal({ onClose }) {
  return (
    <div onClick={() => onClose()} style={{ position: "fixed", inset: 0, zIndex: 96, background: "rgba(5,7,9,.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(560px,100%)", background: "#14181D", border: "1px solid #2C333C", borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 16, animation: "popIn .35s cubic-bezier(.2,.7,.3,1) both" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: ".14em", color: "#FF4B57", marginBottom: 6 }}>HOW TO USE</div>
            <div style={{ fontFamily: "'Archivo'", fontWeight: 800, fontSize: 22 }}>사용 가이드</div>
          </div>
          <button onClick={() => onClose()} style={{ background: "transparent", border: "none", color: "#6B737C", fontSize: 18, cursor: "pointer", padding: "2px 6px" }}>×</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "60vh", overflowY: "auto" }}>
          {[
            ["01", "원정대 등록", <><b>원정대</b> 탭에서 공대원의 대표 캐릭터명(필요하면 실명도)을 입력하고 <b>[원정대 등록]</b>을 누르세요. 1700 이상 캐릭터의 레벨·전투력·초상화를 자동으로 불러옵니다. <b>↻ 갱신</b>(원정대별) 또는 <b>↻ 전체 원정대 갱신</b>으로 최신 정보를 다시 불러올 수 있습니다.</>],
            ["02", "부계정 연결", <>원정대 이름 옆의 선택창에서 <b>OO 의 부계정</b>을 고르면 본계정과 한 사람으로 묶여 함께 표시되고, 자동 조합 때 같은 파티에 함께 들어가지 않습니다.</>],
            ["03", "캐릭터 설정", <>캐릭터마다 <b>매칭 참여중 / 제외됨</b>을 눌러 이번 주 파티에서 뺄 수 있고, <b>⚙ 레이드 설정</b>에서 갈 난이도를 고르거나 이미 다녀온 레이드를 체크 해제할 수 있습니다. 바드·홀리나이트·도화가·발키리는 <b>딜러/서포터 배지</b>를 눌러 역할을 바꿀 수 있습니다.</>],
            ["04", "최적 파티 자동 조합", <><b>파티 편성</b> 탭의 <b>[최적 파티 자동 조합]</b>을 누르면 레벨 조건, 서포터 수, 직업·원정대(부계정 포함) 중복을 고려해 앞 파티부터 꽉 채워 편성합니다. 자리가 없는 캐릭터는 <b>싱글 / 미편성</b>으로 아래에 모입니다. 자동 조합은 상단 <b>관리자</b> 로그인 후에만 할 수 있습니다.</>],
            ["05", "보기 방식과 수동 편집", <><b>카드 보기 / 표 요약</b>을 전환하고, 레이드별·공대원별로 걸러 볼 수 있습니다. <b>파티 수동 편집</b>을 켜면 캐릭터를 눌러 선택한 뒤 다른 캐릭터나 빈 자리를 눌러 바꿀 수 있습니다 (표 요약에서도 가능, 관리자 로그인 필요). <b>📋 텍스트 복사</b>를 누르면 지금 보이는 파티 목록을 디스코드·카톡에 붙여넣기 좋은 글로 복사합니다.</>],
            ["06", "클리어 체크", <><b>클리어 현황 → 파티별 클리어</b>에서 다녀온 파티를 눌러 클리어로 표시하세요. <b>캐릭터별 현황</b>에서는 캐릭터마다 레이드별로 남음 / 편성 / 클리어 상태를 한눈에 볼 수 있습니다. 수요일 리셋 후에는 <b>↺ 주간 초기화</b>로 클리어 표시와 클리어 체크를 한 번에 되돌리세요.</>],
            ["07", "레이드 관리", <><b>레이드 관리</b> 탭에서 새 레이드나 난이도를 추가하고, 이름·인원(4인/8인)·입장 레벨·배경 이미지를 바꿀 수 있습니다. 배경은 <b>📁 내 PC</b>로 내 컴퓨터 이미지를 올릴 수도 있습니다. 새 레이드는 입장 레벨이 되는 캐릭터에게 자동으로 선택되며, 다음 자동 조합부터 반영됩니다. 레이드·난이도 삭제와 목록 초기화는 상단 <b>관리자</b> 로그인 후에만 할 수 있습니다.</>],
            ["08", "모두 함께 보기", <>원정대 등록, 파티 편성, 클리어 체크는 서버에 저장되어 사이트에 접속한 모든 사람에게 몇 초 안에 똑같이 보입니다. 상단 오른쪽 점이 초록색이면 정상적으로 공유 중입니다. 누가 무엇을 바꿨는지는 관리자가 <b>변경 기록</b>에서 확인합니다.</>],
          ].map(([n, title, body]) => (
            <div key={n} style={{ display: "flex", gap: 14, background: "#1B2027", border: "1px solid #262C34", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontFamily: mono, fontSize: 12, color: "#C8F24C", flex: "none", paddingTop: 1 }}>{n}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{title}</div>
                <div style={{ fontSize: 12, color: "#A8B0B9", lineHeight: 1.6 }}>{body}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={() => onClose()} style={{ background: "#C8F24C", color: "#0B0D10", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>확인</button>
        </div>
      </div>
    </div>
  );
}
