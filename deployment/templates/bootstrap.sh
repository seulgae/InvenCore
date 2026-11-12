#!/usr/bin/env bash
# ONE-TIME reference setup for a NEW, DEDICATED Amazon Linux 2023 EC2 instance.
# Do not run blindly on the existing server. See docs/AWS_CICD.md.
set -Eeuo pipefail
[[ $EUID -eq 0 ]] || {
  echo 'Run through sudo on the target EC2 instance' >&2
  exit 1
}
bucket=${1:?Usage: bootstrap.sh ARTIFACT_BUCKET AWS_REGION DOMAIN}
region=${2:?AWS region required}
domain=${3:?Your HTTPS domain required}
[[ "$bucket" =~ ^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$ && "$region" =~ ^[a-z]{2}-[a-z]+-[0-9]+$ && "$domain" =~ ^[a-z0-9][a-z0-9.-]+[a-z0-9]$ ]] || {
  echo 'Replace and validate the bucket, region and domain' >&2
  exit 1
}
. /etc/os-release
[[ "$ID" == amzn && "$VERSION_ID" == 2023 ]] || {
  echo 'This template is for Amazon Linux 2023 only' >&2
  exit 1
}
templates=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
dnf install -y java-17-amazon-corretto-headless nginx awscli-2 jq python3 tar gzip util-linux policycoreutils-python-utils
id invencore >/dev/null 2>&1 || useradd --system --home-dir /var/lib/invencore --shell /sbin/nologin invencore
install -d -m 755 /srv/invencore/releases /srv/invencore/shared/assets
install -d -m 750 -o invencore -g invencore /var/lib/invencore /var/lib/invencore/uploads
install -d -m 700 /etc/invencore
if [[ ! -f /etc/invencore/application.env ]]; then
  install -m 600 "$templates/application.env.example" /etc/invencore/application.env
  python3 - "$domain" <<'PY'
import pathlib, secrets, sys
path = pathlib.Path('/etc/invencore/application.env')
text = path.read_text().replace('REPLACE_ON_SERVER_WITH_RANDOM_VALUE', secrets.token_urlsafe(48))
path.write_text(text.replace('YOUR_DOMAIN', sys.argv[1]))
PY
fi
printf 'ARTIFACT_BUCKET=%s\nAWS_DEFAULT_REGION=%s\n' "$bucket" "$region" > /etc/invencore/deploy.env
chmod 600 /etc/invencore/deploy.env
install -m 755 "$templates/deploy.sh" /usr/local/sbin/invencore-deploy
install -m 755 "$templates/rollback.sh" /usr/local/sbin/invencore-rollback
install -m 644 "$templates/invencore.service" /etc/systemd/system/invencore.service
# Back up the existing main config instead of discarding it.
if [[ ! -e /etc/nginx/nginx.conf.before-invencore ]]; then
  cp -- /etc/nginx/nginx.conf /etc/nginx/nginx.conf.before-invencore
fi
install -m 644 "$templates/nginx.conf" /etc/nginx/nginx.conf
install -m 644 "$templates/invencore.conf" /etc/nginx/conf.d/invencore.conf
if command -v getenforce >/dev/null && [[ $(getenforce) != Disabled ]]; then
  semanage fcontext -a -t httpd_sys_content_t '/srv/invencore(/.*)?' 2>/dev/null || semanage fcontext -m -t httpd_sys_content_t '/srv/invencore(/.*)?'
  restorecon -R /srv/invencore
  setsebool -P httpd_can_network_connect 1
fi
nginx -t
systemctl daemon-reload
systemctl enable invencore
systemctl enable --now nginx
systemctl reload nginx
echo 'Setup installed. Application starts after the first reviewed release. Configure HTTPS before public use.'
