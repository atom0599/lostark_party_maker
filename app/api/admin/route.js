import { NextResponse } from "next/server";
import { checkPassword, makeToken, isAdmin, adminEnabled } from "../../../lib/admin";

export const dynamic = "force-dynamic";

// 토큰이 아직 유효한지 확인
export async function GET(request) {
  return NextResponse.json({ enabled: adminEnabled, admin: isAdmin(request) });
}

// 로그인: body { password } → { token }
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  if (!adminEnabled) {
    return NextResponse.json({ error: "관리자 비밀번호가 설정되지 않았습니다." }, { status: 503 });
  }
  if (!checkPassword(body.password)) {
    // 짧은 비밀번호라 무차별 대입을 늦추기 위해 실패 시 지연
    await new Promise(r => setTimeout(r, 800));
    return NextResponse.json({ error: "비밀번호가 틀렸습니다." }, { status: 401 });
  }
  return NextResponse.json({ token: makeToken() });
}
