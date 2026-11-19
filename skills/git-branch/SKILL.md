---
description: 작업 브랜치를 만들거나 정리할 때 사용한다. 베이스 브랜치를 고르고, 원격 브랜치 없이 origin/<base>에서 로컬 브랜치를 메인 클론이나 worktree에 만든다. 머지된 브랜치와 worktree를 유실 없이 지우는 절차도 담는다.
when_to_use: '예: "브랜치 만들어줘", "worktree 만들어줘", "브랜치 정리해줘", "워크트리 삭제해줘", 베이스 브랜치를 정해야 할 때'
---
# GIT BRANCH MANAGEMENT

## create branch or worktree

### select base

계획 문서 `requirements.md`에 베이스가 적혀 있으면 그것을 쓴다. 없으면 `git branch -r`로 원격 브랜치를 보고 아래 표로 정한다.


| 순서  | 베이스                                                                         |
| --- | --------------------------------------------------------------------------- |
| 1   | 저장소 규칙(`CONTRIBUTING.md`, `CLAUDE.md`, `README.md`, `.github/`의 문서)이 정한 브랜치 |
| 2   | 규칙이 없으면 `develop`                                                           |
| 3   | `develop`이 없으면 `main`                                                       |


- 어느 것도 원격에 없으면 멈추고 묻는다.
- 정한 베이스와 근거를 보고에 적는다.

### fetch base

`origin/<base>`는 마지막 fetch 때의 사본이라, 만들기 직전에 원격의 최신 상태로 맞춘다.

```sh
git fetch origin <base>
```

### choose location

메인 클론에 만들지, 새 worktree로 만들지 사용자에게 묻는다. worktree를 고르면 [`worktree.md`](worktree.md)를 읽고 그 순서대로 만든다.

원격 브랜치는 만들지 않는다. 로컬에서 커밋을 쌓고, 처음 push할 때 [`git-push`](../git-push/SKILL.md)가 원격 브랜치를 만든다.

### create in main clone

작업 트리가 clean한지 먼저 확인한다. 커밋하지 않은 변경이 있으면 새 브랜치로 따라오므로 멈추고 알린다.

```sh
git status --porcelain
```

`origin/<base>`에서 브랜치를 만든다.

```sh
git switch --no-track -c <branch> origin/<base>
```

- 사유: `--no-track`이 없으면 upstream이 `origin/<base>`로 잡혀, 이후 `git push`·`git pull`이 베이스를 대상으로 동작한다.

### check

```sh
git status -sb
```

`## <branch>`(upstream 없음)로 나와야 한다. `## <branch>...origin/<base>`로 나오면 `git branch --unset-upstream`으로 푼다.

## cleanup branch or worktree

사용자가 브랜치나 worktree를 지우자고 하면 [`cleanup.md`](cleanup.md)를 읽고 그 순서대로 정리한다.