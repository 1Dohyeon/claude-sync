# PhoneB Monorepo 에이전트 작업 규약

이 파일은 AI 코딩 에이전트가 이 저장소에서 작업할 때 따르는 규약의 진입점입니다.
프로젝트 소개, 셋업 절차, 배포 파이프라인은 [`README.md`](./README.md)에 있습니다.

## 1. 규칙이 주입되는 방식

| 계층 | 위치 | 주입 시점 |
|---|---|---|
| 저장소 필수 | [`.claude/rules/`](./.claude/rules/) | 항상 |
| 저장소 트리거 | [`.claude/skills/`](./.claude/skills/) | 해당 작업을 시작하기 전에 호출 |
| 앱 고유 | `apps/<app>/CLAUDE.md` | 그 앱의 파일을 읽을 때 |

규칙은 한 곳에서만 정의하고 나머지에서는 참조합니다.

### 저장소 필수 규칙

| 파일 | 담는 내용 |
|---|---|
| [`.claude/rules/codebase-map.md`](./.claude/rules/codebase-map.md) | 디렉터리 구조와 그 구조에서 비롯되는 함정 |
| [`.claude/rules/conventions.md`](./.claude/rules/conventions.md) | 모노레포 전역 코딩 컨벤션 |
| [`.claude/rules/verification.md`](./.claude/rules/verification.md) | 검증 명령과 커밋 메시지 형식 |

## 2. 스킬 라우팅 (MUST OBEY)

작업 성격이 트리거에 맞으면 **작업을 시작하기 전에** 해당 스킬을 명시적으로 호출합니다.
자동 호출을 기다리지 않습니다. 자동 호출은 `description` 매칭에 달려 있어 확실하지 않습니다.

| 작업 트리거 | 호출 대상 |
|---|---|
| 백엔드 (`apps/shrimp-server`, `libs/services`, 라우터·컨트롤러·SQL·인증) | [`/backend`](./.claude/skills/backend/SKILL.md) |
| 사용자 프론트 (`apps/shrimp`) | [`/frontend`](./.claude/skills/frontend/SKILL.md) |
| 어드민 (`apps/admin`) | [`/admin`](./.claude/skills/admin/SKILL.md) |
| 요금제 신청 흐름 수정 (간편·빠른·인터넷·히든딜) | [`/apply-flow`](./.claude/skills/apply-flow/SKILL.md) |

- 한 작업이 여러 트리거에 걸리면 해당하는 스킬을 모두 호출합니다.
- `apps/partners`(파트너 포털)와 `apps/open-api-test-server`에는 아직 규약 문서가 없습니다. 이 두 앱을 작업하게 되면 스킬 없이 진행하되, 참조할 규약이 없다는 사실을 먼저 밝힙니다.

## 3. 응답 언어

응답은 한국어로 합니다. 코드 식별자, 경로, 명령어, 에러 메시지는 원문을 유지합니다.
