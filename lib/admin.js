// 관리자 인증. 비밀번호는 ADMIN_PASSWORD 환경변수에만 있고(코드에 없음),
// 브라우저는 로그인 시 받은 토큰을 x-admin-token 헤더로 보낸다.
// 보호가 필요한 요청은 서버에서 매번 이 토큰을 다시 검증한다 — 버튼 숨김만으로는 막을 수 없으므로.
//
// 토큰 = "<만료시각(ms)>.<HMAC(만료시각)>" — 만료가 지나면 다시 로그인해야 하고,
// 비밀번호를 바꾸면 기존 토큰은 모두 무효가 된다.
import { createHmac, timingSafeEqual } from "crypto";

const PW = process.env.ADMIN_PASSWORD;
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7일

export const adminEnabled = !!PW;

const digest = (s) => createHmac("sha256", PW || "unset").update(s).digest();
const sign = (exp) => digest(`loa-party-admin-v2:${exp}`).toString("hex");

function safeEqual(a, b) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function checkPassword(candidate) {
  if (!PW || typeof candidate !== "string") return false;
  return timingSafeEqual(digest(candidate), digest(PW));
}

export function makeToken() {
  const exp = Date.now() + TOKEN_TTL_MS;
  return `${exp}.${sign(exp)}`;
}

export function isAdmin(request) {
  if (!PW) return false;
  const token = request.headers.get("x-admin-token") || "";
  const m = token.match(/^(\d{13})\.([a-f0-9]{64})$/);
  if (!m) return false;
  const exp = Number(m[1]);
  if (!(exp > Date.now())) return false;
  return safeEqual(m[2], sign(exp));
}
