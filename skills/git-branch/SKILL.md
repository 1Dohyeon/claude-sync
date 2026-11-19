---
description: 작업 브랜치를 만들거나 정리할 때 사용한다. 베이스 브랜치를 고르고, 원격 브랜치를 먼저 만든 뒤 메인 클론이나 worktree에 체크아웃한다. 머지된 브랜치와 worktree를 유실 없이 지우는 절차도 담는다.
when_to_use: '예: "브랜치 만들어줘", "worktree 만들어줘", "브랜치 정리해줘", "워크트리 삭제해줘", 베이스 브랜치를 정해야 할 때'
---

# 브랜치 만들기와 정리

## 베이스 브랜치 고르기

새 브랜치를 어디서 딸지(베이스)는 아래 순서로 정하고, 사용자에게 묻지 않는다. 브랜치 생성, [`dev-plan`](../dev-plan/SKILL.md)의 계획 문서, 리뷰 스킬의 범위가 이 규칙을 쓴다.

1. 이번 대화에서 이미 확정한 베이스가 있거나, 계획 문서의 `requirements.md`에 `브랜치: <브랜치> (베이스: <베이스>)` 줄이 있으면 그 베이스를 쓴다. 계획 문서는 `dev-plan`의 "계획 문서 찾기" 순서로 찾는다.
2. 하위 PR의 브랜치이면 부모 브랜치가 베이스다. [`git-pr`](../git-pr/SKILL.md)의 "브랜치 계층"을 참고한다.
3. 없으면 원격에 실제로 있는 브랜치를 확인하고 아래 순서로 정한다.

```sh
git fetch origin
```

```sh
git branch -r
```

| 순서 | 베이스                                                                                    |
| ---- | ----------------------------------------------------------------------------------------- |
| 1    | 저장소 규칙(`CONTRIBUTING.md`, `CLAUDE.md`, `README.md`, `.github/`의 문서)이 정한 브랜치 |
| 2    | 규칙이 없으면 `develop`                                                                   |
| 3    | `develop`이 없으면 `main`                                                                 |

- 예외: `hotfix/*` 브랜치는 `main`을 베이스로 한다.
- 정한 베이스와 근거(몇 번째 순서로 정했는지)를 보고에 적는다.
- 어느 것도 원격에 없으면 멈추고 베이스를 묻는다.

## 브랜치 만들기

작업 브랜치는 메인 클론에서 만들거나 새 worktree로 만든다. 어느 쪽으로 할지는 사용자가 고른다. `<base>`는 위 "베이스 브랜치 고르기"로 정한 베이스다. `dev-plan`에서 작업 브랜치와 베이스를 이미 확정했으면 그 값을 쓴다. 계획 문서의 `requirements.md` 브랜치 줄에 있다.

worktree로 정했으면 [`worktree.md`](worktree.md)를 Read하고 그 순서대로 만든다. 아래 1단계와 3단계는 worktree에서도 같다.

### 메인 클론에서 만드는 순서

0. 메인 클론의 작업 트리가 clean한지 확인한다. 커밋하지 않은 변경이 있으면 중단하고 보고한다. 브랜치를 옮기면 그 변경이 새 브랜치로 따라온다.

```sh
git status --porcelain
```

1. 베이스 브랜치에서 새 브랜치를 원격에 먼저 만든다(로컬엔 아직 없는 빈 브랜치).

```sh
git fetch origin
git push origin origin/<base>:refs/heads/<branch>
```

2. 방금 만든 원격 브랜치를 시작점으로 로컬 브랜치를 만들고 옮긴다. 시작점이 `origin/<branch>`라 upstream이 베이스가 아니라 `<branch>` 자신으로 잡힌다.

```sh
git fetch origin
git switch -c <branch> origin/<branch>
```

3. upstream이 베이스 브랜치가 아니라 `<branch>` 자신인지 확인한다.

```sh
git status -sb
```

`## <branch>...origin/<branch>`로 나와야 한다. 그렇지 않으면 아래로 고친다.

| status 출력                     | 상태                                          | 조치                                                     |
| ------------------------------- | --------------------------------------------- | -------------------------------------------------------- |
| `## <branch>...origin/<branch>` | 정상                                          | 다음 단계로                                              |
| `## <branch>...origin/<base>`   | 베이스 브랜치를 추적                          | `git branch --set-upstream-to=origin/<branch>`           |
| `## <branch>`                   | upstream 없음 (`branch.autoSetupMerge=false`) | 위와 동일                                                |

