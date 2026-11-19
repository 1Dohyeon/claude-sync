---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---

# TYPESCRIPT RULE

저장소 규칙(CLAUDE.md, 린터 설정, 기존 코드의 다수 양식)이 다르게 정해 두었으면 그것을 따른다.

## 버전

- 라이브러리·프레임워크 API를 쓰기 전에, 고치는 파일이 속한 패키지의 `package.json`과 lockfile에서 실제 버전을 확인하고 그 버전 기준으로 쓴다. 기억에 있는 최신 문법을 기본값으로 쓰지 않는다.
- 패키지 호환성은 기억으로 판단하지 않는다. `npm view <패키지>@<버전> engines peerDependencies`, 패키지 매니저의 `ls` 검사, 빌드·테스트 결과로 판단한다.

## 타입

- export하는 함수, 공용 유틸, public 메서드에는 매개변수와 반환 타입을 적는다. 지역 변수는 추론에 맡긴다.
- `any`를 쓰지 않는다. 외부 입력이나 신뢰할 수 없는 값은 `unknown`으로 받아 좁혀서 쓴다. 호출부에 따라 타입이 달라지면 제네릭을 쓴다.
- 확장되거나 구현될 객체 모양은 `interface`로, 유니언·교차·튜플·매핑 타입은 `type`으로 쓴다.
- `.js`·`.jsx` 파일에서 타입이 이해를 도우면 JSDoc을 쓰고, JSDoc은 런타임 동작과 맞춘다.

```ts
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Unexpected error'
}
```

## 비밀값

- API 키와 토큰을 코드에 쓰지 않는다. 환경 변수에서 읽고, 값이 없으면 시작 시점에 오류를 낸다.
