// 공유 상태 변경 중 관리자만 할 수 있는 것을 서버에서 판정한다.
// 화면에서 버튼을 숨기는 것만으로는 /api/state 에 직접 요청하는 걸 막을 수 없으므로.
//
// 관리자 전용:
//  · 파티 편성 변경 (자동 조합, 수동 편집, 파티 비우기) — 파티 id 와 자리(원정대/캐릭터)가 바뀌는 것
//  · 원정대 삭제
//  · 레이드(난이도) 삭제, 레이드 목록 초기화
// 누구나:
//  · 원정대 등록 / 갱신 / 캐릭터 설정, 클리어 체크, 주간 초기화, 레이드 추가·수정

const slotKeys = (list) => (list || []).map(c => `${c && c.owner}/${c && c.charName}`);

// 파티의 "구성"만 뽑는다. 클리어 표시, 캐릭터 레벨/전투력/이미지, 레이드 이름 변경 등은 제외.
const partyShape = (parties) => JSON.stringify(
  (parties || [])
    .map(p => [String(p && p.id), slotKeys(p && p.members), slotKeys(p && p.g1), slotKeys(p && p.g2)])
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
);

// cur: 서버에 저장된 현재 상태 (없을 수 있음), next: 저장하려는 { members, parties, raids }
// 관리자 권한이 필요한 변경이면 이유 문자열, 아니면 null
export function adminOnlyChange(cur, next) {
  if (!cur) return null; // 처음 올리는 상태는 막지 않는다

  if (partyShape(cur.parties) !== partyShape(next.parties)) {
    return "파티 편성 변경은 관리자만 할 수 있습니다.";
  }

  const nextOwners = new Set((next.members || []).map(m => m && m.owner));
  if ((cur.members || []).some(m => m && !nextOwners.has(m.owner))) {
    return "원정대 삭제는 관리자만 할 수 있습니다.";
  }

  if (next.raids && Array.isArray(cur.raids)) {
    const removed = cur.raids.filter(r => !next.raids.some(n => n && n.id === r.id));
    if (removed.length) return "레이드 삭제는 관리자만 할 수 있습니다.";
  }
  return null;
}
