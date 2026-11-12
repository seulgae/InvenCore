#!/usr/bin/env bash
# Manual operation on EC2: sudo invencore-rollback PREVIOUS_RELEASE_ID
set -Eeuo pipefail
[[ $EUID -eq 0 ]] || {
  echo 'Run on EC2 through sudo' >&2
  exit 1
}
release_id=${1:?Choose a known previous release ID}
[[ "$release_id" =~ ^[a-f0-9]{40}-[0-9]+-[0-9]+$ ]] || exit 1
ROOT=/srv/invencore
target="$ROOT/releases/$release_id"
[[ -s "$target/app.jar" && -s "$target/frontend/index.html" ]] || {
  echo 'Complete release not found' >&2
  exit 1
}
exec 9>"$ROOT/deploy.lock"
flock -n 9 || {
  echo 'Another deployment/rollback is running' >&2
  exit 1
}
previous=$(readlink -f "$ROOT/current" || true)
# current 심볼릭 링크를 임시 링크로 교체해 선택한 릴리스로 전환합니다.
switch_to() {
  local link="$ROOT/.rollback-$$"
  ln -s -- "$1" "$link"
  mv -Tf -- "$link" "$ROOT/current"
}
# 앱이 정상 응답할 때까지 제한된 횟수만 확인합니다.
healthy() {
  for attempt in $(seq 1 30); do
    if curl -fsS --max-time 3 http://127.0.0.1:8080/api/health | jq -e '.status == "UP"' >/dev/null; then
      return 0
    fi
    sleep 2
  done
  return 1
}
switch_to "$target"
if systemctl restart invencore && healthy; then
  echo "ROLLED_BACK $release_id"
else
  echo 'Rollback target failed; attempting to restore the original pointer' >&2
  if [[ "$previous" == "$ROOT/releases/"* && -s "$previous/app.jar" ]]; then
    switch_to "$previous"
    systemctl restart invencore
    healthy || true
  fi
  exit 1
fi