- 사유: upstream이 베이스로 잡히면, 이후 평범한 `git push` 한 번에 커밋이 바로 베이스로 들어간다.

고친 뒤 `status -sb`로 다시 확인한다.

## 브랜치 정리

worktree로 만든 브랜치는 [`worktree.md`](worktree.md)의 "worktree 정리"로 지운다. 메인 클론의 브랜치는 아래로 지운다.

지울 것과 두는 것을 혼동하지 않는다.

|                                   | 실체                                | 기본 정리에서                |
| --------------------------------- | ----------------------------------- | ---------------------------- |
| ① 로컬 브랜치 `<branch>`          | `.git/refs/heads/<branch>`          | **지운다**                   |
| ② 원격 추적 ref `origin/<branch>` | `.git/refs/remotes/origin/<branch>` | 두고, 건드리지 않는다        |
| ③ GitHub의 원격 브랜치            | GitHub 서버                         | 사용자가 요청할 때만 지운다  |

③ 삭제(`git push origin --delete <branch>`)는 원격에 영향을 주는 일이라 사용자가 요청할 때만 한다. 지운 뒤에는 `git fetch --prune`으로 ②도 정리한다.

### 메인 클론 브랜치 정리

1. 베이스에 반영됐는지 확인한다. 목록에 있으면 반영된 것이다. 목록에 없으면 아래 "원격이 이미 삭제된 경우"의 patch 단위 확인으로 넘어간다.

```sh
git branch --merged origin/<base>
```

2. 지울 브랜치가 현재 브랜치이면 베이스나 다른 브랜치로 먼저 옮긴다.

3. 로컬 브랜치를 지운다. 1단계에서 반영을 확인했으므로 `-d`로 지워진다.

```sh
git branch -d <branch>
```

4. `git branch -vv`로 남은 브랜치를 확인하고 보고한다.

### 원격이 이미 삭제된 경우 (`: gone`)

선임이 원격 브랜치를 지운 뒤라 ②③이 없다. 원격 사본이 없으니, **베이스에 반영됐는지를 확인**하고 나서 지운다.

| 확인       | 명령                                   | 판정                   |
| ---------- | -------------------------------------- | ---------------------- |
| 조상 여부  | `git branch --merged origin/<base>`    | 목록에 있으면 반영됨   |
| patch 단위 | `git cherry origin/<base> <branch>`    | 모든 줄이 `-`면 반영됨 |

`--merged`만 믿지 않는다. 머지 전에 리베이스(force-push)하는 저장소에서는 로컬 tip이 베이스의 조상이 아니라 거의 아무것도 걸리지 않는다. `git cherry`의 `-`는 patch-id 동일본이 upstream에 있다는 뜻이라 리베이스를 통과한다.

`git cherry`에 `+`가 남으면 곧바로 미반영으로 결론내지 않는다. 리베이스로 **주변 문맥**이 바뀌면 같은 변경도 patch-id가 달라진다. 그 커밋 제목으로 베이스 히스토리를 찾아본다.

```sh
git log origin/<base> --oneline --grep=<제목 일부>
```

같은 제목이 있으면 `git show --stat`으로 양쪽 stat을 비교하고, 파일 단위로 `git diff <로컬커밋> <베이스커밋> -- <파일>`이 비는지 본다. 여기까지 확인되면 반영된 것으로 보고 `git branch -D`로 지운다. 어느 것도 확인되지 않으면 중단하고 보고한다.

### 정리를 빠뜨렸을 때

로컬 브랜치를 지우지 않으면 계속 쌓인다. 자동으로 없어지는 경로가 없다.

- 선임이 원격 브랜치를 지우고 `git fetch --prune`을 해도 ②만 사라진다. ①은 upstream이 `: gone`으로 표시만 되고 남는다. git은 로컬 브랜치를 자동 삭제하지 않는다.
- GitHub Desktop의 BranchPruner는 **기본 브랜치(`main`)에 머지된** 브랜치만 정리한다(로그: `Pruning 0 branches that have been merged into the default branch, main`). PR을 `develop`으로 머지하는 저장소에서는 한 번도 걸리지 않는다.

`git branch -vv`에서 `: gone`이 붙은 것들이 밀린 정리 후보다. 위 "원격이 이미 삭제된 경우"로 확인한 뒤 한 번에 지운다.
