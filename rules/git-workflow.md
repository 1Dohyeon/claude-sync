# Git 워크플로 규칙

## worktree 생성

작업은 항상 새 worktree를 만들어 진행한다. 사용자가 요청하면 아래 순서로 만든다.

1. 베이스 브랜치(`develop`, 없으면 `main`)에서 새 브랜치를 원격에 먼저 만든다(로컬엔 아직 없는 빈 브랜치):

```sh
git fetch origin
git push origin origin/develop:refs/heads/<branch>
```

2. 메인 작업 폴더와 형제 위치에, 방금 만든 원격 브랜치를 추적하는 worktree를 만든다:

```sh
git fetch origin
git worktree add -b <branch> <dir> origin/<branch>
```

`--track`은 붙이지 않는다. 시작점이 `origin/<branch>`라 upstream은 어차피 자동으로 잡히고, git 2.18 미만에서는 `unknown option 'track'`으로 실패한다.

3. upstream이 베이스 브랜치가 아니라 `<branch>` 자신인지 확인한다. (`git worktree add -b <branch> <dir> origin/develop`처럼 만들면 upstream이 `develop`이 되어버려서, 이후 평범한 `git push` 한 번에 커밋이 바로 `develop`으로 들어간다.)

```sh
git -C <dir> status -sb
```

`## <branch>...origin/<branch>`로 나와야 한다. 그렇지 않으면 아래로 고친다.

| status 출력 | 상태 | 조치 |
|---|---|---|
| `## <branch>...origin/<branch>` | 정상 | 다음 단계로 |
| `## <branch>...origin/develop` | 베이스 브랜치를 추적 | `git -C <dir> branch --set-upstream-to=origin/<branch>` |
| `## <branch>` | upstream 없음 (`branch.autoSetupMerge=false`) | 위와 동일 |

고친 뒤 `status -sb`로 다시 확인한다.

4. 의존성을 설치한다. 새 worktree엔 `node_modules`가 없어서 이 단계까지 끝내야 바로 쓸 수 있다. 저장소 자체의 패키지 매니저를 쓴다(`bun.lock` → `bun install`, `pnpm-lock.yaml` → `pnpm install` 등).

5. 설치 과정에서 생긴 lockfile 변경은 되돌린다.

```sh
git -C <dir> checkout -- <lockfile>
```

새 worktree는 원래 clean한 상태로 시작하므로, 여기서 생긴 lockfile 변경은 의도된 변경이 아니라 환경 노이즈다(예: 더 최신 패키지 매니저가 메타데이터를 다시 씀). 실제 의존성 버전이 바뀐 경우라면 그대로 되돌리되 보고에서 언급한다.

6. 마지막으로 확인하고 보고한다.

```sh
git -C <dir> status -sb
```

작업 트리가 clean해야 한다.

## 커밋 메시지

**커밋 메시지를 작성하기 전에 [`~/.claude/CLAUDE.local.md`](../CLAUDE.local.md)를 무조건 Read한다.** 거기 적힌 추가 커밋 규칙도 꼭 따른다.

그 다음 저장소 자체 규칙을 아래 순서로 파악한다.

1. commit/git 관련 문서(`CONTRIBUTING.md`, `.github/` 안의 문서, 저장소 `CLAUDE.md` 등)가 있으면 Read한다.
2. `git log`로 기존 커밋 히스토리를 보고 실제 쓰이는 패턴을 파악한다.

**제목**: 저장소에 규칙 문서가 없으면 1번에서 파악한 히스토리 패턴을 따른다.

**본문(description)**: 저장소에 규칙이 있으면 그 규칙을 따른다. 없으면(대체로 없다) 다음을 따른다.

- 1레벨 불릿 리스트로 구성한다.
- why(이유)는 적지 않는다. what(무엇을 했는지)만 적는다.

## 푸시 · PR · 머지

- 푸시는 항상 사용자 허락을 받은 뒤에만 한다.
- PR 생성, 머지는 하지 않는다.
