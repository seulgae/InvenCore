#!/usr/bin/env bash
# Run on Ubuntu: sudo bash deployment/monitoring/install-host-query.sh
set -euo pipefail
if [[ "$EUID" -ne 0 ]]; then
  echo 'Run with sudo.' >&2
  exit 1
fi
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
command -v python3 >/dev/null
test -f "$script_dir/collect-host-capacity.py"
test -f "$script_dir/invencore-host-capacity.service"
python3 -c 'import sys; assert sys.platform.startswith("linux")'
getent passwd invencore-monitor >/dev/null || \
  useradd --system --user-group --home-dir /nonexistent --shell /usr/sbin/nologin invencore-monitor
install -d -m 0755 /usr/local/lib/invencore-monitor
install -m 0644 "$script_dir/collect-host-capacity.py" /usr/local/lib/invencore-monitor/collect-host-capacity.py
install -m 0644 "$script_dir/invencore-host-capacity.service" /etc/systemd/system/invencore-host-capacity.service
# Stop only the obsolete metrics timer; do not touch app or database containers.
if systemctl cat invencore-host-capacity.timer >/dev/null 2>&1; then
  systemctl disable --now invencore-host-capacity.timer
fi
systemctl daemon-reload
systemctl enable invencore-host-capacity.service
systemctl restart invencore-host-capacity.service
for attempt in {1..20}; do
  if [[ -S /run/invencore-host/capacity.sock ]] && \
      python3 "$script_dir/query-host-capacity.py" --quiet 2>/dev/null; then
    echo 'Host query service ready. App containers were not changed.'
    exit 0
  fi
  sleep 0.25
done
echo 'Host query service not ready; check journalctl -u invencore-host-capacity.service.' >&2
exit 1
