// 관리자 인증. 비밀번호는 ADMIN_PASSWORD 환경변수에만 있고(코드에 없음),
// 브라우저는 로그인 시 받은 토큰(HMAC)을 x-admin-token 헤더로 보낸다.
// 보호가 필요한 요청은 서버에서 매번 이 토큰을 다시 검증한다 — 버튼 숨김만으로는 막을 수 없으므로.
import { createHmac, timingSafeEqual } from "crypto";

const PW = process.env.ADMIN_PASSWORD;

export const adminEnabled = !!PW;

const digest = (s) => createHmac("sha256", PW || "unset").update(s).digest();

function safeEqual(a, b) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function checkPassword(candidate) {
  if (!PW || typeof candidate !== "string") return false;
  return timingSafeEqual(digest(candidate), digest(PW));
}

export function makeToken() {
  return digest("loa-party-admin-v1").toString("hex");
}

export function isAdmin(request) {
  if (!PW) return false;
  return safeEqual(request.headers.get("x-admin-token") || "", makeToken());
}
