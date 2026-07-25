#!/usr/bin/env node
// /sync-main [branch] 커맨드가 호출하는 스크립트.
//
// 인자 없음: fork repo의 로컬 main을 upstream/main 기준으로 fast-forward 동기화하고,
//   origin(내 fork)의 main도 같이 push한다. main은 자체 커밋이 없는 순수 미러 브랜치라는
//   전제라, 항상 --ff-only만 쓰고 어긋나면(= main에 예상 밖 커밋이 있으면) 중단한다.
//
// 인자로 <branch> 지정: origin/main 최신 커밋 위로 <branch>를 rebase하고, 성공하면
//   origin의 <branch>에도 push한다. 충돌이 나면 자동으로 continue/abort하지 않고
//   그 상태 그대로 사용자에게 알린다.
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

// worktree list에서 <branch>가 체크아웃된 경로를 찾는다. 없으면 null.
function findWorktreeForBranch(repoRoot, branch) {
  const worktreeList = tryGit(repoRoot, ['worktree', 'list', '--porcelain']);
  if (!worktreeList.ok) return null;
  const escaped = branch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const branchRe = new RegExp(`^branch refs/heads/${escaped}$`, 'm');
  for (const block of worktreeList.out.split('\n\n')) {
    const pathMatch = block.match(/^worktree (.+)$/m);
    if (pathMatch && branchRe.test(block)) return pathMatch[1].trim();
  }
  return null;
}

function syncMainFromUpstream(repoRoot) {
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

  const mainWorktree = findWorktreeForBranch(repoRoot, 'main');
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
}

function rebaseBranchOntoOriginMain(repoRoot, branch) {
  const branchExists = tryGit(repoRoot, ['rev-parse', '--verify', '--quiet', branch]);
  if (!branchExists.ok) fail(`로컬에 '${branch}' 브랜치가 없습니다.`);

  console.log('origin/main fetch 중...');
  const fetchMain = tryGit(repoRoot, ['fetch', 'origin', 'main']);
  if (!fetchMain.ok) fail('git fetch origin main 실패:\n' + fetchMain.out);
  // origin/<branch>는 아직 원격에 없을 수 있다(신규 로컬 브랜치) — 실패해도 계속 진행.
  const hadRemoteBranchBefore = tryGit(repoRoot, ['fetch', 'origin', branch]).ok;

  const targetDir = findWorktreeForBranch(repoRoot, branch) || repoRoot;

  const status = tryGit(targetDir, ['status', '--porcelain']);
  if (!status.ok) fail('git status 실패:\n' + status.out);
  if (status.out.trim()) {
    fail(`'${targetDir}'에 커밋되지 않은 변경사항이 있어 중단합니다:\n` + status.out);
  }

  const beforeSha = tryGit(repoRoot, ['rev-parse', branch]);

  console.log(`origin/main 위로 '${branch}' rebase 중...`);
  // targetDir에서 <branch>가 체크아웃되어 있지 않으면 git rebase가 자동으로 switch부터 한다.
  const rebase = tryGit(targetDir, ['rebase', 'origin/main', branch]);
  if (!rebase.ok) {
    const conflicts = tryGit(targetDir, ['status', '--porcelain']);
    fail(
      `rebase 충돌 발생. '${targetDir}'에서 직접 해결하세요 (git rebase --continue 또는 --abort).\n\n` +
        rebase.out +
        (conflicts.ok && conflicts.out.trim() ? '\n\n현재 상태:\n' + conflicts.out : '')
    );
  }

  const afterSha = tryGit(repoRoot, ['rev-parse', branch]);
  if (beforeSha.ok && afterSha.ok && beforeSha.out === afterSha.out) {
    console.log(`이미 최신 상태입니다 (${branch} = ${afterSha.out.slice(0, 8)}).`);
  } else {
    console.log(`${branch} 갱신: ${beforeSha.ok ? beforeSha.out.slice(0, 8) : '(없음)'} -> ${afterSha.out.slice(0, 8)}`);
  }

  console.log('origin으로 push 중...');
  let push;
  let forced = false;
  if (!hadRemoteBranchBefore) {
    push = tryGit(repoRoot, ['push', '-u', 'origin', branch]);
  } else {
    const isAncestor = tryGit(repoRoot, ['merge-base', '--is-ancestor', `origin/${branch}`, branch]);
    if (isAncestor.ok) {
      push = tryGit(repoRoot, ['push', 'origin', branch]);
    } else {
      forced = true;
      push = tryGit(repoRoot, ['push', '--force-with-lease', 'origin', branch]);
    }
  }
  if (!push.ok) fail('origin push 실패:\n' + push.out);
  console.log(`origin/${branch} push 완료${forced ? ' (force-with-lease, rebase로 히스토리가 재작성됨)' : ''}.`);
  if (push.out) console.log(push.out);
}

const cwd = process.cwd();
const roots = findRepoRoots(cwd);
if (roots.length === 0) fail('git 저장소를 찾을 수 없습니다.');
const repoRoot = roots[0];

const branchArg = (process.argv[2] || '').trim();
if (branchArg) {
  rebaseBranchOntoOriginMain(repoRoot, branchArg);
} else {
  syncMainFromUpstream(repoRoot);
}
