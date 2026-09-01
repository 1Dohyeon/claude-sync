---
description: PhoneB 사용자 프론트엔드(apps/shrimp)를 작성·수정할 때 사용한다. 컴포넌트·스타일·상태 관리 컨벤션을 어디서 확인하고 무엇을 검증할지 정한다.
---

# 사용자 프론트 작업 절차

`apps/shrimp`를 건드리는 작업에 적용합니다.
요금제 신청 흐름을 수정한다면 [`/apply-flow`](../apply-flow/SKILL.md)도 함께 호출합니다.

## 1. 설계 전에 읽습니다

- [`.rules/frontend-conventions.md`](../../../.rules/frontend-conventions.md): 프론트 공통 컨벤션의 SSOT입니다. 컴포넌트 작성, 타입과 인터페이스 명명, 타입 import, Vanilla Extract 스타일 규칙이 여기 있습니다.
- [`apps/shrimp/CLAUDE.md`](../../../apps/shrimp/CLAUDE.md): 이 앱 고유의 기술 스택, 디렉터리 구조, Jotai와 React Query 사용 패턴이 있습니다.
- 컴포넌트 설계나 렌더링 성능을 판단해야 하면 [`.rules/react-best-practice.md`](../../../.rules/react-best-practice.md)의 해당 항목만 찾아 읽습니다. 분량이 크므로 전체를 통째로 읽지 않습니다.

## 2. 구현할 때 지키는 것

- 스타일은 Vanilla Extract로 작성합니다. 컴포넌트는 `ComponentName/` 폴더 아래에 `ComponentName.tsx`, `ComponentName.css.ts`, `index.ts`를 두는 기존 구조를 따릅니다.
- 전역 상태는 Jotai, 서버 상태는 React Query를 씁니다. 새 상태 관리 도구를 들이지 않습니다.
- 여러 화면이 공유하는 컴포넌트는 `src/common/`에 둡니다.
- 백엔드 호출은 `apis/`의 클라이언트나 Server Actions를 거칩니다. 컴포넌트에서 백엔드 URL을 직접 조립하지 않습니다.
- `src/generated/`는 생성물이므로 직접 수정하지 않습니다.

## 3. 검증

```bash
bun nx lint shrimp
bun nx test shrimp
```

페이지를 추가했다면 라우트 타입을 다시 만듭니다.

```bash
bun nx generate:routes shrimp
```

화면이 바뀌었다면 실제로 열어서 확인한 경로와 확인한 내용을 남깁니다.
