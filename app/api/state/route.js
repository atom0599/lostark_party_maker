import { NextResponse } from "next/server";
import { getJSON, getVersion, createJSON, casJSON, hasKV } from "../../../lib/store";
import { isAdmin } from "../../../lib/admin";
import { adminOnlyChange } from "../../../lib/permissions";
import { cleanupRaidImages } from "../../../lib/images";
import { describeChanges, STATE_KEY, LOG_KEY, LOG_MAX } from "../../../lib/changelog";

// 모든 사람이 함께 보는 공유 상태: 원정대 목록 + 파티 편성(클리어 포함) + 레이드 목록
const KEY = STATE_KEY;
const MAX_BYTES = 2_000_000;

export const dynamic = "force-dynamic";

const emptyState = () => ({ version: 0, members: [], parties: [], updatedAt: 0 });

// ?v=<내가 가진 version> 을 붙이면, 서버 version 이 같을 때 전체 상태 대신 { same: true } 만 돌려준다.
// (폴링 대부분이 '바뀐 것 없음'이라 저장소·네트워크 전송량을 크게 줄인다)
export async function GET(request) {
  try {
    const v = new URL(request.url).searchParams.get("v");
    if (v != null && /^\d+$/.test(v)) {
      const version = await getVersion(KEY);
      if (version === Number(v)) {
        return NextResponse.json({ same: true, version, shared: hasKV }, { headers: { "Cache-Control": "no-store" } });
      }
    }
    const state = (await getJSON(KEY)) || emptyState();
    return NextResponse.json({ state, shared: hasKV }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("state GET", e);
    return NextResponse.json({ error: "저장소 조회 실패" }, { status: 502 });
  }
}

// body: { baseVersion, members, parties, raids? }
// baseVersion 이 서버의 현재 version 과 다르면 409 와 최신 상태를 돌려준다 (클라이언트가 병합 후 재시도).
export async function PUT(request) {
  let body;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BYTES) return NextResponse.json({ error: "데이터가 너무 큽니다." }, { status: 413 });
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const { baseVersion, members, parties, raids } = body || {};
  // 변경 기록용: 누가(브라우저에서 정한 이름) 어떤 동작으로 바꿨는지
  const actor = typeof body.actor === "string" ? body.actor.slice(0, 40) : "";
  const actions = Array.isArray(body.actions) ? body.actions.filter(a => typeof a === "string").slice(0, 10).map(a => a.slice(0, 60)) : [];
  if (!Array.isArray(members) || !Array.isArray(parties) || typeof baseVersion !== "number"
    || (raids != null && !Array.isArray(raids))) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  try {
    const cur = await getJSON(KEY);
    const curVersion = cur ? cur.version || 0 : 0;
    if (baseVersion !== curVersion) {
      return NextResponse.json({ conflict: true, state: cur || emptyState() }, { status: 409 });
    }
    // 파티 편성 변경 · 원정대 삭제 · 레이드 삭제는 관리자만 (lib/permissions.js)
    const denied = adminOnlyChange(cur, { members, parties, raids });
    if (denied && !isAdmin(request)) {
      return NextResponse.json({ error: denied, forbidden: true, state: cur }, { status: 403 });
    }
    const next = { version: curVersion + 1, members, parties, raids: raids || (cur && cur.raids) || null, updatedAt: Date.now() };
    const ok = cur ? await casJSON(KEY, next, curVersion) : await createJSON(KEY, next);
    if (!ok) {
      return NextResponse.json({ conflict: true, state: (await getJSON(KEY)) || emptyState() }, { status: 409 });
    }
    await appendLog(cur, next, actor, actions);
    if (raids && JSON.stringify(raids) !== JSON.stringify(cur && cur.raids)) {
      await cleanupRaidImages(cur && cur.raids, next.raids);
    }
    return NextResponse.json({ version: next.version });
  } catch (e) {
    console.error("state PUT", e);
    return NextResponse.json({ error: "저장 실패" }, { status: 502 });
  }
}

// 변경 기록 추가 (실패해도 저장 자체는 성공으로 둔다)
async function appendLog(prev, next, actor, actions) {
  try {
    const changes = describeChanges(prev, next);
    if (!changes.length && !actions.length) return;
    const entry = {
      at: Date.now(),
      actor: actor || "이름 없음",
      actions,
      changes: changes.length > 40 ? [...changes.slice(0, 40), `외 ${changes.length - 40}건`] : changes,
    };
    for (let i = 0; i < 4; i++) {
      const log = await getJSON(LOG_KEY);
      if (!log) {
        if (await createJSON(LOG_KEY, { version: 1, entries: [entry] })) return;
        continue;
      }
      const entries = [entry, ...(log.entries || [])].slice(0, LOG_MAX);
      if (await casJSON(LOG_KEY, { version: (log.version || 0) + 1, entries }, log.version || 0)) return;
    }
  } catch (e) {
    console.error("log append", e);
  }
}
