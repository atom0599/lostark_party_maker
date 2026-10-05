import { NextResponse } from "next/server";
import { getJSON, createJSON, casJSON, hasKV } from "../../../lib/store";

// 모든 사람이 함께 보는 공유 상태: 원정대 목록 + 파티 편성(클리어 포함)
const KEY = "loa:party-maker:main";
const MAX_BYTES = 2_000_000;

export const dynamic = "force-dynamic";

const emptyState = () => ({ version: 0, members: [], parties: [], updatedAt: 0 });

export async function GET() {
  try {
    const state = (await getJSON(KEY)) || emptyState();
    return NextResponse.json({ state, shared: hasKV }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("state GET", e);
    return NextResponse.json({ error: "저장소 조회 실패" }, { status: 502 });
  }
}

// body: { baseVersion, members, parties }
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
  const { baseVersion, members, parties } = body || {};
  if (!Array.isArray(members) || !Array.isArray(parties) || typeof baseVersion !== "number") {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  try {
    const cur = await getJSON(KEY);
    const curVersion = cur ? cur.version || 0 : 0;
    if (baseVersion !== curVersion) {
      return NextResponse.json({ conflict: true, state: cur || emptyState() }, { status: 409 });
    }
    const next = { version: curVersion + 1, members, parties, updatedAt: Date.now() };
    const ok = cur ? await casJSON(KEY, next, curVersion) : await createJSON(KEY, next);
    if (!ok) {
      return NextResponse.json({ conflict: true, state: (await getJSON(KEY)) || emptyState() }, { status: 409 });
    }
    return NextResponse.json({ version: next.version });
  } catch (e) {
    console.error("state PUT", e);
    return NextResponse.json({ error: "저장 실패" }, { status: 502 });
  }
}
