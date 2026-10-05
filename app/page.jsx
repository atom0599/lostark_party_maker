// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from "react";

const NAV = [["home", "홈"], ["roster", "원정대"], ["parties", "파티 편성"]];
const BG_SEQ = ["/raid_5.jpg", "/raid_1.jpg", "/raid_4.jpg", "/raid_2.jpg", "/raid_3.jpg"];
const HYBRID_CLASSES = ["바드", "홀리나이트", "도화가", "발키리"];
const DLR_COLOR = "#FF4B57";
const SUP_COLOR = "#2FD3B7";
const SUB_COLOR = "#B478FF";
const fmtDate = (t) => {
  const d = new Date(t);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
};

const RAID_LIST = [
  { id: 1, category: "벨가르딘", name: "벨가르딘 노말", type: 8, minLevel: 1750, reqSup: 2, reqDlr: 6 },
  { id: 2, category: "벨가르딘", name: "벨가르딘 하드", type: 8, minLevel: 1770, reqSup: 2, reqDlr: 6 },
  { id: 3, category: "벨가르딘", name: "벨가르딘 나이트메어", type: 8, minLevel: 1780, reqSup: 2, reqDlr: 6 },
  { id: 4, category: "지평", name: "지평의 성당 1단계", type: 4, minLevel: 1700, reqSup: 1, reqDlr: 3 },
  { id: 5, category: "지평", name: "지평의 성당 2단계", type: 4, minLevel: 1720, reqSup: 1, reqDlr: 3 },
  { id: 6, category: "지평", name: "지평의 성당 3단계", type: 4, minLevel: 1750, reqSup: 1, reqDlr: 3 },
  { id: 7, category: "세르카", name: "세르카 노말", type: 4, minLevel: 1710, reqSup: 1, reqDlr: 3 },
  { id: 8, category: "세르카", name: "세르카 하드", type: 4, minLevel: 1730, reqSup: 1, reqDlr: 3 },
  { id: 9, category: "세르카", name: "세르카 나이트메어", type: 4, minLevel: 1740, reqSup: 1, reqDlr: 3 },
  { id: 10, category: "4막", name: "4막 노말", type: 8, minLevel: 1700, reqSup: 2, reqDlr: 6 },
  { id: 11, category: "4막", name: "4막 하드", type: 8, minLevel: 1720, reqSup: 2, reqDlr: 6 },
  { id: 12, category: "종막", name: "종막 노말", type: 8, minLevel: 1710, reqSup: 2, reqDlr: 6 },
  { id: 13, category: "종막", name: "종막 하드", type: 8, minLevel: 1730, reqSup: 2, reqDlr: 6 },
];
const RAID_CATEGORIES = [...new Set(RAID_LIST.map(r => r.category))];

const CLASS_ICONS = {
  "버서커": "/icons/Berserker.svg",
  "워로드": "/icons/Warlord.svg",
  "디스트로이어": "/icons/Destroyer.svg",
  "홀리나이트": "/icons/Holyknight.svg",
  "슬레이어": "/icons/Slayer.svg",
  "배틀마스터": "/icons/Battlemaster.svg",
  "인파이터": "/icons/Infighter.svg",
  "기공사": "/icons/Soulmaster.svg",
  "창술사": "/icons/Lancemaster.svg",
  "스트라이커": "/icons/Striker.svg",
  "브레이커": "/icons/Breaker.svg",
  "데빌헌터": "/icons/Devilhunter.svg",
  "블래스터": "/icons/Blaster.svg",
  "호크아이": "/icons/Hawkeye.svg",
  "스카우터": "/icons/Scouter.svg",
  "건슬링어": "/icons/Gunslinger.svg",
  "바드": "/icons/Bard.svg",
  "서머너": "/icons/Summoner.svg",
  "아르카나": "/icons/Arcana.svg",
  "소서리스": "/icons/Elementalmaster.svg",
  "블레이드": "/icons/Blade.svg",
  "데모닉": "/icons/Demonic.svg",
  "리퍼": "/icons/Reaper.svg",
  "소울이터": "/icons/Souleater.svg",
  "도화가": "/icons/Artist.svg",
  "기상술사": "/icons/Aeromancer.svg",
  "환수사": "/icons/Wildsoul.svg",
  "차원술사": "/icons/dimension_master.svg",
  "발키리": "/icons/Valkyrie.svg",
  "가디언나이트": "/icons/Dragon_knight.svg",
  // 뿌리 클래스(기본 직업) 매핑
  "전사": "/icons/warrior.svg",
  "전사(여)": "/icons/warrior_female.svg",
  "무도가": "/icons/fighter.svg",
  "무도가(남)": "/icons/fighter_male.svg",
  "헌터": "/icons/hunter.svg",
  "건너(여)": "/icons/hunter_female.svg",
  "마법사": "/icons/magician.svg",
  "암살자": "/icons/assassin.svg",
  "스페셜리스트": "/icons/specialist.svg"
};

