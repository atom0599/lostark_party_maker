// 서버 공유 상태(원정대 / 파티 / 레이드 목록)를 다루는 순수 함수

// 저장된 레이드 목록이 올바른 형태인지
export const validRaids = (raids) => Array.isArray(raids) && raids.length > 0
  && raids.every(r => r && typeof r.id === "number" && r.category && r.name && (r.type === 4 || r.type === 8) && typeof r.minLevel === "number");

// 파티 결과의 레이드 이름을 현재 레이드 목록의 이름으로 맞춘다 (예전 이름 / 레이드 관리에서 이름 변경 시)
export const migratePartyNames = (parties, raids) => parties.map(p => {
  const raid = raids.find(r => r.id === p.originalRaidId);
  if (!raid || !p.baseRaidName || p.baseRaidName === raid.name) return p;
  return { ...p, raidName: p.raidName.replace(p.baseRaidName, raid.name), baseRaidName: raid.name };
});

const same = (x, y) => JSON.stringify(x) === JSON.stringify(y);

// 3-way 병합: base(마지막으로 서버와 맞췄던 상태) 대비 내가 바꾼 항목은 내 것을, 안 바꾼 항목은 서버 것을 쓴다.
// 항목 단위 = 원정대(owner) / 파티(id). 순서는 내가 순서를 바꿨으면 내 순서, 아니면 서버 순서.
// resolve(b, l, s): 같은 항목을 나와 서버가 둘 다 바꿨을 때 더 잘게 합치는 함수 (없으면 내 것)
export const merge3 = (base, local, server, keyOf, resolve) => {
  const toMap = (arr) => new Map((arr || []).map(x => [keyOf(x), x]));
  const b = toMap(base), l = toMap(local), sv = toMap(server);
  const pick = (k) => {
    const bv = b.get(k), lv = l.get(k), sv2 = sv.get(k);
    if (same(lv, bv)) return sv2;          // 나는 안 바꿈 → 서버
    if (same(sv2, bv)) return lv;          // 서버는 안 바꿈 → 나
    if (resolve && bv !== undefined && lv !== undefined && sv2 !== undefined) return resolve(bv, lv, sv2);
    return lv;
  };
  const localOrderChanged = !same((local || []).map(keyOf), (base || []).map(keyOf));
  const order = localOrderChanged
    ? [...(local || []).map(keyOf), ...(server || []).map(keyOf)]
    : [...(server || []).map(keyOf), ...(local || []).map(keyOf)];
  const seen = new Set();
  const out = [];
  for (const k of order) {
    if (seen.has(k)) continue;
    seen.add(k);
    const v = pick(k);
    if (v !== undefined) out.push(v);
  }
  return out;
};

// 객체를 필드 단위로 3-way 병합. groups: 항상 함께 움직여야 하는 필드 묶음 (예: 파티의 members/g1/g2)
// sub: 필드별로 더 잘게 합치는 함수 ({ characters: (b, l, s) => ... })
const mergeFields = (b, l, s, { groups = [], sub = {} } = {}) => {
  const out = { ...s };
  const grouped = new Set(groups.flat());
  for (const g of groups) {
    const pickOf = (o) => g.map(k => o[k]);
    if (!same(pickOf(l), pickOf(b))) g.forEach(k => { out[k] = l[k]; });
  }
  const keys = new Set([...Object.keys(b), ...Object.keys(l), ...Object.keys(s)]);
  for (const k of keys) {
    if (grouped.has(k)) continue;
    if (same(l[k], b[k])) continue;                  // 나는 안 바꿈 → 서버 값 유지
    if (sub[k] && !same(s[k], b[k])) out[k] = sub[k](b[k], l[k], s[k]);
    else if (l[k] === undefined) delete out[k];
    else out[k] = l[k];
  }
  return out;
};

// 원정대 병합: 같은 원정대를 둘이 동시에 고쳐도, 서로 다른 캐릭터/필드면 둘 다 살린다
const mergeChar = (b, l, s) => mergeFields(b, l, s);
export const mergeMember = (b, l, s) => mergeFields(b, l, s, {
  sub: { characters: (bc, lc, sc) => merge3(bc, lc, sc, c => c.charName, mergeChar) },
});

// 파티 병합: 구성(members/g1/g2)과 클리어 표시 등은 따로 합친다
export const mergeParty = (b, l, s) => mergeFields(b, l, s, { groups: [["members", "g1", "g2"]] });

// 서버가 관리자 전용 변경(파티 편성 · 원정대 삭제 · 레이드 삭제)을 거부했을 때,
// 그 부분만 서버 상태로 되돌리고 나머지 내 변경(캐릭터 설정, 클리어 체크 등)은 살린 상태를 만든다.
export const keepAllowedChanges = (base, local, server) => {
  const members = merge3(base.members, local.members, server.members, m => m.owner, mergeMember);
  for (const m of server.members) if (!members.some(x => x.owner === m.owner)) members.push(m);

  const raids = merge3(base.raids, local.raids, server.raids, r => r.id);
  for (const r of server.raids) if (!raids.some(x => x.id === r.id)) raids.push(r);

  // 파티 구성은 서버 그대로, 내가 바꾼 클리어 표시만 반영
  const parties = server.parties.map(sp => {
    const lp = local.parties.find(p => p.id === sp.id);
    const bp = base.parties.find(p => p.id === sp.id);
    return lp && bp && !!lp.cleared !== !!bp.cleared ? { ...sp, cleared: lp.cleared } : sp;
  });
  return { members, parties: migratePartyNames(parties, raids), raids };
};
