# 현재 서버용 deploy.sh

PostgreSQL + Kafka/Redis + 호스트 직접 조회 구성용입니다. 기존 `.env.docker`와 DB/볼륨을 유지하고, **CI 성공 전체 40자리 SHA를 인자로 받아** 환경 파일의 예전 태그보다 우선 적용합니다. latest·짧은 SHA·현재 Git HEAD를 자동 선택하지 않습니다.

## 설치

코드가 main에 반영된 뒤 Ubuntu에서 실행합니다. 서버의 기존 스크립트는 백업하고 프로젝트의 진입점으로 교체합니다. Python 로직은 프로젝트의 `deployment/docker/deploy.py`를 사용하므로 이후 소스 pull로 갱신됩니다.

```bash
(
  set -e
  cd /opt/homeserver/apps/InvenCore
  git pull --ff-only
  sudo bash deployment/monitoring/install-host-query.sh
  sudo cp -p /opt/homeserver/scripts/deploy.sh \
    "/opt/homeserver/scripts/deploy.sh.backup-$(date +%Y%m%d-%H%M%S)"
  sudo install -m 0755 deployment/docker/deploy.sh /opt/homeserver/scripts/deploy.sh
)
```

pull 충돌은 서버 파일을 백업·비교해 해결하고 진행합니다. 기존 환경 파일을 예제로 덮어쓰지 않습니다. 호스트 서비스 설치는 앱·DB 컨테이너를 교체하지 않습니다.

## 실행

```bash
release=REPLACE_WITH_SUCCESSFUL_40_CHARACTER_SHA

# 사전 점검만: 이미지 다운로드·연결 확인, 앱 교체 없음
sudo /opt/homeserver/scripts/deploy.sh "$release" --check

# 동일 점검 후 yes를 입력했을 때만 앱 교체
sudo /opt/homeserver/scripts/deploy.sh "$release"
```

1. SHA·필수 파일·Docker 권한·Compose 설정 검사. 비밀값은 출력하지 않습니다.
2. 두 GHCR 이미지를 지정 SHA로 pull. 없는 태그나 인증 실패 시 기존 앱을 유지합니다.
3. 외부 인프라 네트워크·PostgreSQL TCP 확인. external GW가 켜져 있으면 Kafka·Redis TCP도 확인합니다. 계정 인증은 앱 시작 시 확인됩니다.
4. 호스트 조회 소켓에 실제 질의. 실행 중인 backend의 PostgreSQL 설정 확인. 현재 상태·SHA·실제 프론트 포트·GW 모드 표시.
5. yes 확인 후 backend/frontend만 교체하고 healthy를 기다립니다. health·방명록 조회·external 모드 상태를 읽기 전용으로 검증합니다.

DB·Kafka·Redis 스택이나 볼륨을 삭제하지 않습니다. 사용자 계정·공개 테스트 글도 생성하지 않습니다. 환경 파일의 SHA·비밀번호·JWT 키를 변경하지 않으므로 다음 실행에도 SHA 인자를 지정합니다.

## 기존 DB 확인이 되지 않을 때

이전 실행 컨테이너에서 PostgreSQL 설정을 찾지 못하면 자동 교체를 막습니다. 새 환경 파일을 PostgreSQL로 바꿨다고 이전 컨테이너까지 전환된 것은 아닙니다.

기존 메모리 DB 등의 데이터 보존·이관을 검토한 경우에만 `--allow-db-transition`을 추가합니다. 이 옵션 자체가 데이터를 이관하거나 보존해 주지는 않습니다. 최종 yes 확인도 필요합니다.

```bash
# 데이터 보존/이관 검토 완료 후에만
sudo /opt/homeserver/scripts/deploy.sh "$release" --allow-db-transition
```

## 선택 옵션과 실패 처리

- `--without-monitoring`: 소켓 overlay·점검 제외. 서버 직접 조회 기능은 연결되지 않습니다.
- `--local-images`: pull 대신 이미 로드된 동일 SHA 이미지 사용. CI 검사에도 사용합니다.
- `--env-file PATH`: 별도 기존 환경 파일 지정.
- `APP_DIR`: 프로젝트 경로. 기본 `/opt/homeserver/apps/InvenCore`.
- `HOST_CAPACITY_DIR`: 호스트 소켓 디렉터리. 기본 `/run/invencore-host`.

앱 교체 후 실패하면 실패 코드로 끝내고 DB 삭제·자동 롤백을 하지 않습니다. `sudo docker logs --tail 100 invencore-app-backend-1`로 별도 확인합니다. 이미지 롤백 시에도 DB 스키마 호환성을 확인하세요.

`test_deploy.py`는 태그·설정·소켓과 사전 점검/취소 시 앱·환경 파일 보존을 검사합니다. CI는 실제 인프라와 빌드한 이미지로 `--check --local-images`를 실행하며 운영 배포는 수행하지 않습니다.

[통합 서버 가이드](../../docs/SERVER_CICD.md) · [PostgreSQL](../../docs/POSTGRESQL.md) · [호스트 직접 조회](../monitoring/README.md)
