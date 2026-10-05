import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getJSON, createJSON } from "../../../lib/store";

// 사용자가 올린 레이드 배경 이미지. 공유 상태(/api/state)는 2초마다 오가므로
// 이미지는 따로 저장하고, 레이드에는 이 주소(/api/image?id=...)만 넣는다.
export const dynamic = "force-dynamic";

const PREFIX = "loa:party-maker:img:";
const MAX_CHARS = 3_000_000; // base64 기준 약 2.2MB
const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;

export async function GET(request) {
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!/^[a-f0-9-]{36}$/.test(id)) return new NextResponse("not found", { status: 404 });
  try {
    const img = await getJSON(PREFIX + id);
    const m = img && typeof img.data === "string" && img.data.match(DATA_URL);
    if (!m) return new NextResponse("not found", { status: 404 });
    return new NextResponse(Buffer.from(m[2], "base64"), {
      headers: { "Content-Type": m[1], "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch (e) {
    console.error("image GET", e);
    return new NextResponse("error", { status: 502 });
  }
}

// body: { dataUrl } (브라우저에서 줄여서 보낸 jpeg/png/webp) → { url }
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const dataUrl = body && body.dataUrl;
  if (typeof dataUrl !== "string" || dataUrl.length > MAX_CHARS || !DATA_URL.test(dataUrl)) {
    return NextResponse.json({ error: "지원하지 않는 이미지이거나 너무 큽니다." }, { status: 400 });
  }
  const id = randomUUID();
  try {
    await createJSON(PREFIX + id, { data: dataUrl, createdAt: Date.now() });
    return NextResponse.json({ url: `/api/image?id=${id}` });
  } catch (e) {
    console.error("image POST", e);
    return NextResponse.json({ error: "이미지 저장 실패" }, { status: 502 });
  }
}
