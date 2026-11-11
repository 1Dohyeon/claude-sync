#!/bin/sh
# rules/environments.md의 경로 값을 읽는 함수다. 훅 스크립트가 . 로 불러 쓴다.

environments_file="$(dirname "$0")/../rules/environments.md"

# $1: 변수 이름, $2: 파일에 값이 없을 때 쓸 경로
environment_path() {
    value=$(sed -n "s/^$1=//p" "$environments_file" 2>/dev/null | head -n 1 | tr -d '\r')
    if [ -z "$value" ]; then
        value=$2
    fi
    case $value in
        "~"*) value="$HOME${value#"~"}" ;;
    esac
    printf '%s\n' "$value"
}
