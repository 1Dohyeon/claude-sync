# 웹 마이그레이션 계획: `.app/web` → `apps/web`

## Context

`cliper` 모노레포에서 백엔드(`.app/api` → `apps/api`)는 사실상 마이그레이션이 끝났고, 프론트(`.app/web`)는 아직 손대지 않았다 — `apps/web`은 Nx가 만든 빈 스캐폴드(`layout.tsx`/`page.tsx`뿐)만 있다. 이번 계획은 `.app/web`(release/v0.1.0, 진실의 원천)의 실제 제품 화면 전체를 `apps/web`으로 옮기는 순서와 방법을 정한다.

사용자 확인 사항:
- 백엔드 response DTO 연결 작업(현재 uncommitted)은 커밋을 기다리지 않고 **병행** 진행한다.
- `next.config`의 `typescript.ignoreBuildErrors: true`는 **가져오지 않는다**(제거, 엄격하게 감).
- **delivery 모듈이 방금 백엔드에 추가됐다** (`apps/api/src/modules/delivery`, `delivery-category` — uncommitted지만 `app.module.ts`에 등록 완료, 라우트 `stores/:storeId/deliveries`·`stores/:storeId/delivery-categories`, `libs/shared-types`에 대응 DTO 존재 확인) → **delivery도 이번 마이그레이션 범위에 포함**한다. 더 이상 블로킹 아님.
- API base URL 환경변수는 `NEXT_PUBLIC_API_URL`로 통일(현재 `apps/web/.env` 이름 유지).

## 사전 확인된 사실 (재조사 불필요)

- `apps/api/src/modules/`: `delivery, delivery-category, employee, ingredient, payment, profile, recipe, recipe-ingredient, schedule, store, store-management, user` — 전 모듈 존재. `user`는 dto만(로직은 `apps/api/src/auth`).
- `store-management` 컨트롤러가 `income-records`/`outcome-records` 서브라우트 둘 다 서빙 → 프론트 `income/`, `manage/`(outcome) 모두 이 모듈에 매핑.
- `ingredient-category` request DTO 갭도 이미 닫힘 (`CreateIngredientCategoryDto implements CreateIngredientCategoryRequestDto` 신규 추가).
- `libs/shared-types/src/index.ts` 배럴은 `types/*.dto.ts` 20개 파일 전부 export — 최신 상태.
- `apps/api`는 전역 prefix `api` + `ResponseInterceptor`로 `{success, data, message, timestamp, path}` 봉투를 씌움. `.app/web` axios 클라이언트의 `response.data.data` unwrap 관례가 그대로 맞음.
- `nx.json`은 `@nx/next/plugin`을 등록해 `next.config.js` 존재만으로 `dev`/`build` 타깃을 자동 추론함 → `apps/web/project.json`은 빈 `{}` 그대로 두면 됨(수동 타깃 추가 불필요).
- `tsconfig.base.json`의 `paths`는 `extends`로 병합되지 않고 override됨 → `apps/web/tsconfig.json`에 `@/*` alias를 추가할 때 `@cliper/shared-types` path도 반드시 같이 재선언해야 함.
- 루트 `package.json`(pnpm workspace, 단일 root)에 `.app/web`이 쓰는 런타임 의존성(`@tanstack/react-query`, `axios`, `zustand`, `@react-google-maps/api`, `recharts`, `tailwindcss` 등) 전부 이미 있음 — 추가 설치 불필요. `next-intl`은 없고, 실제 i18n은 홈그로운 `useTranslations`(fetch json) 방식 — `.app/web/CLAUDE.md`가 next-intl이라 적어놓은 건 실제와 다름, 있는 그대로(홈그로운) 포팅.
- `.app/web/lib/api/client.ts` 기본 baseURL 리터럴(`.../api/web`)은 레거시에서도 실제로 안 맞는 값이었음(레거시조차 env override에 의존) — 그대로 베끼지 말고 `${NEXT_PUBLIC_API_URL}/api`로 계산해서 씀.
- `store-profile.ts`(api lib)는 `store-profiles/*` 라우트를 호출하는데 백엔드는 이미 `stores`로 리네임됨 → `store.ts`로 이름 변경 + 라우트/타입 전면 수정 필요 (`StoreProfile`→`Store`, `getStoreProfileById`→`getStoreById`).
- 인증은 전부 클라이언트 사이드(axios 쿠키 + `useAuthRedirect`), `middleware.ts` 없음. **이번 마이그레이션도 이 패턴 그대로 유지** — 서버 컴포넌트에서 인증된 fetch를 하는 곳이 없어 미들웨어 도입 필요성 없음. 새 아키텍처 도입 아님, 포팅만.

