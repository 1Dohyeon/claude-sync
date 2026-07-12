// 공용 헬퍼: load-progress.js(SessionStart 훅)가
// "지금 작업 대상 git 저장소가 어디인지"를 판단할 때 사용한다.
// 단일 repo에서 실행된 경우뿐 아니라, repo1/repo2를 함께 담은
// 풀스택 루트 폴더에서 실행된 경우까지 감지하기 위한 로직.
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function gitTopLevel(dir) {
  try {
    return execFileSync('git', ['-C', dir, 'rev-parse', '--show-toplevel'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

// cwd itself if it's inside a git repo; otherwise every immediate
// subdirectory of cwd that is its own git repo (fullstack root case).
function findRepoRoots(cwd) {
  const roots = new Set();

  const ownRoot = gitTopLevel(cwd);
  if (ownRoot) {
    roots.add(path.resolve(ownRoot));
    return Array.from(roots);
  }

  let entries = [];
  try {
    entries = fs.readdirSync(cwd, { withFileTypes: true });
  } catch {
    entries = [];
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const sub = path.join(cwd, entry.name);
    if (fs.existsSync(path.join(sub, '.git'))) {
      roots.add(path.resolve(sub));
    }
  }

  return Array.from(roots);
}

// origin remote URL(https://github.com/user/repo.git, git@github.com:user/repo.git 등)에서
// repo 이름만 뽑아낸다. 로컬 클론 폴더명은 사용자가 자유롭게 바꿀 수 있어
// task 기록의 키로 쓰기에 불안정하기 때문에, 안정적인 origin 기준으로 판단한다.
function repoNameFromRemote(dir) {
  try {
    const url = execFileSync('git', ['-C', dir, 'remote', 'get-url', 'origin'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    const match = url.match(/[/:]([^/:]+?)(\.git)?$/);
    return match ? match[1] : '';
  } catch {
    return '';
  }
}

// origin이 없는 로컬 전용 저장소는 폴더명으로 폴백한다.
function getRepoName(dir) {
  return repoNameFromRemote(dir) || path.basename(dir);
}

// task 기록 경로(docs/<repo>/tasks/<branch>/)의 <branch> 값을 구한다.
// 브랜치 = task 단위로 나눠 쓰기로 했으므로, 병렬 task 작업이 서로 다른
// 폴더에 기록되도록 분리하는 데 쓰인다.
function getCurrentBranch(dir) {
  try {
    return execFileSync('git', ['-C', dir, 'rev-parse', '--abbrev-ref', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

module.exports = { findRepoRoots, getRepoName, getCurrentBranch };
