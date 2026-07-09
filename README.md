# claude-setting

Claude Code를 어떻게 세팅하고 사용하는지 정리해둔 저장소입니다.

## 구조

```
claude-setting/
├── .claude/               # ~/.claude 예시 (글로벌 설정)
│   ├── CLAUDE.md          # GLOBAL CLAUDE MD
│   ├── chores.template.md
│   ├── progress.template.md
│   ├── progress.granularity.md
│   └── settings.local.json
└── work_space/            # 실제 작업 폴더(work_space) 예시
    ├── CLAUDE.md          # WORK CLAUDE MD
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

- `.claude/` ↔ `~/.claude` (사용자 홈의 글로벌 Claude 설정)
- `work_space/` ↔ 실제로 작업할 때 쓰는 루트 폴더

## 문서 역할

| 문서 | 위치 | 역할 |
| --- | --- | --- |
| GLOBAL CLAUDE MD | `.claude/CLAUDE.md` | 모든 프로젝트에 적용되는 규칙 (응답 언어, 브랜치·커밋 정책, 비밀정보 취급 등) |
| WORK CLAUDE MD | `work_space/CLAUDE.md` | 이 작업 공간에서만 적용되는 라우팅·규칙 (REPO CLAUDE MD 목록, 이슈 자산화 규칙 등) |
| REPO CLAUDE MD | `work_space/<repo>/CLAUDE.md` | 레포(또는 모노레포 app)별 팀 공용 규칙. git에 커밋됨 |
| `.claude-docs/` | `work_space/.claude-docs/` | AI가 남기는 작업 기록 — 진행 상황, 완료된 목표 스냅샷, 잡일 목록 |

`work_space/`는 멀티레포 예시(`repo_a`, `repo_b`)로 구성했습니다. 모노레포라면 `<repo>/apps/<app>` 형태로 대체됩니다. 자세한 규칙은 [.claude/CLAUDE.md](.claude/CLAUDE.md)와 [work_space/CLAUDE.md](work_space/CLAUDE.md)를 참고하세요.