export default function Home() {
  const [searchName, setSearchName] = useState("");
  const [memberList, setMemberList] = useState([]);
  const [partyResult, setPartyResult] = useState([]);
  const [loading, setLoading] = useState(false);

  const [viewMode, setViewMode] = useState("all");
  const [filterTarget, setFilterTarget] = useState("");
  const [sortMode, setSortMode] = useState("default");

  const [selectedCharForConfig, setSelectedCharForConfig] = useState(null);
  const [isTableView, setIsTableView] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [swapTarget, setSwapTarget] = useState(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  useEffect(() => {
    const savedMembers = localStorage.getItem("loa_members");
    const savedResult = localStorage.getItem("loa_party_result");
    if (savedMembers) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      try { setMemberList(JSON.parse(savedMembers)); } catch {}
    }
    if (savedResult) {
      try { setPartyResult(JSON.parse(savedResult)); } catch {}
    }
  }, []);

  const saveToLocalStorage = (newMembers, newResult) => {
    setMemberList(newMembers);
    setPartyResult(newResult);
    localStorage.setItem("loa_members", JSON.stringify(newMembers));
    localStorage.setItem("loa_party_result", JSON.stringify(newResult));
  };

  // 부계정으로 연결된 원정대는 같은 사람으로 취급 -> 최상위(본계정) 소유자명을 반환
  const rootOwner = (owner) => {
    let cur = owner;
    const seen = new Set([owner]);
    while (true) {
      const m = memberList.find(x => x.owner === cur);
      const main = m && m.mainAccount;
      if (!main || main === cur || seen.has(main)) return cur;
      seen.add(main);
      cur = main;
    }
  };

  // 원정대(부계정)의 본계정 지정 / 해제
  const handleSetMainAccount = (ownerName, mainOwnerName) => {
    const updated = memberList.map(m =>
      m.owner === ownerName ? { ...m, mainAccount: mainOwnerName || null } : m
    );
    saveToLocalStorage(updated, partyResult);
  };

  const handleSearchCharacter = async (e) => {
    e.preventDefault();
    if (!searchName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/character?name=${encodeURIComponent(searchName)}`);
      const data = await res.json();

      if (res.ok && Array.isArray(data)) {
        const categories = [...new Set(RAID_LIST.map(r => r.category))];
        
        const newMember = {
          owner: searchName,
          characters: data.map(char => {
            const defaultAllowed = categories.map(cat => {
              const raidsInCat = RAID_LIST.filter(r => r.category === cat && char.ItemLevel >= r.minLevel);
              if (raidsInCat.length === 0) return null;
              const highest = raidsInCat.reduce((max, r) => r.minLevel > max.minLevel ? r : max, raidsInCat[0]);
              return highest.id;
            }).filter(Boolean);

            return {
              charName: char.CharacterName,
              className: char.CharacterClassName,
              level: char.ItemLevel,
              combatPower: char.CombatPower,
              characterImage: char.CharacterImage,
              role: ["바드", "홀리나이트", "도화가", "발키리"].includes(char.CharacterClassName) ? "서포터" : "딜러",
              isExcluded: false,
              allowedRaids: defaultAllowed
            };
          })
        };
        saveToLocalStorage([...memberList, newMember], partyResult);
        setSearchName("");
      } else {
        alert(data.error || "캐릭터를 조회할 수 없습니다.");
      }
    } catch {
      alert("통신 중 에러가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = (ownerName) => {
    saveToLocalStorage(memberList.filter(m => m.owner !== ownerName), []);
  };

  const handleRefreshMember = async (ownerName) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/character?name=${encodeURIComponent(ownerName)}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        const categories = [...new Set(RAID_LIST.map(r => r.category))];
        const updatedMembers = memberList.map(m => {
          if (m.owner === ownerName) {
            const newChars = data.map(char => {
              const existingChar = m.characters.find(c => c.charName === char.CharacterName);
              const defaultAllowed = categories.map(cat => {
                const raidsInCat = RAID_LIST.filter(r => r.category === cat && char.ItemLevel >= r.minLevel);
                if (raidsInCat.length === 0) return null;
                const highest = raidsInCat.reduce((max, r) => r.minLevel > max.minLevel ? r : max, raidsInCat[0]);
                return highest.id;
              }).filter(Boolean);

              return {
                charName: char.CharacterName,
                className: char.CharacterClassName,
                level: char.ItemLevel,
                combatPower: char.CombatPower,
                characterImage: char.CharacterImage,
                role: existingChar ? existingChar.role : (["바드", "홀리나이트", "도화가", "발키리"].includes(char.CharacterClassName) ? "서포터" : "딜러"),
                isExcluded: existingChar ? existingChar.isExcluded : false,
                allowedRaids: existingChar ? existingChar.allowedRaids : defaultAllowed
              };
            });
            return { ...m, characters: newChars };
          }
          return m;
        });
        saveToLocalStorage(updatedMembers, partyResult);
      } else {
        alert("원정대 갱신에 실패했습니다.");
      }
    } catch {
      alert("원정대 갱신 중 에러가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExclude = (ownerName, charName) => {
    const updatedMembers = memberList.map(m => {
      if (m.owner === ownerName) {
        return {
          ...m,
          characters: m.characters.map(c => 
            c.charName === charName ? { ...c, isExcluded: !c.isExcluded } : c
          )
        };
      }
      return m;
    });
    setMemberList(updatedMembers);
    localStorage.setItem("loa_members", JSON.stringify(updatedMembers));
  };

  const handleToggleRole = (ownerName, charName) => {
    const updatedMembers = memberList.map(m => {
      if (m.owner === ownerName) {
        return {
          ...m,
          characters: m.characters.map(c => {
            if (c.charName === charName && ["바드", "홀리나이트", "도화가", "발키리"].includes(c.className)) {
              return { ...c, role: c.role === "서포터" ? "딜러" : "서포터" };
            }
            return c;
          })
        };
      }
      return m;
    });
    saveToLocalStorage(updatedMembers, partyResult);
  };

  const handleToggleCharRaid = (ownerName, charName, raidId) => {
    const targetRaid = RAID_LIST.find(r => r.id === raidId);
    const updatedMembers = memberList.map(m => {
      if (m.owner === ownerName) {
        return {
          ...m,
          characters: m.characters.map(c => {
            if (c.charName === charName) {
              const currentAllowed = c.allowedRaids || RAID_LIST.filter(r => c.level >= r.minLevel).map(r => r.id);
              let newAllowed;
              if (currentAllowed.includes(raidId)) {
                newAllowed = currentAllowed.filter(id => id !== raidId);
              } else {
                newAllowed = currentAllowed.filter(id => {
                  const existingRaid = RAID_LIST.find(r => r.id === id);
                  return existingRaid && existingRaid.category !== targetRaid.category;
                });
                newAllowed.push(raidId);
              }
              return { ...c, allowedRaids: newAllowed };
            }
            return c;
          })
        };
      }
      return m;
    });
    setMemberList(updatedMembers);
    localStorage.setItem("loa_members", JSON.stringify(updatedMembers));
    
    if (selectedCharForConfig && selectedCharForConfig.char.charName === charName) {
      const targetChar = updatedMembers.find(m => m.owner === ownerName)?.characters.find(c => c.charName === charName);
      if (targetChar) setSelectedCharForConfig({ owner: ownerName, char: targetChar });
    }
  };

  // 직업/원정대(부계정) 중복 없이 최대한 많은 캐릭터를 편성하되,
  // 앞 파티부터 꽉 채우도록(풀파티 우선) 배치한다.
  const packRaid = (sups, dlrs, type) => {
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
      const sizes = good.map(g => g.length);
      return {
        parties: good,
        leftovers: rest,
        placed: all.length - rest.length,
        // 파티가 앞쪽부터 꽉 찼을수록 커지는 지표 (제곱합)
        fullness: sizes.reduce((s, x) => s + x * x, 0),
      };
    };

    const pcap = Math.max(1, Math.floor(all.length / 2));
    let best = null;
    const better = (r) =>
      !best ||
      r.placed > best.placed ||
      (r.placed === best.placed && r.fullness > best.fullness) ||
      (r.placed === best.placed && r.fullness === best.fullness && r.parties.length < best.parties.length);

    for (let n = 1; n <= pcap; n++) {
      for (const mode of ["fill", "spread"]) {
        const r = tryPack(n, mode);
        if (better(r)) best = r;
      }
    }
    return best || { parties: [], leftovers: [...all] };
  };

  const balanceEightManParty = (members) => {
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

  // 클리어 표시 토글: 매칭에서 빼지 않고, 완료된 파티를 시각적으로 비활성화 표시만 함
  const handlePartyClear = (party) => {
    if (party.type === "single") return;
    const newResult = partyResult.map(p =>
      p.id === party.id ? { ...p, cleared: !p.cleared } : p
    );
    saveToLocalStorage(memberList, newResult);
  };

  // 수동 편집: 선택한 캐릭터를 다른 캐릭터와 교체하거나 빈 자리로 이동
  const applyEdit = (from, to) => {
    const next = partyResult.map(p => ({
      ...p,
      members: [...(p.members || [])],
      g1: [...(p.g1 || [])],
      g2: [...(p.g2 || [])],
    }));

    const fromParty = next.find(p => p.id === from.partyId);
    const toParty = next.find(p => p.id === to.partyId);
    if (!fromParty || !toParty) return;

    // 같은 사람(부계정 포함)이 한 파티에 중복 편성되는지 확인
    if (fromParty.id !== toParty.id && toParty.type !== "single") {
      const movingRoot = rootOwner(from.owner);
      const clash = (toParty.members || []).some(m =>
        !(to.member && m.owner === to.member.owner && m.charName === to.member.charName) &&
        rootOwner(m.owner) === movingRoot
      );
      if (clash && !window.confirm("같은 사람(부계정 포함)의 캐릭터가 이미 이 파티에 있습니다. 그래도 진행할까요?")) return;
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
    if (!moving) return;

    if (to.member) {
      // 두 캐릭터 자리 교체
      const target = pull(toParty, to.group, to.member.owner, to.member.charName);
      if (!target) {
        push(fromParty, from.group, moving);
        return;
      }
      push(toParty, to.group, moving);
      push(fromParty, from.group, target);
    } else {
      // 빈 자리로 이동 (정원 초과 방지)
      const cap = toParty.type === 8 || toParty.type === 4 ? 4 : Infinity;
      if (toParty[to.group].length >= cap) {
        push(fromParty, from.group, moving);
        return;
      }
      push(toParty, to.group, moving);
    }

    next.forEach(p => {
      if (p.type === 8) p.members = [...p.g1, ...p.g2];
    });

    // 인원이 0명이 된 싱글/미편성 파티는 정리
    const cleaned = next.filter(p => !(p.type === "single" && p.members.length === 0));

    saveToLocalStorage(memberList, cleaned);
  };

  const handleSlotClick = (partyId, group, member) => {
    if (!isEditMode) return;

    if (!swapTarget) {
      if (member) setSwapTarget({ partyId, group, owner: member.owner, charName: member.charName });
      return;
    }

    // 선택한 카드를 다시 누르면 선택 해제
    if (member && swapTarget.partyId === partyId && swapTarget.owner === member.owner && swapTarget.charName === member.charName) {
      setSwapTarget(null);
      return;
    }

    applyEdit(swapTarget, { partyId, group, member });
    setSwapTarget(null);
  };
  const generateParties = () => {
    if (memberList.length === 0) return alert("공대원 원정대를 먼저 등록해주세요!");

    const sortedRaids = [...RAID_LIST].sort((a, b) => b.minLevel - a.minLevel);
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
        const allowed = c.allowedRaids || RAID_LIST.filter(r => c.level >= r.minLevel).map(r => r.id);

        if (allowed.includes(raid.id) && !trackerSet.has(raid.category)) {
          if (c.role === "서포터") eligibleSupports.push(c);
          else eligibleDealers.push(c);
        }
      });

      // 직업/원정대 중복 없이, 최대한 많은 캐릭터를 파티에 채워 넣는다.
      const packed = packRaid(eligibleSupports, eligibleDealers, raid.type);
      const assignedParties = packed.parties;
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

      if (a.originalRaidId !== b.originalRaidId) return a.originalRaidId - b.originalRaidId;
      return a.id.localeCompare(b.id);
    });

    let partyIndex = 1;
    matchResults.forEach((p) => {
      if (!p.raidName.includes("싱글 / 미편성") && p.type !== "single") p.partyNum = partyIndex++;
    });

    saveToLocalStorage(memberList, matchResults);
  };

  const getRaidIllustration = (originalRaidId) => {
    if (originalRaidId >= 1 && originalRaidId <= 3) return "/raid_5.jpg"; 
    if (originalRaidId >= 4 && originalRaidId <= 6) return "/raid_4.jpg"; 
    if (originalRaidId >= 7 && originalRaidId <= 9) return "/raid_3.jpg"; 
    if (originalRaidId >= 10 && originalRaidId <= 11) return "/raid_1.jpg"; 
    if (originalRaidId >= 12 && originalRaidId <= 13) return "/raid_2.jpg"; 
    return "/raid_1.jpg";
  };

  /* ---------- UI 전용 상태 (화면 전환 / 스플래시 / 배경) ---------- */
  const [screen, setScreen] = useState("home");
  const [splash, setSplash] = useState(true);
  const bgA = useRef(null);
  const bgB = useRef(null);
  const bgIdx = useRef(0);
  const swapping = useRef(false);

  const [today, setToday] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToday(fmtDate(Date.now()));
    const t = setTimeout(() => setSplash(false), 1500);
    return () => clearTimeout(t);
  }, []);

  /* ---------- background crossfade ---------- */
  useEffect(() => {
    const nextBg = () => {
      const i = (bgIdx.current + 1) % BG_SEQ.length;
      const src = BG_SEQ[i];
      const A = bgA.current, B = bgB.current;
      if (!A || !B || swapping.current) return;
      bgIdx.current = i;
      swapping.current = true;
      B.src = src;
      const go = () => requestAnimationFrame(() => { B.style.opacity = "1"; });
      if (B.complete) go(); else B.onload = go;
      setTimeout(() => {
        A.src = src;
        B.style.transition = "none";
        B.style.opacity = "0";
        requestAnimationFrame(() => { B.style.transition = "opacity 1.6s ease"; });
        swapping.current = false;
      }, 1900);
    };
    const t = setInterval(nextBg, 8000);
    return () => clearInterval(t);
  }, []);

  const isSingleParty = (party) => party.raidName.includes("싱글 / 미편성") || party.type === "single";
  const partyCP = (party) => (party.members || []).reduce((sum, m) => sum + (m.combatPower || 0), 0);

  const displayedParties = partyResult.filter(party => {
    if (viewMode === "all") return true;
    if (viewMode === "raid") {
      if (!filterTarget) return true;
      return party.baseRaidName === filterTarget || party.raidName.includes(filterTarget);
    }
    if (viewMode === "owner") {
      if (!filterTarget) return true;
      const allPartyMembers = [...(party.members || []), ...(party.g1 || []), ...(party.g2 || [])];
      return allPartyMembers.some(m => m.owner === filterTarget);
    }
    if (viewMode === "single") {
      return isSingleParty(party);
    }
    return true;
  }).map((party, i) => ({ party, i }))
    .sort((a, b) => {
      // 싱글/미편성은 항상 정상 편성된 파티보다 아래로
      const aSingle = isSingleParty(a.party);
      const bSingle = isSingleParty(b.party);
      if (aSingle !== bSingle) return aSingle ? 1 : -1;

      // 클리어 완료된 파티는 그 다음으로 아래로
      const aCleared = !!a.party.cleared;
      const bCleared = !!b.party.cleared;
      if (aCleared !== bCleared) return aCleared ? 1 : -1;

      switch (sortMode) {
        case "members": {
          const diff = (b.party.members?.length || 0) - (a.party.members?.length || 0);
          if (diff !== 0) return diff;
          break;
        }
        case "cp": {
          const diff = partyCP(b.party) - partyCP(a.party);
          if (diff !== 0) return diff;
          break;
        }
        case "name": {
          const diff = a.party.raidName.localeCompare(b.party.raidName, "ko");
          if (diff !== 0) return diff;
          break;
        }
        default:
          break;
      }
      return a.i - b.i;
    })
    .map(({ party }) => party);

  /* ---------- 요약 수치 ---------- */
  const totalChars = memberList.reduce((s, m) => s + m.characters.length, 0);
  const activeChars = memberList.reduce((s, m) => s + m.characters.filter(c => !c.isExcluded).length, 0);
  const formedParties = partyResult.filter(p => !isSingleParty(p));
  const clearedCount = formedParties.filter(p => p.cleared).length;
  const unassignedCount = partyResult.filter(isSingleParty).reduce((s, p) => s + (p.members || []).length, 0);
  const clearRate = formedParties.length ? Math.round((clearedCount / formedParties.length) * 100) : 0;
  const raidProgress = RAID_LIST.map(raid => {
    const ps = partyResult.filter(p => p.originalRaidId === raid.id);
    const formed = ps.filter(p => !isSingleParty(p));
    return {
      raid,
      formed: formed.length,
      cleared: formed.filter(p => p.cleared).length,
      singles: ps.filter(isSingleParty).reduce((s, p) => s + (p.members || []).length, 0),
    };
  }).filter(r => r.formed > 0 || r.singles > 0);

  /* ---------- style helpers ---------- */
  const pill = (active, accent = "#FF4B57") => ({
    borderRadius: 999, padding: "9px 15px", fontSize: 13, fontWeight: active ? 700 : 500, cursor: "pointer",
    whiteSpace: "nowrap", border: `1px solid ${active ? accent : "#262C34"}`,
    background: active ? accent : "transparent", color: active ? "#0B0D10" : "#A8B0B9"
  });
  const card = { background: "#14181D", border: "1px solid #262C34", borderRadius: 18, padding: 18 };
  const glass = { background: "rgba(16,20,25,.72)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 22, padding: 18, boxShadow: "0 20px 50px rgba(0,0,0,.4)" };
  const h1 = { fontFamily: "'Archivo'", fontWeight: 800, fontSize: "clamp(26px,5vw,34px)" };
  const sub = { fontSize: 13, color: "#8B949E", marginTop: 4 };
  const input = { background: "#0F1318", border: "1px solid #2C333C", borderRadius: 10, padding: "11px 13px", color: "#E8EAEC", fontSize: 13 };
  const selectStyle = { ...input, padding: "8px 10px", fontSize: 12, cursor: "pointer" };
  const btnPrimary = { background: "#FF4B57", color: "#0B0D10", border: "none", borderRadius: 12, padding: "12px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" };
  const btnGhost = { background: "#1B2027", color: "#E8EAEC", border: "1px solid #333B45", borderRadius: 12, padding: "12px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" };
  const btnSmall = { background: "#252C34", color: "#C8D0D8", border: "1px solid #333B45", borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" };
  const mono = "'IBM Plex Mono'";
  const fadeUp = "fadeUp .45s cubic-bezier(.2,.7,.3,1) both";

  const roleBadge = (member, ownerName, stop) => {
    const isHybrid = HYBRID_CLASSES.includes(member.className);
    const isSup = isHybrid && member.role === "서포터";
    const color = isSup ? SUP_COLOR : DLR_COLOR;
    const style = {
      display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, color,
      background: `${color}1A`, border: `1px solid ${color}55`, borderRadius: 999, padding: "3px 9px", whiteSpace: "nowrap", flex: "none"
    };
    if (!isHybrid) return <span style={style}>딜러</span>;
    return (
      <button
        type="button"
        title="클릭하여 딜러/서포터 전환"
        onClick={(e) => { if (stop) e.stopPropagation(); handleToggleRole(ownerName, member.charName); }}
        style={{ ...style, cursor: "pointer" }}
      >
        {isSup ? "서포터" : "딜러"} <span style={{ opacity: .7 }}>⇄</span>
      </button>
    );
  };

  const classLine = (member, color = "#8B949E") => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
      {CLASS_ICONS[member.className] && (
        <img src={CLASS_ICONS[member.className]} alt={member.className} style={{ width: 13, height: 13, opacity: .9, flex: "none" }} />
      )}
      {member.className}
    </span>
  );

  const charArt = (member, bg) => member.characterImage && (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", display: "flex", justifyContent: "flex-end" }}>
      <img src={member.characterImage} alt="" style={{ height: "125%", width: "auto", maxWidth: "none", objectFit: "cover", objectPosition: "top", opacity: .55, transform: "translate(14px,-8px)" }} />
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, ${bg} 0%, ${bg}E0 42%, ${bg}00 100%)` }} />
    </div>
  );

  const statLine = (member, lvColor = "#C8F24C") => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: mono, fontSize: 11 }}>
      <span style={{ color: lvColor, fontWeight: 600 }}>Lv.{member.level}</span>
      <span style={{ color: "#A8B0B9" }}>CP {member.combatPower.toLocaleString()}</span>
    </div>
  );

  const renderManageCard = (member, ownerName) => {
    const bg = "#1B2027";
    return (
      <div data-row="1" style={{
        position: "relative", overflow: "hidden", background: bg, border: `1px solid ${member.isExcluded ? "rgba(225,66,79,.25)" : "#262C34"}`,
        borderRadius: 12, padding: "10px 12px", minHeight: 104, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 6,
        opacity: member.isExcluded ? .42 : 1
      }}>
        {charArt(member, bg)}
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={!member.isExcluded}
            onChange={() => handleToggleExclude(ownerName, member.charName)}
            title="체크 해제 시 파티 매칭에서 제외"
            style={{ width: 15, height: 15, accentColor: "#C8F24C", cursor: "pointer", flex: "none" }}
          />
          <button
            type="button"
            onClick={() => setSelectedCharForConfig({ owner: ownerName, char: member })}
            title="이 캐릭터의 레이드 클리어 여부 및 매칭 설정"
            style={btnSmall}
          >
            ⚙ 클리어 체크
          </button>
          {roleBadge(member, ownerName, false)}
        </div>
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textDecoration: member.isExcluded ? "line-through" : "none", color: member.isExcluded ? "#6B737C" : "#E8EAEC" }}>
            {member.charName}
          </span>
          {classLine(member)}
        </div>
        <div style={{ position: "relative" }}>{statLine(member)}</div>
      </div>
    );
  };

  const renderMemberCard = (member, isSingle, slot) => {
    const isTargetOwner = viewMode === "owner" && filterTarget && member.owner === filterTarget;
    const editable = isEditMode && !!slot;
    const isSelected = editable && swapTarget && swapTarget.partyId === slot.partyId
      && swapTarget.owner === member.owner && swapTarget.charName === member.charName;
    const dimmed = viewMode === "owner" && !isTargetOwner;
    const bg = isSelected ? "#232A21" : isTargetOwner ? "#262318" : "#1B2027";
    const border = isSelected ? "#C8F24C" : isTargetOwner ? "#E5C04C" : isSingle ? "#333B45" : "#262C34";

    return (
      <div
        data-row={editable ? "1" : undefined}
        onClick={editable ? () => handleSlotClick(slot.partyId, slot.group, member) : undefined}
        style={{
          position: "relative", overflow: "hidden", background: bg, borderRadius: 12, padding: "10px 12px", minHeight: 104,
          border: `1px ${isSingle && !isSelected && !isTargetOwner ? "dashed" : "solid"} ${border}`,
          boxShadow: isSelected ? "0 0 0 1px #C8F24C, 0 0 22px rgba(200,242,76,.25)" : isTargetOwner ? "0 0 18px rgba(229,192,76,.18)" : "none",
          display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 6,
          cursor: editable ? "pointer" : "default", opacity: dimmed ? .35 : 1, transition: "opacity .2s ease, border-color .2s ease"
        }}
      >
        {charArt(member, bg)}
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
          {roleBadge(member, member.owner, true)}
          {isSelected && <span style={{ fontFamily: mono, fontSize: 10, color: "#C8F24C", letterSpacing: ".08em" }}>SELECTED</span>}
        </div>
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: isTargetOwner ? "#F2D98A" : "#E8EAEC" }}>{member.charName}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, fontSize: 11, color: isTargetOwner ? "#E5C04C" : "#8B949E" }}>
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: "0 1 auto" }}>{member.owner}</span>
            <span style={{ color: "#4A525C" }}>·</span>
            {classLine(member, isTargetOwner ? "#E5C04C" : "#8B949E")}
          </span>
        </div>
        <div style={{ position: "relative" }}>{statLine(member, isTargetOwner ? "#E5C04C" : isSingle ? "#B9A4FF" : "#C8F24C")}</div>
      </div>
    );
  };

  const renderEmptySlot = (slot) => {
    const active = isEditMode && !!swapTarget;
    return (
      <div
        data-row={active ? "1" : undefined}
        onClick={active ? () => handleSlotClick(slot.partyId, slot.group, null) : undefined}
        style={{
          minHeight: 104, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
          border: `1px dashed ${active ? "rgba(200,242,76,.6)" : "#262C34"}`,
          background: active ? "rgba(200,242,76,.06)" : "rgba(15,19,24,.5)",
          color: active ? "#C8F24C" : "#4A525C", fontFamily: mono, fontSize: 11, letterSpacing: ".08em",
          cursor: active ? "pointer" : "default", fontWeight: active ? 600 : 400
        }}
      >
        {active ? "여기로 이동 ↓" : "EMPTY"}
      </div>
    );
  };

  const slotGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 8 };

  const renderGroup = (party, key, label, color) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
        <span style={{ fontSize: 12, fontWeight: 700 }}>{label}</span>
        <span style={{ fontFamily: mono, fontSize: 10, color: "#6B737C" }}>서포터 1 / 딜러 3</span>
      </div>
      <div style={slotGrid}>
        {(party[key] || []).map((m, idx) => <div key={`${key}-${idx}`}>{renderMemberCard(m, false, { partyId: party.id, group: key })}</div>)}
        {Array.from({ length: Math.max(0, 4 - (party[key] || []).length) }).map((_, eIdx) => (
          <div key={`empty-${key}-${eIdx}`}>{renderEmptySlot({ partyId: party.id, group: key })}</div>
        ))}
      </div>
    </div>
  );

  const generateBtn = (style) => (
    <button onClick={generateParties} style={style}>⚡ 최적 파티 자동 조합</button>
  );

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "#0B0D10", color: "#E8EAEC", overflow: "hidden" }}>
      {/* splash */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 90, display: "flex", alignItems: "center", justifyContent: "center",
        background: "#0B0D10", opacity: splash ? 1 : 0, pointerEvents: splash ? "auto" : "none",
        transition: "opacity .7s ease", overflow: "hidden"
      }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(900px 500px at 50% 38%, #1A2027 0%, #0B0D10 70%)" }} />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
          <div style={{ width: 66, height: 66, borderRadius: 18, overflow: "hidden", animation: "popIn .6s cubic-bezier(.2,.7,.3,1) both, glowPulse 2.4s ease-in-out infinite .6s" }}>
            <img src="/icon.png" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ fontFamily: "'Archivo'", fontWeight: 800, fontSize: "clamp(24px,7vw,38px)", textAlign: "center", letterSpacing: "-.01em", animation: "revealMask .9s cubic-bezier(.2,.7,.3,1) both .15s" }}>PARTY MAKER</div>
          <div style={{ width: 220, height: 3, borderRadius: 999, background: "rgba(255,255,255,.12)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: "100%", transformOrigin: "left", background: "linear-gradient(90deg,#FF4B57,#C8F24C)", animation: "growBar 1.3s cubic-bezier(.4,0,.2,1) both" }} />
          </div>
          <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: ".2em", color: "#8B949E", animation: "fadeUp .6s ease both .5s" }}>LOADING RAID ROSTER</div>
        </div>
        <div style={{ position: "absolute", bottom: 28, fontFamily: mono, fontSize: 11, letterSpacing: ".16em", color: "#5A626C" }}>MADE BY 이현</div>
      </div>

      {/* guide modal */}
      {isGuideOpen && (
        <div onClick={() => setIsGuideOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 96, background: "rgba(5,7,9,.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "min(560px,100%)", background: "#14181D", border: "1px solid #2C333C", borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 16, animation: "popIn .35s cubic-bezier(.2,.7,.3,1) both" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: ".14em", color: "#FF4B57", marginBottom: 6 }}>HOW TO USE</div>
                <div style={{ fontFamily: "'Archivo'", fontWeight: 800, fontSize: 22 }}>사용 가이드</div>
              </div>
              <button onClick={() => setIsGuideOpen(false)} style={{ background: "transparent", border: "none", color: "#6B737C", fontSize: 18, cursor: "pointer", padding: "2px 6px" }}>×</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "60vh", overflowY: "auto" }}>
              {[
                ["01", "원정대 등록", <>원정대 탭 입력창에 공대원 대표 캐릭터명을 입력하고 <b>[원정대 등록]</b>을 누르면 API를 통해 모든 캐릭터 정보와 레벨, 전투력이 자동으로 불려옵니다.</>],
                ["02", "세부 설정 및 직업 전환", <>캐릭터 카드의 <b>⚙ 클리어 체크</b>를 누르면 해당 캐릭터가 갈 수 있는 레이드를 직접 커스텀할 수 있습니다. 바드·홀리나이트·도화가·발키리 같은 하이브리드 직업은 <b>딜러/서포터 배지</b>를 눌러 역할을 전환할 수 있습니다.</>],
                ["03", "최적 파티 자동 조합", <>모든 원정대를 등록한 뒤 <b>[최적 파티 자동 조합]</b>을 누르면, 레벨 조건과 직업군(서포터 밸런스, 원정대 중복 방지)을 고려하여 가장 효율적인 파티를 자동으로 구성해 줍니다.</>],
                ["04", "보기 방식 및 수동 편집", <>파티 편성 탭에서 <b>카드 보기</b>와 <b>표 요약</b>을 전환할 수 있고, <b>수동 편집</b>을 켜면 캐릭터를 눌러 다른 캐릭터나 빈 자리와 교체할 수 있습니다.</>],
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
              <button onClick={() => setIsGuideOpen(false)} style={{ background: "#C8F24C", color: "#0B0D10", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>확인</button>
            </div>
          </div>
        </div>
      )}

      {/* character raid config modal */}
      {selectedCharForConfig && (
        <div onClick={() => setSelectedCharForConfig(null)} style={{ position: "fixed", inset: 0, zIndex: 96, background: "rgba(5,7,9,.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "min(520px,100%)", background: "#14181D", border: "1px solid #2C333C", borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 16, animation: "popIn .35s cubic-bezier(.2,.7,.3,1) both" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: ".14em", color: "#FF4B57", marginBottom: 6 }}>RAID SETTINGS</div>
                <div style={{ fontFamily: "'Archivo'", fontWeight: 800, fontSize: 22, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selectedCharForConfig.char.charName}</div>
                <div style={{ fontSize: 12, color: "#8B949E", marginTop: 4 }}>
                  {selectedCharForConfig.owner} 원정대 · {selectedCharForConfig.char.className} · <span style={{ fontFamily: mono, color: "#C8F24C" }}>Lv.{selectedCharForConfig.char.level}</span>
                </div>
              </div>
              <button onClick={() => setSelectedCharForConfig(null)} style={{ background: "transparent", border: "none", color: "#6B737C", fontSize: 18, cursor: "pointer", padding: "2px 6px" }}>×</button>
            </div>
            <div style={{ fontSize: 12, color: "#8B949E", lineHeight: 1.6 }}>
              이 캐릭터가 매칭될 레이드를 선택하세요. <b style={{ color: "#C6CDD4" }}>이미 다녀온 레이드(클리어)</b>는 체크를 해제하면 파티 매칭에서 제외됩니다. 같은 레이드 계열은 하나만 선택됩니다.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: "52vh", overflowY: "auto", paddingRight: 2 }}>
              {RAID_LIST.map((raid) => {
                const isLevelMet = selectedCharForConfig.char.level >= raid.minLevel;
                const allowedRaids = selectedCharForConfig.char.allowedRaids || [];
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
                        onChange={() => handleToggleCharRaid(selectedCharForConfig.owner, selectedCharForConfig.char.charName, raid.id)}
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
              <button onClick={() => setSelectedCharForConfig(null)} style={{ background: "#C8F24C", color: "#0B0D10", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>확인 및 완료</button>
            </div>
          </div>
        </div>
      )}

      {/* background */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#0E1319" }}>
        <div style={{ position: "absolute", inset: 0, animation: "kenburns 26s ease-in-out infinite alternate" }}>
          <img ref={bgA} src={BG_SEQ[0]} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 26%" }} />
          <img ref={bgB} src={BG_SEQ[0]} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 26%", opacity: 0, transition: "opacity 1.6s ease" }} />
        </div>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(180deg,rgba(11,13,16,.62) 0%,rgba(11,13,16,.34) 16%,rgba(11,13,16,.82) 46%,rgba(11,13,16,.94) 70%,rgba(11,13,16,.97) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(90deg,rgba(11,13,16,.6) 0%,rgba(11,13,16,.05) 42%,rgba(11,13,16,.55) 100%)" }} />
      </div>

      <div style={{ position: "relative", maxWidth: 1460, margin: "0 auto", padding: "14px 14px 0", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* top bar */}
        <div className="topBar" style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", background: "rgba(16,20,25,.58)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 22, padding: "10px 16px", boxShadow: "0 18px 44px rgba(0,0,0,.35)", animation: "dropIn .55s cubic-bezier(.2,.7,.3,1) both" }}>
          <button onClick={() => setScreen("home")} style={{ display: "flex", alignItems: "center", gap: 10, paddingRight: 6, flex: "none", background: "transparent", border: "none", cursor: "pointer", color: "#E8EAEC" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, overflow: "hidden", flex: "none" }}>
              <img src="/icon.png" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <span className="brandLabel" style={{ fontFamily: "'Archivo'", fontWeight: 800, fontSize: 14, letterSpacing: ".02em" }}>LOA PARTY</span>
          </button>
          <div data-scrollx="1" className="navRow" style={{ display: "flex", alignItems: "center", gap: 6, flex: "1 1 320px", minWidth: 0, paddingBottom: 2 }}>
            {NAV.map(([k, label]) => (
              <button key={k} onClick={() => setScreen(k)} style={pill(screen === k)}>
                {label}
                {k === "roster" && memberList.length > 0 ? ` ${memberList.length}` : ""}
                {k === "parties" && formedParties.length > 0 ? ` ${formedParties.length}` : ""}
              </button>
            ))}
          </div>
          <div className="topControls" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", flex: "0 1 auto" }}>
            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,75,87,.14)", border: "1px solid rgba(255,75,87,.4)", borderRadius: 999, padding: "6px 12px", fontSize: 12, fontWeight: 700, color: "#FF4B57" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#FF4B57", animation: "pulseDot 1.2s infinite" }} />
                <span>조회중</span>
              </div>
            )}
            {isEditMode && (
              <button onClick={() => { setIsEditMode(false); setSwapTarget(null); }} title="수동 편집 종료" style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(200,242,76,.14)", border: "1px solid rgba(200,242,76,.4)", borderRadius: 999, padding: "6px 12px", fontSize: 12, fontWeight: 700, color: "#C8F24C", cursor: "pointer" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#C8F24C", animation: "pulseDot 1.2s infinite" }} />
                <span>편집중</span>
              </button>
            )}
            <button className="guideBtn" onClick={() => setIsGuideOpen(true)} style={{ background: "transparent", color: "#8B949E", border: "1px solid rgba(255,255,255,.14)", borderRadius: 999, padding: "7px 13px", fontSize: 12, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}>
              <span className="btnIcon">?</span>
              <span className="btnLabel">사용 가이드</span>
            </button>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 620px", minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>

            {/* HOME */}
            {screen === "home" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ position: "relative", minHeight: 340, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "40px 4px 12px" }}>
                  <div style={{ position: "absolute", top: 6, right: 2, display: "flex", gap: 8 }}>
                    <div style={{ background: "rgba(27,32,39,.66)", backdropFilter: "blur(10px)", border: "1px solid rgba(200,242,76,.32)", borderRadius: 999, padding: "8px 15px", fontSize: 12, color: "#C8F24C" }}>● LOST ARK RAID</div>
                  </div>
                  <div style={{ fontFamily: "'Archivo'", fontWeight: 800, fontSize: "clamp(38px,8vw,76px)", lineHeight: .98, letterSpacing: "-.03em", marginBottom: 12, textShadow: "0 10px 40px rgba(0,0,0,.65)", animation: "revealMask .8s cubic-bezier(.2,.7,.3,1) both" }}>로아 파티 메이커</div>
                  <div style={{ fontSize: 15, color: "#C6CDD4", maxWidth: 540, marginBottom: 22, textWrap: "pretty", textShadow: "0 2px 14px rgba(0,0,0,.6)" }}>
                    대표 캐릭터명으로 원정대 등록 → 캐릭터별 클리어 체크 → 직업·원정대 중복 없이 최적 파티 자동 조합 → 수동 편집과 클리어 표시까지. 모든 데이터는 이 브라우저에 저장됩니다.
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button onClick={() => setScreen("roster")} style={{ ...btnPrimary, padding: "14px 22px", fontSize: 14 }}>원정대 등록하기</button>
                    <button onClick={() => setScreen("parties")} style={{ background: "rgba(27,32,39,.72)", backdropFilter: "blur(10px)", color: "#E8EAEC", border: "1px solid rgba(255,255,255,.14)", borderRadius: 12, padding: "14px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>파티 편성 보기</button>
                  </div>
                </div>

                <div data-lift="1" style={{ background: "rgba(15,19,24,.84)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 20, padding: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: "#8B949E", letterSpacing: ".04em" }}>레이드 목록</div>
                    <div style={{ fontFamily: mono, fontSize: 11, color: "#8B949E" }}>{RAID_LIST.length}개 난이도</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 10 }}>
                    {RAID_CATEGORIES.map((cat, ci) => {
                      const raids = RAID_LIST.filter(r => r.category === cat);
                      return (
                        <div key={cat} data-tile="1" style={{ position: "relative", overflow: "hidden", borderRadius: 14, minHeight: 150, border: "1px solid rgba(255,255,255,.08)", animation: fadeUp, animationDelay: `${ci * 70}ms` }}>
                          <img src={getRaidIllustration(raids[0].id)} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(11,13,16,.25) 0%,rgba(11,13,16,.92) 70%)" }} />
                          <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 8, padding: 14 }}>
                            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                              <div style={{ fontFamily: "'Archivo'", fontWeight: 800, fontSize: 20 }}>{cat}</div>
                              <div style={{ fontFamily: mono, fontSize: 10, color: "#C6CDD4" }}>{raids[0].type}인</div>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                              {raids.map(r => (
                                <span key={r.id} style={{ fontSize: 10, color: "#C6CDD4", background: "rgba(11,13,16,.6)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 999, padding: "3px 8px", whiteSpace: "nowrap" }}>
                                  {r.name.replace(cat, "").trim() || r.name} <span style={{ fontFamily: mono, color: "#C8F24C" }}>{r.minLevel}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ROSTER */}
            {screen === "roster" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: fadeUp }}>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                  <div>
                    <div style={h1}>원정대 관리</div>
                    <div style={sub}>공대원 대표 캐릭터명을 등록하면 1700 이상 캐릭터의 레벨·전투력을 불러옵니다. 체크를 해제한 캐릭터는 매칭에서 빠지고, ⚙ 클리어 체크로 레이드별 참여 여부를 정할 수 있습니다.</div>
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 12, color: "#8B949E" }}>
                    원정대 <span style={{ color: "#C8F24C" }}>{memberList.length}</span> · 캐릭터 <span style={{ color: "#E8EAEC" }}>{activeChars}</span>/{totalChars}
                  </div>
                </div>

                <form onSubmit={handleSearchCharacter} style={{ ...card, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <input
                    type="text"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    placeholder="공대원 대표 캐릭터명을 입력하세요"
                    style={{ ...input, flex: "1 1 260px", minWidth: 180 }}
                  />
                  <button type="submit" disabled={loading} style={{ background: "#C8F24C", color: "#0B0D10", border: "none", borderRadius: 10, padding: "11px 18px", fontSize: 13, fontWeight: 700, cursor: loading ? "default" : "pointer", opacity: loading ? .6 : 1, minWidth: 110 }}>
                    {loading ? "조회 중…" : "원정대 등록"}
                  </button>
                </form>

                {memberList.length === 0 ? (
                  <div style={{ ...card, fontSize: 13, color: "#8B949E", textAlign: "center", padding: "34px 18px" }}>
                    아직 등록된 원정대가 없습니다. 위 입력창에 대표 캐릭터명을 넣어 시작하세요.
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 14 }}>
                    {memberList.map((m, idx) => {
                      const active = m.characters.filter(c => !c.isExcluded).length;
                      return (
                        <div key={idx} data-lift="1" style={{ ...card, padding: 14, display: "flex", flexDirection: "column", gap: 12, border: `1px solid ${m.mainAccount ? "rgba(180,120,255,.35)" : "#262C34"}`, animation: fadeUp, animationDelay: `${idx * 50}ms` }}>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                                <span style={{ width: 9, height: 9, borderRadius: "50%", background: m.mainAccount ? SUB_COLOR : "#C8F24C", flex: "none" }} />
                                <span style={{ fontFamily: "'Archivo'", fontWeight: 700, fontSize: 18, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.owner}</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                                <span style={{ fontFamily: mono, fontSize: 11, color: "#8B949E" }}>{active}/{m.characters.length} 캐릭터 참여</span>
                                {m.mainAccount && (
                                  <span style={{ fontSize: 10, color: SUB_COLOR, background: "rgba(180,120,255,.12)", border: "1px solid rgba(180,120,255,.35)", borderRadius: 999, padding: "2px 8px" }}>🔗 {m.mainAccount} 부계정</span>
                                )}
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 6, flex: "none" }}>
                              <button onClick={() => handleRefreshMember(m.owner)} disabled={loading} title="원정대 정보 갱신" style={{ ...btnSmall, opacity: loading ? .6 : 1 }}>↻ 갱신</button>
                              <button onClick={() => handleRemoveMember(m.owner)} title="원정대 삭제" style={{ ...btnSmall, background: "transparent", color: "#6B737C" }}>삭제 ×</button>
                            </div>
                          </div>

                          {memberList.length > 1 && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 11, color: "#8B949E", flex: "none" }}>부계정 연결</span>
                              <select
                                value={m.mainAccount || ""}
                                onChange={(e) => handleSetMainAccount(m.owner, e.target.value)}
                                title="이 원정대를 다른 원정대의 부계정으로 지정하면, 자동 조합 시 같은 레이드 파티에 함께 편성되지 않습니다."
                                style={{ ...selectStyle, flex: 1, minWidth: 0, fontSize: 11, padding: "6px 8px", borderRadius: 8 }}
                              >
                                <option value="">없음 (본계정)</option>
                                {memberList.filter(o => o.owner !== m.owner).map((o, i) => (
                                  <option key={i} value={o.owner}>{o.owner} 의 부계정</option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 460, overflowY: "auto", paddingRight: 2 }}>
                            {m.characters.map((c, cIdx) => (
                              <div key={cIdx}>{renderManageCard(c, m.owner)}</div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {memberList.length > 0 && (
                  <button onClick={() => { generateParties(); setScreen("parties"); }} style={{ ...btnPrimary, width: "100%", padding: 13 }}>⚡ 등록한 원정대로 최적 파티 자동 조합</button>
                )}
              </div>
            )}

            {/* PARTIES */}
            {screen === "parties" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: fadeUp }}>
                <div style={{ position: "relative", overflow: "hidden", border: "1px solid #262C34", borderRadius: 22, padding: "30px 28px 24px", background: "radial-gradient(1200px 300px at 12% 0%, #2A1B22 0%, #14181D 62%)" }}>
                  <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(115deg,rgba(255,255,255,.028) 0 12px,rgba(0,0,0,0) 12px 26px)" }} />
                  <div style={{ position: "absolute", top: 0, left: 0, width: "38%", height: "100%", background: "linear-gradient(90deg,rgba(255,75,87,0) 0%,rgba(255,75,87,.1) 50%,rgba(255,75,87,0) 100%)", animation: "sweep 5.5s linear infinite" }} />
                  <div style={{ position: "relative", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: ".14em", color: "#FF4B57", marginBottom: 10 }}>RAID PARTIES</div>
                      <div style={{ fontFamily: "'Archivo'", fontWeight: 800, fontSize: "clamp(34px,7vw,56px)", lineHeight: 1, letterSpacing: "-.02em", animation: "revealMask .7s cubic-bezier(.2,.7,.3,1) both" }}>파티 편성</div>
                      <div style={{ fontSize: 13, color: "#A8B0B9", marginTop: 10, maxWidth: 520 }}>직업·원정대(부계정 포함) 중복 없이 앞 파티부터 꽉 채운 결과입니다. 싱글/미편성과 클리어한 파티는 항상 아래로 정렬됩니다.</div>
                    </div>
                    <div className="statTiles" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {[
                        ["편성 파티", String(formedParties.length)],
                        ["클리어", `${clearedCount}`],
                        ["미편성", `${unassignedCount}`]
                      ].map(([label, value], i) => (
                        <div key={label} className="statTile" data-lift="1" style={{ minWidth: 110, background: "rgba(20,24,29,.72)", border: "1px solid #2C333C", borderRadius: 16, padding: "14px 18px", animation: fadeUp, animationDelay: `${i * 90 + 120}ms` }}>
                          <div style={{ fontSize: 11, color: "#8B949E", letterSpacing: ".06em" }}>{label}</div>
                          <div className="statValue" style={{ fontFamily: "'Archivo'", fontWeight: 800, fontSize: 30, marginTop: 6 }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* actions */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 4, background: "#14181D", border: "1px solid #262C34", borderRadius: 999, padding: 4 }}>
                    <button onClick={() => setIsTableView(false)} style={{ ...pill(!isTableView, "#C8F24C"), padding: "7px 14px", border: "none" }}>카드 보기</button>
                    <button onClick={() => setIsTableView(true)} style={{ ...pill(isTableView, "#C8F24C"), padding: "7px 14px", border: "none" }}>표 요약</button>
                  </div>
                  <button
                    onClick={() => { setIsEditMode(!isEditMode); setSwapTarget(null); }}
                    style={{ ...btnGhost, padding: "10px 16px", ...(isEditMode ? { background: "rgba(200,242,76,.14)", color: "#C8F24C", border: "1px solid rgba(200,242,76,.45)" } : {}) }}
                  >
                    ✎ {isEditMode ? "수동 편집 종료" : "파티 수동 편집"}
                  </button>
                  <div style={{ flex: 1 }} />
                  {generateBtn(btnPrimary)}
                </div>

                {/* filters */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", background: "#14181D", border: "1px solid #262C34", borderRadius: 14, padding: "10px 12px" }}>
                  <div data-scrollx="1" style={{ display: "flex", gap: 6, minWidth: 0 }}>
                    <button onClick={() => { setViewMode("all"); setFilterTarget(""); }} style={pill(viewMode === "all")}>전체 보기</button>
                    <button onClick={() => { setViewMode("raid"); setFilterTarget(RAID_LIST[0].name); }} style={pill(viewMode === "raid")}>레이드별</button>
                    <button onClick={() => { setViewMode("owner"); setFilterTarget(memberList[0]?.owner || ""); }} style={pill(viewMode === "owner")}>공대원별</button>
                    <button onClick={() => { setViewMode("single"); setFilterTarget(""); }} style={pill(viewMode === "single")}>싱글 / 미편성</button>
                  </div>
                  {viewMode === "raid" && (
                    <select value={filterTarget} onChange={(e) => setFilterTarget(e.target.value)} style={selectStyle}>
                      {RAID_LIST.map((raid) => (
                        <option key={raid.id} value={raid.name}>{raid.name}</option>
                      ))}
                    </select>
                  )}
                  {viewMode === "owner" && (
                    <select value={filterTarget} onChange={(e) => setFilterTarget(e.target.value)} style={selectStyle}>
                      {memberList.map((m, idx) => (
                        <option key={idx} value={m.owner}>{m.owner} 원정대</option>
                      ))}
                    </select>
                  )}
                  <div style={{ flex: 1 }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "#8B949E", letterSpacing: ".06em" }}>정렬</span>
                    <select value={sortMode} onChange={(e) => setSortMode(e.target.value)} title="싱글/미편성 및 클리어 파티는 항상 하단으로 정렬됩니다" style={selectStyle}>
                      <option value="default">기본순서 (레이드순)</option>
                      <option value="members">인원수 많은순</option>
                      <option value="cp">전투력 합 높은순</option>
                      <option value="name">파티명순</option>
                    </select>
                  </div>
                </div>

                {isEditMode && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: 12, color: "#C6CDD4", background: "rgba(200,242,76,.06)", border: "1px solid rgba(200,242,76,.3)", borderRadius: 12, padding: "10px 14px" }}>
                    <span style={{ fontWeight: 700, color: "#C8F24C" }}>수동 편집 모드</span>
                    {isTableView ? (
                      <span>표 요약에서는 편집할 수 없습니다. <b>카드 보기</b>로 전환하세요.</span>
                    ) : (
                      <span>
                        캐릭터를 클릭해 선택한 뒤, 교체할 <b>다른 캐릭터</b>나 <b>빈 자리</b>를 클릭하세요.
                        {swapTarget && <span style={{ marginLeft: 6, color: "#C8F24C", fontWeight: 600 }}>· 선택됨: {swapTarget.charName}</span>}
                      </span>
                    )}
                    {swapTarget && (
                      <button onClick={() => setSwapTarget(null)} style={{ marginLeft: "auto", background: "transparent", border: "1px solid #333B45", color: "#8B949E", borderRadius: 9, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>선택 해제</button>
                    )}
                  </div>
                )}

                {displayedParties.length === 0 ? (
                  <div style={{ ...card, fontSize: 13, color: "#8B949E", textAlign: "center", padding: "34px 18px" }}>
                    {partyResult.length === 0 ? "아직 조합된 파티가 없습니다. 원정대를 등록한 뒤 [최적 파티 자동 조합]을 눌러주세요." : "조건에 해당하는 파티 결과가 없습니다."}
                  </div>
                ) : isTableView ? (
                  <div data-scrollx="1" style={{ ...card, padding: 8 }}>
                    <table style={{ width: "100%", minWidth: 760, borderCollapse: "separate", borderSpacing: "0 6px", fontSize: 12 }}>
                      <thead>
                        <tr style={{ fontSize: 11, color: "#8B949E", letterSpacing: ".06em", textAlign: "left" }}>
                          <th style={{ padding: "8px 12px", fontWeight: 500, width: 48 }}>#</th>
                          <th style={{ padding: "8px 12px", fontWeight: 500, whiteSpace: "nowrap" }}>레이드</th>
                          <th style={{ padding: "8px 12px", fontWeight: 500 }}>참여 캐릭터</th>
                          <th style={{ padding: "8px 12px", fontWeight: 500, textAlign: "right", whiteSpace: "nowrap" }}>총 전투력 / 평균</th>
                          <th style={{ padding: "8px 12px", fontWeight: 500, textAlign: "center", width: 96 }}>관리</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedParties.map((party, index) => {
                          const isSingle = isSingleParty(party);
                          const totalCP = (party.members || []).reduce((acc, cur) => acc + cur.combatPower, 0);
                          const avgCP = (party.members && party.members.length > 0) ? Math.floor(totalCP / party.members.length) : 0;
                          const td = { padding: "10px 12px", background: "#1B2027", borderTop: "1px solid #262C34", borderBottom: "1px solid #262C34", verticalAlign: "middle" };
                          const names = (list) => list.map((m, idx) => (
                            <span key={idx} style={{ display: "inline-flex", alignItems: "center", gap: 3, marginRight: 8, whiteSpace: "nowrap" }}>
                              {CLASS_ICONS[m.className] && <img src={CLASS_ICONS[m.className]} alt={m.className} style={{ width: 12, height: 12, opacity: .85 }} />}
                              {m.charName}
                            </span>
                          ));
                          return (
                            <tr key={party.id} style={{ opacity: party.cleared ? .45 : 1 }}>
                              <td style={{ ...td, borderLeft: "1px solid #262C34", borderRadius: "12px 0 0 12px", fontFamily: mono, color: "#8B949E" }}>{String(index + 1).padStart(2, "0")}</td>
                              <td style={{ ...td, fontWeight: 700, whiteSpace: "nowrap", color: isSingle ? "#B9A4FF" : "#E8EAEC", textDecoration: party.cleared ? "line-through" : "none" }}>{party.raidName}</td>
                              <td style={{ ...td, color: "#C6CDD4" }}>
                                {party.type === 8 && !isSingle ? (
                                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                    <div><span style={{ fontFamily: mono, color: DLR_COLOR, marginRight: 8 }}>1파티</span>{names(party.g1 || [])}</div>
                                    <div><span style={{ fontFamily: mono, color: SUP_COLOR, marginRight: 8 }}>2파티</span>{names(party.g2 || [])}</div>
                                  </div>
                                ) : (
                                  <div>{names(party.members || [])}</div>
                                )}
                              </td>
                              <td style={{ ...td, textAlign: "right", fontFamily: mono, whiteSpace: "nowrap" }}>
                                {!isSingle ? (
                                  <span>{totalCP.toLocaleString()} <span style={{ color: "#4A525C" }}>|</span> <span style={{ color: "#8B949E" }}>{avgCP.toLocaleString()}</span></span>
                                ) : <span style={{ color: "#6B737C" }}>—</span>}
                              </td>
                              <td style={{ ...td, borderRight: "1px solid #262C34", borderRadius: "0 12px 12px 0", textAlign: "center" }}>
                                {!isSingle && (
                                  <button
                                    onClick={() => handlePartyClear(party)}
                                    title="클리어 표시 토글 (매칭에는 영향 없음)"
                                    style={party.cleared
                                      ? { ...btnSmall, background: "transparent", color: "#8B949E" }
                                      : { ...btnSmall, background: "rgba(200,242,76,.12)", color: "#C8F24C", border: "1px solid rgba(200,242,76,.4)" }}
                                  >
                                    {party.cleared ? "↩ 취소" : "✓ 클리어"}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {displayedParties.map((party, pi) => {
                      const isSingle = isSingleParty(party);
                      const totalCP = (party.members || []).reduce((acc, cur) => acc + cur.combatPower, 0);
                      const avgCP = (party.members && party.members.length > 0) ? Math.floor(totalCP / party.members.length) : 0;
                      const bgImage = getRaidIllustration(party.originalRaidId);
                      return (
                        <div
                          key={party.id}
                          style={{
                            position: "relative", overflow: "hidden", borderRadius: 20, background: "#14181D",
                            border: `1px ${isSingle ? "dashed" : "solid"} ${isSingle ? "rgba(185,164,255,.35)" : "#262C34"}`,
                            opacity: party.cleared ? .5 : 1, filter: party.cleared ? "grayscale(.85)" : "none",
                            transition: "opacity .3s ease, filter .3s ease",
                            animation: fadeUp, animationDelay: `${Math.min(pi, 8) * 40}ms`
                          }}
                        >
                          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                            <img src={bgImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%", opacity: .32 }} />
                            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(20,24,29,.45) 0%,rgba(20,24,29,.9) 42%,#14181D 100%)" }} />
                          </div>

                          <div style={{ position: "relative", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 14, flexWrap: "wrap", padding: "20px 20px 14px" }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                                {isSingle ? (
                                  <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: ".14em", color: "#B9A4FF" }}>SINGLE / UNASSIGNED</span>
                                ) : (
                                  <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: ".14em", color: "#FF4B57" }}>PARTY {String(party.partyNum).padStart(2, "0")}</span>
                                )}
                                {party.cleared && (
                                  <span style={{ fontSize: 10, fontWeight: 700, color: "#0B0D10", background: "#C8F24C", borderRadius: 999, padding: "2px 8px" }}>✓ 클리어 완료</span>
                                )}
                              </div>
                              <div style={{ fontFamily: "'Archivo'", fontWeight: 800, fontSize: "clamp(20px,3vw,26px)", lineHeight: 1.1, textDecoration: party.cleared ? "line-through" : "none", textShadow: "0 4px 18px rgba(0,0,0,.5)" }}>{party.raidName}</div>
                              <div style={{ fontFamily: mono, fontSize: 11, color: "#8B949E", marginTop: 6 }}>
                                {party.category} · 인원 {(party.members || []).length}{!isSingle && `/${party.type}`} · 권장 Lv.{party.minLevel}
                              </div>
                            </div>
                            {!isSingle && (
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <div style={{ display: "flex", gap: 14, background: "rgba(11,13,16,.6)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, padding: "9px 14px" }}>
                                  <div>
                                    <div style={{ fontSize: 10, color: "#8B949E" }}>총 전투력</div>
                                    <div style={{ fontFamily: mono, fontSize: 13, fontWeight: 600 }}>{totalCP.toLocaleString()}</div>
                                  </div>
                                  <div style={{ width: 1, background: "#2C333C" }} />
                                  <div>
                                    <div style={{ fontSize: 10, color: "#8B949E" }}>평균</div>
                                    <div style={{ fontFamily: mono, fontSize: 13, fontWeight: 600, color: "#C8F24C" }}>{avgCP.toLocaleString()}</div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handlePartyClear(party)}
                                  title="클리어 표시만 토글합니다. 파티 편성/매칭에는 영향을 주지 않습니다."
                                  style={party.cleared
                                    ? { ...btnGhost, padding: "11px 14px", fontSize: 12 }
                                    : { background: "#C8F24C", color: "#0B0D10", border: "none", borderRadius: 12, padding: "11px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                                >
                                  {party.cleared ? "↩ 클리어 취소" : "✓ 클리어 표시"}
                                </button>
                              </div>
                            )}
                          </div>

                          <div style={{ position: "relative", padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                            {party.type === 8 && !isSingle ? (
                              <>
                                {renderGroup(party, "g1", "1파티", DLR_COLOR)}
                                {renderGroup(party, "g2", "2파티", SUP_COLOR)}
                              </>
                            ) : (
                              <div style={slotGrid}>
                                {(party.members || []).map((member, mIdx) => (
                                  <div key={mIdx}>{renderMemberCard(member, isSingle, { partyId: party.id, group: "members" })}</div>
                                ))}
                                {!isSingle && Array.from({ length: Math.max(0, party.type - (party.members || []).length) }).map((_, eIdx) => (
                                  <div key={`empty-${eIdx}`}>{renderEmptySlot({ partyId: party.id, group: "members" })}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* right rail */}
          <div className="rightRail hideOnPhone" style={{ flex: "1 1 320px", minWidth: 270, maxWidth: 420, display: "flex", flexDirection: "column", gap: 12, animation: "slideInR .55s cubic-bezier(.2,.7,.3,1) both" }}>
            <div data-lift="1" style={{ ...glass, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -50, right: -30, width: 170, height: 170, borderRadius: "50%", background: "rgba(255,75,87,.13)", filter: "blur(8px)", animation: "floaty 7s ease-in-out infinite" }} />
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>이번 주 레이드</div>
                  <div style={{ fontSize: 11, color: "#8B949E", fontFamily: mono }}>{today}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setScreen("roster")} title="원정대 관리" style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.06)", color: "#C6CDD4", fontSize: 12, cursor: "pointer" }}>☰</button>
                  <button onClick={() => setScreen("parties")} title="파티 편성" style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.06)", color: "#C6CDD4", fontSize: 12, cursor: "pointer" }}>⤢</button>
                </div>
              </div>
              <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8, marginBottom: 18 }}>
                {[
                  ["원정대", memberList.length, "#FF4B57"],
                  ["캐릭터", activeChars, "#2FD3B7"],
                  ["파티", formedParties.length, "#C8F24C"],
                ].map(([label, value, color]) => (
                  <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 52, height: 52, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Archivo'", fontWeight: 800, fontSize: 18, color: "#0B0D10", background: color, boxShadow: "0 0 0 3px rgba(255,255,255,.08), 0 10px 24px rgba(0,0,0,.4)" }}>{value}</div>
                    <div style={{ fontSize: 11, color: "#8B949E" }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "#8B949E" }}>클리어 진행</span>
                  <span style={{ fontFamily: mono }}>{clearedCount} / {formedParties.length}</span>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${clearRate}%`, borderRadius: 999, background: "linear-gradient(90deg,#FF4B57,#C8F24C)", transition: "width .5s cubic-bezier(.2,.7,.3,1)" }} />
                </div>
              </div>
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 18 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>자동 조합 준비?</div>
                  <div style={{ fontSize: 11, color: "#8B949E" }}>{partyResult.length ? `${formedParties.length}파티 편성됨 · 미편성 ${unassignedCount}` : `${activeChars}캐릭터 대기 · 미편성`}</div>
                </div>
                <button onClick={() => { generateParties(); if (memberList.length) setScreen("parties"); }} style={{ flex: "none", background: "#C8F24C", color: "#0B0D10", border: "none", borderRadius: 999, padding: "11px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", animation: "glowPulse 3.6s ease-in-out infinite" }}>✦ 자동 조합</button>
              </div>
            </div>

            <div data-lift="1" style={{ background: "rgba(240,240,244,.96)", borderRadius: 22, padding: 16, boxShadow: "0 20px 50px rgba(0,0,0,.35)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#15181C" }}>레이드별 진행 현황</div>
                <div style={{ fontFamily: mono, fontSize: 11, color: "#5E6570" }}>{raidProgress.length ? `${raidProgress.length}개 레이드` : "대기"}</div>
              </div>
              {raidProgress.length ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8 }}>
                  {raidProgress.map(({ raid, formed, cleared, singles }) => {
                    const done = formed > 0 && cleared === formed;
                    const onlySingles = formed === 0;
                    const bg = done ? "#1D2229" : onlySingles ? "#E1424F" : "#E2E4E9";
                    const fg = done || onlySingles ? "#F5F6F8" : "#15181C";
                    return (
                      <button
                        key={raid.id}
                        onClick={() => { setScreen("parties"); setViewMode("raid"); setFilterTarget(raid.name); }}
                        style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, borderRadius: 14, padding: "11px 12px", background: bg, color: fg, border: "none", cursor: "pointer", textAlign: "left", opacity: onlySingles ? .8 : 1 }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{raid.name}</div>
                        <div style={{ fontSize: 10, opacity: .85 }}>
                          {done ? "클리어 완료" : onlySingles ? "편성 불가" : `${formed}파티 · 클리어 ${cleared}`}
                          {singles > 0 && ` · 미편성 ${singles}`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: "#5E6570", padding: "10px 0" }}>아직 자동 조합 전입니다. 원정대를 등록하고 자동 조합을 눌러주세요.</div>
              )}
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[
                ["클리어율", `${clearRate}%`, "#C8F24C"],
                ["미편성 캐릭터", String(unassignedCount), "#E8EAEC"]
              ].map(([label, value, color]) => (
                <div key={label} data-lift="1" style={{ flex: "1 1 120px", minWidth: 120, background: "rgba(16,20,25,.72)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 20, padding: 16 }}>
                  <div style={{ fontSize: 11, color: "#8B949E", marginBottom: 10 }}>{label}</div>
                  <div style={{ fontFamily: "'Archivo'", fontWeight: 800, fontSize: 30, color }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: "26px 18px 34px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: mono, fontSize: 11, letterSpacing: ".16em", color: "#5A626C" }}>
          <span style={{ width: 22, height: 1, background: "#2C333C" }} />
          <span>MADE BY 이현 · 개천에서가디언난다</span>
          <span style={{ width: 22, height: 1, background: "#2C333C" }} />
        </div>
        <div style={{ fontFamily: mono, fontSize: 11, color: "#3E454E" }}>오류 및 버그 제보 atom11201202@gmail.com</div>
      </div>
    </div>
  );
}
