"use client";

import { useState, useEffect, useRef } from "react";

// 관리자 로그인 상태. 토큰은 localStorage 에 두고, 서버(/api/admin)가 매번 다시 검증한다.
// tokenRef: 서버 요청 헤더(x-admin-token)에 바로 쓰기 위한 최신 토큰
export default function useAdmin() {
  const [token, setToken] = useState("");
  const tokenRef = useRef("");

  const apply = (t) => {
    tokenRef.current = t;
    setToken(t);
    try {
      if (t) localStorage.setItem("loa_admin_token", t);
      else localStorage.removeItem("loa_admin_token");
    } catch {}
  };

  useEffect(() => {
    let saved = "";
    try { saved = localStorage.getItem("loa_admin_token") || ""; } catch {}
    if (!saved) return;
    // 저장된 토큰이 아직 유효한지 서버에 확인 (만료됐거나 비밀번호가 바뀌었으면 자동 로그아웃)
    fetch("/api/admin", { headers: { "x-admin-token": saved } })
      .then(r => r.json())
      .then(d => {
        if (d.admin) { tokenRef.current = saved; setToken(saved); }
        else { try { localStorage.removeItem("loa_admin_token"); } catch {} }
      })
      .catch(() => {});
  }, []);

  // 성공하면 null, 실패하면 보여줄 오류 문구
  const login = async (password) => {
    try {
      const res = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const d = await res.json();
      if (!res.ok) return d.error || "로그인 실패";
      apply(d.token);
      return null;
    } catch {
      return "서버와 통신하지 못했습니다.";
    }
  };

  const logout = () => apply("");

  // 서버가 관리자 작업을 거부했을 때: 토큰이 정말 무효(만료 등)면 로그아웃
  const recheck = () => {
    if (!tokenRef.current) return;
    fetch("/api/admin", { headers: { "x-admin-token": tokenRef.current } })
      .then(r => r.json())
      .then(d => { if (!d.admin) apply(""); })
      .catch(() => {});
  };

  return { isAdmin: !!token, tokenRef, login, logout, recheck };
}
