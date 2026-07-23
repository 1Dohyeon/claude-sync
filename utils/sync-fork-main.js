#!/usr/bin/env node
// /sync-main 커맨드가 호출하는 스크립트.
// fork repo의 로컬 main을 upstream/main으로 fast-forward 동기화하고,
// origin(내 fork)의 main도 같이 push한다.
// 전제: main은 자체 커밋이 없는 순수 미러 브랜치. 그래서 병합은 항상
// --ff-only(또는 순수 fast-forward fetch refspec)만 쓰고, 어긋나면(= main에
// 예상 밖 커밋이 있으면) 강제로 덮어쓰지 않고 중단해 사용자에게 알린다.
'use strict';

const { execFileSync } = require('child_process');
const { findRepoRoots } = require('./find-repos');

function git(dir, args) {
  return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8' }).trim();
}

function tryGit(dir, args) {
  try {
    return { ok: true, out: git(dir, args) };
  } catch (e) {
    return { ok: false, out: (e.stderr || e.message || '').toString().trim() };
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

const cwd = process.cwd();
const roots = findRepoRoots(cwd);
if (roots.length === 0) fail('git 저장소를 찾을 수 없습니다.');
const repoRoot = roots[0];

const remotes = tryGit(repoRoot, ['remote']);
if (!remotes.ok || !remotes.out.split('\n').includes('upstream')) {
  fail('이 저장소에는 upstream remote가 없습니다.');
}

console.log('upstream main fetch 중...');
// upstream 전체를 fetch하면 브랜치가 매우 많은 repo에서 Windows 경로 길이 제한에
// 걸릴 수 있어(예: 긴 브랜치명 -> "Filename too long"), main만 지정해서 가져온다.
const fetch = tryGit(repoRoot, ['fetch', 'upstream', 'main']);
if (!fetch.ok) fail('git fetch upstream 실패:\n' + fetch.out);

const upstreamMain = tryGit(repoRoot, ['rev-parse', 'upstream/main']);
if (!upstreamMain.ok) fail('upstream/main을 찾을 수 없습니다:\n' + upstreamMain.out);

// main이 어느 worktree에 체크아웃되어 있는지 확인 (없으면 ref를 직접 갱신)
const worktreeList = tryGit(repoRoot, ['worktree', 'list', '--porcelain']);
let mainWorktree = null;
if (worktreeList.ok) {
  for (const block of worktreeList.out.split('\n\n')) {
    const pathMatch = block.match(/^worktree (.+)$/m);
    const isMain = /^branch refs\/heads\/main$/m.test(block);
    if (pathMatch && isMain) {
      mainWorktree = pathMatch[1].trim();
      break;
    }
  }
}

const beforeSha = tryGit(repoRoot, ['rev-parse', 'main']);

if (mainWorktree) {
  console.log(`main이 ${mainWorktree} 에 체크아웃되어 있습니다. 그 worktree에서 동기화합니다.`);
  const status = tryGit(mainWorktree, ['status', '--porcelain']);
  if (!status.ok) fail('git status 실패:\n' + status.out);
  if (status.out.trim()) {
    fail('main worktree에 커밋되지 않은 변경사항이 있어 중단합니다:\n' + status.out);
  }
  const merge = tryGit(mainWorktree, ['merge', '--ff-only', 'upstream/main']);
  if (!merge.ok) {
    fail('fast-forward 실패 (main에 예상 밖 커밋이 있을 수 있습니다):\n' + merge.out);
  }
} else {
  console.log('main이 체크아웃되어 있지 않습니다. ref를 직접 갱신합니다.');
  const updateRef = tryGit(repoRoot, ['fetch', 'upstream', 'main:main']);
  if (!updateRef.ok) {
    fail('main ref 갱신 실패 (fast-forward 불가, main에 예상 밖 커밋이 있을 수 있습니다):\n' + updateRef.out);
  }
}

const afterSha = tryGit(repoRoot, ['rev-parse', 'main']);

if (beforeSha.ok && afterSha.ok && beforeSha.out === afterSha.out) {
  console.log(`이미 최신 상태입니다 (main = ${afterSha.out.slice(0, 8)}).`);
} else {
  console.log(`main 갱신: ${beforeSha.ok ? beforeSha.out.slice(0, 8) : '(없음)'} -> ${afterSha.out.slice(0, 8)}`);
}

console.log('origin(fork)으로 push 중...');
const push = tryGit(repoRoot, ['push', 'origin', 'main']);
if (!push.ok) fail('origin push 실패:\n' + push.out);
console.log('origin/main push 완료.');
if (push.out) console.log(push.out);
