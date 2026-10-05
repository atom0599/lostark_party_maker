import { NextResponse } from "next/server";
import { getJSON } from "../../../lib/store";
import { isAdmin } from "../../../lib/admin";
import { LOG_KEY } from "../../../lib/changelog";

export const dynamic = "force-dynamic";

// 변경 기록 조회 — 관리자만
export async function GET(request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "관리자만 볼 수 있습니다." }, { status: 403 });
  }
  try {
    const log = (await getJSON(LOG_KEY)) || { entries: [] };
    return NextResponse.json({ entries: log.entries || [] }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("log GET", e);
    return NextResponse.json({ error: "기록 조회 실패" }, { status: 502 });
  }
}
