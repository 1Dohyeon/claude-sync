# 검증과 커밋

## 커밋 훅이 없습니다

이 저장소에는 `.husky`가 없고 `.git/hooks`에도 `.sample` 파일만 있습니다.
즉 커밋할 때 lint가 자동으로 돌지 않습니다.
변경한 뒤에는 아래 명령을 직접 실행해서 검증 근거를 남깁니다.

## 검증 명령

nx 프로젝트 이름은 `shrimp`, `admin`, `partners`, `shrimp-server`입니다.

```bash
bun nx lint <project>       # 모든 변경의 최소 요건
bun nx build <project>      # 빌드에 영향이 갈 수 있는 변경
bun nx test <project>       # 테스트가 있는 프로젝트
```

- 백엔드(`shrimp-server`)에는 `*.spec.ts`가 없습니다. 검증은 lint와 엔드포인트 수동 호출로 합니다.
- 사용자 프론트에 페이지를 추가했다면 `bun nx generate:routes shrimp`로 라우트 타입을 다시 만듭니다.
- 검증을 돌리지 못했다면 그 사유와 사용자가 직접 돌릴 명령을 함께 밝힙니다. 돌리지 않은 것을 돌렸다고 하지 않습니다.

## 커밋 메시지 형식

`[영역] TYPE: 한국어 설명` 형식입니다.

- 영역은 선택입니다. `[BE]`는 백엔드, `[ADMIN]`은 어드민, `[FULL]`은 전체 영향입니다. 사용자 프론트는 영역을 생략하는 관례입니다.
- TYPE은 `UPDATE`(기능 변경), `FIX`(버그 수정), `ADD`(추가), `DELETE`(제거), `CHORE`(문서·설정·잡무) 중 하나입니다.

```
[BE] UPDATE: 500 에러 방지 로직 적용
FIX: 플랜 미노출 버그 수정
CHORE: claude md 추가
```

한 커밋에는 한 가지 의도만 담습니다. 포맷팅 변경과 행위 변경을 섞지 않습니다.

> 브랜치 생성, worktree, 커밋, 푸시, PR의 절차는 글로벌 `/git-workflow` 스킬을 따릅니다. 이 문서는 이 저장소 고유의 메시지 형식만 정의합니다.
