// 레이드 배경으로 올린 이미지(/api/image?id=...) 정리.
// 이미지는 base64 로 공유 저장소(Supabase)에 들어가므로, 안 쓰게 된 것은 지워서 용량을 아낀다.
import { listKeys, deleteKey } from "./store";

export const IMG_PREFIX = "loa:party-maker:img:";
const ORPHAN_GRACE_MS = 24 * 60 * 60 * 1000; // 올렸지만 아직 레이드에 저장 안 된 이미지를 위한 유예

const imageIdsOf = (raids) => new Set(
  (Array.isArray(raids) ? raids : [])
    .map(r => r && typeof r.image === "string" && r.image.match(/^\/api\/image\?id=([a-f0-9-]{36})$/))
    .filter(Boolean)
    .map(m => m[1])
);

// 레이드 목록이 바뀐 뒤 호출. 실패해도 저장 자체에는 영향 없음.
//  1) 이번 변경으로 더 이상 어떤 레이드도 쓰지 않는 이미지 → 바로 삭제
//  2) 어느 레이드에도 없는 채로 하루 넘게 남은 이미지(업로드만 하고 저장 안 함 등) → 삭제
export async function cleanupRaidImages(prevRaids, nextRaids) {
  if (!Array.isArray(nextRaids)) return;
  try {
    const used = imageIdsOf(nextRaids);
    const dropped = [...imageIdsOf(prevRaids)].filter(id => !used.has(id));
    const now = Date.now();
    const stale = (await listKeys(IMG_PREFIX))
      .filter(({ key, createdAt }) => {
        const id = key.slice(IMG_PREFIX.length);
        return !used.has(id) && !dropped.includes(id) && createdAt && now - createdAt > ORPHAN_GRACE_MS;
      })
      .map(({ key }) => key.slice(IMG_PREFIX.length));
    for (const id of [...dropped, ...stale]) await deleteKey(IMG_PREFIX + id);
  } catch (e) {
    console.error("image cleanup", e);
  }
}
