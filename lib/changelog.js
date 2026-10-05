// 공유 상태가 바뀔 때마다 무엇이 바뀌었는지 사람이 읽을 수 있는 문장으로 정리한다.
// (관리자 전용 '변경 기록' 탭에서 보여줌)

export const STATE_KEY = "loa:party-maker:main";
export const LOG_KEY = "loa:party-maker:log";
export const LOG_MAX = 400;

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const isSingle = (p) => p.type === "single" || String(p.raidName || "").includes("싱글 / 미편성");
const memberKeys = (p) => (p.members || []).map(m => `${m.owner}/${m.charName}`).sort();

export function describeChanges(prev, next) {
  const out = [];
  prev = prev || { members: [], parties: [], raids: null };

  /* ---- 원정대 ---- */
  const pm = new Map((prev.members || []).map(m => [m.owner, m]));
  const nm = new Map((next.members || []).map(m => [m.owner, m]));
  for (const [o, m] of nm) {
    if (!pm.has(o)) out.push(`원정대 등록: ${o}${m.realName ? ` (${m.realName})` : ""} — 캐릭터 ${m.characters.length}개`);
  }
  for (const [o] of pm) if (!nm.has(o)) out.push(`원정대 삭제: ${o}`);
  for (const [o, m] of nm) {
    const p = pm.get(o);
    if (!p || same(p, m)) continue;
    if ((p.realName || "") !== (m.realName || "")) out.push(`실명 변경: ${o} → ${m.realName || "(없음)"}`);
    if ((p.mainAccount || "") !== (m.mainAccount || "")) {
      out.push(m.mainAccount ? `부계정 연결: ${o} → ${m.mainAccount} 의 부계정` : `부계정 해제: ${o}`);
    }
    const pc = new Map(p.characters.map(c => [c.charName, c]));
    let refreshed = 0;
    for (const c of m.characters) {
      const q = pc.get(c.charName);
      if (!q) { out.push(`캐릭터 추가: ${o} / ${c.charName}`); continue; }
      if (!!q.isExcluded !== !!c.isExcluded) out.push(`${c.isExcluded ? "매칭 제외" : "매칭 참여"}: ${c.charName}`);
      if (q.role !== c.role) out.push(`역할 변경: ${c.charName} → ${c.role}`);
      if (!same(q.allowedRaids || null, c.allowedRaids || null)) out.push(`레이드 설정 변경: ${c.charName}`);
      if (q.level !== c.level || q.combatPower !== c.combatPower) refreshed++;
    }
    for (const q of p.characters) {
      if (!m.characters.some(c => c.charName === q.charName)) out.push(`캐릭터 빠짐(갱신): ${o} / ${q.charName}`);
    }
    if (refreshed) out.push(`원정대 갱신: ${o} — 레벨/전투력 변경 ${refreshed}캐릭`);
  }

  /* ---- 파티 ---- */
  const pp = prev.parties || [], np = next.parties || [];
  const formed = np.filter(p => !isSingle(p)).length;
  if (!pp.length && np.length) {
    out.push(`파티 자동 조합: ${formed}파티`);
  } else if (pp.length && !np.length) {
    out.push("파티 편성 비움");
  } else {
    const pById = new Map(pp.map(p => [p.id, p]));
    const changed = np.filter(p => { const q = pById.get(p.id); return !q || !same(memberKeys(q), memberKeys(p)); });
    const idsChanged = !same(pp.map(p => p.id).sort(), np.map(p => p.id).sort());
    if (idsChanged || changed.length > 3) out.push(`파티 다시 편성: ${formed}파티`);
    else changed.forEach(p => out.push(`수동 편집: ${p.raidName}`));
    for (const p of np) {
      const q = pById.get(p.id);
      if (q && !!q.cleared !== !!p.cleared) {
        out.push(`${p.cleared ? "클리어 표시" : "클리어 취소"}: ${p.raidName}${p.partyNum ? ` (파티 ${p.partyNum})` : ""}`);
      }
    }
  }

  /* ---- 레이드 목록 ---- */
  if (Array.isArray(next.raids) && Array.isArray(prev.raids)) {
    const pr = new Map(prev.raids.map(r => [r.id, r]));
    const nr = new Map(next.raids.map(r => [r.id, r]));
    for (const [id, r] of nr) {
      const q = pr.get(id);
      if (!q) { out.push(`레이드 추가: ${r.name} (${r.type}인, Lv.${r.minLevel})`); continue; }
      if (q.name !== r.name) out.push(`레이드 이름 변경: ${q.name} → ${r.name}`);
      if (q.minLevel !== r.minLevel) out.push(`입장 레벨 변경: ${r.name} ${q.minLevel} → ${r.minLevel}`);
      if (q.type !== r.type) out.push(`인원 변경: ${r.name} ${q.type}인 → ${r.type}인`);
      if ((q.image || "") !== (r.image || "")) out.push(`배경 이미지 변경: ${r.name}`);
    }
    for (const [id, q] of pr) if (!nr.has(id)) out.push(`레이드 삭제: ${q.name}`);
  }
  return out;
}
