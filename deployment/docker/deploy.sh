#!/usr/bin/env bash
set -euo pipefail
APP_DIR="${APP_DIR:-/opt/homeserver/apps/InvenCore}"
exec python3 "$APP_DIR/deployment/docker/deploy.py" --app-dir "$APP_DIR" "$@"
