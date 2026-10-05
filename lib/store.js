// 저장소 계층 (valorant-teambuilder 와 같은 방식).
// Supabase(Postgres REST, kv_store 테이블) → Vercel KV / Upstash Redis 순으로 시도하고,
// 둘 다 없으면 프로세스 메모리(Map)에 저장한다 — 로컬 개발용이며 배포 환경에서는 공유되지 않음.

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasSupabase = !!(SUPABASE_URL && SUPABASE_KEY);

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const hasRedis = !!(REDIS_URL && REDIS_TOKEN);

export const hasKV = hasSupabase || hasRedis;

const mem = globalThis.__loaMem || (globalThis.__loaMem = new Map());

const sbHeaders = () => ({ apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` });

async function redis(path, body) {
  const res = await fetch(`${REDIS_URL}/${path}`, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`kv ${path} ${res.status}`);
  return res.json();
}

export async function getJSON(key) {
  if (hasSupabase) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/kv_store?key=eq.${encodeURIComponent(key)}&select=value&limit=1`,
      { headers: sbHeaders(), cache: "no-store" }
    );
    if (!res.ok) throw new Error(`supabase get ${res.status}`);
    const rows = await res.json();
    return rows && rows[0] ? rows[0].value : null;
  }
  if (hasRedis) {
    const out = await redis(`get/${encodeURIComponent(key)}`);
    if (!out || out.result == null) return null;
    try { return JSON.parse(out.result); } catch { return null; }
  }
  return mem.has(key) ? mem.get(key) : null;
}

// 키가 아직 없을 때만 생성. 이미 있으면 false.
export async function createJSON(key, value) {
  if (hasSupabase) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/kv_store`, {
      method: "POST",
      headers: { ...sbHeaders(), "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ key, value, expires_at: null }),
    });
    if (res.status === 409) return false;
    if (!res.ok) throw new Error(`supabase create ${res.status} ${await res.text().catch(() => "")}`);
    return true;
  }
  if (hasRedis) {
    const out = await redis("", ["SET", key, JSON.stringify(value), "NX"]);
    return out?.result === "OK";
  }
  if (mem.has(key)) return false;
  mem.set(key, value);
  return true;
}

// 저장된 객체의 version 이 expectedVersion 일 때만 원자적으로 덮어쓴다.
// 그 사이 다른 사람이 먼저 썼으면 false.
export async function casJSON(key, value, expectedVersion) {
  if (hasSupabase) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/kv_store?key=eq.${encodeURIComponent(key)}&value->>version=eq.${encodeURIComponent(expectedVersion)}`,
      {
        method: "PATCH",
        headers: { ...sbHeaders(), "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({ value, expires_at: null }),
      }
    );
    if (!res.ok) throw new Error(`supabase cas ${res.status} ${await res.text().catch(() => "")}`);
    const rows = await res.json();
    return Array.isArray(rows) && rows.length > 0;
  }
  if (hasRedis) {
    const script = "local cur = redis.call('GET', KEYS[1]) "
      + "if cur then local ok, obj = pcall(cjson.decode, cur) "
      + "if ok and type(obj) == 'table' and tonumber(obj.version) ~= tonumber(ARGV[2]) then return 0 end end "
      + "redis.call('SET', KEYS[1], ARGV[1]) return 1";
    const out = await redis("", ["EVAL", script, "1", key, JSON.stringify(value), String(expectedVersion)]);
    return out?.result === 1;
  }
  const cur = mem.get(key);
  if (cur && cur.version !== expectedVersion) return false;
  mem.set(key, value);
  return true;
}
