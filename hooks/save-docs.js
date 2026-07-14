#!/usr/bin/env node
// docs/(별도 private repo: .claude-sync-docs)의 "현재 상태"를 스냅샷 커밋/푸시한다.
//   - SessionEnd 훅으로 자동 실행 (인자 없음 → 전체 repo)
//   - /save-docs [repo] 커맨드로 수동 실행 (인자 있으면 그 repo만)
// 목적: task 기록 유실 방지 + 크로스머신 이어작업.
// 원칙(반드시 지킴): 변경 없으면 통과 / 오프라인·충돌·에러여도 세션을 절대 막지 않음.
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

// 훅 계약상 stdin으로 JSON이 올 수 있으나 여기선 쓰지 않는다(있으면 소진만).
try {
    fs.readFileSync(0, "utf8");
} catch {
    // ignore
}

const docsDir = path.join(os.homedir(), ".claude", "docs");
const repo = (process.argv[2] || "").trim(); // 선택: 특정 repo만. 없으면 전체.
const scopeLabel = repo || "전체";

function git(args, timeoutMs) {
    return execFileSync("git", ["-C", docsDir, ...args], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        timeout: timeoutMs || undefined,
    });
}

try {
    // docs가 git 저장소가 아니면(이 기기에 docs repo 미클론 등) 조용히 통과
    if (!fs.existsSync(path.join(docsDir, ".git"))) {
        console.log("snapshot: docs가 git 저장소가 아님 — 통과");
        process.exit(0);
    }

    // repo 스코프 지정 시 해당 폴더 존재 확인
    if (repo && !fs.existsSync(path.join(docsDir, repo))) {
        console.log(`snapshot: docs/${repo} 없음 — 통과`);
        process.exit(0);
    }

    // 변경 확인 (스코프 한정). 없으면 통과 → 빈 커밋 방지
    const statusArgs = repo
        ? ["status", "--porcelain", "--", repo]
        : ["status", "--porcelain"];
    if (!git(statusArgs).trim()) {
        console.log(`snapshot(${scopeLabel}): 변경 없음 — 통과`);
        process.exit(0);
    }

    // 현재 상태 그대로 스테이징 (스코프 한정 or 전체)
    git(["add", ...(repo ? [repo] : ["-A"])]);

    const d = new Date(); // 이 기기의 로컬 시각(KST 등)
    const p = (n) => String(n).padStart(2, "0");
    const stamp = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
    const msg = repo ? `chore: save ${repo} ${stamp}` : `chore: auto-save ${stamp}`;
    git(["commit", "-m", msg]);
    console.log(`snapshot(${scopeLabel}): 커밋 — ${msg}`);

    // push는 실패해도 무시(오프라인/non-fast-forward). 세션 종료가 매달리지 않게 타임아웃.
    try {
        git(["push"], 15000);
        console.log("snapshot: push 완료");
    } catch {
        console.log("snapshot: push 실패(오프라인/충돌) — 로컬 커밋만, 다음에 수동 pull/push");
    }
} catch (e) {
    // 훅은 절대 세션을 막지 않는다. 커맨드로 실행 시 원인만 노출.
    console.log("snapshot: 오류로 중단(세션엔 영향 없음): " + (e && e.message ? e.message : e));
}

process.exit(0);