## Phase 0 — 준비
- 환경변수: `apps/web/.env`의 `NEXT_PUBLIC_API_URL` 유지, `NEXT_PUBLIC_API_GOOGLE_MAP_API` 추가.
- 백엔드 uncommitted 변경(response DTO 연결 + delivery 모듈 + ingredient-category DTO)은 그대로 둔 채 병행 — 계약이 바뀌면 그때그때 프론트도 맞춘다.
- 검증: 없음(결정 단계).

## Phase 1 — 파운데이션 (모든 라우트의 선행조건)
목표: 빈 스캐폴드 → 실제 화면 없이 chrome/providers/인증/알축/i18n까지 붙은 빌드 가능한 껍데기.

- `apps/web/tsconfig.json`: `compilerOptions.paths`에 `"@/*": ["./src/*"]` + `"@cliper/shared-types": ["../../libs/shared-types/src/index.ts"]` 재선언 추가.
- `apps/web/next.config.js` ← `.app/web/next.config.ts` 이식 (`output: "standalone"`, `images.remotePatterns` 6개 호스트), **`typescript.ignoreBuildErrors`는 제외**.
- `apps/web/src/app/layout.tsx`(교체) + `apps/web/src/app/Providers.tsx`(신규, `QueryClientProvider` + `useState(() => new QueryClient(...))`) + `apps/web/src/app/[lang]/layout.tsx`(`generateStaticParams` ko/en).
- `apps/web/src/lib/api/client.ts` — axios 클라이언트(퍼블릭/프라이빗 분리, 401→refresh 인터셉터+큐잉) 그대로 이식, baseURL만 `${NEXT_PUBLIC_API_URL}/api`로 계산.
- `apps/web/src/store/authStore.ts` — 그대로 이식, `MyInfo`(local) → `MyInfoResponseDto`(`@cliper/shared-types`)로 교체.
- `apps/web/src/hooks/{useAuth,useAuthRedirect,useLang,useLanguageRedirect,useTranslations}.ts` — 그대로 이식.
- `apps/web/src/lib/api/auth.ts` — 이식 후 `apps/api/src/auth/auth.controller.ts` 라우트명과 대조 확인(마이그레이션 문서상 ✅지만 실물 대조 필요).
- `apps/web/public/locales/{en,ko}.json` — 그대로 복사.
- `apps/web/src/layout/*`(Header, SmartHeader, Footer, SimpleFooter, StoreHeader + css module) — 그대로 이식(순수 프레젠테이션).
- `apps/web/src/app/[lang]/page.tsx`(랜딩) — 이식, 파운데이션 전체의 스모크 테스트 역할.

검증: `nx build web` 통과, `nx dev web`으로 `/en`·`/ko` 랜딩이 헤더/푸터와 함께 렌더링, `@/*`·`@cliper/shared-types` 해석 에러 없음, `/locales/{lang}.json` 404 없음.

## Phase 2 — 단순 스텁 라우트
`information/`, `privacy/`, `terms/` — 백엔드/인증 의존 없는 정적 페이지. CSS module·`_components` 이식 메커니즘을 저위험으로 먼저 검증.

검증: 두 로케일 모두 정상 렌더.

## Phase 3 — 인증/프로필 셸 (`my/_components`, `my` 루트)
`MySidebar`, `ProfileHome`, `CafeProfileHome`, `StoreSidebar`, `AddStoreModal`. Phase 1의 `useAuth`/`authStore`/`useAuthRedirect`와 `lib/api/profile.ts` + `lib/api/store.ts`(이번에 `store-profile.ts`에서 리네임)에 의존. 이후 모든 `stores/[id]/*` 서브라우트의 게이트.

이 단계에서 `store-profile.ts` → `store.ts` 리네임/재작성 수행: 라우트 `store-profiles/*`→`stores/*`, 타입 `StoreProfile`/`CreateStoreProfileDto`→`StoreResponseDto`/`CreateStoreRequestDto`, 메서드명 `getStoreProfileById`→`getStoreById`.

검증: 로그인 → `/[lang]/my` 진입, 스토어 목록/스위처 렌더, `AddStoreModal`로 실제 `apps/api` 대상 스토어 생성 end-to-end 확인. 이후 `grep`으로 `store-profiles`/`StoreProfile` 잔존 참조 0건 확인.

