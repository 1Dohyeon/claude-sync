# claude-sync

Claude Code 글로벌 설정입니다. 저장소는 각 컴퓨터에 `clone`으로 받아두고, 실제 사용할 `~/.claude/`는 이 저장소의 **루트**를 가리키도록 심링크합니다.

> 저장소 주소: [1Dohyeon/.claude-sync](https://github.com/1Dohyeon/.claude-sync)

## 연결 방법

1. **Node.js 설치 확인** — `hooks/`의 훅 스크립트가 모두 `.js`로 작성되어 있고 `node`로 실행되므로, 연결할 기기에 Node.js가 먼저 설치되어 있어야 합니다.
2. **clone 후 심링크 연결** — 절차는 [meta/setup.md](meta/setup.md) 참고.

## 구조

> 클로드 작업에 직/간접적 영향 있는 파일 및 폴더만 표기

```
claude-setting/             # ~/.claude로 심링크되는 저장소 루트
├── docs/                   # claude가 작업할 때, 읽고 쓰는 문서 저장 (git)
├── hooks/                  # 훅 스크립트 (git)
├── CLAUDE.md               # Claude 응답·행동 규칙 (git)
├── settings.json           # Claude Code 앱 설정 — 테마·업데이트 채널 등 (git)
├── CLAUDE.local.md         # 응답·행동 규칙의 기기별 오버라이드/추가 (gitignore)
└── settings.local.json     # 앱 설정의 기기별 오버라이드 — 권한 허용 목록 등 (gitignore)
```

## 매핑

- 저장소 루트 ↔ `~/.claude` (각 기기에 clone한 저장소의 루트를 심링크로 연결)

## 주의

- `hooks/`에 둔 훅 스크립트는 `settings.json`에서 `node`로 연결해야 합니다.
- Windows와 macOS를 같이 쓰는 경우, 훅은 `sh`보다 `js`로 통일하는 편이 안전합니다.

## 문서 역할

| 문서             | 위치        | 역할                                                                               |
| ---------------- | ----------- | ---------------------------------------------------------------------------------- |
| GLOBAL CLAUDE MD | `CLAUDE.md` | 모든 프로젝트에 적용되는 절대 규칙 (응답 언어, 브랜치·커밋 정책, 비밀정보 취급 등) |
