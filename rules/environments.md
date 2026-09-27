# ENVIRONMENTS

기기와 사용자에 따라 달라지는 값이다. 스킬은 경로를 따로 적지 않고 여기 적힌 값을 쓴다. 값을 바꾸려면 아래 블록의 `=` 뒤를 고친다.

```sh
# 계획 문서의 2순위 위치(plans 폴더 자체)다. 문서는 $PLANS_PATH/{owner}/{repo}/{branch}/ 에 둔다. 기본값은 ~/plans 다.
# 스크립트(hooks/save-docs.sh, skills/planning-dev/hooks/tasksim.py)는 이 파일을 읽지 못해 값을 바꿔도 ~/plans 를 쓴다.
PLANS_PATH=~/plans
```
