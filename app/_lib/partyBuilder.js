// 파티 자동 조합 / 수동 편집 알고리즘 (화면 상태와 무관한 순수 함수)

// 직업/원정대(부계정) 중복 없이 배치하되,
// 1순위: 앞 파티부터 최대한 꽉 채운다 (예: 4인 레이드 딜러 4명 → 2+2 가 아니라 3+1)
// 2순위: 그 안에서 남는(미편성) 캐릭터를 최소화한다.
export const packRaid = (sups, dlrs, type) => {
  const maxSup = type === 8 ? 2 : 1;
  const maxDlr = type === 8 ? 6 : 3;
  const all = [...sups, ...dlrs];
  if (all.length < 2) return { parties: [], leftovers: [...all] };

  const freq = {};
  const ownerFreq = {};
  all.forEach(c => {
    freq[c.className] = (freq[c.className] || 0) + 1;
    ownerFreq[c.ownerGroup] = (ownerFreq[c.ownerGroup] || 0) + 1;
  });

  // 같은 직업/같은 원정대가 많은 캐릭터를 먼저 배치(자리 선점) → 그다음 전투력 낮은 순
  const prio = (a, b) =>
    (freq[b.className] - freq[a.className]) ||
    (ownerFreq[b.ownerGroup] - ownerFreq[a.ownerGroup]) ||
    (a.combatPower - b.combatPower);
  const sortedSups = [...sups].sort(prio);
  const sortedDlrs = [...dlrs].sort(prio);

  // mode: "fill" = 가장 꽉 찬 파티부터 채움(풀파티 우선), "spread" = 가장 빈 파티부터(전원 편성 보조)
  const tryPack = (n, mode) => {
    const parties = Array.from({ length: n }, () => ({
      members: [], owners: new Set(), classes: new Set(), sup: 0, dlr: 0,
    }));

    const place = (c, isSup) => {
      const fit = parties.filter(p =>
        p.members.length < type &&
        (isSup ? p.sup < maxSup : p.dlr < maxDlr) &&
        !p.owners.has(c.ownerGroup) &&
        !p.classes.has(c.className)
      );
      if (fit.length === 0) return false;
      fit.sort((a, b) => mode === "fill"
        ? b.members.length - a.members.length
        : a.members.length - b.members.length);
      const p = fit[0];
      p.members.push(c);
      p.owners.add(c.ownerGroup);
      p.classes.add(c.className);
      if (isSup) p.sup++; else p.dlr++;
      return true;
    };

    const rest = [];
    for (const c of sortedSups) if (!place(c, true)) rest.push(c);
    for (const c of sortedDlrs) if (!place(c, false)) rest.push(c);

    const good = [];
    for (const p of parties) {
      if (p.members.length >= 2) good.push(p.members);
      else rest.push(...p.members);
    }
    good.sort((a, b) => b.length - a.length); // 가장 꽉 찬 파티가 1번
    return {
      parties: good,
      leftovers: rest,
      placed: all.length - rest.length,
      sizes: good.map(g => g.length), // 내림차순
    };
  };

  const pcap = Math.max(1, Math.floor(all.length / 2));
  let best = null;
  // 파티 인원을 큰 순서로 나열해 앞에서부터 비교 (첫 파티가 더 꽉 찬 쪽이 이김)
  const cmpSizes = (a, b) => {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const d = (a[i] || 0) - (b[i] || 0);
      if (d !== 0) return d;
    }
    return 0;
  };
  const better = (r) => {
    if (!best) return true;
    const c = cmpSizes(r.sizes, best.sizes);
    if (c !== 0) return c > 0;                                  // 1순위: 앞 파티부터 꽉 채우기
    if (r.placed !== best.placed) return r.placed > best.placed; // 2순위: 남는 사람 최소화
    return r.parties.length < best.parties.length;
  };

  for (let n = 1; n <= pcap; n++) {
    for (const mode of ["fill", "spread"]) {
      const r = tryPack(n, mode);
      if (better(r)) best = r;
    }
  }
  return best || { parties: [], leftovers: [...all] };
};

