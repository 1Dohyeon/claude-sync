# Windows 개발 환경 초기 세팅

새로 초기화한 Windows 기기에서 개발 도구를 D 드라이브에 설치하고, 패키지 캐시가 C 드라이브에 쌓이지 않게 하는 절차다. 개발 도구가 아무것도 설치되지 않았고 D 드라이브는 비어 있다는 전제로 진행한다. 이 내용을 Claude Code에 붙여넣었다면, Claude는 아래 절차를 순서대로 진행한다.

## 목표

- 개발 도구(git, Node.js, uv)는 Scoop으로 `D:\scoop`에 설치한다.
- Python은 uv로 설치하고 관리한다. uv가 쓰는 폴더는 `D:\uv` 아래에 둔다.
- npm, uv 등의 캐시는 사용자 환경 변수로 `D:\cache` 아래에 둔다.
- PATH는 직접 수정하지 않는다. Scoop이 `D:\scoop\shims`를, uv가 `D:\uv\bin`을 명령으로 사용자 PATH에 등록한다.

## 진행 규칙

- 명령은 **관리자 권한이 아닌** PowerShell로 실행한다. Scoop은 관리자 권한 설치를 기본으로 막는다.
- 각 단계를 실행하기 전에 무엇을 할지 보여주고 승인을 받는다.
- 디스크 포맷과 파티션 작업은 Claude가 직접 실행하지 않는다. 설정 화면 경로만 안내하고 사용자가 직접 진행한다.
- 명령이 실패하면 오류 메시지 원문을 그대로 보여주고, 우회하지 않고 멈춘 뒤 묻는다.
- 사용자 환경 변수와 PATH의 변경은 이미 실행 중인 프로세스에 반영되지 않는다. Claude Code가 띄우는 셸도 마찬가지이므로, 설치 이후의 명령은 아래 줄을 앞에 붙여 실행한다.

```powershell
$env:Path = [Environment]::GetEnvironmentVariable('Path','User') + ';' + [Environment]::GetEnvironmentVariable('Path','Machine'); foreach ($k in 'SCOOP','npm_config_cache','UV_CACHE_DIR','UV_PYTHON_INSTALL_DIR','UV_PYTHON_BIN_DIR','UV_TOOL_DIR','UV_TOOL_BIN_DIR') { Set-Item "env:$k" ([Environment]::GetEnvironmentVariable($k,'User')) }
```

## 1. 사전 확인

아래 항목을 확인하고 결과를 표로 보고한다.

```powershell
Get-Volume -DriveLetter C, D | Select-Object DriveLetter, FileSystemLabel, FileSystem, @{n='SizeGB';e={[math]::Round($_.Size/1GB,1)}}, @{n='FreeGB';e={[math]::Round($_.SizeRemaining/1GB,1)}}
```

## 2. (선택) D 드라이브를 Dev Drive로 만들기

- Dev Drive는 ReFS 파일 시스템을 쓰고 Defender 검사를 비동기로 처리한다. 그래서 `npm install`이나 빌드처럼 작은 파일을 많이 다루는 작업이 빨라진다.
- 포맷은 되돌릴 수 없으므로 반드시 사용자의 명시적인 승인을 받는다.
- 클라우드 동기화 프로그램을 D 드라이브에서 쓸 예정이면, 그 프로그램이 ReFS 볼륨을 지원하는지 먼저 확인하도록 알린다. 확신이 없으면 D 드라이브 일부(예: 200~300GB)만 Dev Drive로 나누고 나머지는 NTFS로 두는 구성을 권한다.
- 경로: 설정 > 시스템 > 저장소 > 고급 저장소 설정 > 디스크 및 볼륨. 사용자가 직접 진행하고, 끝나면 1단계의 `Get-Volume`으로 결과를 다시 확인한다.

## 3. 환경 변수 등록

Scoop과 각 도구를 설치하기 **전에** 등록해야 처음부터 캐시가 C 드라이브에 생기지 않는다.

```powershell
$vars = [ordered]@{
  'SCOOP'                    = 'D:\scoop'
  'npm_config_cache'         = 'D:\cache\npm'
  'UV_CACHE_DIR'             = 'D:\cache\uv'
  'UV_PYTHON_INSTALL_DIR'    = 'D:\uv\python'
  'UV_PYTHON_BIN_DIR'        = 'D:\uv\bin'
  'UV_TOOL_DIR'              = 'D:\uv\tools'
  'UV_TOOL_BIN_DIR'          = 'D:\uv\bin'
  'YARN_CACHE_FOLDER'        = 'D:\cache\yarn'
  'PLAYWRIGHT_BROWSERS_PATH' = 'D:\cache\ms-playwright'
  'HF_HOME'                  = 'D:\cache\huggingface'
}
foreach ($k in $vars.Keys) { [Environment]::SetEnvironmentVariable($k, $vars[$k], 'User') }
```

나중에 다른 언어를 쓰게 되면 같은 방식으로 추가한다.

