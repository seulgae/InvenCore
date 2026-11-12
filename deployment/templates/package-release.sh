#!/usr/bin/env bash
# Reference only. Run from the repository root after frontend/backend builds.
set -Eeuo pipefail
: "${GITHUB_SHA:?Set GITHUB_SHA to the full git commit SHA}"
[[ "$GITHUB_SHA" =~ ^[a-f0-9]{40}$ ]] || {
  echo 'Invalid commit SHA' >&2
  exit 1
}
mapfile -t jars < <(find backend/build/libs -maxdepth 1 -type f -name '*.jar' ! -name '*-plain.jar')
[[ ${#jars[@]} -eq 1 && -s frontend/dist/index.html ]] || {
  echo 'Build exactly one bootJar and the frontend first' >&2
  exit 1
}
output_dir=$(realpath -- "${1:-.}")
[[ -d "$output_dir" ]] || {
  echo 'Output directory must already exist' >&2
  exit 1
}
bundle=$(mktemp -d /tmp/invencore-package.XXXXXX)
# 검증한 임시 패키징 디렉터리만 정리하고 빌드 원본은 유지합니다.
cleanup() {
  local target parent
  target=$(realpath -- "$bundle")
  parent=$(realpath -- /tmp)
  # Verify the resolved absolute target before recursively removing only our temporary copy.
  if [[ "$target" == "$parent"/invencore-package.* && $(dirname -- "$target") == "$parent" ]]; then
    rm -rf -- "$target"
  fi
}
trap cleanup EXIT
cp -- "${jars[0]}" "$bundle/app.jar"
cp -R -- frontend/dist "$bundle/frontend"
printf '%s\n' "$GITHUB_SHA" > "$bundle/REVISION"
tar --force-local -C "$bundle" -czf "$output_dir/release.tar.gz" .
(cd "$output_dir" && sha256sum release.tar.gz > release.tar.gz.sha256)
echo 'Created release.tar.gz and release.tar.gz.sha256'