// 같은 레이드에 파티가 여러 개면 파티끼리 평균 전투력이 비슷해지도록
// 같은 역할(서포터↔서포터, 딜러↔딜러)끼리 파티 간 맞교환을 반복한다.
// 맞교환이라 파티 인원·서폿/딜러 수는 그대로이고, 직업·원정대(부계정 포함) 중복 금지도 지킨다.
export const balanceRaidParties = (parties) => {
  if (parties.length < 2) return parties;
  const ps = parties.map(p => [...p]);
  const avg = (p) => p.reduce((s, c) => s + (c.combatPower || 0), 0) / p.length;
  const cost = () => {
    const a = ps.map(avg);
    const mean = a.reduce((s, x) => s + x, 0) / a.length;
    return a.reduce((s, x) => s + (x - mean) ** 2, 0);
  };
  const isSup = (c) => c.role === "서포터";
  const canJoin = (party, c, leaving) =>
    party.every(m => m === leaving || (m.className !== c.className && m.ownerGroup !== c.ownerGroup));

  let cur = cost();
  for (let iter = 0; iter < 300; iter++) {
    let best = null;
    for (let i = 0; i < ps.length; i++) {
      for (let j = i + 1; j < ps.length; j++) {
        for (let x = 0; x < ps[i].length; x++) {
          for (let y = 0; y < ps[j].length; y++) {
            const a = ps[i][x], b = ps[j][y];
            if (isSup(a) !== isSup(b)) continue;
            if (!canJoin(ps[j], a, b) || !canJoin(ps[i], b, a)) continue;
            ps[i][x] = b; ps[j][y] = a;
            const c = cost();
            ps[i][x] = a; ps[j][y] = b;
            if (c < cur - 1e-6 && (!best || c < best.c)) best = { i, j, x, y, c };
          }
        }
      }
    }
    if (!best) break;
    const t = ps[best.i][best.x];
    ps[best.i][best.x] = ps[best.j][best.y];
    ps[best.j][best.y] = t;
    cur = best.c;
  }
  return ps;
};

export const balanceEightManParty = (members) => {
  const sorted = [...members].sort((a, b) => b.combatPower - a.combatPower);
  const g1 = [];
  const g2 = [];

  for (const m of sorted) {
    const g1Total = g1.reduce((sum, x) => sum + x.combatPower, 0);
    const g2Total = g2.reduce((sum, x) => sum + x.combatPower, 0);
    
    const isDlr = m.role === "딜러";
    const g1DlrCount = g1.filter(x => x.role === "딜러").length;
    const g1SupCount = g1.length - g1DlrCount;
    const g2DlrCount = g2.filter(x => x.role === "딜러").length;
    const g2SupCount = g2.length - g2DlrCount;

    const canGoG1 = g1.length < 4 && (isDlr ? g1DlrCount < 3 : g1SupCount < 1);
    const canGoG2 = g2.length < 4 && (isDlr ? g2DlrCount < 3 : g2SupCount < 1);

    if (canGoG1 && canGoG2) {
      if (g1Total <= g2Total) {
        g1.push(m);
      } else {
        g2.push(m);
      }
    } else if (canGoG1) {
      g1.push(m);
    } else if (canGoG2) {
      g2.push(m);
    }
  }

  return { g1, g2, members: [...g1, ...g2] };
};

// 화면 · 파티 번호 정렬용: 4인 레이드 → 8인 레이드 (싱글/미편성은 type 이 "single" 이라 원래 레이드 목록에서 찾는다)
export const typeRank = (p, raidList) => {
  let t = p && p.type;
  if (t !== 4 && t !== 8 && raidList) {
    const r = raidList.find(x => x.id === p.originalRaidId);
    t = r && r.type;
  }
  return t === 4 ? 0 : 1;
};

