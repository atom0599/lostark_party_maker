// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from "react";

const NAV = [["home", "홈"], ["roster", "원정대"], ["clear", "클리어 현황"], ["parties", "파티 편성"], ["raids", "레이드 관리"]];
// 로스트아크 공식 아트웍 지역 일러스트 (CC BY-NC-SA 4.0, © Smilegate RPG)
const BG_SEQ = [
  "/regions/elgacia.jpg", "/regions/aldebaran.jpg", "/regions/kadarum.jpg", "/regions/fleche.jpg",
  "/regions/punika.jpg", "/regions/voldis.jpg", "/regions/south_vern.jpg",
];
const HYBRID_CLASSES = ["바드", "홀리나이트", "도화가", "발키리"];
const DLR_COLOR = "#FF4B57";
const SUP_COLOR = "#4ADE80";
const G1_COLOR = "#4C9AFF";
const G2_COLOR = "#FF8A4C";
const SUB_COLOR = "#B478FF";

// 서포터 = 초록 십자가, 딜러 = 칼
function RoleIcon({ sup, size = 11 }) {
  if (sup) {
    return (
      <svg width={size} height={size} viewBox="0 0 12 12" aria-label="서포터" style={{ flex: "none" }}>
        <path d="M4.4 .8h3.2v3.6h3.6v3.2H7.6v3.6H4.4V7.6H.8V4.4h3.6z" fill={SUP_COLOR} />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-label="딜러" fill="none" stroke={DLR_COLOR} strokeWidth="1.9" strokeLinecap="round" style={{ flex: "none" }}>
      <path d="M14.5 1.5 L6.8 9.2" />
      <path d="M14.5 1.5 L12.2 2.1 M14.5 1.5 L13.9 3.8" />
      <path d="M4.6 7.4 L8.6 11.4" />
      <path d="M5.6 10.4 L2.2 13.8" />
    </svg>
  );
}

// 기본 레이드 목록. 실제 목록은 '레이드 관리' 탭에서 수정되며 서버에 공유 저장된다.
// category: 같은 레이드(난이도 묶음)를 구분하는 키 / series: 레이드 이름 / diff: 난이도(단계)
const mkRaid = (id, category, series, diff, type, minLevel, image) => ({
  id, category, series, diff, name: `${series} ${diff}`, type, minLevel,
  reqSup: type === 8 ? 2 : 1, reqDlr: type === 8 ? 6 : 3, image,
});
const DEFAULT_RAIDS = [
  mkRaid(1, "벨가르딘", "죽음의 계율자, 벨가르딘", "노말", 8, 1750, "/raid_5.jpg"),
  mkRaid(2, "벨가르딘", "죽음의 계율자, 벨가르딘", "하드", 8, 1770, "/raid_5.jpg"),
  mkRaid(3, "벨가르딘", "죽음의 계율자, 벨가르딘", "나이트메어", 8, 1780, "/raid_5.jpg"),
  mkRaid(4, "지평", "지평의 성당", "1단계", 4, 1700, "/raid_4.jpg"),
  mkRaid(5, "지평", "지평의 성당", "2단계", 4, 1720, "/raid_4.jpg"),
  mkRaid(6, "지평", "지평의 성당", "3단계", 4, 1750, "/raid_4.jpg"),
  mkRaid(7, "세르카", "고통의 마녀, 세르카", "노말", 4, 1710, "/raid_3.jpg"),
  mkRaid(8, "세르카", "고통의 마녀, 세르카", "하드", 4, 1730, "/raid_3.jpg"),
  mkRaid(9, "세르카", "고통의 마녀, 세르카", "나이트메어", 4, 1740, "/raid_3.jpg"),
  mkRaid(10, "4막", "4막:파멸의 성채", "노말", 8, 1700, "/raid_1.jpg"),
  mkRaid(11, "4막", "4막:파멸의 성채", "하드", 8, 1720, "/raid_1.jpg"),
  mkRaid(12, "종막", "종막:최후의 날", "노말", 8, 1710, "/raid_2.jpg"),
  mkRaid(13, "종막", "종막:최후의 날", "하드", 8, 1730, "/raid_2.jpg"),
];

// 레이드 배경으로 고를 수 있는 이미지
const RAID_IMAGES = [
  ["벨가르딘", "/raid_5.jpg"], ["지평의 성당", "/raid_4.jpg"], ["세르카", "/raid_3.jpg"],
  ["파멸의 성채", "/raid_1.jpg"], ["최후의 날", "/raid_2.jpg"],
  ["엘가시아", "/regions/elgacia.jpg"], ["알데바란의 바다", "/regions/aldebaran.jpg"], ["카다룸 제도", "/regions/kadarum.jpg"],
  ["플레체", "/regions/fleche.jpg"], ["파푸니카", "/regions/punika.jpg"], ["볼다이크", "/regions/voldis.jpg"], ["베른 남부", "/regions/south_vern.jpg"],
];

// 저장된 레이드 목록이 올바른 형태인지
const validRaids = (raids) => Array.isArray(raids) && raids.length > 0
  && raids.every(r => r && typeof r.id === "number" && r.category && r.name && (r.type === 4 || r.type === 8) && typeof r.minLevel === "number");

// 파티 결과의 레이드 이름을 현재 레이드 목록의 이름으로 맞춘다 (예전 이름 / 레이드 관리에서 이름 변경 시)
const migratePartyNames = (parties, raids) => parties.map(p => {
  const raid = raids.find(r => r.id === p.originalRaidId);
  if (!raid || !p.baseRaidName || p.baseRaidName === raid.name) return p;
  return { ...p, raidName: p.raidName.replace(p.baseRaidName, raid.name), baseRaidName: raid.name };
});

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

// 3-way 병합: base(마지막으로 서버와 맞췄던 상태) 대비 내가 바꾼 항목은 내 것을, 안 바꾼 항목은 서버 것을 쓴다.
// 항목 단위 = 원정대(owner) / 파티(id). 순서는 내가 순서를 바꿨으면 내 순서, 아니면 서버 순서.
const merge3 = (base, local, server, keyOf) => {
  const toMap = (arr) => new Map((arr || []).map(x => [keyOf(x), x]));
  const b = toMap(base), l = toMap(local), sv = toMap(server);
  const same = (x, y) => JSON.stringify(x) === JSON.stringify(y);
  const pick = (k) => (same(l.get(k), b.get(k)) ? sv.get(k) : l.get(k));
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

export default function Home() {
  const [searchName, setSearchName] = useState("");
  const [searchRealName, setSearchRealName] = useState("");
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

  // 변경 기록에 남길 동작 이름 (다음 서버 저장 때 함께 전송)
  const logAction = (label) => { pendingActions.current = [...pendingActions.current, label].slice(-10); };
  // 변경 기록에 표시될 내 이름 (브라우저마다 저장)
  const [actorName, setActorName] = useState("");
  const [nameOpen, setNameOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  useEffect(() => {
    let name = "", dev = "";
    try {
      name = localStorage.getItem("loa_actor") || "";
      dev = localStorage.getItem("loa_device") || "";
      if (!dev) { dev = Math.random().toString(36).slice(2, 6); localStorage.setItem("loa_device", dev); }
    } catch {}
    setActorName(name);
    actorRef.current = name || `이름 없음 #${dev}`;
  }, []);
  const saveActorName = () => {
    const name = nameDraft.trim().slice(0, 20);
    setActorName(name);
    let dev = "";
    try {
      if (name) localStorage.setItem("loa_actor", name); else localStorage.removeItem("loa_actor");
      dev = localStorage.getItem("loa_device") || "";
    } catch {}
    actorRef.current = name || `이름 없음 #${dev}`;
    setNameOpen(false);
  };

  // 레이드 목록 (레이드 관리 탭에서 수정, 서버 공유). 아래 로직은 모두 이 목록을 기준으로 동작한다.
  const [raidList, setRaidList] = useState(DEFAULT_RAIDS);
  const RAID_LIST = raidList;
  const RAID_CATEGORIES = [...new Set(RAID_LIST.map(r => r.category))];
  const CATEGORY_TITLE = Object.fromEntries(RAID_CATEGORIES.map(c => [c, RAID_LIST.find(r => r.category === c).series || c]));
  const raidDiff = (raid) => raid.diff || raid.name.slice((CATEGORY_TITLE[raid.category] || "").length).trim();

  useEffect(() => {
    const savedMembers = localStorage.getItem("loa_members");
    const savedResult = localStorage.getItem("loa_party_result");
    let raids = DEFAULT_RAIDS;
    try {
      const savedRaids = JSON.parse(localStorage.getItem("loa_raids") || "null");
      if (validRaids(savedRaids)) { raids = savedRaids; setRaidList(savedRaids); }
    } catch {}
    if (savedMembers) {
      try { setMemberList(JSON.parse(savedMembers)); } catch {}
    }
    if (savedResult) {
      try { setPartyResult(migratePartyNames(JSON.parse(savedResult), raids)); } catch {}
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
  // 원정대 주인의 실명 지정 / 수정
  const handleSetRealName = (ownerName, realName) => {
    const updated = memberList.map(m =>
      m.owner === ownerName ? { ...m, realName: realName.trim() } : m
    );
    saveToLocalStorage(updated, partyResult);
  };

  // 실명: 본인 원정대에 없으면 본계정(최상위)의 실명을 따른다
  const realNameOf = (owner) => {
    const m = memberList.find(x => x.owner === owner);
    if (m && m.realName) return m.realName;
    const root = memberList.find(x => x.owner === rootOwner(owner));
    return (root && root.realName) || "";
  };
  const ownerLabel = (owner) => {
    const real = realNameOf(owner);
    return real ? `${owner} (${real})` : owner;
  };

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
          realName: searchRealName.trim(),
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
        setSearchRealName("");
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

  // API 로 받아온 원정대 정보(data)를 원정대 목록과 이미 편성된 파티에 반영한 결과를 돌려준다
  const applyRefreshData = (members, parties, ownerName, data) => {
    const categories = [...new Set(RAID_LIST.map(r => r.category))];
    const updatedMembers = members.map(m => {
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

    // 갱신된 레벨·전투력·초상화를 이미 편성된 파티에도 바로 반영
    const fresh = new Map(data.map(char => [char.CharacterName, char]));
    const refreshChar = (c) => {
      if (c.owner !== ownerName || !fresh.has(c.charName)) return c;
      const f = fresh.get(c.charName);
      return { ...c, level: f.ItemLevel, combatPower: f.CombatPower, characterImage: f.CharacterImage || c.characterImage };
    };
    const updatedParties = parties.map(p => ({
      ...p,
      members: (p.members || []).map(refreshChar),
      g1: (p.g1 || []).map(refreshChar),
      g2: (p.g2 || []).map(refreshChar),
    }));
    return { members: updatedMembers, parties: updatedParties };
  };

  const handleRefreshMember = async (ownerName) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/character?name=${encodeURIComponent(ownerName)}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        const next = applyRefreshData(memberList, partyResult, ownerName, data);
        logAction(`원정대 갱신: ${ownerName}`);
        saveToLocalStorage(next.members, next.parties);
      } else {
        alert("원정대 갱신에 실패했습니다.");
      }
    } catch {
      alert("원정대 갱신 중 에러가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 모든 원정대를 차례로 갱신하고 한 번에 저장 (API 요청 한도를 고려해 하나씩 순서대로)
  const [refreshAllProgress, setRefreshAllProgress] = useState(null); // { done, total }
  const handleRefreshAll = async () => {
    if (!memberList.length || refreshAllProgress) return;
    setLoading(true);
    const owners = memberList.map(m => m.owner);
    let members = memberList, parties = partyResult;
    const failed = [];
    for (let k = 0; k < owners.length; k++) {
      setRefreshAllProgress({ done: k, total: owners.length });
      try {
        const res = await fetch(`/api/character?name=${encodeURIComponent(owners[k])}`);
        const data = await res.json();
        if (res.ok && Array.isArray(data)) ({ members, parties } = applyRefreshData(members, parties, owners[k], data));
        else failed.push(owners[k]);
      } catch {
        failed.push(owners[k]);
      }
      if (k < owners.length - 1) await new Promise(r => setTimeout(r, 400));
    }
    logAction(`전체 원정대 갱신 (${owners.length - failed.length}/${owners.length})`);
    saveToLocalStorage(members, parties);
    setRefreshAllProgress(null);
    setLoading(false);
    if (failed.length) alert(`다음 원정대는 갱신하지 못했습니다: ${failed.join(", ")}`);
  };

  // 1. 주간 초기화: 모든 파티의 클리어 표시를 지우고,
  //    캐릭터별로 클리어 체크(선택 해제)해 둔 레이드를 갈 수 있는 최고 난이도로 다시 선택한다.
  //    직접 고른 난이도와 매칭 참여/제외 설정은 그대로 둔다.
  const handleWeeklyReset = () => {
    if (!window.confirm("주간 초기화를 할까요?\n\n· 모든 파티의 클리어 표시가 지워집니다\n· 클리어 체크해 둔 레이드가 다시 매칭 참여로 바뀝니다\n· 파티 편성은 그대로이며, 새로 짜려면 자동 조합을 다시 눌러주세요")) return;
    const cats = [...new Set(RAID_LIST.map(r => r.category))];
    const members = memberList.map(m => ({
      ...m,
      characters: m.characters.map(c => {
        const allowed = [...(c.allowedRaids || [])];
        for (const cat of cats) {
          const has = allowed.some(id => { const r = RAID_LIST.find(x => x.id === id); return r && r.category === cat; });
          if (has) continue;
          const ok = RAID_LIST.filter(r => r.category === cat && c.level >= r.minLevel);
          if (ok.length) allowed.push(ok.reduce((mx, r) => (r.minLevel > mx.minLevel ? r : mx), ok[0]).id);
        }
        return { ...c, allowedRaids: allowed };
      }),
    }));
    const parties = partyResult.map(p => (p.cleared ? { ...p, cleared: false } : p));
    logAction("주간 초기화");
    saveToLocalStorage(members, parties);
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

  // 직업/원정대(부계정) 중복 없이 배치하되,
  // 1순위: 앞 파티부터 최대한 꽉 채운다 (예: 4인 레이드 딜러 4명 → 2+2 가 아니라 3+1)
  // 2순위: 그 안에서 남는(미편성) 캐릭터를 최소화한다.
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
  const balanceRaidParties = (parties) => {
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

      if (a.originalRaidId !== b.originalRaidId) return a.originalRaidId - b.originalRaidId;
      return a.id.localeCompare(b.id);
    });

    let partyIndex = 1;
    matchResults.forEach((p) => {
      if (!p.raidName.includes("싱글 / 미편성") && p.type !== "single") p.partyNum = partyIndex++;
    });

    saveToLocalStorage(memberList, matchResults);
  };

  const getRaidIllustration = (raidId) => {
    const raid = RAID_LIST.find(r => r.id === raidId);
    if (raid && raid.image) return raid.image;
    const sameCat = raid && RAID_LIST.find(r => r.category === raid.category && r.image);
    return (sameCat && sameCat.image) || "/raid_1.jpg";
  };

  /* ---------- 서버 공유 동기화 ----------
     원정대 / 파티 / 레이드 목록은 서버(/api/state)가 기준. 로컬 변경은 자동으로 올리고,
     다른 사람의 변경은 2초마다 받아온다. 동시에 수정하면 원정대·파티·레이드 단위로 3-way 병합. */
  const [syncStatus, setSyncStatus] = useState("connecting"); // connecting | live | local | error
  const adminTokenRef = useRef("");
  const pendingActions = useRef([]);
  const actorRef = useRef("");
  const sync = useRef({ ready: false, version: 0, base: null, baseSnap: "", pushing: false, timer: null });
  const latest = useRef({ members: [], parties: [], raids: DEFAULT_RAIDS });

  const snapOf = (st) => JSON.stringify([st.members, st.parties, st.raids]);

  const normalizeServer = (state) => {
    const raids = validRaids(state.raids) ? state.raids : DEFAULT_RAIDS;
    return { members: state.members || [], parties: migratePartyNames(state.parties || [], raids), raids };
  };

  const applyLocal = (st) => {
    latest.current = st;
    setMemberList(st.members);
    setPartyResult(st.parties);
    setRaidList(st.raids);
    try {
      localStorage.setItem("loa_members", JSON.stringify(st.members));
      localStorage.setItem("loa_party_result", JSON.stringify(st.parties));
      localStorage.setItem("loa_raids", JSON.stringify(st.raids));
    } catch {}
  };

  const adoptServer = (state) => {
    const st = normalizeServer(state);
    const s = sync.current;
    s.version = state.version || 0;
    s.base = st;
    s.baseSnap = snapOf(st);
    applyLocal(st);
  };

  const pushState = async () => {
    const s = sync.current;
    if (!s.ready || s.pushing) return;
    const cur0 = latest.current;
    const snap = snapOf(cur0);
    if (snap === s.baseSnap) return;
    s.pushing = true;
    try {
      const res = await fetch("/api/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(adminTokenRef.current ? { "x-admin-token": adminTokenRef.current } : {}) },
        body: JSON.stringify({ baseVersion: s.version, members: cur0.members, parties: cur0.parties, raids: cur0.raids, actor: actorRef.current, actions: pendingActions.current }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        pendingActions.current = [];
        s.version = data.version;
        s.base = cur0;
        s.baseSnap = snap;
        setSyncStatus(st => (st === "local" ? st : "live"));
      } else if (res.status === 403 && data.state) {
        // 관리자 권한 없이 레이드를 지운 경우 → 서버 상태로 되돌림
        adoptServer(data.state);
        alert(data.error || "관리자만 할 수 있는 작업입니다.");
      } else if (res.status === 409 && data.state) {
        // 다른 사람이 먼저 저장함 → 내 변경분을 서버 최신본 위에 병합해서 다시 올림
        const server = normalizeServer(data.state);
        const cur = latest.current;
        const raids = merge3(s.base.raids, cur.raids, server.raids, r => r.id);
        const merged = {
          members: merge3(s.base.members, cur.members, server.members, m => m.owner),
          parties: migratePartyNames(merge3(s.base.parties, cur.parties, server.parties, p => p.id), raids),
          raids,
        };
        s.version = data.state.version || 0;
        s.base = server;
        s.baseSnap = snapOf(server);
        applyLocal(merged);
      } else {
        setSyncStatus("error");
      }
    } catch {
      setSyncStatus("error");
    } finally {
      s.pushing = false;
      if (snapOf(latest.current) !== s.baseSnap) {
        clearTimeout(s.timer);
        s.timer = setTimeout(pushState, 300);
      }
    }
  };

  // 최초 접속: 서버 상태를 받아오고, 서버가 비어 있으면 이 브라우저의 기존 데이터를 올린다
  useEffect(() => {
    let alive = true;
    const pull = async (first) => {
      const s = sync.current;
      try {
        const res = await fetch("/api/state", { cache: "no-store" });
        const data = await res.json();
        if (!alive || !res.ok) throw new Error();
        if (first) {
          s.ready = true;
          setSyncStatus(data.shared ? "live" : "local");
          const server = data.state;
          if (!server.version) {
            // 서버가 비어 있음 → 이 브라우저에 데이터가 있을 때만 첫 공유 상태로 업로드
            // (빈 브라우저가 먼저 접속해도 빈 상태를 올려서 다른 사람의 기존 데이터를 막지 않도록)
            const empty = { members: [], parties: [], raids: DEFAULT_RAIDS };
            s.version = 0; s.base = empty; s.baseSnap = snapOf(empty);
            pushState();
          } else {
            adoptServer(server);
          }
          return;
        }
        setSyncStatus(st => (st === "error" ? (data.shared ? "live" : "local") : st));
        const dirty = snapOf(latest.current) !== s.baseSnap;
        if (data.state.version > s.version && !s.pushing && !dirty) adoptServer(data.state);
        else if (data.state.version > s.version && dirty) pushState(); // 409 → 병합 경로
      } catch {
        if (alive) setSyncStatus("error");
        if (first && alive) setTimeout(() => pull(true), 3000);
      }
    };
    pull(true);
    const t = setInterval(() => { if (sync.current.ready) pull(false); }, 2000);
    return () => { alive = false; clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 로컬에서 원정대/파티/레이드 목록이 바뀌면 서버로 올린다 (짧게 모아서)
  useEffect(() => {
    latest.current = { members: memberList, parties: partyResult, raids: raidList };
    const s = sync.current;
    if (!s.ready) return;
    if (snapOf(latest.current) === s.baseSnap) return;
    clearTimeout(s.timer);
    s.timer = setTimeout(pushState, 250);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberList, partyResult, raidList]);

  /* ---------- 레이드 관리 ---------- */
  // 레이드 목록 변경을 저장하고, 원정대 캐릭터의 레이드 선택과 파티 이름을 함께 정리한다.
  //  - 삭제됐거나 입장 레벨이 올라 못 가게 된 난이도를 고른 캐릭터 → 같은 레이드의 갈 수 있는 최고 난이도로
  //  - 새로 추가된 레이드 → 갈 수 있는 캐릭터에게 최고 난이도를 자동 선택
  //  - 이미 클리어 체크(선택 없음)한 레이드는 그대로 둔다
  const saveRaids = (nextRaids) => {
    const prevCats = new Set(RAID_LIST.map(r => r.category));
    const cats = [...new Set(nextRaids.map(r => r.category))];
    const highestFor = (level, cat) => {
      const ok = nextRaids.filter(r => r.category === cat && level >= r.minLevel);
      return ok.length ? ok.reduce((m, r) => (r.minLevel > m.minLevel ? r : m), ok[0]).id : null;
    };
    const members = memberList.map(m => ({
      ...m,
      characters: m.characters.map(c => {
        const prevAllowed = c.allowedRaids || RAID_LIST.filter(r => c.level >= r.minLevel).map(r => r.id);
        const allowed = [];
        for (const cat of cats) {
          const prevSel = prevAllowed.map(id => RAID_LIST.find(r => r.id === id)).find(r => r && r.category === cat);
          if (!prevCats.has(cat)) {
            const h = highestFor(c.level, cat);
            if (h != null) allowed.push(h);
          } else if (prevSel) {
            const still = nextRaids.find(r => r.id === prevSel.id && c.level >= r.minLevel);
            const pick = still ? still.id : highestFor(c.level, cat);
            if (pick != null) allowed.push(pick);
          }
        }
        return { ...c, allowedRaids: allowed };
      }),
    }));
    setRaidList(nextRaids);
    try { localStorage.setItem("loa_raids", JSON.stringify(nextRaids)); } catch {}
    saveToLocalStorage(members, migratePartyNames(partyResult, nextRaids));
  };

  const nextRaidId = () => RAID_LIST.reduce((m, r) => Math.max(m, r.id), 0) + 1;

  const updateSeries = (category, patch) => {
    saveRaids(RAID_LIST.map(r => {
      if (r.category !== category) return r;
      const n = { ...r, ...patch };
      if (patch.type) { n.reqSup = patch.type === 8 ? 2 : 1; n.reqDlr = patch.type === 8 ? 6 : 3; }
      n.name = `${n.series} ${raidDiff(n)}`;
      return n;
    }));
  };

  const updateRaid = (id, patch) => {
    saveRaids(RAID_LIST.map(r => {
      if (r.id !== id) return r;
      const n = { ...r, ...patch };
      n.name = `${n.series || CATEGORY_TITLE[n.category]} ${raidDiff(n)}`;
      return n;
    }));
  };

  const addDifficulty = (category) => {
    const inCat = RAID_LIST.filter(r => r.category === category);
    const base = inCat[inCat.length - 1];
    const lv = Math.max(...inCat.map(r => r.minLevel)) + 10;
    saveRaids([...RAID_LIST, mkRaid(nextRaidId(), category, base.series || CATEGORY_TITLE[category], "새 난이도", base.type, lv, base.image)]);
  };

  const addSeries = ({ series, diff, type, minLevel, image }) => {
    const id = nextRaidId();
    saveRaids([...RAID_LIST, mkRaid(id, `raid-${id}`, series, diff, type, minLevel, image)]);
  };

  const removeRaid = (id) => saveRaids(RAID_LIST.filter(r => r.id !== id));
  const removeSeries = (category) => {
    if (RAID_CATEGORIES.length <= 1) { alert("레이드는 최소 1개는 있어야 합니다."); return; }
    saveRaids(RAID_LIST.filter(r => r.category !== category));
  };

  /* ---------- UI 전용 상태 (화면 전환 / 스플래시 / 배경) ---------- */
  const [screen, setScreen] = useState("home");
  const [splash, setSplash] = useState(true);
  const bgA = useRef(null);
  const bgB = useRef(null);
  const bgIdx = useRef(0);
  const swapping = useRef(false);

  const [clearOwner, setClearOwner] = useState("");
  const [clearTab, setClearTab] = useState("party");
  const [newRaid, setNewRaid] = useState({ series: "", diff: "노말", type: 8, minLevel: 1700, image: "/raid_1.jpg" });
  const [uploading, setUploading] = useState(false);

  /* ---------- 관리자 (레이드 삭제 권한) ---------- */
  const [adminToken, setAdminToken] = useState("");
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminPw, setAdminPw] = useState("");
  const [adminErr, setAdminErr] = useState("");
  const isAdmin = !!adminToken;
  useEffect(() => {
    let saved = "";
    try { saved = localStorage.getItem("loa_admin_token") || ""; } catch {}
    if (!saved) return;
    // 저장된 토큰이 아직 유효한지 서버에 확인 (비밀번호가 바뀌었으면 자동 로그아웃)
    fetch("/api/admin", { headers: { "x-admin-token": saved } })
      .then(r => r.json())
      .then(d => {
        if (d.admin) { adminTokenRef.current = saved; setAdminToken(saved); }
        else { try { localStorage.removeItem("loa_admin_token"); } catch {} }
      })
      .catch(() => {});
  }, []);
  const adminLogin = async () => {
    setAdminErr("");
    try {
      const res = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: adminPw }) });
      const d = await res.json();
      if (!res.ok) { setAdminErr(d.error || "로그인 실패"); return; }
      adminTokenRef.current = d.token;
      setAdminToken(d.token);
      try { localStorage.setItem("loa_admin_token", d.token); } catch {}
      setAdminOpen(false);
      setAdminPw("");
    } catch {
      setAdminErr("서버와 통신하지 못했습니다.");
    }
  };
  const adminLogout = () => {
    adminTokenRef.current = "";
    setAdminToken("");
    try { localStorage.removeItem("loa_admin_token"); } catch {}
  };
  // 관리자 전용 동작: 로그인 안 되어 있으면 로그인 창을 띄운다
  const requireAdmin = (fn) => () => {
    if (!isAdmin) { setAdminErr(""); setAdminOpen(true); return; }
    fn();
  };

  // 내 컴퓨터 이미지를 줄여서(가로 최대 1600px, JPEG) 서버에 올리고 주소를 받는다
  const uploadRaidImage = async (file) => {
    if (!file) return null;
    if (!/^image\//.test(file.type)) { alert("이미지 파일만 올릴 수 있습니다."); return null; }
    setUploading(true);
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1600 / bitmap.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      let quality = 0.85, dataUrl = canvas.toDataURL("image/jpeg", quality);
      while (dataUrl.length > 2_800_000 && quality > 0.4) { quality -= 0.15; dataUrl = canvas.toDataURL("image/jpeg", quality); }
      const res = await fetch("/api/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl }) });
      const d = await res.json();
      if (!res.ok) { alert(d.error || "이미지 업로드에 실패했습니다."); return null; }
      return d.url;
    } catch {
      alert("이미지를 읽지 못했습니다.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
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

  // 본계정 + 부계정을 한 사람으로 묶은 원정대 그룹 (등록 순서 유지)
  const rosterGroups = (() => {
    const map = new Map();
    memberList.forEach(m => {
      const key = rootOwner(m.owner);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(m);
    });
    return [...map.entries()].map(([key, accounts]) => {
      const main = accounts.find(a => a.owner === key) || accounts[0];
      return { key, main, accounts: [main, ...accounts.filter(a => a !== main)] };
    });
  })();
  const charStats = (chars) => {
    const n = chars.length;
    const sum = (f) => chars.reduce((s, c) => s + (Number(c[f]) || 0), 0);
    return {
      count: n,
      active: chars.filter(c => !c.isExcluded).length,
      avgLevel: n ? (sum("level") / n).toFixed(1) : "—",
      avgCP: n ? Math.round(sum("combatPower") / n).toLocaleString() : "—",
      maxLevel: n ? Math.max(...chars.map(c => Number(c.level) || 0)).toFixed(1) : "—",
    };
  };

  /* ---------- style helpers ---------- */
  const pill = (active, accent = "#FF4B57") => ({
    borderRadius: 999, padding: "9px 15px", fontSize: 13, fontWeight: active ? 700 : 500, cursor: "pointer",
    whiteSpace: "nowrap", border: `1px solid ${active ? accent : "#262C34"}`,
    background: active ? accent : "transparent", color: active ? "#0B0D10" : "#A8B0B9"
  });
  const card = { background: "#14181D", border: "1px solid #262C34", borderRadius: 18, padding: 18 };
  const h1 = { fontFamily: "'Archivo'", fontWeight: 800, fontSize: "clamp(26px,5vw,34px)" };
  const sub = { fontSize: 13, color: "#8B949E", marginTop: 4 };
  const input = { background: "#0F1318", border: "1px solid #2C333C", borderRadius: 10, padding: "11px 13px", color: "#E8EAEC", fontSize: 13 };
  const selectStyle = { ...input, padding: "8px 10px", fontSize: 12, cursor: "pointer" };
  const btnPrimary = { background: "#FF4B57", color: "#0B0D10", border: "none", borderRadius: 12, padding: "12px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" };
  const btnGhost = { background: "#1B2027", color: "#E8EAEC", border: "1px solid #333B45", borderRadius: 12, padding: "12px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" };
  const btnSmall = { background: "#252C34", color: "#C8D0D8", border: "1px solid #333B45", borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" };
  const mono = "'IBM Plex Mono'";
  const fadeUp = "fadeUp .45s cubic-bezier(.2,.7,.3,1) both";

  // editable=false 이면 표시만 (파티 편성 화면에서는 역할 전환 불가 — 원정대 관리에서만)
  const roleBadge = (member, ownerName, editable = true) => {
    const isHybrid = HYBRID_CLASSES.includes(member.className);
    const isSup = isHybrid && member.role === "서포터";
    const color = isSup ? SUP_COLOR : DLR_COLOR;
    const style = {
      display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, color,
      background: `${color}1A`, border: `1px solid ${color}55`, borderRadius: 999, padding: "3px 9px", whiteSpace: "nowrap", flex: "none"
    };
    if (!isHybrid) return <span style={style}><RoleIcon sup={false} />딜러</span>;
    if (!editable) return <span style={style}><RoleIcon sup={isSup} />{isSup ? "서포터" : "딜러"}</span>;
    return (
      <button
        type="button"
        title="클릭하여 딜러/서포터 전환"
        onClick={() => handleToggleRole(ownerName, member.charName)}
        style={{ ...style, cursor: "pointer" }}
      >
        <RoleIcon sup={isSup} />{isSup ? "서포터" : "딜러"} <span style={{ opacity: .6 }}>⇄</span>
      </button>
    );
  };

  const classLine = (member, color = "#8B949E", size = 11) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: size, color, whiteSpace: "nowrap", flex: "none" }}>
      {CLASS_ICONS[member.className] && (
        <img src={CLASS_ICONS[member.className]} alt={member.className} style={{ width: size + 2, height: size + 2, opacity: .9, flex: "none" }} />
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

  // 캐릭터가 각 레이드 계열에서 어떤 상태인지 (클리어 현황 탭 / 원정대 카드 공용)
  const raidStatus = (owner, char, category) => {
    const inCat = RAID_LIST.filter(r => r.category === category);
    const eligible = inCat.filter(r => char.level >= r.minLevel);
    if (eligible.length === 0) return { state: "locked" };
    const allowed = char.allowedRaids || RAID_LIST.filter(r => char.level >= r.minLevel).map(r => r.id);
    const sel = inCat.find(r => allowed.includes(r.id));
    const highest = eligible.reduce((max, r) => r.minLevel > max.minLevel ? r : max, eligible[0]);
    if (!sel) return { state: "done", highest };
    const party = partyResult.find(p => p.category === category && !isSingleParty(p)
      && (p.members || []).some(m => m.owner === owner && m.charName === char.charName));
    if (party && party.cleared) return { state: "cleared", raid: sel, party, highest };
    if (party) return { state: "assigned", raid: sel, party, highest };
    return { state: "pending", raid: sel, highest };
  };

  const STATUS_STYLE = {
    locked: { color: "#4A525C", bg: "transparent", border: "#20262E" },
    done: { color: "#2FD3B7", bg: "rgba(47,211,183,.1)", border: "rgba(47,211,183,.35)" },
    cleared: { color: "#C8F24C", bg: "rgba(200,242,76,.1)", border: "rgba(200,242,76,.35)" },
    assigned: { color: "#E8EAEC", bg: "#20262E", border: "#333B45" },
    pending: { color: "#E5C04C", bg: "rgba(229,192,76,.08)", border: "rgba(229,192,76,.3)" },
  };

  // 초상화: 상반신이 보이도록 위쪽 기준으로 확대해 자른다
  const charThumb = (member, w = 52, h = w, zoom = 1.9) => (
    <div style={{ width: w, height: h, borderRadius: 12, overflow: "hidden", flex: "none", background: "radial-gradient(circle at 50% 30%, #252C35 0%, #0F1318 75%)", border: "1px solid #2C333C", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {member.characterImage
        ? <img src={member.characterImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 10%", transform: `scale(${zoom})`, transformOrigin: "50% 12%" }} />
        : CLASS_ICONS[member.className] && <img src={CLASS_ICONS[member.className]} alt="" style={{ width: "55%", opacity: .7 }} />}
    </div>
  );

  // 원정대 관리 캐릭터 카드: 세로형 고정 크기 (한 줄에 6개)
  const CLAMP2 = { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", wordBreak: "break-all" };
  const renderManageCard = (member, ownerName) => {
    const active = !member.isExcluded;
    return (
      <div data-lift="1" style={{
        height: 318, background: active ? "#1B2027" : "#14181D", border: `1px solid ${active ? "#2C333C" : "#1F242B"}`,
        borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column"
      }}>
        <div style={{ position: "relative", height: 150, flex: "none", overflow: "hidden", background: "radial-gradient(circle at 50% 35%, #2A323C 0%, #0F1318 75%)", opacity: active ? 1 : .45 }}>
          {member.characterImage
            ? <img src={member.characterImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 12%", transform: "scale(1.3)", transformOrigin: "50% 10%" }} />
            : CLASS_ICONS[member.className] && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src={CLASS_ICONS[member.className]} alt="" style={{ width: 64, height: 64, opacity: .6 }} />
              </div>
            )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(27,32,39,0) 55%,rgba(27,32,39,.95) 100%)" }} />
          <div style={{ position: "absolute", top: 8, left: 8 }}>{roleBadge(member, ownerName)}</div>
          <div style={{ position: "absolute", left: 10, bottom: 6, fontFamily: mono, fontSize: 15, fontWeight: 700, color: "#C8F24C", textShadow: "0 2px 8px rgba(0,0,0,.8)" }}>Lv.{member.level}</div>
        </div>
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 4, padding: "8px 10px 0", opacity: active ? 1 : .45 }}>
          <div style={{ height: 40, display: "flex", alignItems: "center" }}>
            <span style={{ ...CLAMP2, fontSize: 15, fontWeight: 700, lineHeight: 1.3, textDecoration: active ? "none" : "line-through" }}>{member.charName}</span>
          </div>
          {classLine(member, "#A8B0B9", 12)}
          <span style={{ fontFamily: mono, fontSize: 11, color: "#8B949E" }}>CP {member.combatPower.toLocaleString()}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: 10 }}>
          <button
            type="button"
            onClick={() => handleToggleExclude(ownerName, member.charName)}
            title="파티 매칭 참여 / 제외 전환"
            style={{ ...btnSmall, padding: "7px 8px", ...(active
              ? { background: "rgba(200,242,76,.12)", color: "#C8F24C", border: "1px solid rgba(200,242,76,.35)" }
              : { background: "rgba(225,66,79,.1)", color: "#E1424F", border: "1px solid rgba(225,66,79,.35)" }) }}
          >
            {active ? "● 매칭 참여중" : "○ 매칭 제외됨"}
          </button>
          <button
            type="button"
            onClick={() => setSelectedCharForConfig({ owner: ownerName, char: member })}
            title="이 캐릭터가 갈 레이드와 클리어한 레이드 확인 / 설정"
            style={{ ...btnSmall, padding: "7px 8px" }}
          >
            ⚙ 레이드 설정
          </button>
        </div>
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
          position: "relative", overflow: "hidden", background: bg, borderRadius: 12, padding: "10px 12px", height: 128, boxSizing: "border-box",
          border: `1px ${isSingle && !isSelected && !isTargetOwner ? "dashed" : "solid"} ${border}`,
          boxShadow: isSelected ? "0 0 0 1px #C8F24C, 0 0 22px rgba(200,242,76,.25)" : isTargetOwner ? "0 0 18px rgba(229,192,76,.18)" : "none",
          display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 6,
          cursor: editable ? "pointer" : "default", opacity: dimmed ? .35 : 1, transition: "opacity .2s ease, border-color .2s ease"
        }}
      >
        {charArt(member, bg)}
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
          {roleBadge(member, member.owner, false)}
          {isSelected && <span style={{ fontFamily: mono, fontSize: 10, color: "#C8F24C", letterSpacing: ".08em" }}>SELECTED</span>}
        </div>
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          <span style={{ ...CLAMP2, fontSize: 14, fontWeight: 700, lineHeight: 1.25, color: isTargetOwner ? "#F2D98A" : "#E8EAEC" }}>{member.charName}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, fontSize: 11, color: isTargetOwner ? "#E5C04C" : "#8B949E" }}>
            <span title={ownerLabel(member.owner)} style={{ minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ownerLabel(member.owner)}</span>
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
          height: 128, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
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

  // 클리어 현황 > 파티별 클리어: 파티 단위로 클리어 표시를 토글하는 유일한 곳
  const renderPartyClear = () => {
    if (formedParties.length === 0) {
      return (
        <div style={{ ...card, fontSize: 13, color: "#8B949E", textAlign: "center", padding: "34px 18px" }}>
          아직 편성된 파티가 없습니다. 파티 편성 탭에서 [최적 파티 자동 조합]을 먼저 눌러주세요.
        </div>
      );
    }
    const pct = Math.round((clearedCount / formedParties.length) * 100);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ ...card, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: "'Archivo'", fontWeight: 800, fontSize: 34, color: "#C8F24C" }}>{clearedCount}</span>
            <span style={{ fontSize: 13, color: "#8B949E" }}>/ {formedParties.length} 파티 클리어</span>
          </div>
          <div style={{ flex: "1 1 240px", height: 8, borderRadius: 999, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, borderRadius: 999, background: "linear-gradient(90deg,#2FD3B7,#C8F24C)", transition: "width .4s ease" }} />
          </div>
          <span style={{ fontFamily: mono, fontSize: 13, color: "#C6CDD4" }}>{pct}%</span>
        </div>

        {RAID_CATEGORIES.map(cat => {
          const list = formedParties
            .filter(p => p.category === cat)
            .sort((a, b) => (a.originalRaidId - b.originalRaidId) || ((a.partyNum || 0) - (b.partyNum || 0)));
          if (!list.length) return null;
          const done = list.filter(p => p.cleared).length;
          return (
            <div key={cat} style={{ ...card, padding: 0, overflow: "hidden" }}>
              <div style={{ position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "14px 18px", borderBottom: "1px solid #262C34" }}>
                <img src={getRaidIllustration(list[0].originalRaidId)} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: .2 }} />
                <span style={{ position: "relative", fontFamily: "'Archivo'", fontWeight: 800, fontSize: 18 }}>{CATEGORY_TITLE[cat]}</span>
                <span style={{ position: "relative", fontFamily: mono, fontSize: 12, color: done === list.length ? "#C8F24C" : "#C6CDD4" }}>{done} / {list.length} 클리어</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: 10 }}>
                {list.map(party => {
                  const members = party.type === 8 ? [...(party.g1 || []), ...(party.g2 || [])] : (party.members || []);
                  return (
                    <button
                      key={party.id}
                      type="button"
                      data-row="1"
                      onClick={() => handlePartyClear(party)}
                      title={party.cleared ? "클릭하면 클리어 표시를 취소합니다" : "클릭하면 클리어로 표시합니다"}
                      style={{
                        display: "flex", alignItems: "center", gap: 14, textAlign: "left", width: "100%", cursor: "pointer",
                        background: party.cleared ? "rgba(200,242,76,.07)" : "#1B2027",
                        border: `1px solid ${party.cleared ? "rgba(200,242,76,.4)" : "#262C34"}`,
                        borderRadius: 12, padding: "10px 14px", color: "#E8EAEC"
                      }}
                    >
                      <span style={{
                        width: 26, height: 26, borderRadius: 8, flex: "none", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 15, fontWeight: 800,
                        background: party.cleared ? "#C8F24C" : "transparent", color: "#0B0D10",
                        border: `2px solid ${party.cleared ? "#C8F24C" : "#3A434E"}`
                      }}>{party.cleared ? "✓" : ""}</span>
                      <div style={{ flex: "0 0 auto", minWidth: 170 }}>
                        <div style={{ fontFamily: mono, fontSize: 10, color: "#FF4B57", letterSpacing: ".1em" }}>PARTY {String(party.partyNum).padStart(2, "0")}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, textDecoration: party.cleared ? "line-through" : "none", color: party.cleared ? "#8B949E" : "#E8EAEC" }}>{raidDiff(RAID_LIST.find(r => r.id === party.originalRaidId))}{party.raidName.match(/ #\d+$/)?.[0] || ""}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0, display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {members.map((m, i) => (
                          <span key={i} title={`${ownerLabel(m.owner)} · ${m.className}`} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600, color: "#C6CDD4", background: "#14181D", border: "1px solid #2C333C", borderRadius: 999, padding: "3px 10px 3px 7px", whiteSpace: "nowrap" }}>
                            {CLASS_ICONS[m.className] && <img src={CLASS_ICONS[m.className]} alt={m.className} style={{ width: 17, height: 17, opacity: .95 }} />}
                            <RoleIcon sup={HYBRID_CLASSES.includes(m.className) && m.role === "서포터"} size={11} />
                            {m.charName}
                          </span>
                        ))}
                      </div>
                      <span style={{ flex: "none", fontSize: 11, fontWeight: 700, color: party.cleared ? "#C8F24C" : "#6B737C", whiteSpace: "nowrap" }}>{party.cleared ? "클리어 완료" : "진행 전"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 5. 파티 편성을 디스코드/카톡에 붙여넣기 좋은 글로 만든다 (지금 보이는 목록 기준)
  const [copied, setCopied] = useState(false);
  const partyText = (list) => {
    const d = new Date();
    const who = (m) => {
      const sup = HYBRID_CLASSES.includes(m.className) && m.role === "서포터";
      const real = realNameOf(m.owner);
      return `${sup ? "[서폿] " : ""}${m.charName}(${m.className}${real ? `·${real}` : ""})`;
    };
    const lines = [`📋 로아 파티 편성 (${d.getMonth() + 1}/${d.getDate()})`, ""];
    for (const p of list) {
      const single = isSingleParty(p);
      const n = (p.members || []).length;
      if (single) {
        lines.push(`[미편성] ${p.baseRaidName || p.raidName} — ${n}명`);
        lines.push(`  ${(p.members || []).map(who).join(", ")}`);
      } else {
        const avg = n ? Math.floor((p.members || []).reduce((a, m) => a + (m.combatPower || 0), 0) / n) : 0;
        lines.push(`[파티 ${p.partyNum}] ${p.raidName} — ${n}/${p.type}명 · 평균 ${avg.toLocaleString()}${p.cleared ? " · ✓클리어" : ""}`);
        if (p.type === 8) {
          lines.push(`  1파티: ${(p.g1 || []).map(who).join(", ") || "-"}`);
          lines.push(`  2파티: ${(p.g2 || []).map(who).join(", ") || "-"}`);
        } else {
          lines.push(`  ${(p.members || []).map(who).join(", ")}`);
        }
      }
      lines.push("");
    }
    return lines.join("\n").trim();
  };
  const copyPartyText = async () => {
    const text = partyText(displayedParties);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch {}
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // 6. 변경 기록 (관리자 전용)
  const [logEntries, setLogEntries] = useState(null);
  const [logError, setLogError] = useState("");
  const loadLog = async () => {
    try {
      const res = await fetch("/api/log", { headers: { "x-admin-token": adminTokenRef.current }, cache: "no-store" });
      const d = await res.json();
      if (!res.ok) { setLogError(d.error || "기록을 불러오지 못했습니다."); return; }
      setLogError("");
      setLogEntries(d.entries);
    } catch {
      setLogError("서버와 통신하지 못했습니다.");
    }
  };
  useEffect(() => {
    if (screen !== "log" || !isAdmin) return;
    loadLog();
    const t = setInterval(loadLog, 10000);
    return () => clearInterval(t);
  }, [screen, isAdmin]);
  useEffect(() => {
    // 로그아웃하면 기록 화면에서 나간다
    if (!isAdmin && screen === "log") setScreen("home");
  }, [isAdmin, screen]);

  const generateBtn = (style) => (
    <button onClick={() => { logAction("최적 파티 자동 조합"); generateParties(); }} style={style}>⚡ 최적 파티 자동 조합</button>
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

      {/* 내 이름 설정 */}
      {nameOpen && (
        <div onClick={() => setNameOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 97, background: "rgba(5,7,9,.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); saveActorName(); }} style={{ width: "min(340px,100%)", background: "#14181D", border: "1px solid #2C333C", borderRadius: 18, padding: 20, display: "flex", flexDirection: "column", gap: 12, animation: "popIn .3s cubic-bezier(.2,.7,.3,1) both" }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>내 이름</div>
            <div style={{ fontSize: 12, color: "#8B949E" }}>파티를 바꾸거나 클리어를 누르면 이 이름으로 기록됩니다. 이 브라우저에만 저장됩니다.</div>
            <input autoFocus value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} maxLength={20} placeholder="예: 이현" style={{ background: "#0F1318", border: "1px solid #2C333C", borderRadius: 10, padding: "11px 14px", color: "#E8EAEC", fontSize: 13 }} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setNameOpen(false)} style={{ background: "transparent", color: "#8B949E", border: "1px solid #2C333C", borderRadius: 10, padding: "9px 14px", fontSize: 13, cursor: "pointer" }}>취소</button>
              <button type="submit" style={{ background: "#C8F24C", color: "#0B0D10", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>저장</button>
            </div>
          </form>
        </div>
      )}

      {/* admin login */}
      {adminOpen && (
        <div onClick={() => setAdminOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 97, background: "rgba(5,7,9,.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); adminLogin(); }} style={{ width: "min(340px,100%)", background: "#14181D", border: "1px solid #2C333C", borderRadius: 18, padding: 20, display: "flex", flexDirection: "column", gap: 12, animation: "popIn .3s cubic-bezier(.2,.7,.3,1) both" }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>관리자 로그인</div>
            <div style={{ fontSize: 12, color: "#8B949E" }}>레이드 삭제와 목록 초기화는 관리자만 할 수 있습니다.</div>
            <input autoFocus type="password" inputMode="numeric" value={adminPw} onChange={(e) => setAdminPw(e.target.value)} placeholder="비밀번호" style={{ background: "#0F1318", border: "1px solid #2C333C", borderRadius: 10, padding: "11px 14px", color: "#E8EAEC", fontSize: 13 }} />
            {adminErr && <div style={{ fontSize: 12, color: "#E1424F" }}>{adminErr}</div>}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setAdminOpen(false)} style={{ background: "transparent", color: "#8B949E", border: "1px solid #2C333C", borderRadius: 10, padding: "9px 14px", fontSize: 13, cursor: "pointer" }}>취소</button>
              <button type="submit" style={{ background: "#C8F24C", color: "#0B0D10", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>로그인</button>
            </div>
          </form>
        </div>
      )}

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
                ["01", "원정대 등록", <><b>원정대</b> 탭에서 공대원의 대표 캐릭터명(필요하면 실명도)을 입력하고 <b>[원정대 등록]</b>을 누르세요. 1700 이상 캐릭터의 레벨·전투력·초상화를 자동으로 불러옵니다. <b>↻ 갱신</b>(원정대별) 또는 <b>↻ 전체 원정대 갱신</b>으로 최신 정보를 다시 불러올 수 있습니다.</>],
                ["02", "부계정 연결", <>원정대 이름 옆의 선택창에서 <b>OO 의 부계정</b>을 고르면 본계정과 한 사람으로 묶여 함께 표시되고, 자동 조합 때 같은 파티에 함께 들어가지 않습니다.</>],
                ["03", "캐릭터 설정", <>캐릭터마다 <b>매칭 참여중 / 제외됨</b>을 눌러 이번 주 파티에서 뺄 수 있고, <b>⚙ 레이드 설정</b>에서 갈 난이도를 고르거나 이미 다녀온 레이드를 체크 해제할 수 있습니다. 바드·홀리나이트·도화가·발키리는 <b>딜러/서포터 배지</b>를 눌러 역할을 바꿀 수 있습니다.</>],
                ["04", "최적 파티 자동 조합", <><b>파티 편성</b> 탭의 <b>[최적 파티 자동 조합]</b>을 누르면 레벨 조건, 서포터 수, 직업·원정대(부계정 포함) 중복을 고려해 앞 파티부터 꽉 채워 편성합니다. 자리가 없는 캐릭터는 <b>싱글 / 미편성</b>으로 아래에 모입니다.</>],
                ["05", "보기 방식과 수동 편집", <><b>카드 보기 / 표 요약</b>을 전환하고, 레이드별·공대원별로 걸러 볼 수 있습니다. <b>파티 수동 편집</b>을 켜면 캐릭터를 눌러 선택한 뒤 다른 캐릭터나 빈 자리를 눌러 바꿀 수 있습니다 (표 요약에서도 가능). <b>📋 텍스트 복사</b>를 누르면 지금 보이는 파티 목록을 디스코드·카톡에 붙여넣기 좋은 글로 복사합니다.</>],
                ["06", "클리어 체크", <><b>클리어 현황 → 파티별 클리어</b>에서 다녀온 파티를 눌러 클리어로 표시하세요. <b>캐릭터별 현황</b>에서는 캐릭터마다 레이드별로 남음 / 편성 / 클리어 상태를 한눈에 볼 수 있습니다. 수요일 리셋 후에는 <b>↺ 주간 초기화</b>로 클리어 표시와 클리어 체크를 한 번에 되돌리세요.</>],
                ["07", "레이드 관리", <><b>레이드 관리</b> 탭에서 새 레이드나 난이도를 추가하고, 이름·인원(4인/8인)·입장 레벨·배경 이미지를 바꿀 수 있습니다. 배경은 <b>📁 내 PC</b>로 내 컴퓨터 이미지를 올릴 수도 있습니다. 새 레이드는 입장 레벨이 되는 캐릭터에게 자동으로 선택되며, 다음 자동 조합부터 반영됩니다. 레이드·난이도 삭제와 목록 초기화는 상단 <b>관리자</b> 로그인 후에만 할 수 있습니다.</>],
                ["08", "모두 함께 보기", <>원정대 등록, 파티 편성, 클리어 체크는 서버에 저장되어 사이트에 접속한 모든 사람에게 몇 초 안에 똑같이 보입니다. 상단 오른쪽 점이 초록색이면 정상적으로 공유 중입니다. <b>👤</b> 버튼으로 내 이름을 정해두면, 관리자가 보는 <b>변경 기록</b>에 그 이름으로 남습니다.</>],
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
                <div style={{ fontFamily: "'Archivo'", fontWeight: 800, fontSize: 22, wordBreak: "break-all", lineHeight: 1.25 }}>{selectedCharForConfig.char.charName}</div>
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
            {(isAdmin ? [...NAV, ["log", "변경 기록"]] : NAV).map(([k, label]) => (
              <button key={k} onClick={() => setScreen(k)} style={{ ...pill(screen === k), display: "inline-flex", alignItems: "center", gap: 7 }}>
                {label}
                {(() => {
                  const n = k === "roster" ? memberList.length : k === "parties" ? formedParties.length : 0;
                  if (!n) return null;
                  const on = screen === k;
                  return (
                    <span
                      title={k === "roster" ? `등록된 원정대 ${n}개` : `편성된 파티 ${n}개`}
                      style={{
                        minWidth: 18, height: 18, padding: "0 5px", borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center",
                        fontFamily: mono, fontSize: 10, fontWeight: 700, lineHeight: 1,
                        background: on ? "rgba(11,13,16,.85)" : "rgba(255,255,255,.1)", color: on ? "#FF4B57" : "#C6CDD4"
                      }}
                    >
                      {n}
                    </span>
                  );
                })()}
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
            {(() => {
              const meta = {
                connecting: ["#8B949E", "연결 중", "서버에 연결하는 중입니다"],
                live: ["#C8F24C", "실시간 공유", "모든 사람이 같은 원정대/파티/클리어 상태를 봅니다 (2초마다 갱신)"],
                local: ["#E5C04C", "공유 저장소 미설정", "서버 저장소(Supabase 등) 환경변수가 없어 이 서버 메모리에만 저장됩니다"],
                error: ["#E1424F", "동기화 오류", "서버와 통신하지 못했습니다. 자동으로 다시 시도합니다"],
              }[syncStatus];
              return (
                <div className="syncPill" title={`${meta[1]} — ${meta[2]}`} aria-label={meta[1]} style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(27,32,39,.7)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 999, padding: "10px", fontSize: 11, color: meta[0], whiteSpace: "nowrap" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: meta[0], animation: "pulseDot 1.6s infinite" }} />
                </div>
              );
            })()}
            <button
              className="nameBtn"
              onClick={() => { setNameDraft(actorName); setNameOpen(true); }}
              title="변경 기록에 남을 내 이름"
              style={{ background: "transparent", color: actorName ? "#C6CDD4" : "#8B949E", border: "1px solid rgba(255,255,255,.14)", borderRadius: 999, padding: "7px 13px", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis" }}
            >
              <span className="btnIcon">👤</span>
              <span className="btnLabel">👤 {actorName || "이름 설정"}</span>
            </button>
            <button
              className="adminBtn"
              onClick={() => { if (isAdmin) adminLogout(); else { setAdminErr(""); setAdminOpen(true); } }}
              title={isAdmin ? "관리자 로그아웃" : "관리자 로그인"}
              style={{ background: isAdmin ? "rgba(200,242,76,.14)" : "transparent", color: isAdmin ? "#C8F24C" : "#8B949E", border: `1px solid ${isAdmin ? "rgba(200,242,76,.4)" : "rgba(255,255,255,.14)"}`, borderRadius: 999, padding: "7px 13px", fontSize: 12, fontWeight: isAdmin ? 700 : 500, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              <span className="btnIcon">{isAdmin ? "🔓" : "🔒"}</span>
              <span className="btnLabel">{isAdmin ? "관리자 ✓ 로그아웃" : "관리자"}</span>
            </button>
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
                    대표 캐릭터명으로 원정대 등록 → 캐릭터별 클리어 체크 → 직업·원정대 중복 없이 최적 파티 자동 조합 → 수동 편집과 클리어 체크까지. 등록·편성·클리어는 접속한 모든 사람에게 실시간으로 공유됩니다.
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
                              <div style={{ fontFamily: "'Archivo'", fontWeight: 800, fontSize: 18, lineHeight: 1.15 }}>{CATEGORY_TITLE[cat]}</div>
                              <div style={{ fontFamily: mono, fontSize: 10, color: "#C6CDD4" }}>{raids[0].type}인</div>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                              {raids.map(r => (
                                <span key={r.id} style={{ fontSize: 10, color: "#C6CDD4", background: "rgba(11,13,16,.6)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 999, padding: "3px 8px", whiteSpace: "nowrap" }}>
                                  {raidDiff(r)} <span style={{ fontFamily: mono, color: "#C8F24C" }}>{r.minLevel}</span>
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
                    <div style={sub}>공대원 대표 캐릭터명을 등록하면 1700 이상 캐릭터의 레벨·전투력을 불러옵니다. 캐릭터마다 매칭 참여/제외를 정하고, ⚙ 레이드 설정으로 갈 레이드와 이미 클리어한 레이드를 체크하세요.</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ fontFamily: mono, fontSize: 12, color: "#8B949E" }}>
                      원정대 <span style={{ color: "#C8F24C" }}>{memberList.length}</span> · 캐릭터 <span style={{ color: "#E8EAEC" }}>{activeChars}</span>/{totalChars}
                    </div>
                    {memberList.length > 0 && (
                      <button onClick={handleRefreshAll} disabled={loading} title="모든 원정대의 레벨·전투력·캐릭터를 다시 불러옵니다" style={{ ...btnGhost, padding: "9px 14px", fontSize: 12, opacity: loading ? .7 : 1 }}>
                        {refreshAllProgress ? `갱신 중… ${refreshAllProgress.done + 1}/${refreshAllProgress.total}` : "↻ 전체 원정대 갱신"}
                      </button>
                    )}
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
                  <input
                    type="text"
                    value={searchRealName}
                    onChange={(e) => setSearchRealName(e.target.value)}
                    placeholder="실명 (선택)"
                    style={{ ...input, flex: "0 1 180px", minWidth: 120 }}
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
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {rosterGroups.map((g, gi) => {
                      const st = charStats(g.accounts.flatMap(a => a.characters));
                      return (
                        <div key={g.key} style={{ ...card, padding: 0, overflow: "hidden", border: `1px solid ${g.accounts.length > 1 ? "rgba(180,120,255,.35)" : "#2C333C"}`, animation: fadeUp, animationDelay: `${gi * 50}ms` }}>
                          {/* 사람(본계정+부계정) 단위 헤더 */}
                          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", padding: "16px 18px", background: "linear-gradient(90deg,#1E242C 0%,#14181D 100%)", borderBottom: "1px solid #262C34" }}>
                            <div style={{ minWidth: 0, flex: "1 1 220px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#C8F24C", flex: "none" }} />
                                <span style={{ fontFamily: "'Archivo'", fontWeight: 800, fontSize: 22, wordBreak: "break-all" }}>{g.main.owner}</span>
                                {realNameOf(g.main.owner) && <span style={{ fontSize: 14, fontWeight: 600, color: "#C6CDD4" }}>{realNameOf(g.main.owner)}</span>}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                                <span style={{ fontSize: 11, color: "#8B949E" }}>{g.accounts.length > 1 ? `원정대 ${g.accounts.length}개 통합` : "원정대 1개"}</span>
                                {g.accounts.filter(a => a !== g.main).map(a => (
                                  <span key={a.owner} style={{ fontSize: 10, color: SUB_COLOR, background: "rgba(180,120,255,.12)", border: "1px solid rgba(180,120,255,.35)", borderRadius: 999, padding: "2px 8px" }}>🔗 {a.owner}</span>
                                ))}
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              {[
                                ["캐릭터", `${st.active}/${st.count}`, "#E8EAEC"],
                                ["평균 레벨", st.avgLevel, "#C8F24C"],
                                ["평균 전투력", st.avgCP, "#E8EAEC"],
                                ["최고 레벨", st.maxLevel, "#E8EAEC"],
                              ].map(([label, value, color]) => (
                                <div key={label} style={{ minWidth: 92, background: "rgba(11,13,16,.55)", border: "1px solid #2C333C", borderRadius: 12, padding: "8px 12px" }}>
                                  <div style={{ fontSize: 10, color: "#8B949E" }}>{label}</div>
                                  <div style={{ fontFamily: mono, fontSize: 15, fontWeight: 600, color, marginTop: 2 }}>{value}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 원정대(계정)별 캐릭터를 가로로 나열 */}
                          {g.accounts.map(a => {
                            const ast = charStats(a.characters);
                            const isMain = a === g.main;
                            return (
                              <div key={a.owner} style={{ padding: "12px 18px 16px", borderTop: isMain ? "none" : "1px dashed #2C333C" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                                  <span style={{ fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "2px 8px", ...(isMain
                                    ? { color: "#C8F24C", background: "rgba(200,242,76,.1)", border: "1px solid rgba(200,242,76,.3)" }
                                    : { color: SUB_COLOR, background: "rgba(180,120,255,.12)", border: "1px solid rgba(180,120,255,.35)" }) }}>{isMain ? "본계정" : "부계정"}</span>
                                  <span style={{ fontSize: 14, fontWeight: 700 }}>{a.owner} 원정대</span>
                                  <input
                                    key={`${a.owner}-${a.realName || ""}`}
                                    defaultValue={a.realName || ""}
                                    onBlur={(e) => { if ((a.realName || "") !== e.target.value.trim()) handleSetRealName(a.owner, e.target.value); }}
                                    onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                                    placeholder={isMain ? "실명 입력" : (realNameOf(a.owner) ? `실명 (${realNameOf(a.owner)})` : "실명 입력")}
                                    title="실명 — 입력 후 Enter 또는 바깥을 누르면 저장됩니다"
                                    style={{ ...input, width: 120, padding: "5px 9px", fontSize: 12, borderRadius: 8 }}
                                  />
                                  {g.accounts.length > 1 && (
                                    <span style={{ fontFamily: mono, fontSize: 11, color: "#8B949E" }}>
                                      {ast.count}캐릭 · 평균 Lv <span style={{ color: "#C8F24C" }}>{ast.avgLevel}</span> · 평균 CP {ast.avgCP}
                                    </span>
                                  )}
                                  <div style={{ flex: 1 }} />
                                  {memberList.length > 1 && (
                                    <select
                                      value={a.mainAccount || ""}
                                      onChange={(e) => handleSetMainAccount(a.owner, e.target.value)}
                                      title="이 원정대를 다른 원정대의 부계정으로 지정하면 한 사람으로 묶이고, 자동 조합 시 같은 레이드 파티에 함께 편성되지 않습니다."
                                      style={{ ...selectStyle, fontSize: 11, padding: "6px 8px", borderRadius: 8, maxWidth: 200 }}
                                    >
                                      <option value="">본계정 (연결 없음)</option>
                                      {memberList.filter(o => o.owner !== a.owner).map((o, i) => (
                                        <option key={i} value={o.owner}>{o.owner} 의 부계정</option>
                                      ))}
                                    </select>
                                  )}
                                  <button onClick={() => handleRefreshMember(a.owner)} disabled={loading} title="원정대 정보 갱신" style={{ ...btnSmall, opacity: loading ? .6 : 1 }}>↻ 갱신</button>
                                  <button onClick={() => handleRemoveMember(a.owner)} title="원정대 삭제" style={{ ...btnSmall, background: "transparent", color: "#6B737C" }}>삭제 ×</button>
                                </div>
                                <div className="charGrid6">
                                  {a.characters.map((c, cIdx) => (
                                    <div key={cIdx}>{renderManageCard(c, a.owner)}</div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
                {memberList.length > 0 && (
                  <button onClick={() => { logAction("최적 파티 자동 조합"); generateParties(); setScreen("parties"); }} style={{ ...btnPrimary, width: "100%", padding: 13 }}>⚡ 등록한 원정대로 최적 파티 자동 조합</button>
                )}
              </div>
            )}

            {/* CLEAR STATUS */}
            {screen === "clear" && (() => {
              const owners = clearOwner && memberList.some(m => m.owner === clearOwner)
                ? memberList.filter(m => m.owner === clearOwner) : memberList;
              const catStats = RAID_CATEGORIES.map(cat => {
                let left = 0, done = 0;
                memberList.forEach(m => m.characters.forEach(c => {
                  if (c.isExcluded) return;
                  const st = raidStatus(m.owner, c, cat).state;
                  if (st === "pending" || st === "assigned") left++;
                  else if (st === "done" || st === "cleared") done++;
                }));
                return { cat, left, done };
              });
              const clearGrid = `minmax(230px,1.5fr) repeat(${RAID_CATEGORIES.length},minmax(118px,1fr))`;
              const cellLabel = (st) => {
                switch (st.state) {
                  case "locked": return ["—", "레벨 미달"];
                  case "done": return ["✓ 클리어", "체크 완료"];
                  case "cleared": return ["✓ 클리어", `${raidDiff(st.raid)} · 파티 클리어`];
                  case "assigned": return [raidDiff(st.raid), `파티 ${st.party.partyNum} 편성`];
                  default: return [raidDiff(st.raid), partyResult.length ? "미편성" : "남음"];
                }
              };
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: fadeUp }}>
                  <div>
                    <div style={h1}>클리어 현황</div>
                    <div style={sub}>파티별 클리어 탭에서 다녀온 파티를 체크하고, 캐릭터별 현황에서 각 캐릭터가 이번 주 어떤 레이드를 남겨두고 있는지 확인하세요.</div>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => setClearTab("party")} style={pill(clearTab === "party", "#C8F24C")}>파티별 클리어</button>
                    <button onClick={() => setClearTab("char")} style={pill(clearTab === "char", "#C8F24C")}>캐릭터별 현황</button>
                    <div style={{ flex: 1 }} />
                    <button
                      onClick={handleWeeklyReset}
                      title="수요일 리셋: 파티 클리어 표시와 캐릭터 클리어 체크를 모두 되돌립니다"
                      style={{ ...btnGhost, padding: "9px 14px", fontSize: 12, color: "#E5C04C", border: "1px solid rgba(229,192,76,.4)", background: "rgba(229,192,76,.08)" }}
                    >
                      ↺ 주간 초기화
                    </button>
                  </div>

                  {clearTab === "party" ? renderPartyClear() : (<>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
                    {catStats.map(({ cat, left, done }, i) => {
                      const total = left + done;
                      const pct = total ? Math.round((done / total) * 100) : 0;
                      return (
                        <div key={cat} style={{ position: "relative", overflow: "hidden", borderRadius: 16, border: "1px solid #2C333C", background: "#14181D", padding: "14px 16px", animation: fadeUp, animationDelay: `${i * 60}ms` }}>
                          <img src={getRaidIllustration(RAID_LIST.find(r => r.category === cat).id)} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: .18 }} />
                          <div style={{ position: "relative" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{CATEGORY_TITLE[cat]}</div>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 8 }}>
                              <span style={{ fontFamily: "'Archivo'", fontWeight: 800, fontSize: 28, color: left ? "#E5C04C" : "#C8F24C" }}>{left}</span>
                              <span style={{ fontSize: 11, color: "#8B949E" }}>캐릭터 남음 · 완료 {done}</span>
                            </div>
                            <div style={{ height: 4, borderRadius: 999, background: "rgba(255,255,255,.08)", overflow: "hidden", marginTop: 10 }}>
                              <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#2FD3B7,#C8F24C)", borderRadius: 999, transition: "width .4s ease" }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", background: "#14181D", border: "1px solid #262C34", borderRadius: 14, padding: "10px 12px" }}>
                    <div data-scrollx="1" style={{ display: "flex", gap: 6, minWidth: 0 }}>
                      <button onClick={() => setClearOwner("")} style={pill(!clearOwner || !memberList.some(m => m.owner === clearOwner))}>전체 원정대</button>
                      {memberList.map(m => (
                        <button key={m.owner} onClick={() => setClearOwner(m.owner)} style={pill(clearOwner === m.owner)}>{ownerLabel(m.owner)}</button>
                      ))}
                    </div>
                    <div style={{ flex: 1 }} />
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 11 }}>
                      {[["pending", "남음"], ["assigned", "파티 편성"], ["cleared", "파티 클리어"], ["done", "클리어 체크"]].map(([k, label]) => (
                        <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#8B949E" }}>
                          <span style={{ width: 9, height: 9, borderRadius: 3, background: STATUS_STYLE[k].bg, border: `1px solid ${STATUS_STYLE[k].border}` }} />{label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {memberList.length === 0 ? (
                    <div style={{ ...card, fontSize: 13, color: "#8B949E", textAlign: "center", padding: "34px 18px" }}>
                      등록된 원정대가 없습니다. 원정대 탭에서 먼저 등록해주세요.
                    </div>
                  ) : owners.map(m => (
                    <div key={m.owner} data-scrollx="1" style={{ ...card, padding: 0 }}>
                      <div style={{ minWidth: 780 }}>
                        <div style={{ display: "grid", gridTemplateColumns: clearGrid, gap: 8, alignItems: "center", padding: "12px 14px", background: "#1B2027", borderBottom: "1px solid #262C34" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                            <span style={{ width: 9, height: 9, borderRadius: "50%", background: m.mainAccount ? SUB_COLOR : "#C8F24C", flex: "none" }} />
                            <span style={{ fontFamily: "'Archivo'", fontWeight: 700, fontSize: 16, wordBreak: "break-all" }}>{m.owner}</span>
                            {realNameOf(m.owner) && <span style={{ fontSize: 12, color: "#A8B0B9", whiteSpace: "nowrap" }}>{realNameOf(m.owner)}</span>}
                          </div>
                          {RAID_CATEGORIES.map(cat => (
                            <div key={cat} style={{ fontSize: 11, color: "#A8B0B9", fontWeight: 600, textAlign: "center", lineHeight: 1.3 }}>{CATEGORY_TITLE[cat]}</div>
                          ))}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          {m.characters.map(c => (
                            <div key={c.charName} style={{ display: "grid", gridTemplateColumns: clearGrid, gap: 8, alignItems: "center", padding: "8px 14px", borderBottom: "1px solid #1F242B", opacity: c.isExcluded ? .4 : 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                                {charThumb(c, 54, 62, 1.6)}
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: 15, fontWeight: 700, wordBreak: "break-all", lineHeight: 1.25 }}>{c.charName}</div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 3 }}>
                                    {classLine(c, "#A8B0B9", 13)}
                                    <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: "#C8F24C" }}>{c.level}</span>
                                  </div>
                                  {c.isExcluded && <div style={{ fontSize: 10, color: "#E1424F" }}>매칭 제외</div>}
                                </div>
                              </div>
                              {RAID_CATEGORIES.map(cat => {
                                const st = raidStatus(m.owner, c, cat);
                                const sty = STATUS_STYLE[st.state];
                                const [main, subLabel] = cellLabel(st);
                                const locked = st.state === "locked";
                                return (
                                  <div
                                    key={cat}
                                    title={locked ? "레벨 미달" : st.raid ? st.raid.name : CATEGORY_TITLE[cat]}
                                    style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, minHeight: 46, borderRadius: 10, background: sty.bg, border: `1px solid ${sty.border}`, color: sty.color, padding: "6px 4px", textAlign: "center" }}
                                  >
                                    <span style={{ fontSize: 12, fontWeight: 700 }}>{main}</span>
                                    <span style={{ fontSize: 10, opacity: .8, whiteSpace: "nowrap" }}>{subLabel}</span>
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  </>)}
                </div>
              );
            })()}

            {/* LOG (변경 기록, 관리자 전용) */}
            {screen === "log" && isAdmin && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: fadeUp }}>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                  <div>
                    <div style={h1}>변경 기록</div>
                    <div style={sub}>누가 언제 무엇을 바꿨는지 최근 400건까지 보관합니다. 관리자만 볼 수 있으며, 이름은 각자 상단 👤 버튼에서 정한 이름입니다.</div>
                  </div>
                  <button onClick={loadLog} style={{ ...btnGhost, padding: "9px 14px", fontSize: 12 }}>↻ 새로고침</button>
                </div>
                {logError && <div style={{ ...card, color: "#E1424F", fontSize: 13 }}>{logError}</div>}
                {!logEntries ? (
                  <div style={{ ...card, color: "#8B949E", fontSize: 13 }}>불러오는 중…</div>
                ) : logEntries.length === 0 ? (
                  <div style={{ ...card, color: "#8B949E", fontSize: 13, textAlign: "center", padding: "34px 18px" }}>아직 기록이 없습니다.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {logEntries.map((e, i) => {
                      const d = new Date(e.at);
                      const when = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
                      return (
                        <div key={`${e.at}-${i}`} style={{ ...card, padding: "12px 16px", display: "grid", gridTemplateColumns: "120px minmax(0,1fr)", gap: 14 }} className="logRow">
                          <div>
                            <div style={{ fontFamily: mono, fontSize: 12, color: "#C6CDD4" }}>{when}</div>
                            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4, wordBreak: "break-all" }}>{e.actor}</div>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
                            {!!(e.actions && e.actions.length) && (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                                {e.actions.map((a, k) => (
                                  <span key={k} style={{ fontSize: 11, fontWeight: 700, color: "#C8F24C", background: "rgba(200,242,76,.1)", border: "1px solid rgba(200,242,76,.3)", borderRadius: 999, padding: "2px 9px" }}>{a}</span>
                                ))}
                              </div>
                            )}
                            {(e.changes || []).map((c, k) => (
                              <div key={k} style={{ fontSize: 12, color: "#C6CDD4", lineHeight: 1.5, wordBreak: "break-all" }}>· {c}</div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* RAIDS (레이드 관리) */}
            {screen === "raids" && (() => {
              const commitText = (cur, fn) => (e) => {
                const v = e.target.value.trim();
                if (!v) { e.target.value = cur; return; }
                if (v !== cur) fn(v);
              };
              const commitLevel = (cur, fn) => (e) => {
                const v = Math.round(Number(e.target.value));
                if (!Number.isFinite(v) || v <= 0) { e.target.value = cur; return; }
                if (v !== cur) fn(v);
              };
              const enterBlur = (e) => { if (e.key === "Enter") e.currentTarget.blur(); };
              const imageUploadButton = (onDone) => (
                <label title="내 컴퓨터의 이미지로 배경 설정" style={{ ...btnSmall, display: "inline-flex", alignItems: "center", padding: "0 11px", cursor: uploading ? "default" : "pointer", opacity: uploading ? .6 : 1, flex: "none" }}>
                  {uploading ? "올리는 중…" : "📁 내 PC"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={uploading}
                    style={{ display: "none" }}
                    onChange={async (e) => { const f = e.target.files && e.target.files[0]; e.target.value = ""; const url = await uploadRaidImage(f); if (url) onDone(url); }}
                  />
                </label>
              );
              const field = { ...input, padding: "8px 10px", fontSize: 13, borderRadius: 9 };
              const label = { fontSize: 11, color: "#8B949E", marginBottom: 5 };
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: fadeUp }}>
                  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                    <div>
                      <div style={h1}>레이드 관리</div>
                      <div style={sub}>자동 조합에 쓰이는 레이드 목록입니다. 새 레이드나 난이도를 추가하고 이름·인원·입장 레벨을 바꿀 수 있으며, 모든 사람에게 같이 적용됩니다. 이미 짜둔 파티는 그대로이고, 다음 자동 조합부터 반영됩니다.</div>
                    </div>
                    <button
                      onClick={requireAdmin(() => { if (window.confirm("레이드 목록을 기본값으로 되돌릴까요? 추가하거나 바꾼 레이드가 모두 사라집니다.")) saveRaids(DEFAULT_RAIDS); })}
                      title={isAdmin ? "" : "관리자만 할 수 있습니다"}
                      style={{ ...btnSmall, background: "transparent", color: "#8B949E", padding: "9px 12px" }}
                    >
                      {isAdmin ? "" : "🔒 "}기본 목록으로 초기화
                    </button>
                  </div>

                  {/* 새 레이드 추가 */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const series = newRaid.series.trim();
                      const diff = newRaid.diff.trim();
                      const lv = Math.round(Number(newRaid.minLevel));
                      if (!series || !diff) return alert("레이드 이름과 난이도를 입력해주세요.");
                      if (!Number.isFinite(lv) || lv <= 0) return alert("입장 레벨을 숫자로 입력해주세요.");
                      if (RAID_LIST.some(r => (r.series || CATEGORY_TITLE[r.category]) === series)) return alert("같은 이름의 레이드가 이미 있습니다. 아래 목록에서 난이도를 추가해주세요.");
                      addSeries({ series, diff, type: newRaid.type, minLevel: lv, image: newRaid.image });
                      setNewRaid(r => ({ ...r, series: "", diff: "노말" }));
                    }}
                    style={{ ...card, display: "flex", flexDirection: "column", gap: 12 }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 700 }}>새 레이드 추가</div>
                    <div style={{ display: "grid", gridTemplateColumns: "minmax(200px,2fr) minmax(110px,1fr) 110px 130px minmax(200px,1.4fr) auto", gap: 10, alignItems: "end" }} className="raidForm">
                      <div>
                        <div style={label}>레이드 이름</div>
                        <input value={newRaid.series} onChange={(e) => setNewRaid(r => ({ ...r, series: e.target.value }))} placeholder="예: 3막:칠흑, 폭풍의 밤" style={{ ...field, width: "100%" }} />
                      </div>
                      <div>
                        <div style={label}>첫 난이도</div>
                        <input value={newRaid.diff} onChange={(e) => setNewRaid(r => ({ ...r, diff: e.target.value }))} placeholder="노말 / 1단계" style={{ ...field, width: "100%" }} />
                      </div>
                      <div>
                        <div style={label}>인원</div>
                        <select value={newRaid.type} onChange={(e) => setNewRaid(r => ({ ...r, type: Number(e.target.value) }))} style={{ ...field, width: "100%", cursor: "pointer" }}>
                          <option value={8}>8인</option>
                          <option value={4}>4인</option>
                        </select>
                      </div>
                      <div>
                        <div style={label}>입장 레벨</div>
                        <input type="number" value={newRaid.minLevel} onChange={(e) => setNewRaid(r => ({ ...r, minLevel: e.target.value }))} style={{ ...field, width: "100%", fontFamily: mono }} />
                      </div>
                      <div>
                        <div style={label}>배경 이미지</div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <select value={newRaid.image} onChange={(e) => setNewRaid(r => ({ ...r, image: e.target.value }))} style={{ ...field, width: "100%", minWidth: 0, cursor: "pointer" }}>
                            {!RAID_IMAGES.some(([, src]) => src === newRaid.image) && <option value={newRaid.image}>업로드한 이미지</option>}
                            {RAID_IMAGES.map(([n, src]) => <option key={src} value={src}>{n}</option>)}
                          </select>
                          {imageUploadButton(url => setNewRaid(r => ({ ...r, image: url })))}
                        </div>
                      </div>
                      <button type="submit" style={{ ...btnPrimary, padding: "10px 16px" }}>+ 추가</button>
                    </div>
                  </form>

                  {/* 레이드별 목록 */}
                  {RAID_CATEGORIES.map((cat, ci) => {
                    const raids = RAID_LIST.filter(r => r.category === cat).sort((a, b) => a.minLevel - b.minLevel);
                    const head = raids[0];
                    const series = head.series || CATEGORY_TITLE[cat];
                    const image = getRaidIllustration(head.id);
                    return (
                      <div key={cat} style={{ ...card, padding: 0, overflow: "hidden", animation: fadeUp, animationDelay: `${ci * 40}ms` }}>
                        <div style={{ position: "relative", overflow: "hidden", padding: "16px 18px", borderBottom: "1px solid #262C34" }}>
                          <img src={image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: .28 }} />
                          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,rgba(20,24,29,.92) 0%,rgba(20,24,29,.6) 100%)" }} />
                          <div style={{ position: "relative", display: "flex", alignItems: "flex-end", gap: 10, flexWrap: "wrap" }}>
                            <div style={{ flex: "1 1 260px" }}>
                              <div style={label}>레이드 이름</div>
                              <input
                                key={`s-${cat}-${series}`}
                                defaultValue={series}
                                onBlur={commitText(series, v => updateSeries(cat, { series: v }))}
                                onKeyDown={enterBlur}
                                style={{ ...field, width: "100%", fontFamily: "'Archivo'", fontWeight: 800, fontSize: 18, background: "rgba(11,13,16,.7)" }}
                              />
                            </div>
                            <div>
                              <div style={label}>인원</div>
                              <select value={head.type} onChange={(e) => updateSeries(cat, { type: Number(e.target.value) })} style={{ ...field, cursor: "pointer", background: "rgba(11,13,16,.7)" }}>
                                <option value={8}>8인 (서폿 2 + 딜러 6)</option>
                                <option value={4}>4인 (서폿 1 + 딜러 3)</option>
                              </select>
                            </div>
                            <div>
                              <div style={label}>배경 이미지</div>
                              <div style={{ display: "flex", gap: 6 }}>
                                <select value={image} onChange={(e) => updateSeries(cat, { image: e.target.value })} style={{ ...field, cursor: "pointer", background: "rgba(11,13,16,.7)" }}>
                                  {!RAID_IMAGES.some(([, src]) => src === image) && <option value={image}>업로드한 이미지</option>}
                                  {RAID_IMAGES.map(([n, src]) => <option key={src} value={src}>{n}</option>)}
                                </select>
                                {imageUploadButton(url => updateSeries(cat, { image: url }))}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={requireAdmin(() => { if (window.confirm(`'${series}' 레이드(난이도 ${raids.length}개)를 삭제할까요?`)) removeSeries(cat); })}
                              title={isAdmin ? "레이드 삭제" : "관리자만 삭제할 수 있습니다"}
                              style={{ ...btnSmall, background: "rgba(225,66,79,.1)", color: "#E1424F", border: "1px solid rgba(225,66,79,.35)", padding: "9px 12px", opacity: isAdmin ? 1 : .6 }}
                            >
                              {isAdmin ? "" : "🔒 "}레이드 삭제
                            </button>
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: 12 }}>
                          <div style={{ display: "grid", gridTemplateColumns: "minmax(140px,1fr) 150px 70px", gap: 10, padding: "0 4px", fontSize: 11, color: "#8B949E" }}>
                            <div>난이도</div><div>입장 레벨</div><div />
                          </div>
                          {raids.map(r => (
                            <div key={r.id} data-row="1" style={{ display: "grid", gridTemplateColumns: "minmax(140px,1fr) 150px 70px", gap: 10, alignItems: "center", background: "#1B2027", border: "1px solid #262C34", borderRadius: 10, padding: "6px 8px" }}>
                              <input
                                key={`d-${r.id}-${raidDiff(r)}`}
                                defaultValue={raidDiff(r)}
                                onBlur={commitText(raidDiff(r), v => updateRaid(r.id, { diff: v }))}
                                onKeyDown={enterBlur}
                                style={{ ...field, fontWeight: 600 }}
                              />
                              <input
                                key={`l-${r.id}-${r.minLevel}`}
                                type="number"
                                defaultValue={r.minLevel}
                                onBlur={commitLevel(r.minLevel, v => updateRaid(r.id, { minLevel: v }))}
                                onKeyDown={enterBlur}
                                style={{ ...field, fontFamily: mono, color: "#C8F24C" }}
                              />
                              <button
                                type="button"
                                disabled={raids.length === 1}
                                onClick={requireAdmin(() => { if (window.confirm(`'${r.name}' 난이도를 삭제할까요?`)) removeRaid(r.id); })}
                                title={raids.length === 1 ? "마지막 난이도는 '레이드 삭제'로 지워주세요" : isAdmin ? "이 난이도 삭제" : "관리자만 삭제할 수 있습니다"}
                                style={{ ...btnSmall, background: "transparent", color: "#6B737C", opacity: raids.length === 1 ? .4 : 1 }}
                              >
                                {isAdmin ? "" : "🔒 "}삭제
                              </button>
                            </div>
                          ))}
                          <button type="button" onClick={() => addDifficulty(cat)} style={{ ...btnSmall, borderStyle: "dashed", background: "transparent", color: "#A8B0B9", padding: "9px 10px", marginTop: 2 }}>
                            + 난이도 추가
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

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
                  <button
                    onClick={copyPartyText}
                    disabled={!displayedParties.length}
                    title="지금 보이는 파티 목록을 디스코드/카톡에 붙여넣기 좋은 글로 복사"
                    style={{ ...btnGhost, padding: "10px 16px", opacity: displayedParties.length ? 1 : .5, ...(copied ? { color: "#C8F24C", border: "1px solid rgba(200,242,76,.45)" } : {}) }}
                  >
                    {copied ? "✓ 복사됨" : "📋 텍스트 복사"}
                  </button>
                  <div style={{ flex: 1 }} />
                  {generateBtn(btnPrimary)}
                </div>

                {/* filters */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", background: "#14181D", border: "1px solid #262C34", borderRadius: 14, padding: "10px 12px" }}>
                  <div data-scrollx="1" style={{ display: "flex", gap: 6, minWidth: 0 }}>
                    <button onClick={() => { setViewMode("all"); setFilterTarget(""); }} style={pill(viewMode === "all")}>전체 보기</button>
                    <button onClick={() => { setViewMode("raid"); setFilterTarget(RAID_LIST[0]?.name || ""); }} style={pill(viewMode === "raid")}>레이드별</button>
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
                        <option key={idx} value={m.owner}>{ownerLabel(m.owner)} 원정대</option>
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
                    <span>
                      캐릭터를 클릭해 선택한 뒤, 교체할 <b>다른 캐릭터</b>나 <b>빈 자리</b>를 클릭하세요.{isTableView ? " (표에서도 이름을 눌러 편집할 수 있습니다)" : ""}
                      {swapTarget && <span style={{ marginLeft: 6, color: "#C8F24C", fontWeight: 600 }}>· 선택됨: {swapTarget.charName}</span>}
                    </span>
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
                          <th style={{ padding: "8px 12px", fontWeight: 500, textAlign: "center", width: 96 }}>클리어</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedParties.map((party, index) => {
                          const isSingle = isSingleParty(party);
                          const totalCP = (party.members || []).reduce((acc, cur) => acc + cur.combatPower, 0);
                          const avgCP = (party.members && party.members.length > 0) ? Math.floor(totalCP / party.members.length) : 0;
                          const td = { padding: "10px 12px", background: "#1B2027", borderTop: "1px solid #262C34", borderBottom: "1px solid #262C34", verticalAlign: "middle" };
                          // 수동 편집 모드에서는 이름 칩을 눌러 교체 / 빈 자리로 이동
                          const names = (list, group, cap) => (
                            <span style={{ display: "inline-flex", flexWrap: "wrap", gap: 5, verticalAlign: "middle" }}>
                              {list.map((m, idx) => {
                                const selected = isEditMode && swapTarget && swapTarget.partyId === party.id
                                  && swapTarget.owner === m.owner && swapTarget.charName === m.charName;
                                const ownerHit = viewMode === "owner" && filterTarget && m.owner === filterTarget;
                                return (
                                  <span
                                    key={idx}
                                    onClick={isEditMode ? () => handleSlotClick(party.id, group, m) : undefined}
                                    title={`${ownerLabel(m.owner)} · ${m.className} · Lv.${m.level}`}
                                    style={{
                                      display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap", borderRadius: 999, padding: "3px 9px 3px 6px",
                                      background: selected ? "rgba(200,242,76,.16)" : ownerHit ? "rgba(229,192,76,.14)" : "#20262E",
                                      border: `1px solid ${selected ? "#C8F24C" : ownerHit ? "rgba(229,192,76,.5)" : isEditMode ? "#3A434E" : "#2C333C"}`,
                                      color: selected ? "#C8F24C" : ownerHit ? "#F2D98A" : "#D5DBE1",
                                      cursor: isEditMode ? "pointer" : "default"
                                    }}
                                  >
                                    {CLASS_ICONS[m.className] && <img src={CLASS_ICONS[m.className]} alt={m.className} style={{ width: 12, height: 12, opacity: .85 }} />}
                                    {m.charName}
                                    <RoleIcon sup={HYBRID_CLASSES.includes(m.className) && m.role === "서포터"} size={10} />
                                  </span>
                                );
                              })}
                              {isEditMode && Array.from({ length: Math.max(0, cap - list.length) }).map((_, eIdx) => (
                                <span
                                  key={`e-${eIdx}`}
                                  onClick={swapTarget ? () => handleSlotClick(party.id, group, null) : undefined}
                                  style={{ display: "inline-flex", alignItems: "center", borderRadius: 999, padding: "3px 10px", fontSize: 11, whiteSpace: "nowrap",
                                    border: `1px dashed ${swapTarget ? "rgba(200,242,76,.6)" : "#333B45"}`, color: swapTarget ? "#C8F24C" : "#4A525C",
                                    cursor: swapTarget ? "pointer" : "default" }}
                                >
                                  {swapTarget ? "+ 여기로" : "빈 자리"}
                                </span>
                              ))}
                            </span>
                          );
                          return (
                            <tr key={party.id} style={{ opacity: party.cleared ? .45 : 1 }}>
                              <td style={{ ...td, borderLeft: "1px solid #262C34", borderRadius: "12px 0 0 12px", fontFamily: mono, color: "#8B949E" }}>{String(index + 1).padStart(2, "0")}</td>
                              <td style={{ ...td, fontWeight: 700, whiteSpace: "nowrap", color: isSingle ? "#B9A4FF" : "#E8EAEC", textDecoration: party.cleared ? "line-through" : "none" }}>{party.raidName}</td>
                              <td style={{ ...td, color: "#C6CDD4" }}>
                                {party.type === 8 && !isSingle ? (
                                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    <div><span style={{ fontFamily: mono, color: G1_COLOR, marginRight: 8, verticalAlign: "middle" }}>1파티</span>{names(party.g1 || [], "g1", 4)}</div>
                                    <div><span style={{ fontFamily: mono, color: G2_COLOR, marginRight: 8, verticalAlign: "middle" }}>2파티</span>{names(party.g2 || [], "g2", 4)}</div>
                                  </div>
                                ) : (
                                  <div>{names(party.members || [], "members", isSingle ? 0 : party.type)}</div>
                                )}
                              </td>
                              <td style={{ ...td, textAlign: "right", fontFamily: mono, whiteSpace: "nowrap" }}>
                                {!isSingle ? (
                                  <span>{totalCP.toLocaleString()} <span style={{ color: "#4A525C" }}>|</span> <span style={{ color: "#8B949E" }}>{avgCP.toLocaleString()}</span></span>
                                ) : <span style={{ color: "#6B737C" }}>—</span>}
                              </td>
                              <td style={{ ...td, borderRight: "1px solid #262C34", borderRadius: "0 12px 12px 0", textAlign: "center" }}>
                                {!isSingle && (party.cleared
                                  ? <span style={{ fontSize: 11, fontWeight: 700, color: "#0B0D10", background: "#C8F24C", borderRadius: 999, padding: "3px 9px", whiteSpace: "nowrap" }}>✓ 클리어</span>
                                  : <span style={{ fontSize: 11, color: "#6B737C", whiteSpace: "nowrap" }}>진행 전</span>)}
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
                                {isSingle ? "미편성" : `${party.type}인 레이드`} · 인원 {(party.members || []).length}{!isSingle && `/${party.type}`} · 권장 Lv.{party.minLevel}
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
                              </div>
                            )}
                          </div>

                          <div style={{ position: "relative", padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                            {party.type === 8 && !isSingle ? (
                              <>
                                {renderGroup(party, "g1", "1파티", G1_COLOR)}
                                {renderGroup(party, "g2", "2파티", G2_COLOR)}
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
        </div>
      </div>

      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: "26px 18px 34px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: mono, fontSize: 11, letterSpacing: ".16em", color: "#5A626C" }}>
          <span style={{ width: 22, height: 1, background: "#2C333C" }} />
          <span>MADE BY 이현 · 개천에서가디언난다</span>
          <span style={{ width: 22, height: 1, background: "#2C333C" }} />
        </div>
        <div style={{ fontFamily: mono, fontSize: 11, color: "#3E454E" }}>오류 및 버그 제보 atom11201202@gmail.com</div>
        <div style={{ fontFamily: mono, fontSize: 10, color: "#3E454E", textAlign: "center" }}>배경 일러스트 © Smilegate RPG · <a href="https://lostark.game.onstove.com/Artwork" target="_blank" rel="noreferrer" style={{ color: "#5A626C" }}>로스트아크 공식 아트웍</a> (CC BY-NC-SA 4.0)</div>
      </div>
    </div>
  );
}
