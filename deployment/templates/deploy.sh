#!/usr/bin/env bash
# Installed root-owned; invoked only by the reviewed InvenCoreDeploy SSM document.
set -Eeuo pipefail
[[ $EUID -eq 0 ]] || {
  echo 'Run on EC2 through Systems Manager' >&2
  exit 1
}
release_id=${1:?Release ID required}
checksum=${2:?SHA256 required}
[[ "$release_id" =~ ^[a-f0-9]{40}-[0-9]+-[0-9]+$ && "$checksum" =~ ^[a-f0-9]{64}$ ]] || {
  echo 'Invalid release parameters' >&2
  exit 1
}
ROOT=/srv/invencore
. /etc/invencore/deploy.env
: "${ARTIFACT_BUCKET:?}" "${AWS_DEFAULT_REGION:?}"
export AWS_DEFAULT_REGION
exec 9>"$ROOT/deploy.lock"
flock -n 9 || {
  echo 'Another deployment/rollback is running' >&2
  exit 1
}
previous=$(readlink -f "$ROOT/current" || true)
release="$ROOT/releases/$release_id"
[[ ! -e "$release" ]] || {
  echo 'Release ID already exists; use a new workflow attempt' >&2
  exit 1
}
work=$(mktemp -d /tmp/invencore-release.XXXXXX)
switched=false
trap 'rm -rf -- "$work"' EXIT

# current 심볼릭 링크를 임시 링크로 교체해 선택한 릴리스로 전환합니다.
switch_to() {
  local target=$1 link="$ROOT/.current-$$"
  [[ "$target" == "$ROOT/releases/"* && -s "$target/app.jar" && -s "$target/frontend/index.html" ]] || return 1
  ln -s -- "$target" "$link"
  mv -Tf -- "$link" "$ROOT/current"
}
# 앱이 정상 응답할 때까지 제한된 횟수만 확인합니다.
healthy() {
  local body
  for attempt in $(seq 1 30); do
    body=$(curl -fsS --max-time 3 http://127.0.0.1:8080/api/health 2>/dev/null || true)
    if jq -e '.status == "UP"' >/dev/null 2>&1 <<< "$body"; then
      return 0
    fi
    sleep 2
  done
  return 1
}
# 릴리스 전환 후 오류가 나면 이전 코드와 서비스 상태로 복구를 시도합니다.
on_error() {
  local code=$?
  trap - ERR
  set +e
  if "$switched"; then
    if [[ "$previous" == "$ROOT/releases/"* && -s "$previous/app.jar" ]]; then
      echo 'New release failed; restoring the previous release'
      switch_to "$previous" && systemctl restart invencore
      healthy || echo 'Rollback health check also failed; inspect journalctl' >&2
    else
      echo 'First deployment failed; there is no previous release' >&2
      systemctl stop invencore
      [[ -L "$ROOT/current" ]] && unlink "$ROOT/current"
    fi
  fi
  exit "$code"
}
trap on_error ERR
aws s3 cp "s3://$ARTIFACT_BUCKET/releases/$release_id/release.tar.gz" "$work/release.tar.gz" --only-show-errors
printf '%s  %s\n' "$checksum" "$work/release.tar.gz" | sha256sum -c -
# Reject traversal, links and special files before extracting as root.
python3 - "$work/release.tar.gz" <<'PY'
import pathlib, sys, tarfile
with tarfile.open(sys.argv[1], 'r:gz') as archive:
    for member in archive.getmembers():
        path = pathlib.PurePosixPath(member.name)
        if path.is_absolute() or '..' in path.parts or not (member.isfile() or member.isdir()):
            raise SystemExit('Unsafe archive member')
        if path.parts and path.parts[0] not in ('app.jar', 'frontend', 'REVISION'):
            raise SystemExit('Unexpected archive content')
PY
install -d -m 755 "$release"
tar --no-same-owner --no-same-permissions -xzf "$work/release.tar.gz" -C "$release"
[[ -s "$release/app.jar" && -s "$release/frontend/index.html" ]]
grep -Fxq "${release_id%%-*}" "$release/REVISION"
chmod -R a+rX "$release"
# Retain hashed assets referenced by tabs that were open before this release.
if [[ -d "$release/frontend/assets" ]]; then
  cp -a -- "$release/frontend/assets/." "$ROOT/shared/assets/"
  chmod -R a+rX "$ROOT/shared/assets"
fi
if command -v restorecon >/dev/null; then
  restorecon -R "$ROOT"
fi
nginx -t
switch_to "$release"
switched=true
systemctl restart invencore
healthy
# Verify both the API proxy and a React deep link through Nginx.
curl -fsS --max-time 5 http://127.0.0.1/api/health | jq -e '.status == "UP"' >/dev/null
curl -fsS --max-time 5 http://127.0.0.1/inventory/aws-cicd > "$work/index.html"
grep -q 'id="root"' "$work/index.html"
echo "DEPLOYED $release_id"
