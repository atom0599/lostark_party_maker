// @ts-nocheck
"use client";

import { useState, useEffect } from "react";

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

  const [selectedCharForConfig, setSelectedCharForConfig] = useState(null);
  const [isTableView, setIsTableView] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
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
    const updatedMembers = memberList.map(m => {
      if (m.owner === ownerName) {
        return {
          ...m,
          characters: m.characters.map(c => {
            if (c.charName === charName) {
              const currentAllowed = c.allowedRaids || RAID_LIST.filter(r => c.level >= r.minLevel).map(r => r.id);
              const newAllowed = currentAllowed.includes(raidId)
                ? currentAllowed.filter(id => id !== raidId)
                : [...currentAllowed, raidId];
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

  const generateParties = () => {
    if (memberList.length === 0) return alert("공대원 원정대를 먼저 등록해주세요!");

    const sortedRaids = [...RAID_LIST].sort((a, b) => b.minLevel - a.minLevel);
    const charCategoryTracker = {};
    const allChars = [];

    memberList.forEach(m => {
      m.characters.forEach(c => {
        if (!c.isExcluded) {
          allChars.push({ ...c, owner: m.owner });
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

      eligibleSupports.sort((a, b) => b.combatPower - a.combatPower);
      eligibleDealers.sort((a, b) => b.combatPower - a.combatPower);

      const assignedParties = [];
      let supports = [...eligibleSupports];
      let dealers = [...eligibleDealers];

      while (supports.length > 0 || dealers.length > 0) {
        let remS = supports.length;
        let remD = dealers.length;
        const maxSup = raid.type === 8 ? 2 : 1;
        const maxDlr = raid.type === 8 ? 6 : 3;
        
        const tempParties = [];
        while(remS > 0 || remD > 0) {
          let takeS = Math.min(remS, maxSup);
          let takeD = Math.min(remD, maxDlr);
          tempParties.push({ targetSup: takeS, targetDlr: takeD, members: [], owners: new Set(), classes: new Set() });
          remS -= takeS;
          remD -= takeD;
        }

        let placedAny = false;
        const getAvg = (p) => p.members.length === 0 ? 0 : p.members.reduce((sum, x) => sum + x.combatPower, 0) / p.members.length;

        for (const sup of [...supports]) {
          const eligible = tempParties.filter(p => {
            const currentSup = p.members.filter(x => x.role === "서포터").length;
            return currentSup < p.targetSup && !p.owners.has(sup.owner) && !p.classes.has(sup.className);
          });

          if (eligible.length > 0) {
            eligible.sort((a, b) => {
              const remA = a.targetSup - a.members.filter(x => x.role === "서포터").length;
              const remB = b.targetSup - b.members.filter(x => x.role === "서포터").length;
              if (remA !== remB) return remB - remA;
              return getAvg(a) - getAvg(b);
            });
            
            const p = eligible[0];
            p.members.push(sup);
            p.owners.add(sup.owner);
            p.classes.add(sup.className);
            supports = supports.filter(s => s !== sup);
            placedAny = true;
          }
        }

        for (const dlr of [...dealers]) {
          const eligible = tempParties.filter(p => {
            const currentDlr = p.members.filter(x => x.role === "딜러").length;
            return currentDlr < p.targetDlr && !p.owners.has(dlr.owner) && !p.classes.has(dlr.className);
          });

          if (eligible.length > 0) {
            eligible.sort((a, b) => {
              const remA = a.targetDlr - a.members.filter(x => x.role === "딜러").length;
              const remB = b.targetDlr - b.members.filter(x => x.role === "딜러").length;
              if (remA !== remB) return remB - remA;
              return getAvg(a) - getAvg(b);
            });
            
            const p = eligible[0];
            p.members.push(dlr);
            p.owners.add(dlr.owner);
            p.classes.add(dlr.className);
            dealers = dealers.filter(d => d !== dlr);
            placedAny = true;
          }
        }

        const validParties = tempParties.filter(p => p.members.length >= 2);
        if (validParties.length > 0) {
          validParties.forEach(p => assignedParties.push(p.members));
        }

        if (!placedAny) break;
      }

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

      const assignedCharKeys = new Set();
      assignedParties.forEach(p => p.forEach(m => assignedCharKeys.add(m.charName + m.owner)));

      const trueLeftovers = [...eligibleSupports, ...eligibleDealers].filter(c => !assignedCharKeys.has(c.charName + c.owner));

      if (trueLeftovers.length > 0) {
        trueLeftovers.forEach(m => {
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
          members: trueLeftovers,
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

  const renderManageCard = (member, ownerName) => {
    const isHybrid = ["바드", "홀리나이트", "도화가", "발키리"].includes(member.className);

    return (
      <div className={`p-3 rounded-xl border text-xs flex flex-col justify-between h-32 relative overflow-hidden transition-all ${
        member.isExcluded 
          ? (isDarkMode ? 'bg-gray-950 border-red-900/30 opacity-40' : 'bg-gray-200 border-red-300 opacity-40') 
          : (isDarkMode ? 'bg-gray-900/70 border-gray-800/60 hover:bg-gray-900' : 'bg-white border-gray-200 shadow-sm hover:bg-gray-50')
      }`}>
        {member.characterImage && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-end">
            <img 
              src={member.characterImage} 
              alt={member.charName} 
              className="h-[105%] w-auto object-cover object-top opacity-65 filter brightness-110 transform translate-x-3 -translate-y-1 scale-100" 
            />
            <div className={`absolute inset-0 bg-gradient-to-r ${isDarkMode ? 'from-gray-950/95 via-gray-950/50' : 'from-white/95 via-white/50'} to-transparent`}></div>
          </div>
        )}

        <div className="flex justify-between items-start gap-1 z-10">
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={!member.isExcluded} 
              onChange={() => handleToggleExclude(ownerName, member.charName)} 
              className="w-4 h-4 cursor-pointer accent-yellow-500 flex-shrink-0 rounded" 
            />
            <button 
              type="button"
              onClick={() => setSelectedCharForConfig({ owner: ownerName, char: member })}
              className={`${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400 border-gray-700' : 'bg-gray-100 hover:bg-gray-200 text-yellow-600 border-gray-300'} text-xs px-1.5 py-0.5 rounded-md border transition-all shadow-sm`}
              title="이 캐릭터가 갈 레이드 세부 설정"
            >
              ⚙️
            </button>
          </div>
        </div>

        <div className="flex flex-col min-w-0 z-10 mt-1">
          <span className={`font-bold text-sm truncate drop-shadow-md ${member.isExcluded ? 'line-through text-gray-500' : (isDarkMode ? 'text-gray-100' : 'text-gray-900')}`}>
            {member.charName}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[11px] flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              직업: 
              {CLASS_ICONS[member.className] && (
                <img src={CLASS_ICONS[member.className]} alt={member.className} className={`w-3.5 h-3.5 ${isDarkMode ? 'opacity-90' : 'invert opacity-80'}`} />
              )}
              <strong className={isDarkMode ? 'text-gray-300' : 'text-gray-800'}>{member.className}</strong>
            </span>
            
            {isHybrid ? (
              <button 
                type="button"
                onClick={() => handleToggleRole(ownerName, member.charName)}
                className={`relative inline-flex h-5 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  member.role === '서포터' ? 'bg-green-600' : 'bg-blue-600'
                }`}
                title="클릭하여 딜러/서포터 전환"
              >
                <span className="sr-only">Role Switch</span>
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  member.role === '서포터' ? 'translate-x-6' : 'translate-x-0'
                }`} />
                <span className="absolute inset-0 flex items-center justify-between px-1 text-[9px] font-bold text-white pointer-events-none">
                  <span>{member.role === '서포터' ? '➕' : ''}</span>
                  <span>{member.role === '딜러' ? '⚔️' : ''}</span>
                </span>
              </button>
            ) : (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${isDarkMode ? 'text-blue-400 bg-blue-950/60 border-blue-950' : 'text-blue-600 bg-blue-50 border-blue-200'}`}>⚔️ 딜러</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 z-10 mt-2">
          <span className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${isDarkMode ? 'bg-black/60 text-yellow-400' : 'bg-white/80 text-yellow-600 shadow-sm'}`}>
            Lv.{member.level}
          </span>
          <span className={`font-semibold text-[11px] px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-black/60 text-blue-300' : 'bg-white/80 text-blue-600 shadow-sm'}`}>
            CP {member.combatPower.toLocaleString()}
          </span>
        </div>
      </div>
    );
  };

  const renderMemberCard = (member, isSingle) => {
    const isTargetOwner = viewMode === "owner" && filterTarget && member.owner === filterTarget;
    const isHybrid = ["바드", "홀리나이트", "도화가", "발키리"].includes(member.className);

    return (
      <div className={`p-3 rounded-xl border text-xs flex flex-col justify-between h-32 relative overflow-hidden transition-all ${
        isTargetOwner 
          ? (isDarkMode ? 'bg-yellow-950/60 border-yellow-500 shadow-lg shadow-yellow-500/25 ring-2 ring-yellow-500' : 'bg-yellow-50 border-yellow-400 shadow-md ring-2 ring-yellow-400') 
          : viewMode === "owner" 
            ? (isDarkMode ? 'bg-gray-950/50 border-gray-900 opacity-40' : 'bg-gray-100 border-gray-200 opacity-40') 
            : isSingle 
              ? (isDarkMode ? 'bg-indigo-950/50 border-indigo-900/40' : 'bg-indigo-50 border-indigo-200') 
              : (isDarkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white border-gray-200 shadow-sm')
      }`}>
        
        {member.characterImage && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-end">
            <img 
              src={member.characterImage} 
              alt={member.charName} 
              className="h-[105%] w-auto object-cover object-top opacity-65 filter brightness-110 transform translate-x-3 -translate-y-1 scale-100" 
            />
            <div className={`absolute inset-0 bg-gradient-to-r ${isDarkMode ? 'from-gray-950/95 via-gray-950/50' : 'from-white/95 via-white/50'} to-transparent`}></div>
          </div>
        )}

        <div className="flex justify-between items-start gap-1 z-10">
          {isHybrid ? (
            <button 
              type="button"
              onClick={() => handleToggleRole(member.owner, member.charName)}
              className={`relative inline-flex h-5 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                member.role === '서포터' ? 'bg-green-600' : 'bg-blue-600'
              }`}
              title="클릭하여 딜러/서포터 전환"
            >
              <span className="sr-only">Role Switch</span>
              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                member.role === '서포터' ? 'translate-x-6' : 'translate-x-0'
              }`} />
              <span className="absolute inset-0 flex items-center justify-between px-1 text-[9px] font-bold text-white pointer-events-none">
                <span>{member.role === '서포터' ? '➕' : ''}</span>
                <span>{member.role === '딜러' ? '⚔️' : ''}</span>
              </span>
            </button>
          ) : (
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold flex items-center gap-1 ${isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
              ⚔️ 딜러
            </span>
          )}
          <div className="w-4"></div>
        </div>

        <div className="flex flex-col min-w-0 z-10 mt-1">
          <span className={`font-bold text-sm truncate drop-shadow-md ${isTargetOwner ? (isDarkMode ? 'text-yellow-200' : 'text-yellow-800') : (isDarkMode ? 'text-gray-100' : 'text-gray-900')}`}>{member.charName}</span>
          <span className={`text-[10px] truncate flex items-center gap-1 ${isTargetOwner ? (isDarkMode ? 'text-yellow-400 font-medium' : 'text-yellow-700 font-medium') : (isDarkMode ? 'text-gray-300' : 'text-gray-600')}`}>
            {member.owner} · 
            {CLASS_ICONS[member.className] && (
              <img src={CLASS_ICONS[member.className]} alt={member.className} className={`w-3 h-3 ${isDarkMode ? 'opacity-90' : 'invert opacity-80'}`} />
            )}
            {member.className}
          </span>
        </div>

        <div className="flex items-center gap-2 z-10 mt-2">
          <span className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${isTargetOwner ? (isDarkMode ? 'text-yellow-300 bg-black/60' : 'text-yellow-800 bg-white/90 shadow-sm') : isSingle ? (isDarkMode ? 'text-indigo-300 bg-black/60' : 'text-indigo-800 bg-white/90 shadow-sm') : (isDarkMode ? 'text-yellow-400 bg-black/60' : 'text-yellow-700 bg-white/90 shadow-sm')}`}>
            Lv.{member.level}
          </span>
          <span className={`font-semibold text-[11px] px-1.5 py-0.5 rounded ${isTargetOwner ? (isDarkMode ? 'text-yellow-300 bg-black/60' : 'text-yellow-800 bg-white/90 shadow-sm') : (isDarkMode ? 'text-blue-300 bg-black/60' : 'text-blue-700 bg-white/90 shadow-sm')}`}>
            CP {member.combatPower.toLocaleString()}
          </span>
        </div>
      </div>
    );
  };

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
      return party.raidName.includes("싱글 / 미편성") || party.type === "single";
    }
    return true;
  });

  return (
    <main className={`min-h-screen ${isDarkMode ? 'bg-gray-950 text-gray-100' : 'bg-gray-100 text-gray-900'} p-8 font-sans transition-colors duration-200`}>
      <div className="max-w-[1720px] mx-auto space-y-8">
        
        {/* 헤더 부분 */}
        <div className={`flex flex-col md:flex-row justify-between items-start md:items-center border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-300'} pb-4 gap-4`}>
          <div className="flex items-center gap-3">
            {/* ⚡ [public/icon.png 로스트아크 아이콘 적용] */}
            <div className="w-11 h-11 rounded-2xl bg-gray-900 border border-yellow-500/50 flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0">
              <img src="/icon.png" alt="LOA Icon" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>LOA SMART PARTY MAKER</h1>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                  By. 이현 (개천에서가디언난다)
                </span>
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>원정대 관리 및 최적 파티 자동 조합 시스템</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            
            {/* 가이드 버튼 */}
            <button 
              onClick={() => setIsGuideOpen(true)}
              className={`${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700' : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300 shadow-sm'} border font-bold px-4 py-2.5 rounded-xl text-sm transition-all flex items-center gap-1.5`}
            >
              <span>📖 사용 가이드</span>
            </button>

            {/* 라이트/다크 모드 전환 스위치 */}
            <div className={`flex items-center gap-2 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300 shadow-sm'} border px-3 py-2 rounded-xl`}>
              <span className="text-xs">☀️</span>
              <button 
                type="button"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`relative inline-flex h-6 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isDarkMode ? 'bg-indigo-600' : 'bg-yellow-500'
                }`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isDarkMode ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
              <span className="text-xs">🌙</span>
            </div>

            {/* 카드/표 전환 스위치 */}
            <div className={`flex items-center gap-3 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300 shadow-sm'} border px-4 py-2 rounded-xl`}>
              <span className={`text-xs font-semibold ${!isTableView ? (isDarkMode ? 'text-yellow-400' : 'text-yellow-600') : 'text-gray-400'}`}>카드 보기</span>
              <button 
                type="button"
                onClick={() => setIsTableView(!isTableView)}
                className={`relative inline-flex h-6 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isTableView ? 'bg-indigo-600' : 'bg-gray-700'
                }`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isTableView ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
              <span className={`text-xs font-semibold ${isTableView ? (isDarkMode ? 'text-indigo-400' : 'text-indigo-600') : 'text-gray-400'}`}>표 요약</span>
            </div>

            <button onClick={generateParties} className="bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-bold px-6 py-2.5 rounded-lg shadow-lg transition-all">
              ⚡ 최적 파티 자동 조합
            </button>
          </div>
        </div>

        {/* 가이드 모달 창 */}
        {isGuideOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className={`${isDarkMode ? 'bg-gray-900 border-gray-800 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} border rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl transition-colors`}>
              <div className={`flex justify-between items-center border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} pb-3`}>
                <h3 className={`text-lg font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>📖 LOA SMART PARTY MAKER 사용 가이드</h3>
                <button 
                  onClick={() => setIsGuideOpen(false)}
                  className={`${isDarkMode ? 'text-gray-400 hover:text-white bg-gray-800' : 'text-gray-600 hover:text-black bg-gray-100'} font-bold px-2 py-1 text-sm rounded-lg`}
                >
                  ✕ 닫기
                </button>
              </div>

              <div className={`text-xs space-y-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed max-h-[60vh] overflow-y-auto pr-2`}>
                <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/40 space-y-1">
                  <strong className="text-indigo-400 text-sm">1. 원정대 등록 방법</strong>
                  <p>상단 입력창에 공대원 대표 캐릭터명을 입력하고 <strong>[원정대 등록]</strong>을 누르면 API를 통해 모든 캐릭터 정보와 레벨, 전투력이 자동으로 불려옵니다.</p>
                </div>

                <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/40 space-y-1">
                  <strong className="text-indigo-400 text-sm">2. 세부 설정 및 직업 전환 (⚙️)</strong>
                  <p>캐릭터 카드 우측 상단의 <strong>⚙️ 버튼</strong>을 누르면 해당 캐릭터가 갈 수 있는 레이드를 직접 커스텀할 수 있습니다. 바드·홀리나이트·도화가·발키리 같은 하이브리드 직업은 카드 상단의 <strong>스위치</strong>를 눌러 딜러/서포터 역할을 전환할 수 있습니다.</p>
                </div>

                <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/40 space-y-1">
                  <strong className="text-indigo-400 text-sm">3. 최적 파티 자동 조합 (⚡)</strong>
                  <p>모든 원정대를 등록한 뒤 <strong>[최적 파티 자동 조합]</strong>을 누르면, 레벨 조건과 직업군(서포터 밸런스, 원정대 중복 방지)을 고려하여 가장 효율적인 파티를 자동으로 구성해 줍니다.</p>
                </div>

                <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/40 space-y-1">
                  <strong className="text-indigo-400 text-sm">4. 보기 방식 및 테마 전환</strong>
                  <p>상단 스위치를 통해 <strong>카드 형태</strong>와 <strong>표 요약 형태</strong>로 자유롭게 전환할 수 있으며, 우측의 ☀️/🌙 버튼으로 라이트 모드와 다크 모드를 바꿀 수 있습니다.</p>
                </div>
              </div>

              <div className={`flex justify-end pt-2 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                <button 
                  onClick={() => setIsGuideOpen(false)}
                  className="bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-bold px-5 py-2 rounded-xl text-sm"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={`${isDarkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-gray-300 shadow-md'} border rounded-2xl p-6 space-y-5 transition-colors`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-base font-bold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'} flex items-center gap-2`}>
              <span>👥</span> 공대원 원정대 관리
            </h2>
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>총 등록된 원정대: <strong className={isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}>{memberList.length}</strong>개</span>
          </div>

          <form onSubmit={handleSearchCharacter} className="flex gap-3">
            <input 
              type="text" 
              value={searchName} 
              onChange={(e) => setSearchName(e.target.value)} 
              placeholder="공대원 대표 캐릭터명을 입력하세요" 
              className={`flex-1 ${isDarkMode ? 'bg-gray-950 border-gray-800 text-white placeholder-gray-500 focus:border-yellow-500' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-yellow-600'} border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all shadow-inner`} 
            />
            <button 
              type="submit" 
              disabled={loading} 
              className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center min-w-[110px]"
            >
              {loading ? (
                <span className="flex items-center gap-2 text-xs">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  조회 중...
                </span>
              ) : "원정대 등록"}
            </button>
          </form>

          {memberList.length > 0 && (
            <div className="flex gap-4 overflow-x-auto pb-3 pt-2 scrollbar-thin">
              {memberList.map((m, idx) => (
                <div key={idx} className={`${isDarkMode ? 'bg-gray-950/80 border-gray-800/80' : 'bg-gray-50 border-gray-200 shadow-sm'} p-4 rounded-xl border space-y-3 min-w-[340px] max-w-[340px] flex-shrink-0 transition-colors`}>
                  <div className={`flex justify-between items-center border-b ${isDarkMode ? 'border-gray-900' : 'border-gray-200'} pb-2.5`}>
                    <div className={`font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'} text-sm flex items-center gap-1.5`}>
                      <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                      {m.owner} 원정대
                    </div>
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => handleRefreshMember(m.owner)} 
                        title="원정대 정보 갱신"
                        className={`${isDarkMode ? 'text-gray-400 hover:text-blue-400 bg-gray-900 border-gray-800' : 'text-gray-500 hover:text-blue-600 bg-white border-gray-200'} font-bold px-2 py-0.5 text-xs border rounded-lg transition-all flex items-center gap-1`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        갱신
                      </button>
                      <button 
                        onClick={() => handleRemoveMember(m.owner)} 
                        className={`${isDarkMode ? 'text-gray-500 hover:text-red-400 bg-gray-900 border-gray-800' : 'text-gray-400 hover:text-red-600 bg-white border-gray-200'} font-bold px-2 py-0.5 text-xs border rounded-lg transition-all`}
                      >
                        삭제 ✕
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-xs space-y-2 max-h-56 overflow-y-auto pr-1">
                    {m.characters.map((c, cIdx) => (
                      <div key={cIdx}>
                        {renderManageCard(c, m.owner)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedCharForConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className={`${isDarkMode ? 'bg-gray-900 border-gray-800 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} border rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl transition-colors`}>
              <div className={`flex justify-between items-center border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} pb-3`}>
                <div>
                  <h3 className={`text-lg font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>⚙️ 캐릭터 레이드 세부 설정</h3>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{selectedCharForConfig.owner} 원정대 · <span className="font-semibold">{selectedCharForConfig.char.charName}</span> (Lv.{selectedCharForConfig.char.level})</p>
                </div>
                <button 
                  onClick={() => setSelectedCharForConfig(null)}
                  className={`${isDarkMode ? 'text-gray-400 hover:text-white bg-gray-800' : 'text-gray-600 hover:text-black bg-gray-100'} font-bold px-2 py-1 text-sm rounded-lg`}
                >
                  ✕ 닫기
                </button>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>이 캐릭터가 참여할 수 있는 레이드를 선택하세요. 레벨 조건을 만족하더라도 체크를 해제하면 자동 조합에서 제외됩니다.</p>
                
                <div className="grid grid-cols-1 gap-2">
                  {RAID_LIST.map((raid) => {
                    const isLevelMet = selectedCharForConfig.char.level >= raid.minLevel;
                    const allowedRaids = selectedCharForConfig.char.allowedRaids || [];
                    const isChecked = allowedRaids.includes(raid.id);

                    return (
                      <label 
                        key={raid.id}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          !isLevelMet 
                            ? (isDarkMode ? 'bg-gray-950/40 border-gray-900 opacity-40 cursor-not-allowed' : 'bg-gray-100 border-gray-200 opacity-40 cursor-not-allowed') 
                            : isChecked 
                              ? (isDarkMode ? 'bg-yellow-950/25 border-yellow-500/50 cursor-pointer' : 'bg-yellow-50 border-yellow-300 cursor-pointer') 
                              : (isDarkMode ? 'bg-gray-950 border-gray-800 cursor-pointer' : 'bg-white border-gray-200 cursor-pointer')
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox"
                            disabled={!isLevelMet}
                            checked={isChecked}
                            onChange={() => handleToggleCharRaid(selectedCharForConfig.owner, selectedCharForConfig.char.charName, raid.id)}
                            className="w-4 h-4 accent-yellow-500 cursor-pointer"
                          />
                          <div>
                            <span className="text-sm font-semibold">{raid.name}</span>
                            <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} ml-2`}>(권장 Lv.{raid.minLevel})</span>
                          </div>
                        </div>
                        <span className={`text-xs font-bold ${isLevelMet ? (isChecked ? (isDarkMode ? 'text-yellow-400' : 'text-yellow-600') : (isDarkMode ? 'text-gray-500' : 'text-gray-400')) : 'text-red-500'}`}>
                          {isLevelMet ? (isChecked ? '참여함' : '제외됨') : '레벨 미달'}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className={`flex justify-end pt-2 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                <button 
                  onClick={() => setSelectedCharForConfig(null)}
                  className="bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-bold px-5 py-2 rounded-xl text-sm"
                >
                  확인 및 완료
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300 shadow-sm'} border p-4 rounded-xl transition-colors`}>
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>📋 파티별 최적 매칭 결과</h2>
            
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className={`flex ${isDarkMode ? 'bg-gray-950 border-gray-800' : 'bg-gray-100 border-gray-300'} rounded-lg p-1 border`}>
                <button 
                  onClick={() => { setViewMode("all"); setFilterTarget(""); }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === 'all' ? 'bg-yellow-500 text-gray-950' : (isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black')}`}
                >
                  전체 보기
                </button>
                <button 
                  onClick={() => { setViewMode("raid"); setFilterTarget(RAID_LIST[0].name); }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === 'raid' ? 'bg-yellow-500 text-gray-950' : (isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black')}`}
                >
                  레이드별 보기
                </button>
                <button 
                  onClick={() => { setViewMode("owner"); setFilterTarget(memberList[0]?.owner || ""); }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === 'owner' ? 'bg-yellow-500 text-gray-950' : (isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black')}`}
                >
                  공대원별 보기
                </button>
                <button 
                  onClick={() => { setViewMode("single"); setFilterTarget(""); }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === 'single' ? 'bg-yellow-500 text-gray-950' : (isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black')}`}
                >
                  싱글 / 미편성
                </button>
              </div>

              {viewMode === "raid" && (
                <select 
                  value={filterTarget} 
                  onChange={(e) => setFilterTarget(e.target.value)}
                  className={`${isDarkMode ? 'bg-gray-950 border-gray-800 text-yellow-400' : 'bg-gray-100 border-gray-300 text-yellow-700'} border text-xs px-3 py-2 rounded-lg focus:outline-none flex-1 md:flex-none`}
                >
                  {RAID_LIST.map((raid) => (
                    <option key={raid.id} value={raid.name}>{raid.name}</option>
                  ))}
                </select>
              )}

              {viewMode === "owner" && (
                <select 
                  value={filterTarget} 
                  onChange={(e) => setFilterTarget(e.target.value)}
                  className={`${isDarkMode ? 'bg-gray-950 border-gray-800 text-yellow-400' : 'bg-gray-100 border-gray-300 text-yellow-700'} border text-xs px-3 py-2 rounded-lg focus:outline-none flex-1 md:flex-none`}
                >
                  {memberList.map((m, idx) => (
                    <option key={idx} value={m.owner}>{m.owner} 원정대</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {isTableView ? (
            <div className={`${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300 shadow-md'} border rounded-2xl p-6 overflow-x-auto transition-colors`}>
              <h3 className={`text-base font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'} mb-4`}>📄 파티 매칭 결과 요약 표</h3>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b ${isDarkMode ? 'border-gray-800 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                    <th className="py-3 px-4 w-12 text-center">번호</th>
                    <th className="py-3 px-4">레이드 명</th>
                    <th className="py-3 px-4">참여 캐릭터 이름 목록</th>
                    <th className="py-3 px-4 text-right">총 전투력 / 평균</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-gray-800/60' : 'divide-gray-200'}`}>
                  {displayedParties.map((party, index) => {
                    const isSingle = party.raidName.includes("싱글 / 미편성") || party.type === "single";
                    const totalCP = (party.members || []).reduce((acc, cur) => acc + cur.combatPower, 0);
                    const avgCP = (party.members && party.members.length > 0) ? Math.floor(totalCP / party.members.length) : 0;

                    return (
                      <tr key={party.id} className={`${isDarkMode ? 'hover:bg-gray-800/40' : 'hover:bg-gray-50'} transition-all`}>
                        <td className={`py-3 px-4 text-center font-bold ${isDarkMode ? 'text-yellow-500' : 'text-yellow-600'}`}>{index + 1}</td>
                        <td className="py-3 px-4 font-bold">
                          {isSingle ? (
                            <span className={isDarkMode ? 'text-indigo-300' : 'text-indigo-700'}>{party.raidName}</span>
                          ) : (
                            <span className={isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}>{party.raidName}</span>
                          )}
                        </td>
                        <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} font-medium`}>
                          {party.type === 8 && !isSingle ? (
                            <div className="space-y-1">
                              <div>
                                <strong className={isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}>1파티:</strong>{' '}
                                {(party.g1 || []).map((m, idx) => (
                                  <span key={idx} className="inline-flex items-center ml-1">
                                    {CLASS_ICONS[m.className] && (
                                      <img src={CLASS_ICONS[m.className]} alt={m.className} className={`w-3 h-3 mr-0.5 ${isDarkMode ? 'opacity-90' : 'invert opacity-80'}`} />
                                    )}
                                    {m.charName}{idx < (party.g1 || []).length - 1 && ","}
                                  </span>
                                ))}
                              </div>
                              <div>
                                <strong className={isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}>2파티:</strong>{' '}
                                {(party.g2 || []).map((m, idx) => (
                                  <span key={idx} className="inline-flex items-center ml-1">
                                    {CLASS_ICONS[m.className] && (
                                      <img src={CLASS_ICONS[m.className]} alt={m.className} className={`w-3 h-3 mr-0.5 ${isDarkMode ? 'opacity-90' : 'invert opacity-80'}`} />
                                    )}
                                    {m.charName}{idx < (party.g2 || []).length - 1 && ","}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div>
                              {(party.members || []).map((m, idx) => (
                                <span key={idx} className="inline-flex items-center mr-1">
                                  {CLASS_ICONS[m.className] && (
                                    <img src={CLASS_ICONS[m.className]} alt={m.className} className={`w-3 h-3 mr-0.5 ${isDarkMode ? 'opacity-90' : 'invert opacity-80'}`} />
                                  )}
                                  {m.charName}{idx < (party.members || []).length - 1 && ","}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {!isSingle ? (
                            <div className={isDarkMode ? 'text-blue-300' : 'text-blue-700'}>
                              {totalCP.toLocaleString()} <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>|</span> <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>{avgCP.toLocaleString()}</span>
                            </div>
                          ) : (
                            <span className={isDarkMode ? 'text-indigo-300' : 'text-indigo-700'}>-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {displayedParties.length === 0 ? (
                <div className={`${isDarkMode ? 'bg-gray-900 border-gray-800 text-gray-500' : 'bg-white border-gray-300 text-gray-400 shadow-sm'} border rounded-xl p-8 text-center text-sm`}>
                  조건에 해당하는 파티 결과가 없습니다.
                </div>
              ) : (
                displayedParties.map((party) => {
                  const isSingle = party.raidName.includes("싱글 / 미편성") || party.type === "single";
                  const totalCP = (party.members || []).reduce((acc, cur) => acc + cur.combatPower, 0);
                  const avgCP = (party.members && party.members.length > 0) ? Math.floor(totalCP / party.members.length) : 0;
                  const bgImage = getRaidIllustration(party.originalRaidId);

                  return (
                    <div key={party.id} className={`${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300 shadow-md'} border rounded-xl overflow-hidden space-y-2 relative transition-colors ${isSingle ? (isDarkMode ? 'border-indigo-900/50 bg-indigo-950/20' : 'border-indigo-200 bg-indigo-50/50') : ''}`}>
                      
                      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                        <img 
                          src={bgImage} 
                          alt={party.category} 
                          className="w-full h-full object-cover object-center opacity-30 filter contrast-125 brightness-95 scale-105" 
                        />
                        <div className={`absolute inset-0 bg-gradient-to-b ${isDarkMode ? 'from-gray-950/80 via-gray-900/85 to-gray-950/90' : 'from-white/90 via-white/85 to-white/95'}`}></div>
                      </div>

                      <div className="relative pt-5 pb-2 px-6 z-10 flex justify-between items-center">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            {isSingle ? (
                              <span className="text-xs font-bold bg-indigo-600 text-white px-2.5 py-1 rounded shadow">싱글 / 미편성</span>
                            ) : (
                              <span className="text-xs font-bold bg-yellow-500 text-gray-950 px-2.5 py-1 rounded shadow">파티 {party.partyNum}</span>
                            )}
                            <span className={`font-extrabold text-xl drop-shadow-md truncate ${isSingle ? (isDarkMode ? 'text-indigo-300' : 'text-indigo-700') : (isDarkMode ? 'text-yellow-300' : 'text-yellow-700')}`}>
                              {party.raidName}
                            </span>
                          </div>
                          <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} font-medium drop-shadow ml-0.5`}>인원: {(party.members || []).length}{!isSingle && `/${party.type}`}</span>
                        </div>
                        
                        {!isSingle && (
                          <div className={`${isDarkMode ? 'bg-blue-950/80 border-blue-900/50 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700'} border px-3.5 py-2 rounded-xl font-semibold shadow text-xs flex items-center gap-3`}>
                            <span>총 전투력 {totalCP.toLocaleString()}</span>
                            <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>|</span>
                            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>평균 {avgCP.toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      <div className="px-5 pb-2 pt-0 space-y-2 relative z-10">
                        {party.type === 8 && !isSingle ? (
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <div className={`text-xs font-bold ${isDarkMode ? 'text-yellow-500' : 'text-yellow-600'} ml-1`}>▪️ 1파티 <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} font-normal`}>(서포터 1 / 딜러 3)</span></div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                                {(party.g1 || []).map((m, idx) => <div key={`g1-${idx}`}>{renderMemberCard(m, false)}</div>)}
                                {Array.from({ length: Math.max(0, 4 - (party.g1 || []).length) }).map((_, eIdx) => (
                                  <div key={`empty1-${eIdx}`} className={`${isDarkMode ? 'bg-gray-950/30 border-gray-800 text-gray-600' : 'bg-gray-100/50 border-gray-200 text-gray-400'} p-3 rounded-xl border border-dashed flex justify-center items-center text-xs h-32`}> - 빈 자리 - </div>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className={`text-xs font-bold ${isDarkMode ? 'text-yellow-500' : 'text-yellow-600'} ml-1`}>▪️ 2파티 <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} font-normal`}>(서포터 1 / 딜러 3)</span></div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                                {(party.g2 || []).map((m, idx) => <div key={`g2-${idx}`}>{renderMemberCard(m, false)}</div>)}
                                {Array.from({ length: Math.max(0, 4 - (party.g2 || []).length) }).map((_, eIdx) => (
                                  <div key={`empty2-${eIdx}`} className={`${isDarkMode ? 'bg-gray-950/30 border-gray-800 text-gray-600' : 'bg-gray-100/50 border-gray-200 text-gray-400'} p-3 rounded-xl border border-dashed flex justify-center items-center text-xs h-32`}> - 빈 자리 - </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                            {(party.members || []).map((member, mIdx) => (
                              <div key={mIdx}>{renderMemberCard(member, isSingle)}</div>
                            ))}
                            {!isSingle && Array.from({ length: party.type - (party.members || []).length }).map((_, eIdx) => (
                              <div key={`empty-${eIdx}`} className={`${isDarkMode ? 'bg-gray-950/30 border-gray-800 text-gray-600' : 'bg-gray-100/50 border-gray-200 text-gray-400'} p-3 rounded-xl border border-dashed flex justify-center items-center text-xs h-32`}>- 빈 자리 -</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}