| 도구   | 환경 변수                   | 예시 값                             |
| ------ | --------------------------- | ----------------------------------- |
| Gradle | `GRADLE_USER_HOME`          | `D:\cache\gradle`                   |
| NuGet  | `NUGET_PACKAGES`            | `D:\cache\nuget`                    |
| Rust   | `CARGO_HOME`, `RUSTUP_HOME` | `D:\scoop\cargo`, `D:\scoop\rustup` |
| Go     | `GOPATH`, `GOMODCACHE`      | `D:\scoop\go`, `D:\cache\go-mod`    |

## 4. Scoop 설치

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
$env:SCOOP = 'D:\scoop'; irm get.scoop.sh | iex
```

설치가 끝나면 `D:\scoop\shims`가 사용자 PATH에 등록되었는지 확인한다.

```powershell
[Environment]::GetEnvironmentVariable('Path','User') -split ';' | Select-String scoop
```

## 5. 개발 도구 설치

git을 먼저 설치한다. Scoop은 bucket을 다룰 때 git을 쓴다.

```powershell
scoop install git
scoop install nodejs-lts uv
```

이어서 uv로 Python을 설치하고, `D:\uv\bin`을 사용자 PATH에 등록한다. `--default`를 붙이면 `python.exe`, `python3.exe`도 `D:\uv\bin`에 만들어져 터미널에서 `python`을 바로 쓸 수 있다.

```powershell
uv python install --default
uv tool update-shell
```

- 위 명령에는 "진행 규칙"의 PATH 갱신 줄을 앞에 붙인다.
- 전역 `pip`은 설치하지 않는다. 패키지는 프로젝트마다 `uv add`(또는 가상 환경 안에서 `uv pip install`)로 설치하고, `ruff` 같은 CLI 도구는 `uv tool install`로 설치한다.
- 그 밖에 필요한 도구가 있는지 사용자에게 묻는다. 검색은 `scoop search <이름>`으로 한다.
- pnpm을 쓴다면 별도 설정은 필요하지 않다. pnpm은 프로젝트가 있는 드라이브의 루트(`D:\.pnpm-store`)에 저장소를 자동으로 만든다.
- 일반 GUI 프로그램(브라우저, 메신저 등)은 이 절차의 범위가 아니다.

## 6. 저장소 센스 설정

`AppData\Local\Temp`는 C 드라이브에 그대로 두고, Windows의 저장소 센스가 매주 임시 파일, 휴지통, 다운로드 폴더를 비우게 한다. 설정 화면(설정 > 시스템 > 저장소 > 저장소 센스)의 값은 아래 레지스트리 값과 같다.

```powershell
$p = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\StorageSense\Parameters\StoragePolicy'
New-Item -Path $p -Force | Out-Null
$v = [ordered]@{
  '01'   = 1   # 저장소 센스 켜기
  '2048' = 7   # 실행 주기(일): 1, 7, 30
  '04'   = 1   # 앱이 쓰지 않는 임시 파일 삭제
  '08'   = 1   # 휴지통 비우기
  '256'  = 30  # 휴지통에 들어간 지 N일 지난 파일: 1, 14, 30, 60
  '32'   = 1   # 다운로드 폴더 비우기
  '512'  = 30  # 다운로드 폴더에서 N일 동안 열지 않은 파일: 1, 14, 30, 60
}
foreach ($k in $v.Keys) { Set-ItemProperty -Path $p -Name $k -Value $v[$k] -Type DWord }
```

- 다운로드 폴더의 파일은 사용자가 지우지 않아도 자동으로 사라지므로, 실행 전에 일수(`512`)를 사용자에게 확인받는다.
- 실행 후 `Get-ItemProperty -Path $p`로 값을 확인하고, 사용자에게 설정 화면에서 같은 값으로 보이는지 확인해 달라고 요청한다.

## 7. 검증

"진행 규칙"의 PATH 갱신 줄을 앞에 붙여 아래 명령을 실행하고, 결과를 표로 보고한다. 모든 경로가 D 드라이브여야 통과다.

```powershell
where.exe git node npm python uv
npm config get cache
npm config get prefix
uv cache dir
uv python dir
uv tool dir --bin
```

- C 드라이브 경로가 나온 항목은 통과로 보고하지 않는다. 그 항목과 원인 추정을 따로 적는다.
- 마지막으로 사용자에게 Claude Code와 터미널을 모두 새로 연 뒤 `node -v`, `python --version`이 동작하는지 직접 확인해 달라고 요청한다.
- 완료는 Claude가 선언하지 않는다. 통과한 항목과 남은 항목을 갈라서 보고하고, 사용자의 확인을 받는다.

## 나중에 설치할 때 참고

- **Docker Desktop**: Settings > Resources > Advanced > Disk image location을 D 드라이브로 바꾼다.
- **WSL**: 배포판을 설치한 뒤 `wsl --manage <배포판 이름> --move D:\wsl\<배포판 이름>`으로 옮긴다.
- **VS Code, 브라우저 등 GUI 앱의 캐시**: 대부분 `AppData`에 고정되어 있어서 옮기지 않는다.