// 원정대 목록과 레이드 목록으로 전체 파티 편성을 만든다.
// rootOwner(owner): 부계정이면 본계정 이름 (같은 사람은 한 파티에 넣지 않기 위해)
export const buildParties = (memberList, raidList, rootOwner) => {
  const sortedRaids = [...raidList].sort((a, b) => b.minLevel - a.minLevel);
  const charCategoryTracker = {};
  const allChars = [];

  memberList.forEach(m => {
    m.characters.forEach(c => {
      if (!c.isExcluded) {
        allChars.push({ ...c, owner: m.owner, ownerGroup: rootOwner(m.owner) });
        const key = c.charName + m.owner;
        if (!charCategoryTracker[key]) {
          charCategoryTracker[key] = new Set();
        }
      }
    });
  });

  const matchResults = [];

  sortedRaids.forEach((raid) => {
    const eligibleSupports = [];
    const eligibleDealers = [];

    allChars.forEach(c => {
      const key = c.charName + c.owner;
      const trackerSet = charCategoryTracker[key] || new Set();
      const allowed = c.allowedRaids || raidList.filter(r => c.level >= r.minLevel).map(r => r.id);

      if (allowed.includes(raid.id) && !trackerSet.has(raid.category)) {
        if (c.role === "서포터") eligibleSupports.push(c);
        else eligibleDealers.push(c);
      }
    });

    // 직업/원정대 중복 없이, 최대한 많은 캐릭터를 파티에 채워 넣는다.
    const packed = packRaid(eligibleSupports, eligibleDealers, raid.type);
    const assignedParties = balanceRaidParties(packed.parties);
    const leftovers = packed.leftovers;

    const raidParties = [];
    assignedParties.forEach((party, idx) => {
      party.forEach(m => {
        const key = m.charName + m.owner;
        if (!charCategoryTracker[key]) charCategoryTracker[key] = new Set();
        charCategoryTracker[key].add(raid.category);
      });
      
      let finalizedMembers = party;
      let g1 = [];
      let g2 = [];
      
      if (raid.type === 8) {
        const balanced = balanceEightManParty(party);
        finalizedMembers = balanced.members;
        g1 = balanced.g1;
        g2 = balanced.g2;
      }
      
      raidParties.push({
        id: `${raid.id}-${idx + 1}`,
        originalRaidId: raid.id,
        raidName: assignedParties.length === 1 ? raid.name : `${raid.name} #${idx + 1}`,
        baseRaidName: raid.name,
        category: raid.category,
        type: raid.type,
        minLevel: raid.minLevel,
        members: finalizedMembers,
        g1: g1,
        g2: g2
      });
    });

    if (leftovers.length > 0) {
      leftovers.forEach(m => {
        const key = m.charName + m.owner;
        if (!charCategoryTracker[key]) charCategoryTracker[key] = new Set();
        charCategoryTracker[key].add(raid.category);
      });
      raidParties.push({
        id: `${raid.id}-single`,
        originalRaidId: raid.id,
        raidName: `${raid.name} (싱글 / 미편성)`,
        baseRaidName: raid.name,
        category: raid.category,
        type: "single",
        minLevel: raid.minLevel,
        members: leftovers,
        g1: [],
        g2: []
      });
    }
    
    matchResults.push(...raidParties);
  });

  matchResults.sort((a, b) => {
    const aIsSingle = a.raidName.includes("싱글 / 미편성") || a.type === "single";
    const bIsSingle = b.raidName.includes("싱글 / 미편성") || b.type === "single";
    
    if (aIsSingle && !bIsSingle) return 1;
    if (!aIsSingle && bIsSingle) return -1;

    // 4인 레이드가 8인 레이드보다 위 (파티 번호도 4인부터)
    const typeDiff = typeRank(a, raidList) - typeRank(b, raidList);
    if (typeDiff !== 0) return typeDiff;

    if (a.originalRaidId !== b.originalRaidId) return a.originalRaidId - b.originalRaidId;
    return a.id.localeCompare(b.id);
  });

  let partyIndex = 1;
  matchResults.forEach((p) => {
    if (!p.raidName.includes("싱글 / 미편성") && p.type !== "single") p.partyNum = partyIndex++;
  });

  return matchResults;
};

// 수동 편집: 선택한 캐릭터(from)를 다른 캐릭터와 맞바꾸거나 빈 자리(to)로 옮긴 새 파티 목록.
// 바꿀 수 없으면 null. 같은 사람(부계정 포함) 중복이면 confirmClash() 가 true 일 때만 진행.
export const movePartySlot = (parties, from, to, rootOwner, confirmClash) => {
  const next = parties.map(p => ({
    ...p,
    members: [...(p.members || [])],
    g1: [...(p.g1 || [])],
    g2: [...(p.g2 || [])],
  }));

  const fromParty = next.find(p => p.id === from.partyId);
  const toParty = next.find(p => p.id === to.partyId);
  if (!fromParty || !toParty) return null;

  // 같은 사람(부계정 포함)이 한 파티에 중복 편성되는지 확인
  if (fromParty.id !== toParty.id && toParty.type !== "single") {
    const movingRoot = rootOwner(from.owner);
    const clash = (toParty.members || []).some(m =>
      !(to.member && m.owner === to.member.owner && m.charName === to.member.charName) &&
      rootOwner(m.owner) === movingRoot
    );
    if (clash && !confirmClash()) return null;
  }

  const pull = (party, group, owner, charName) => {
    const arr = party[group];
    const i = arr.findIndex(m => m.owner === owner && m.charName === charName);
    if (i === -1) return null;
    const [c] = arr.splice(i, 1);
    if (group !== "members") {
      const mi = party.members.findIndex(m => m.owner === owner && m.charName === charName);
      if (mi !== -1) party.members.splice(mi, 1);
    }
    return c;
  };

  const push = (party, group, c) => {
    party[group].push(c);
    if (group !== "members" && !party.members.some(m => m.owner === c.owner && m.charName === c.charName)) {
      party.members.push(c);
    }
  };

  const moving = pull(fromParty, from.group, from.owner, from.charName);
  if (!moving) return null;

  if (to.member) {
    // 두 캐릭터 자리 교체
    const target = pull(toParty, to.group, to.member.owner, to.member.charName);
    if (!target) {
      push(fromParty, from.group, moving);
      return null;
    }
    push(toParty, to.group, moving);
    push(fromParty, from.group, target);
  } else {
    // 빈 자리로 이동 (정원 초과 방지)
    const cap = toParty.type === 8 || toParty.type === 4 ? 4 : Infinity;
    if (toParty[to.group].length >= cap) {
      push(fromParty, from.group, moving);
      return null;
    }
    push(toParty, to.group, moving);
  }

  next.forEach(p => {
    if (p.type === 8) p.members = [...p.g1, ...p.g2];
  });

  // 인원이 0명이 된 싱글/미편성 파티는 정리
  return next.filter(p => !(p.type === "single" && p.members.length === 0));
};