## Phase 4 — `my/stores/[id]/*` 라우트별 이식 (난이도/의존도 순)
각 라우트는 Phase 3만 끝나면 독립적으로 진행 가능. 반복 패턴: `page.tsx`+`_components/*`+`*.module.css` 그대로 복사 → `lib/types/X.interface` import를 `@cliper/shared-types` 대응 타입으로 교체 → `lib/api/X.ts` 호출을 실제 `apps/api` 라우트/응답 봉투에 맞게 수정 → 타입 리네임으로 생기는 prop 드리프트(필드명, null/undefined 등) 수정 → 로컬 `apps/api` 기동한 상태로 브라우저에서 CRUD 스모크 테스트.

순서:
1. **`settings/`** — `store.ts` 대상 가장 단순한 CRUD, 두 번째 스모크 테스트.
2. **`ingredients/`** — CRUD+카테고리. 백엔드 완전 준비됨(`ingredient` 모듈, `CreateIngredientCategoryRequestDto`도 이제 연결됨).
3. **`recipes/`**(+`new/`, `[recipeId]/`, `[recipeId]/edit/`) — 가장 큰 서브트리(스텝, 이미지). 앞 두 개로 관례를 다진 뒤 진행.
4. **`employees/`**(+`schedule/`) — `employee`/`schedule` 모듈. 기간(rrule 전개) 조회는 신규 `ScheduleOccurrenceResponseDto` 콤보 타입 사용.
5. **`income/`** — `store-management`의 `income-records` 서브라우트.
6. **`manage/`**(outcome) — `store-management`의 `outcome-records` 서브라우트. `income/`과 api-lib 파일을 공유하므로 바로 다음에.
7. **`delivery/`** — `delivery`/`delivery-category` 모듈 대상. `lib/api/delivery.ts`를 `stores/:storeId/deliveries`·`stores/:storeId/delivery-categories`에 맞게 이식, 타입은 `DeliveryOrderResponseDto`/`DeliveryPlatformCategoryResponseDto`/`DeliveryRecipeResponseDto`(`@cliper/shared-types`) 사용.

검증(라우트별): `nx build web` 그린 유지, 로컬 `apps/api` 대상으로 최소 1개 엔티티 CRUD 브라우저 수동 확인, 해당 라우트 파일에서 `lib/types` import 잔존 없음(grep).

## Phase 5 — `lib/api` 전체 이식 체크
Phase 3~4에서 대부분 진행되지만, 명시적 체크리스트로 추적: `.app/web/lib/api/*.ts` 12개 전부 이식 완료(`admin.ts`, `auth.ts`, `delivery.ts`, `employee.ts`, `file.ts`, `ingredient.ts`, `profile.ts`, `recipe.ts`, `schedule.ts`, `store-management.ts`, `store.ts`(구 store-profile.ts), `user.ts`).

검증: `apps/web/src` 전체에서 `store-profiles`/`StoreProfile` 문자열/타입 참조 0건(grep).

## Phase 6 — `lib/types` 정리
Phase 4에서 각 라우트가 이미 자기 파일의 import를 교체했으므로, 이제 `.app/web`에서 가져온 미사용 interface 파일 삭제. `i18n.interface.ts`(프론트 전용)만 `apps/web/src/lib/types/i18n.interface.ts`로 남김. `lib/utils/{locationResolver,locationUtils}.ts`는 그대로 이식(Google Maps 스토어-위치 UI에 필요, 순수 geo 헬퍼).

검증: `apps/web/src/lib/types/`에 `i18n.interface.ts`만 존재, `nx build web` 여전히 그린(삭제된 interface를 참조하는 곳이 없었다는 증거).

## Phase 7 — 최종 통합 점검
`.app/web/app` 라우트 트리와 전체 diff해서 누락 확인. `nx build web` + 두 로케일 전체 라우트 클릭스루. `nx build api`가 영향받지 않았는지 확인(실수로 API 쪽 건드리지 않았는지 sanity check).

## 범위 밖 (이번 계획에 포함하지 않음)
- CI/배포 파이프라인 (`.app/web/.github/workflows/deploy.yml`을 모노레포용으로 재구성하는 작업) — 별도 작업으로 분리.
- `payment` 체크아웃 계약 불일치(기존에 알려진 이슈) — 백엔드 쪽 정리 대상, 프론트는 있는 그대로 이식 후 필요시 로컬 타입으로 임시 대응.
- `middleware.ts` 도입(서버사이드 인증 가드) — 현재 아키텍처에 필요 없음, 새로 도입하지 않음.

## 검증 방법 요약
- 각 Phase 종료 시 `nx build web` 통과 필수.
- Phase 1부터는 `nx dev web`으로 로컬 `apps/api`(별도 기동) 대상 브라우저 수동 클릭스루.
- 타입 치환이 끝난 라우트마다 `lib/types` 잔존 import grep.
- Phase 3, 5 종료 시 `store-profiles`/`StoreProfile` 잔존 참조 grep.
