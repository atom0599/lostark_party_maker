// 화면 전체에서 쓰는 상수: 메뉴, 배경, 역할 색, 기본 레이드 목록, 직업 아이콘

export const NAV = [["home", "홈"], ["roster", "원정대"], ["clear", "클리어 현황"], ["parties", "파티 편성"], ["raids", "레이드 관리"]];
// 로스트아크 공식 아트웍 지역 일러스트 (CC BY-NC-SA 4.0, © Smilegate RPG)
export const BG_SEQ = [
  "/regions/elgacia.jpg", "/regions/aldebaran.jpg", "/regions/kadarum.jpg", "/regions/fleche.jpg",
  "/regions/punika.jpg", "/regions/voldis.jpg", "/regions/south_vern.jpg",
];
export const HYBRID_CLASSES = ["바드", "홀리나이트", "도화가", "발키리"];
export const DLR_COLOR = "#FF4B57";
export const SUP_COLOR = "#4ADE80";
export const G1_COLOR = "#4C9AFF";
export const G2_COLOR = "#FF8A4C";
export const SUB_COLOR = "#B478FF";

// 기본 레이드 목록. 실제 목록은 '레이드 관리' 탭에서 수정되며 서버에 공유 저장된다.
// category: 같은 레이드(난이도 묶음)를 구분하는 키 / series: 레이드 이름 / diff: 난이도(단계)
export const mkRaid = (id, category, series, diff, type, minLevel, image) => ({
  id, category, series, diff, name: `${series} ${diff}`, type, minLevel,
  reqSup: type === 8 ? 2 : 1, reqDlr: type === 8 ? 6 : 3, image,
});
export const DEFAULT_RAIDS = [
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
export const RAID_IMAGES = [
  ["벨가르딘", "/raid_5.jpg"], ["지평의 성당", "/raid_4.jpg"], ["세르카", "/raid_3.jpg"],
  ["파멸의 성채", "/raid_1.jpg"], ["최후의 날", "/raid_2.jpg"],
  ["엘가시아", "/regions/elgacia.jpg"], ["알데바란의 바다", "/regions/aldebaran.jpg"], ["카다룸 제도", "/regions/kadarum.jpg"],
  ["플레체", "/regions/fleche.jpg"], ["파푸니카", "/regions/punika.jpg"], ["볼다이크", "/regions/voldis.jpg"], ["베른 남부", "/regions/south_vern.jpg"],
];

export const CLASS_ICONS = {
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
