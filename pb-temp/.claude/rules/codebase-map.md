# 코드베이스 지도

이 저장소의 디렉터리 구조와, 그 구조 때문에 반복해서 발생하는 실수를 정리합니다.
파일 위치를 짚기 전에 이 문서로 확인합니다.

> 구조 정보의 SSOT는 이 문서입니다. `README.md`에도 구조 트리가 있으나 실제와 어긋난 항목이 남아 있으므로, 두 문서가 다르면 이 문서를 따릅니다.

## 디렉터리 구조

```
shrimp/                          # Nx 모노레포 루트 (Bun 전용, .env는 루트 단일 파일)
├── apps/                        # 실행 가능한 애플리케이션
│   ├── shrimp/                  # 사용자 프론트엔드 (Next.js App Router)   :3000
│   │   └── src/
│   │       ├── app/             #   페이지·레이아웃·API Route Handler
│   │       ├── actions/         #   Server Actions
│   │       ├── common/          #   화면 단위 공용 컴포넌트 (Header, PlanCards, ...)
│   │       ├── global/          #   전역 apis·styles·types
│   │       ├── hooks/           #   React Query·카카오 로그인 등 커스텀 훅
│   │       └── generated/       #   라우트 타입 생성물 (직접 수정 금지)
│   ├── admin/                   # 어드민 대시보드 (Next.js)                :3100
│   ├── partners/                # 파트너 포털 (Next.js)                    :3200
│   ├── shrimp-server/           # 백엔드 API 서버 (Express, prefix /api/v2) :3500
│   │   └── src/
│   │       ├── main.ts          #   진입점: 미들웨어 체인, 전역 에러 핸들러, scheduleJobs()
│   │       ├── routers/         #   URL 매칭 + 그룹별 인증 (등록 순서가 인증 범위를 결정)
│   │       ├── controllers/     #   실제 백엔드 핸들러 (apis/controllers 와 혼동 금지)
│   │       ├── services/        #   서버 로컬 서비스
│   │       └── modules/         #   scheduler.ts, swagger.js, 보안 모듈(ro-secucert)
│   └── open-api-test-server/    # 외부 제휴 API 테스트 서버 (JS, Knex, 별도 DB)
│
├── apis/                        # 백엔드가 아님. 프론트가 백엔드를 호출하는 HTTP 클라이언트
│   ├── controllers/             #   apps/shrimp-server/src/controllers/ 와 파일명이 겹침
│   └── services/
│
├── libs/
│   ├── services/                # 도메인 비즈니스 로직 39개 모듈 (백엔드 로직의 본진)
│   └── utils/                   # 공용 유틸리티 (@libs/utils)
│
├── packages/                    # 재사용 패키지 (ui, common, react, jotai, next, global, popbill)
├── types/                       # 프론트·백 공유 타입 (*.d.ts, @types)
├── status/                      # 도메인 상태값·비즈니스 상수 매핑 (@status)
├── config/                      # 공통 설정 (config.ts)
├── db/                          # 레거시 DB 커넥션 (db.ts, 신규 사용 금지)
├── tasks/                       # 인프라·배포 작업 기록 문서
├── .rules/                      # 프론트 컨벤션·React 베스트 프랙티스
└── .claude/                     # 에이전트 설정 (rules는 항상 주입, skills는 트리거 주입)
```

## 앱과 포트

| 앱 | nx 프로젝트 이름 | 포트 | 규약 문서 |
|---|---|---|---|
| 사용자 프론트 | `shrimp` | 3000 | `apps/shrimp/CLAUDE.md` |
| 어드민 | `admin` | 3100 | `apps/admin/CLAUDE.md` |
| 파트너 포털 | `partners` | 3200 | 없음 |
| 백엔드 API | `shrimp-server` | 3500 | `apps/shrimp-server/CLAUDE.md` |

## 구조에서 비롯되는 함정

### 1. `apis/`는 백엔드가 아닙니다

Next.js 서버 컴포넌트가 백엔드를 HTTP로 호출하기 위한 클라이언트 계층입니다.
실제 백엔드 핸들러는 `apps/shrimp-server/src/controllers/`에 있습니다.

| 경로 | 정체 |
|---|---|
| `apps/shrimp-server/src/controllers/planController.ts` | Express 라우트 핸들러 (백엔드) |
| `apis/controllers/shrimp/planController.ts` | 프론트에서 백엔드로 보내는 HTTP 클라이언트 |

두 파일의 이름이 같으므로, 파일을 열기 전에 어느 쪽인지 경로로 확인합니다.

### 2. Knex는 `open-api-test-server` 전용입니다

`shrimp-server`와 `libs/services`의 쿼리는 전부 mysql2 Raw SQL과 named placeholder로 작성합니다.
이 두 곳에 Knex 쿼리 빌더 문법을 새로 들이지 않습니다.

```typescript
import { repositoryInstance } from '@services/mysql';
const rows = await repositoryInstance.executeQuery(sql, { userId });
```

다만 `apps/open-api-test-server`는 예외입니다.
이 앱은 `src/modules/knex.js`에서 Knex 인스턴스를 만들고 `src/daos/*.js`가 그 위에 쿼리 빌더를 얹는 구조이며, 접속 대상도 `MYSQL_OPENAPI_DB`로 본 서비스와 다릅니다.
이 앱을 수정할 때는 기존 Knex 패턴을 그대로 따릅니다.

### 3. `db/db.ts`는 레거시입니다

`db/db.ts`의 `handleMySql()`은 남아 있는 구형 커넥션입니다.
신규 코드는 `@services/mysql`의 `repositoryInstance`를 사용합니다.

### 4. 패키지 매니저는 Bun 전용입니다

`bun install`, `bun nx <target> <project>`를 사용합니다.
npm이나 yarn으로 설치하면 `bun.lockb`와 어긋나 빌드가 깨집니다.

### 5. `.env`는 루트 단일 파일입니다

`shrimp`, `admin`, `partners`, `shrimp-server`가 루트의 `.env` 하나를 공유합니다.
앱별 `.env`를 새로 만들지 않습니다.
시크릿 값은 코드, 로그, 응답, 커밋 어디에도 노출하지 않습니다.

### 6. 상태값은 `@status`에서 가져옵니다

도메인 상태값과 비즈니스 상수는 `status/`에 모여 있습니다.
라우터나 서비스에 매직 넘버를 직접 적지 말고, `@status`의 매핑을 사용하거나 거기에 추가합니다.

### 7. `apps/shrimp/src/generated/`는 생성물입니다

`generate-route-types.ts`가 만들어내는 산출물이며, `predev`와 `prebuild` 단계에서 자동으로 다시 만들어집니다.
직접 수정하지 말고 페이지를 추가한 뒤 `bun nx generate:routes shrimp`를 실행합니다.
