---
description: Windows에서 C 드라이브(또는 다른 드라이브·폴더) 용량을 확인하고 정리할 때 사용한다("C 드라이브 용량 줄이고 싶어", "최근에 뭐가 늘었는지 봐줘"). robocopy 목록 모드로 몇십 초 안에 폴더별·파일별 크기를 훑고, 지울 후보를 골라 승인받은 뒤 지운다.
---

# Windows 디스크 용량 확인·정리

[`rules/workflow.md`](../../rules/workflow.md)의 5단계 위에서 진행되는, 디스크 용량 확인·정리 고유의 규칙이다.

## 도구

- Git Bash의 `du`·`find`로 드라이브를 훑지 않는다. 파일마다 POSIX 흉내를 거쳐서 C 드라이브 전체에 수십 분이 걸린다.
- 같은 폴더의 [`scan.ps1`](scan.ps1)을 쓴다. robocopy 목록 모드(`/L`, 아무것도 복사하지 않음)라 C 드라이브 전체도 1분 안에 끝난다.
- Bash에서 부를 때는 `-File`로 넘긴다. `-Command`에 PowerShell 코드를 직접 쓰면 Bash가 `$_`를 자기 변수로 바꿔 구문 오류가 난다.
- `-Root` 경로는 작은따옴표로 감싼다(`-Root 'C:\Program Files (x86)\'`). 큰따옴표 안에서는 끝의 `\"`가 따옴표를 이스케이프해 Bash가 명령을 끝내지 못한다.

```sh
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ~/.claude/skills/windows-disk-scan/scan.ps1 -Days 14
```

| 인자 | 기본값 | 뜻 |
| --- | --- | --- |
| `-Root` | `C:\` | 훑을 드라이브나 폴더 |
| `-Days` | 0(전체) | 최근 N일 안에 바뀐 파일만 |
| `-MinMB` | 0 | 이 크기 이상인 파일만 |
| `-Depth` | 3 | `folders` 모드에서 `-Root` 아래 몇 단계까지 묶어 합산할지 |
| `-Mode` | `folders` | `folders`는 폴더별 합계, `files`는 큰 파일 목록 |
| `-Top` | 30 | 보여줄 줄 수 |

## 순서

1. `df -h /c`로 전체·여유 용량을 먼저 본다.
2. "최근에 늘었다"는 요청이면 `-Days`를 붙여 폴더별로 넓게 합산한다. 아니면 `-Days` 없이 합산한다.
3. 가장 큰 폴더를 `-Root`로 넘겨 한 단계씩 더 들어간다. 필요하면 `-Mode files -MinMB 50`으로 큰 파일을 본다.
4. 지울 후보를 표로 보여준다. 항목마다 크기, 무엇인지, 지워도 되는 이유를 붙인다.
5. 승인받은 것만 지우고, 지운 경로가 사라졌는지와 `df -h /c`의 여유 용량 변화를 보고한다.

## 해석할 때 주의

- `-Days`로 본 합계는 "최근에 바뀐 파일"의 크기다. 업데이트가 옛 버전을 덮어썼다면 실제로 늘어난 양은 이보다 작다고 밝힌다.
- 결과의 시각은 로컬 시각으로 바꿔서 나온다(robocopy 원본은 UTC다).

## 지우지 말 것

- `pagefile.sys`, `swapfile.sys`, `hiberfil.sys` 같은 시스템 파일은 지우지 않는다. 최대 절전 파일은 `powercfg /h off`로 끄는 방법만 안내한다.
- 재부팅 전의 Windows 업데이트 흔적(`$WinREAgent`, `SoftwareDistribution\Download`, `Logs\CBS`, `WinSxS\Temp`)은 업데이트가 마무리 중일 수 있다. 재부팅을 먼저 권하고, 남은 것은 디스크 정리(`cleanmgr`)나 `DISM /Online /Cleanup-Image /StartComponentCleanup`을 안내한다.
- Microsoft Store 앱과 게임 폴더(`XboxGames` 등)는 폴더째 지우지 않는다. 설정 > 앱에서 제거하도록 안내한다.
- 어떤 앱이 따로 들고 있는 번들 버전(예: `AppData\Roaming\Claude\claude-code`)은 그 폴더 안에 버전이 하나뿐이면 지우지 않는다. "옛 버전"으로 보이더라도 그 앱이 쓰는 유일한 사본일 수 있다.
- 임시 폴더의 설치 파일은 해당 설치 프로그램이 돌고 있지 않은지(`Get-Process`) 확인한 뒤에 지운다.

## 지워도 되는 흔한 후보

- `AppData\Local\Temp` 아래 설치가 끝난 임시 폴더
- `AppData\Roaming\Code\CachedExtensionVSIXs`(VS Code 확장 원본)
- 같은 폴더에 새 버전이 함께 있는 앱의 옛 버전(예: `~\.local\share\claude\versions`)
- 이미 설치가 끝난 설치 파일(`*Setup*.exe`, 업데이터가 받은 `installer.exe`)
- 개발 캐시(`pnpm store prune`, `npm cache clean --force`, `pip cache purge`)
