# BRANCH

메인 클론에 브랜치를 체크아웃해서 작업하는 경우만 다룬다. 언제 이 문서를 따르는지는 [`SKILL.md`](SKILL.md)에 있다.

## create branch

### select base

계획 문서 `requirements.md`에 베이스가 적혀 있으면 그것을 쓴다. 없으면 `git branch -r`로 원격 브랜치를 보고 아래 표로 정한다.

| 순서 | 베이스                                                                                      |
| ---- | ------------------------------------------------------------------------------------------- |
| 1    | 저장소 규칙(`CONTRIBUTING.md`, `CLAUDE.md`, `README.md`, `rules/` 등의 문서)이 정한 브랜치 |
| 2    | 규칙이 없으면 `develop`                                                                     |
| 3    | `develop`이 없으면 `main`                                                                   |

- 어느 것도 원격에 없으면 멈추고 묻는다.
- 정한 베이스와 근거를 보고에 적는다.

### fetch base

`origin/<base>`는 마지막 fetch 때의 사본이라, 만들기 직전에 원격의 최신 상태로 맞춘다.

```sh
git fetch origin <base>
```

### create

원격 브랜치는 만들지 않는다. 로컬에서 커밋을 쌓고, 처음 push할 때 [`git-push`](../git-push/SKILL.md)가 원격 브랜치를 만든다.

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

## cleanup branch

### what to delete

"브랜치 삭제해줘"는 로컬 브랜치를 지우는 것이다. 로컬 브랜치를 남길지 따로 묻지 않는다.

|                                 | 기본 정리에서                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------- |
| 로컬 브랜치 `<branch>`          | **지운다**                                                                            |
| 원격 추적 ref `origin/<branch>` | 두고, 건드리지 않는다                                                                 |
| GitHub의 원격 브랜치            | 사용자가 요청할 때만 `git push origin --delete <branch>`로 지우고 `git fetch --prune` |

### check nothing is lost

**로컬에만 있는 것이 없는지 먼저 본다.** 아래 중 하나라도 걸리면 멈추고 보고한다. 조용히 우회하거나 `-D`로 밀지 않는다. 지울 브랜치가 현재 브랜치가 아니면 먼저 그 브랜치로 옮겨서 본다.

```sh
git status -sb
```

| status 출력                             | 판정                                               |
| --------------------------------------- | -------------------------------------------------- |
| `## <branch>...origin/<branch>` + clean | 통과. 원격과 같다                                  |
| `[behind N]`만                          | 통과. 원격이 앞서 있을 뿐 잃을 것은 없다           |
| `[ahead N]`                             | push하지 않은 커밋이 있다. 멈춘다                  |
| 변경·스테이징된 파일                    | 멈춘다                                             |
| `## <branch>` (upstream 없음)           | 한 번도 push하지 않았다. 아래 "반영 확인"으로 간다 |
| `origin/<branch>: gone`                 | 원격 브랜치가 지워졌다. 아래 "반영 확인"으로 간다  |

```sh
git stash list
```

비어 있어야 한다. stash는 브랜치를 지워도 남지만 되찾을 실마리가 사라진다.

#### 반영 확인

원격 사본이 없으면 베이스에 반영됐는지가 지워도 되는 근거다.

| 확인       | 명령                                | 판정                   |
| ---------- | ----------------------------------- | ---------------------- |
| 조상 여부  | `git branch --merged origin/<base>` | 목록에 있으면 반영됨   |
| patch 단위 | `git cherry origin/<base> <branch>` | 모든 줄이 `-`면 반영됨 |

- `--merged`만 믿지 않는다. 머지 전에 리베이스하는 저장소에서는 로컬 tip이 베이스의 조상이 아니다. `git cherry`의 `-`는 같은 patch가 베이스에 있다는 뜻이라 리베이스를 통과한다.
- `+`가 남으면 커밋 제목으로 `git log origin/<base> --oneline --grep=<제목 일부>`를 찾고, 같은 제목이 있으면 `git diff <로컬커밋> <베이스커밋> -- <파일>`이 비는지 본다.
- 어느 것도 확인되지 않으면 로컬에만 있는 커밋이므로 멈추고 보고한다.

### delete

1. 지울 브랜치가 현재 브랜치이면 다른 브랜치로 먼저 옮긴다.
2. 로컬 브랜치를 지운다. 조상 여부로 반영을 확인했으면 `-d`, 원격 사본이나 patch 단위로 확인했으면 `-D`를 쓴다.

```sh
git branch -d <branch>
```

### verify

```sh
git branch -vv
```

지운 브랜치가 목록에서 사라졌는지 확인하고 보고한다. 원격 브랜치를 지우지 않았으면 `git branch -r`에 `origin/<branch>`가 남아 있는 것도 함께 적는다.

<!--
정리를 빠뜨리면 로컬 브랜치가 계속 쌓인다.
- 원격 브랜치를 지우고 git fetch --prune을 해도 원격 추적 ref만 사라지고, 로컬 브랜치는 upstream이 ": gone"으로 표시된 채 남는다.
- GitHub Desktop의 BranchPruner는 기본 브랜치(main)에 머지된 브랜치만 정리해서, develop으로 머지하는 저장소에서는 걸리지 않는다.
git branch -vv에서 ": gone"이 붙은 것들이 밀린 정리 후보다.
-->
