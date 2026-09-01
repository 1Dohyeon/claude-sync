---
description: 올라온 PR을 리뷰할 때 사용한다("3번 PR 리뷰해줘", PR 링크). 남이 쓴 코드를 승인할지 판단하는 자리이며, 그 PR의 변경 전체를 범위로 아키텍처·코드 레벨·테스트·컨벤션·요구사항 다섯 축을 격리된 서브에이전트로 병렬로 본다. 화면 변경이 있으면 브라우저 확인 목록을 부록으로 덧붙인다.
---

# PR 리뷰

지정된 PR의 변경 전체가 대상이다. 판단할 것은 "승인해도 되는가"다.

앞의 두 리뷰([`diff-review`](../diff-review/SKILL.md)·[`branch-review`](../branch-review/SKILL.md))는 대체로 자기가 쓴 코드를 보는 셀프 리뷰지만, 이쪽은 남이 쓴 코드일 수 있다. 그래서 태도가 다르다.

- 작성자에게 의도를 물을 수 없으므로, 근거가 모자란 항목은 억지로 지적으로 세우지 말고 "확인 필요"에 남긴다.
- 지적 문구가 작성자에게 그대로 전달될 수 있다. 사람이 아니라 코드를 가리키고, 무엇이 어떻게 틀리는지 사실로 쓴다.

## 범위

PR 번호는 사용자가 준 것만 쓴다. 링크를 받았으면 거기서 번호를 읽는다. 번호를 못 찾으면 추측하지 말고 되묻는다.

```sh
gh pr diff <번호>
```

`gh pr diff`로 diff는 얻을 수 있으나, 리뷰어가 주변 구조와 컨벤션을 대조하려면 디스크의 파일도 그 PR 브랜치여야 한다.

```sh
gh pr view <번호> --json headRefName,state
```

- 현재 체크아웃된 브랜치가 `headRefName`과 같으면 그대로 진행한다.
- 다르면 사용자에게 알리고 고르게 한다: `gh pr checkout <번호>`를 실행할지, 아니면 diff만으로 진행할지. 임의로 체크아웃하지 않는다.
- diff만으로 진행하면 아키텍처·컨벤션 축의 정확도가 떨어지므로 그 사실을 리포트에 적는다.

단일 명령으로 유지한다. `&&`·`;`·`|`로 엮으면 allowlist의 접두 규칙에 걸리지 않아 매번 승인 프롬프트가 뜬다.

## 축

다섯 축을 모두 부른다.

- [`architecture-reviewer`](../../agents/architecture-reviewer.md)
- [`logic-reviewer`](../../agents/logic-reviewer.md)
- [`testing-reviewer`](../../agents/testing-reviewer.md)
- [`convention-reviewer`](../../agents/convention-reviewer.md)
- [`requirement-reviewer`](../../agents/requirement-reviewer.md)

`requirement-reviewer`에게 넘길 요구사항은 사용자가 붙여넣은 텍스트, 사용자가 만든 task 문서, PR 설명 순으로 찾는다. 셋 다 없으면 이 축은 부르지 않는다. 남의 PR이라 요구사항을 짐작해서 채우면 근거 없는 지적만 나온다.

화면에 닿는 파일이 있으면 [`qa-reviewer`](../../agents/qa-reviewer.md)를 부록으로 함께 부른다. 남이 쓴 코드를 직접 눌러 볼 절차가 된다.

## 이어서

[`review-common/verify.md`](../review-common/verify.md)를 읽고 요구사항 확보부터 출력까지 그대로 진행한다.

요구사항 출처가 남의 PR에서는 세 갈래다. 사용자가 요청과 함께 붙여넣었으면 그것이 1순위다. 사용자가 이 PR을 위해 worklog에 task 문서를 만들어 두었으면(남의 작업이어도 만들 수 있다) 그것이 2순위이고, 경로는 현재 브랜치가 아니라 PR의 `headRefName`으로 찾는다. 둘 다 없으면 PR 설명과 거기서 이어지는 이슈·링크를 쓴다.

규모 판단의 파일 수는 아래로 센다.

```sh
gh pr diff <번호> --name-only
```
