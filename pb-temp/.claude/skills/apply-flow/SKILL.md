---
description: PhoneB 요금제 신청 흐름(간편신청·빠른신청·인터넷신청·히든딜)을 수정할 때 사용한다. 신청 방식이 어디서 갈리는지, 어느 파일을 함께 봐야 하는지 정한다.
---

# 요금제 신청 흐름 작업 절차

신청 단계, 신청 방식 분기, 신청 상태값을 건드리는 작업에 적용합니다.
화면 코드를 함께 수정하므로 [`/frontend`](../frontend/SKILL.md)도 함께 호출합니다.

## 1. 설계 전에 읽습니다

[`apps/shrimp/CLAUDE.md`](../../../apps/shrimp/CLAUDE.md)의 "요금제 신청 방식" 절이 이 도메인의 SSOT입니다.
네 가지 신청 방식의 단계 목록, 분기 조건, 로그인 상태별 동작, 히든딜의 특수 처리가 모두 정리되어 있습니다.

| 신청 방식 | 경로 |
|---|---|
| 간편신청 | `/easy-application/[applicationId]/[step]` |
| 빠른신청 | `/easy-application/phoneb-apply/[id]/[step]` |
| 인터넷신청 | `/internet/apply/[internetId]/[step]` |
| 외부링크 | 제휴사별 외부 URL |

## 2. 함께 봐야 하는 파일

신청 흐름은 화면 한 곳만 고쳐서는 끝나지 않습니다. 아래 네 곳의 정합성을 함께 확인합니다.

| 관심사 | 위치 |
|---|---|
| 신청 방식 분기 결정 | `apps/shrimp/src/app/detail/_components/DetailPageComponent/DetailPageComponent.tsx` |
| 신청 타입 정의 | `types/application.d.ts` |
| 신청 상태값 매핑 | `status/application.ts`, `status/phoneb-app.ts` |
| 백엔드 호출 | `apis/services/shrimp/applyService.ts` |

분기는 `Plan`의 `isPartner`, `ezApplication`, `phonebApplication`, `carrierId` 값으로 결정됩니다.
통신사 ID를 조건에 쓸 때는 숫자를 직접 적지 말고 기존 상수를 사용합니다.

## 3. 구현할 때 지키는 것

- 단계를 추가하거나 순서를 바꾸면 그 흐름의 모든 단계 목록과 상태값 매핑을 함께 갱신합니다. 한 곳만 고치면 중간 단계에서 흐름이 끊깁니다.
- 신청 방식마다 지원 범위가 다릅니다. 미성년자, 본인인증, eSIM 지원 여부가 흐름별로 갈리므로, 한 흐름의 동작을 다른 흐름에 그대로 옮기지 않습니다.
- 히든딜은 로그인을 강제하고 유입경로 설문을 띄우며 조회수를 집계하지 않습니다. 일반 상세 화면과 같은 컴포넌트를 쓰지만 동작이 다르므로, 수정 전에 `type` 값이 `'hidden'`일 때의 분기를 확인합니다.

## 4. 검증

```bash
bun nx lint shrimp
bun nx test shrimp
```

수정한 흐름을 첫 단계부터 완료 단계까지 실제로 진행해 봅니다.
로그인 상태와 미로그인 상태가 갈리는 지점이 있으므로, 바꾼 분기에 해당하는 상태로 확인하고 그 경로를 남깁니다.
