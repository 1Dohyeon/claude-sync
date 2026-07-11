# claude-setting

Claude Code 글로벌 설정 모음입니다. 저장소는 각 컴퓨터에 `clone`으로 받아두고, 실제 사용할 `~/.claude/`는 이 저장소의 **루트 디렉터리**를 가리키도록 심링크합니다.

저장소 주소: [1Dohyeon/claude-setting](https://github.com/1Dohyeon/claude-setting)

## 연결 방법

1. 저장소를 원하는 위치에 clone합니다.
2. 기존 `~/.claude/`가 있으면 백업하거나 이름을 바꿉니다.
3. `~/.claude/`를 clone한 저장소의 **루트 디렉터리**로 심링크합니다.

즉, `clone`은 저장소를 로컬에 가져오는 작업이고, `심링크`는 Claude Code가 실제로 읽는 `~/.claude/`를 그 저장소의 루트에 연결하는 작업입니다.

### Windows PowerShell

```powershell
Rename-Item $env:USERPROFILE\.claude .claude.backup
New-Item -ItemType SymbolicLink -Path $env:USERPROFILE\.claude -Target C:\path\to\claude-setting
```

### macOS / Linux

```bash
mv ~/.claude ~/.claude.backup
ln -s /path/to/claude-setting ~/.claude
```

## 구조

```
claude-setting/
├── .claude/               # ~/.claude로 동기화되는 글로벌 설정 묶음
│   ├── CLAUDE.md               # GLOBAL CLAUDE MD (절대 규칙 + 모드 라우터)
│   ├── CLAUDE.local.coding.md  # SESSION MD 마스터 — coding 모드
│   ├── CLAUDE.local.docs.md    # SESSION MD 마스터 — docs 모드
│   ├── chores.template.md
│   ├── progress.template.md
│   ├── progress.granularity.md
│   └── settings.local.json
└── work_space/            # 실제 작업 폴더(work_space) 예시
    ├── CLAUDE.md          # WORK CLAUDE MD
    ├── CLAUDE.local.md    # SESSION MD (모드 마스터의 사본, setup 시 생성)
    ├── .claude-docs/      # AI 작업 기록
    │   ├── overview.md
    │   ├── progress.md
    │   ├── chores.md
    │   ├── progresses/    # 완료된 progress 스냅샷
    │   │   ├── repo_a/
    │   │   ├── repo_b/
    │   │   └── _shared/
    │   └── rules/
    │       ├── progress.template.md
    │       ├── progress.granularity.md
    │       └── issues.template.md
    ├── repo_a/             # 실제 프로젝트 레포 예시 (멀티레포)
    └── repo_b/
```

## 매핑

- 저장소 루트 ↔ `~/.claude` (각 기기에 clone한 저장소의 루트를 심링크로 연결)
- `work_space/` ↔ 실제로 작업할 때 쓰는 루트 폴더

## 주의

- `hooks/`에 둔 훅 스크립트는 `settings.json`에서 `node`로 연결해야 합니다.
- Windows와 macOS를 같이 쓰는 경우, 훅은 `sh`보다 `js`로 통일하는 편이 안전합니다.

## 문서 역할

| 문서 | 위치 | 역할 |
| --- | --- | --- |
| GLOBAL CLAUDE MD | `.claude/CLAUDE.md` | 모든 프로젝트에 적용되는 규칙 (응답 언어, 브랜치·커밋 정책, 비밀정보 취급 등) + 모드 라우팅 |
| SESSION MD 마스터 | `.claude/CLAUDE.local.<mode>.md` | 모드별(`coding`·`docs` 등) 작업 규칙 원본. setup 때 SESSION MD로 복사됨 |
| SESSION MD | `work_space/CLAUDE.local.md` | 현재 세션의 작업 모드 규칙 (모드 마스터의 사본). 세션 1개 = 모드 1개, walk-up 자동 로드 |
| WORK CLAUDE MD | `work_space/CLAUDE.md` | 이 작업 공간에서만 적용되는 라우팅·규칙 (REPO CLAUDE MD 목록, 이슈 자산화 규칙 등) |
| REPO CLAUDE MD | `work_space/<repo>/CLAUDE.md` | 레포(또는 모노레포 app)별 팀 공용 규칙. git에 커밋됨 |
| `.claude-docs/` | `work_space/.claude-docs/` | AI가 남기는 작업 기록 — 진행 상황, 완료된 목표 스냅샷, 잡일 목록 |

`work_space/`는 멀티레포 예시(`repo_a`, `repo_b`)로 구성했습니다. 모노레포라면 `<repo>/apps/<app>` 형태로 대체됩니다. 자세한 규칙은 [.claude/CLAUDE.md](.claude/CLAUDE.md)와 [work_space/CLAUDE.md](work_space/CLAUDE.md)를 참고하세요.
