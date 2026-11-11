"use client";

import { useState, useEffect, useRef } from "react";
import { DEFAULT_RAIDS } from "../_lib/constants";
import { validRaids, migratePartyNames, merge3, mergeMember, mergeParty, keepAllowedChanges } from "../_lib/sharedState";

/* 서버 공유 동기화
   원정대 / 파티 / 레이드 목록은 서버(/api/state)가 기준. 로컬 변경은 자동으로 올리고,
   다른 사람의 변경은 몇 초마다 받아온다. 동시에 수정하면 원정대·파티·레이드 단위로 3-way 병합.

   state: 화면의 현재 값과 setter ({ memberList, partyResult, raidList, setMemberList, setPartyResult, setRaidList })
   adminTokenRef: 저장 요청에 붙일 관리자 토큰
   onForbidden(): 서버가 관리자 권한 부족으로 거부했을 때 (로그인 만료 확인용)

   반환: syncStatus(connecting | live | local | error), logAction(label), actorRef(변경 기록에 남길 이름) */
export default function useSharedSync(state, adminTokenRef, onForbidden) {
  const { memberList, partyResult, raidList, setMemberList, setPartyResult, setRaidList } = state;
  const [syncStatus, setSyncStatus] = useState("connecting");
  const pendingActions = useRef([]);
  const actorRef = useRef("");
  const sync = useRef({ ready: false, version: 0, base: null, baseSnap: "", pushing: false, timer: null });
  const latest = useRef({ members: [], parties: [], raids: DEFAULT_RAIDS });
  const onForbiddenRef = useRef(onForbidden);
  useEffect(() => { onForbiddenRef.current = onForbidden; }, [onForbidden]);

  // 변경 기록에 남길 동작 이름 (다음 서버 저장 때 함께 전송)
  const logAction = (label) => { pendingActions.current = [...pendingActions.current, label].slice(-10); };

  const snapOf = (st) => JSON.stringify([st.members, st.parties, st.raids]);

  const normalizeServer = (s) => {
    const raids = validRaids(s.raids) ? s.raids : DEFAULT_RAIDS;
    return { members: s.members || [], parties: migratePartyNames(s.parties || [], raids), raids };
  };

  const applyLocal = (st) => {
    latest.current = st;
    setMemberList(st.members);
    setPartyResult(st.parties);
    setRaidList(st.raids);
    try {
      localStorage.setItem("loa_members", JSON.stringify(st.members));
      localStorage.setItem("loa_party_result", JSON.stringify(st.parties));
      localStorage.setItem("loa_raids", JSON.stringify(st.raids));
    } catch {}
  };

  const adoptServer = (server) => {
    const st = normalizeServer(server);
    const s = sync.current;
    s.version = server.version || 0;
    s.base = st;
    s.baseSnap = snapOf(st);
    applyLocal(st);
  };

  const pushState = async () => {
    const s = sync.current;
    if (!s.ready || s.pushing) return;
    const cur0 = latest.current;
    const snap = snapOf(cur0);
    if (snap === s.baseSnap) return;
    s.pushing = true;
    try {
      const res = await fetch("/api/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(adminTokenRef.current ? { "x-admin-token": adminTokenRef.current } : {}) },
        body: JSON.stringify({ baseVersion: s.version, members: cur0.members, parties: cur0.parties, raids: cur0.raids, actor: actorRef.current, actions: pendingActions.current }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        pendingActions.current = [];
        s.version = data.version;
        s.base = cur0;
        s.baseSnap = snap;
        setSyncStatus(st => (st === "local" ? st : "live"));
      } else if (res.status === 403 && data.state) {
        // 관리자 권한이 필요한 변경(파티 편성 · 원정대 삭제 · 레이드 삭제)을 권한 없이 한 경우
        // → 그 부분만 서버 상태로 되돌리고, 함께 있던 다른 변경은 살려서 다시 올린다
        // (로그인이 만료됐을 수 있으니 관리자 상태도 다시 확인)
        const server = normalizeServer(data.state);
        const kept = keepAllowedChanges(s.base, latest.current, server);
        s.version = data.state.version || 0;
        s.base = server;
        s.baseSnap = snapOf(server);
        applyLocal(kept);
        if (onForbiddenRef.current) onForbiddenRef.current();
        alert(`${data.error || "관리자만 할 수 있는 작업입니다."}\n(그 변경만 되돌렸고, 다른 변경은 저장됩니다)`);
      } else if (res.status === 409 && data.state) {
        // 다른 사람이 먼저 저장함 → 내 변경분을 서버 최신본 위에 병합해서 다시 올림
        const server = normalizeServer(data.state);
        const cur = latest.current;
        const raids = merge3(s.base.raids, cur.raids, server.raids, r => r.id);
        const merged = {
          members: merge3(s.base.members, cur.members, server.members, m => m.owner, mergeMember),
          parties: migratePartyNames(merge3(s.base.parties, cur.parties, server.parties, p => p.id, mergeParty), raids),
          raids,
        };
        s.version = data.state.version || 0;
        s.base = server;
        s.baseSnap = snapOf(server);
        applyLocal(merged);
      } else {
        setSyncStatus("error");
      }
    } catch {
      setSyncStatus("error");
    } finally {
      s.pushing = false;
      if (snapOf(latest.current) !== s.baseSnap) {
        clearTimeout(s.timer);
        s.timer = setTimeout(pushState, 300);
      }
    }
  };

  // 최초 접속: 서버 상태를 받아오고, 서버가 비어 있으면 이 브라우저의 기존 데이터를 올린다
  useEffect(() => {
    let alive = true;
    const pull = async (first) => {
      const s = sync.current;
      try {
        // 이후 폴링은 내 version 을 보내서, 바뀐 게 없으면 { same: true } 만 받는다
        const url = first ? "/api/state" : `/api/state?v=${s.version}`;
        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json();
        if (!alive || !res.ok) throw new Error();
        if (data.same) {
          setSyncStatus(st => (st === "error" ? (data.shared ? "live" : "local") : st));
          if (snapOf(latest.current) !== s.baseSnap && !s.pushing) pushState();
          return;
        }
        if (first) {
          s.ready = true;
          setSyncStatus(data.shared ? "live" : "local");
          const server = data.state;
          if (!server.version) {
            // 서버가 비어 있음 → 이 브라우저에 데이터가 있을 때만 첫 공유 상태로 업로드
            // (빈 브라우저가 먼저 접속해도 빈 상태를 올려서 다른 사람의 기존 데이터를 막지 않도록)
            const empty = { members: [], parties: [], raids: DEFAULT_RAIDS };
            s.version = 0; s.base = empty; s.baseSnap = snapOf(empty);
            pushState();
          } else {
            adoptServer(server);
          }
          return;
        }
        setSyncStatus(st => (st === "error" ? (data.shared ? "live" : "local") : st));
        const dirty = snapOf(latest.current) !== s.baseSnap;
        if (data.state.version > s.version && !s.pushing && !dirty) adoptServer(data.state);
        else if (data.state.version > s.version && dirty) pushState(); // 409 → 병합 경로
      } catch {
        if (alive) setSyncStatus("error");
        if (first && alive) setTimeout(() => pull(true), 3000);
      }
    };
    pull(true);
    // 3초마다 확인하되, 탭을 안 보고 있으면 쉬고 돌아오면 바로 한 번 (요청 수 · 전송량 절약)
    const t = setInterval(() => { if (sync.current.ready && !document.hidden) pull(false); }, 3000);
    const onVis = () => { if (!document.hidden && sync.current.ready) pull(false); };
    document.addEventListener("visibilitychange", onVis);
    return () => { alive = false; clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 로컬에서 원정대/파티/레이드 목록이 바뀌면 서버로 올린다 (짧게 모아서)
  useEffect(() => {
    latest.current = { members: memberList, parties: partyResult, raids: raidList };
    const s = sync.current;
    if (!s.ready) return;
    if (snapOf(latest.current) === s.baseSnap) return;
    clearTimeout(s.timer);
    s.timer = setTimeout(pushState, 250);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberList, partyResult, raidList]);

  return { syncStatus, logAction, actorRef };
}
