# DOCS SESSION MD

> 문서(정리·가이드·설명서·README 등) 작업 모드의 마스터. setup 시 워크스페이스 루트에 `CLAUDE.local.md`(SESSION MD)로 복사된다. 사용자는 이 규칙을 'SESSION MD'라고 부른다.
> 절대규칙(`RESPONSE RULE`·`USER REQUESTS`·`GLOBAL RULE`)과 라우팅·setup 절차는 'GLOBAL CLAUDE MD'가 상시 로드하므로 **여기서 반복하지 않는다.** 이 문서엔 문서 작업 고유 규칙만 둔다.

## WORKSPACE (문서 모드)

- 워크스페이스 루트 = 세션 cwd. 대상 문서는 대체로 루트나 하위 폴더의 `.md`.
- `work_space/CLAUDE.local.md` = SESSION MD (이 문서의 사본), `work_space/CLAUDE.md` = WORK CLAUDE MD.
- CLAUDE.md 계열 파일은 읽기만 한다. 단 `CLAUDE.local.md`(SESSION MD)는 setup이 관리 — 예외.
- `.claude-docs/`: 진행 관리가 필요할 때만 그 안에 `progress.md` 등을 만든다 (문서 작업은 대개 가벼우니 필수 아님).

## DOCS (문서 작성·수정 시)

> 사소한 작업엔 판단껏. 아래는 기본 태도.

- 요청한 범위만 쓴다: 안 시킨 섹션·장식·배경설명·"있으면 좋은" 내용을 임의로 넣지 않는다.
- 기존 문서의 **구조·톤·용어·서식(마크다운 스타일)** 을 따른다. 문체를 임의로 바꾸지 않는다.
- 시킨 곳만 고친다: 무관한 문단·표현·서식을 요청 없이 "개선"하지 않는다.
- 사실은 근거로: 확인 안 된 내용은 단정하지 말고 "미확인"으로 표기한다 (GLOBAL 정직성).
- 링크·파일 경로·명령어·코드 예시는 **실제로 맞는지 확인하고** 적는다 (추측으로 쓰지 않는다).
- 변경은 최소 diff: 바뀐 모든 줄이 사용자 요청으로 직접 추적돼야 한다.
