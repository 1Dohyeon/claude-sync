---
description: PhoneB 어드민 대시보드(apps/admin)를 작성·수정할 때 사용한다. 페이지 구조, 공통 컴포넌트, API 호출 방식을 어디서 확인하고 무엇을 검증할지 정한다.
---

# 어드민 작업 절차

`apps/admin`을 건드리는 작업에 적용합니다.
어드민 화면이 호출하는 백엔드 엔드포인트까지 손봐야 한다면 [`/backend`](../backend/SKILL.md)도 함께 호출합니다.

## 1. 설계 전에 읽습니다

- [`apps/admin/CLAUDE.md`](../../../apps/admin/CLAUDE.md): 이 앱의 디렉터리 구조, 인증 흐름, 페이지 구조 패턴, 공통 컴포넌트(BrandNewAdmin, AdminQuery), Server Actions와 API Route 사용 기준이 있습니다.
- [`.rules/frontend-conventions.md`](../../../.rules/frontend-conventions.md): 프론트 공통 컨벤션의 SSOT입니다.

## 2. 구현할 때 지키는 것

- 새 화면을 만들기 전에 기존 어드민 페이지 하나를 열어 구조를 확인하고 그 형태를 따릅니다.
- 목록 화면의 필터는 `AdminQuery`, 신규 UI는 `BrandNewAdmin` 컴포넌트를 우선 사용합니다. 같은 역할의 컴포넌트를 새로 만들지 않습니다.
- 백엔드 호출 방식(Server Actions와 API Route)은 그 화면의 기존 방식을 따릅니다.

## 3. 권한 관련 주의

어드민 권한 체크는 PATCH 요청을 PUT으로 치환해서 검사합니다.
따라서 PATCH 엔드포인트의 권한은 DB에 `PUT`으로 등록해야 합니다.
권한이 걸린 화면을 추가한다면 이 점을 먼저 확인합니다. 상세한 설명은 `apps/shrimp-server/CLAUDE.md`의 인증 절에 있습니다.

## 4. 검증

```bash
bun nx lint admin
bun nx build admin
```

화면이 바뀌었다면 실제로 열어서 확인한 경로와 확인한 내용을 남깁니다.
권한이 걸린 화면이면 권한이 없는 계정에서도 의도대로 막히는지 확인합니다.
