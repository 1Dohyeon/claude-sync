# FORK.md — fork 커스터마이징 규칙

이 파일은 upstream(원본)을 fork해서 **개인 커스터마이징**하는 저장소에서, 커스텀 브랜치로 작업할 때 적용되는 규칙이다.

## 최우선 판단 기준: rebase 충돌 최소화

커스텀 커밋은 주기적으로 upstream 최신 위로 rebase된다. 그래서 **"이 변경이 나중에 rebase 충돌을 얼마나 만드는가"**가 모든 설계 결정의 1순위 기준이다.

## 규칙

1. **기존(upstream) 파일 수정보다 새 파일 추가를 우선한다.**
   - 새 기능/모듈은 upstream이 모르는 새 파일로 만든다 → 충돌 원천 차단.
   - 설정·상수 확장은 원본을 두고 별도 파일에서 import/override 한다.

2. **기존 파일을 불가피하게 손대면 최소 범위로.**
   - 여러 곳에 흩뿌리지 말고 한 지점(진입점/hook)에 모은다.
   - 대규모 개편이 필요하면 wrapper/adapter로 감싸 원본을 보존한다.

3. **upstream 관리 문서는 직접 수정하지 않는다.**
   - `AGENTS.md`, `CLAUDE.md`, `docs/STYLEGUIDE.md`, `.gitignore` 등은 rebase 충돌 단골이다.
   - fork 공통 규칙은 이 파일(`~/.claude/FORK.md`)에, repo 전용 세부사항은 해당 repo의 `CLAUDE.LOCAL.md`에 쌓는다.

4. **커스텀 로직은 내 소유의 새 파일에 몰아넣는다.**
   - 원본 파일에는 진입점 한 줄만 남긴다 → 충돌이 그 한 줄로 축소된다.

> 추가 규칙 및 예외는 `CLAUDE.LOCAL.md` 참고
