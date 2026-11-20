---
description: PR을 올리기 전에 작업 브랜치 전체를 보거나, 올라온 PR을 리뷰할 때 사용한다. 베이스에서 갈라진 뒤의 변경 전체를 범위로, 규모와 유형에 따라 아키텍처·코드 레벨·영향 범위·테스트·컨벤션·요구사항 가운데 필요한 축을 격리된 서브에이전트로 병렬로 본다.
when_to_use: '예: "PR 올리기 전에 봐줘", "브랜치 전체 리뷰해줘", "3번 PR 리뷰해줘", PR 링크를 줄 때'
---

# 브랜치·PR 리뷰

베이스에서 갈라진 뒤 작업 브랜치에 쌓인 변경 전체가 대상이다. 두 모드가 범위와 축을 공유하고, 변경을 가져오는 곳만 다르다.

| 모드 | 쓰는 때 | 판단할 것 |
| --- | --- | --- |
| 브랜치 | PR을 올리기 전 | 이대로 PR을 올려도 되는가 |
| PR | PR 번호나 링크를 받았을 때 | 승인해도 되는가 |

PR 모드는 남이 쓴 코드일 수 있어서 태도가 다르다. 브랜치 모드와 [`review-commit`](../review-commit/SKILL.md)는 대체로 자기가 쓴 코드를 보는 셀프 리뷰다.

- 작성자에게 의도를 물을 수 없으므로, 근거가 모자란 항목은 억지로 지적으로 세우지 말고 "확인 필요"에 남긴다.
- 지적 문구가 작성자에게 그대로 전달될 수 있다. 사람이 아니라 코드를 가리키고, 무엇이 어떻게 틀리는지 사실로 쓴다.

## 범위: 브랜치 모드

작업 브랜치와 작업 폴더는 [`verify.md`](verify.md#작업-브랜치-정하기)의 "작업 브랜치 정하기"로 정한 것을 쓴다. 베이스는 작업 브랜치 계획 문서의 `requirements.md`에 적힌 베이스를 쓰고, 없으면 [`git-worktree`](../git-worktree/SKILL.md)의 "select base"로 정한다. 원격 ref(`origin/<base>`)를 쓰고 로컬 브랜치는 쓰지 않는다. worktree로 작업하는 동안 로컬 베이스 브랜치는 갱신되지 않아 뒤처지기 쉽고, 그러면 갈라진 지점이 과거로 밀려 남의 커밋까지 대상에 들어온다.

```sh
git -C <작업 폴더> fetch origin
```

```sh
git -C <작업 폴더> diff origin/<base>...HEAD
```

- 끝의 `HEAD`를 빠뜨리면 커밋하지 않은 변경까지 섞여 들어온다.
- 커밋하지 않은 변경은 `git -C <작업 폴더> status --porcelain`으로 확인해서, 있으면 리뷰 범위에서 빠진다는 사실을 알린다.
- 파일 수는 같은 범위에 `--name-only`를 붙여 센다.

## 범위: PR 모드

PR 번호는 사용자가 준 것만 쓴다. 링크를 받았으면 거기서 번호를 읽는다. 번호를 못 찾으면 추측하지 말고 되묻는다.

```sh
gh pr diff <번호>
```

`gh pr diff`로 diff는 얻을 수 있으나, 리뷰어가 주변 구조와 컨벤션을 대조하려면 디스크의 파일도 그 PR 브랜치여야 한다.

```sh
gh pr view <번호> --json headRefName,state
```

- `git worktree list`에 `headRefName` 브랜치의 worktree가 있으면 그 폴더를 작업 폴더로 쓴다.
- 없으면 현재 폴더의 브랜치가 `headRefName`과 같은지 본다. 같으면 현재 폴더가 작업 폴더다.
- 둘 다 아니면 사용자에게 알리고 고르게 한다: `gh pr checkout <번호>`를 실행할지, 아니면 diff만으로 진행할지. 임의로 체크아웃하지 않는다.
- diff만으로 진행하면 아키텍처·컨벤션 축의 정확도가 떨어지므로 그 사실을 리포트에 적는다.
- **`impact-reviewer`는 diff만으로는 부르지 않는다.** 이 축은 저장소를 Grep해서 참조 지점을 찾는 것이 일의 전부인데, 디스크가 PR 브랜치가 아니면 지운 심볼이 아직 살아 있고 바꾼 이름도 예전 것이라 찾아낸 참조가 전부 헛것이 된다. 체크아웃하지 않기로 했으면 이 축을 빼고, 뺐다는 사실을 리포트 머리에 적는다.
- 파일 수는 `gh pr diff <번호> --name-only`로 센다.

## 2라운드부터

두 모드 모두 스냅샷은 처음 명령 대신 [`verify.md`의 "재리뷰"](verify.md#재리뷰)가 정한 증분 범위로 뜬다. PR 모드에서 체크아웃했으면 먼저 `gh pr checkout <번호>`로 PR의 새 커밋을 받아 온다.

단일 명령으로 유지한다. `&&`·`;`·`|`로 엮으면 allowlist의 접두 규칙에 걸리지 않아 매번 승인 프롬프트가 뜬다.

## 축

부를 축은 [`verify.md`](verify.md)의 "규모 판단"이 규모와 유형으로 정한다. standard 이상이면 아래 여섯 축을 모두 부른다. 남의 PR은 계획 문서가 없는 경우가 많아, 그때는 diff 실측으로 규모를 정한다.

- [`architecture-reviewer`](../../agents/architecture-reviewer.md)
- [`logic-reviewer`](../../agents/logic-reviewer.md)
- [`impact-reviewer`](../../agents/impact-reviewer.md)
- [`testing-reviewer`](../../agents/testing-reviewer.md)
- [`convention-reviewer`](../../agents/convention-reviewer.md)
- [`requirement-reviewer`](../../agents/requirement-reviewer.md)

화면에 닿는 파일이 있으면 [`qa-reviewer`](../../agents/qa-reviewer.md)를 부록으로 함께 부른다.

## 이어서

[`verify.md`](verify.md)를 읽고 요구사항 확보부터 출력까지 그대로 진행한다.

요구사항 출처는 모드마다 다르다.

- 브랜치 모드: 작업 브랜치의 계획 문서 `requirements.md` → 없으면 커밋 메시지·이번 대화.
- PR 모드: 사용자가 요청과 함께 붙여넣은 텍스트가 1순위다. 사용자가 이 PR을 위해 계획 문서를 만들어 두었으면(남의 작업이어도 만들 수 있다) 그 `requirements.md`가 2순위이고, 경로의 `{branch}`는 PR의 `headRefName`으로 찾는다. 둘 다 없으면 PR 설명과 거기서 이어지는 이슈·링크를 쓴다. 셋 다 없으면 `requirement-reviewer`는 부르지 않는다. 남의 PR이라 요구사항을 짐작해서 채우면 근거 없는 지적만 나온다.
