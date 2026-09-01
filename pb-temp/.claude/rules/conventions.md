# 코딩 컨벤션 (모노레포 전역)

프론트와 백엔드에 공통으로 적용되는 규칙입니다.
영역별 상세 규칙은 해당 스킬이 가리키는 문서를 따릅니다.

## TypeScript

- 명시적 타입을 정의합니다. `any`는 피하고, 정말로 동적인 값에는 `unknown`을 씁니다.
- 객체 형태는 `interface`, 유니온과 인터섹션과 유틸리티 타입은 `type`으로 선언합니다.
- 인터페이스 이름에 `I` 접두사를 붙이지 않습니다.

## 네이밍

| 항목 | 형식 | 예시 |
|---|---|---|
| 컴포넌트, 타입, 인터페이스 | PascalCase | `ProductCard`, `Carrier` |
| 함수, 변수 | camelCase | `fetchProducts` |
| 상수 | UPPER_SNAKE_CASE | `MAX_ITEMS` |

## Import

- 이번 변경으로 쓰지 않게 된 import는 제거합니다. 원래 있던 미사용 import는 요청 없이 건드리지 않습니다.
- 타입만 가져올 때는 `import type`을 씁니다. 인라인 `type` 키워드는 가독성이 떨어지므로 피합니다.

```ts
import type { Carrier, Device } from '@types';
import { useStore } from '@/store';
import type { Line } from '@/store';
```

## 포맷팅

루트 `.prettierrc`를 따릅니다.
홑따옴표, 세미콜론, `printWidth: 110`, `trailingComma: all`, `tabWidth: 2`, `arrowParens: avoid`입니다.

## Path Alias

정본은 `tsconfig.base.json`의 `compilerOptions.paths`입니다.
자주 쓰는 항목은 다음과 같습니다.

| Alias | 대상 |
|---|---|
| `@apis`, `@apis/controllers/<앱>`, `@apis/services/<앱>` | 프론트에서 백엔드를 호출하는 HTTP 클라이언트 |
| `@services/*` | `libs/services/*/src` (도메인 비즈니스 로직) |
| `@libs/utils` | 공용 유틸리티 |
| `@types` | 프론트·백 공유 타입 |
| `@status` | 도메인 상태값·비즈니스 상수 |
| `@config/*`, `@db/*` | 공통 설정, 레거시 DB 커넥션 |
| `@packages/common`, `@packages/react`, `@packages/jotai`, `@packages/next`, `@packages/global/*` | 재사용 패키지 |
| `@shrimp/*`, `@admin/*`, `@partners/*` | 각 앱의 `src` |

`@phonehere/*`는 존재하지 않는 `apps/phonehere/src`를 가리키는 잔여 항목이므로 사용하지 않습니다.
