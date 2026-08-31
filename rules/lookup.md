# LOOKUP RULE

파일·코드 조회 시 지킨다. (`cat`·`head`·`tail`은 [`settings.json`](../settings.json)의 `deny`로 차단되어 있음)

- 파일 내용은 `Read`, 검색은 `Grep`/`Glob`을 쓴다. `sed`·`awk`·`strings`·`find`로 대체하지 않는다.
- `Bash`는 **단일 명령**만 쓰고 `&&`·`;`·`|`·`for`·`$(...)`로 엮지 않는다. 복합 명령은 allowlist의 접두 규칙에 걸리지 않아 매번 승인 프롬프트가 뜬다.
- 여러 파일을 봐야 하면 `Read`를 한 응답에서 병렬로 여러 번 호출한다.
- 위 방법으로 불가능한 조회(바이너리 문자열 확인 등)만 Bash를 쓰고, 왜 필요한지 먼저 한 줄로 밝힌다.
