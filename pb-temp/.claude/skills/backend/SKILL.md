---
description: PhoneB 백엔드(apps/shrimp-server, libs/services)를 작성·수정할 때 사용한다. 라우터·컨트롤러·서비스·Raw SQL·인증·에러 처리 패턴을 어디서 확인하고 무엇을 검증할지 정한다.
---

# 백엔드 작업 절차

`apps/shrimp-server`, `libs/services`, `status`, `types` 중 백엔드 쪽을 건드리는 작업에 적용합니다.

## 1. 설계 전에 읽습니다

- [`apps/shrimp-server/CLAUDE.md`](../../../apps/shrimp-server/CLAUDE.md): 백엔드 컨벤션의 SSOT입니다. 라우터 그룹별 인증, 컨트롤러 패턴 A와 B, `executeQuery` 반환값, 트랜잭션, 입력 검증, 에러 처리, 파일 업로드, 외부 서비스 연동이 모두 여기 있습니다.
- 이 문서는 백엔드 파일을 열면 자동으로 따라오지만, **파일을 열기 전 설계 단계에서 미리 읽는 것이 이 스킬의 목적**입니다. 어느 라우터 그룹에 붙일지, 로직을 컨트롤러와 서비스 중 어디에 둘지는 코드를 열기 전에 정해야 합니다.

건드릴 도메인의 기존 서비스 모듈을 `libs/services/` 아래에서 먼저 찾습니다.
비즈니스 로직 대부분이 이미 그곳에 있으므로, 새 모듈을 만들기 전에 기존 모듈을 확인합니다.

## 2. 구현할 때 지키는 것

새 코드는 다음 패턴을 따릅니다. 근거와 예시는 위 SSOT 문서에 있습니다.

- 컨트롤러는 얇게 유지하고 로직은 `libs/services`로 내립니다. 신규 컨트롤러는 패턴 B(도메인 파라미터만 받는 형태)로 작성합니다.
- 쿼리는 mysql2 Raw SQL과 named placeholder로 씁니다. 값을 문자열 연결로 끼워 넣지 않습니다.
- 라우터는 인증 그룹에 맞는 디렉터리에 등록합니다. 등록 위치가 곧 인증 범위입니다.
- 성공 응답은 `{ result, ...statusMap[status] }`로 통일합니다. 기존 코드에 `results`나 `plans` 같은 변형이 섞여 있어도 신규는 `result`로 씁니다.
- 에러는 `throw { status, message }`로 던집니다. 정상적인 비즈니스 에러에는 `hideServerLog: 1`을 붙여 로그 노이즈를 줄입니다.
- `@swagger` 주석을 함께 작성합니다.

## 3. 자주 틀리는 지점

전체 목록은 SSOT 문서의 "자주 실수하는 함정" 표에 있습니다. 그중 사고로 이어지는 두 가지만 다시 강조합니다.

- `executeQuery`는 이미 rows 배열을 반환합니다. `const [rows] = await executeQuery(...)`라고 쓰면 `rows`에는 첫 행이 담깁니다.
- 트랜잭션의 `conn.release()`는 반드시 `finally`에 둡니다. `catch`에만 두면 정상 경로에서 커넥션이 샙니다.

## 4. 검증

`shrimp-server`에는 `*.spec.ts`가 없습니다.

```bash
bun nx lint shrimp-server
```

lint를 통과시킨 뒤 추가하거나 수정한 엔드포인트를 실제로 호출해서 응답을 확인합니다.
무엇을 어떤 요청으로 호출했고 어떤 응답을 받았는지 남깁니다.
