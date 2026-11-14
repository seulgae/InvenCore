# Ubuntu 서버 CI/CD 구축·운영 가이드

Ubuntu 설치 이후의 현재 InvenCore 구성을 기준으로 정리합니다. Hyper-V와 Ubuntu 설치는 제외합니다.

## 1. 구성과 확인 범위

| 구분 | 구성 | 역할 |
| --- | --- | --- |
| 접속 | Windows → `ssh invencore-server` | Ubuntu 관리 |
| 앱 | `/opt/homeserver/apps/InvenCore` | frontend Nginx + backend Spring Boot |
| DB | `/opt/homeserver/apps/postgres` | 별도 PostgreSQL 18 컨테이너 |
| 인프라 | `~/invencore-infra` | Kafka 4.1.2 KRaft + Redis 8 AOF |
| CI | `.github/workflows/docker-publish.yml` | 테스트·이미지 검증·GHCR 게시 |
| 배포 | `compose.app.yml` + `compose.ghcr.yml` | 검증된 SHA를 서버에서 수동 반영 |
| 외부 접속 | Tailscale Funnel → frontend → backend | HTTPS 및 API 프록시 |

Kafka·Redis는 서버에서 healthy, Redis PONG, Kafka 토픽 조회 성공을 확인했습니다. PostgreSQL 전환과 Kafka·Redis 서버 모드는 현재 소스에 반영되어 있으며, 최신 이미지 배포 후 서버에서 다시 검증해야 합니다. 과거 실행 로그의 H2를 현재 PostgreSQL 배포 완료 증거로 사용하지 않습니다.

## 2. 서버 기본 점검

Windows PowerShell에서 접속합니다. SSH 별칭은 Windows 설정이므로 Ubuntu 안에서 실행하지 않습니다.

```powershell
ssh invencore-server
```

Ubuntu에서 Docker와 Compose 설치 상태, 자원을 확인합니다. 현재 서버에는 Docker가 설치되어 있습니다.

```bash
sudo docker version
sudo docker compose version
sudo docker ps
free -h
df -h /
cd /opt/homeserver/apps/InvenCore
git status --short
```

Docker socket 권한 오류가 있으면 `sudo docker`를 사용합니다. SSH·앱 접속 경로와 다른 DB·캐시 포트를 불필요하게 외부 공개하지 않습니다.

## 3. 인프라와 영속 데이터

앱 기본 네트워크에는 frontend·backend가 연결됩니다. backend는 외부 네트워크 `invencore-infra-net`에도 연결되어 Kafka·Redis를 사용합니다.

| 실행 위치 | Kafka | Redis |
| --- | --- | --- |
| 서버 backend 컨테이너 | `kafka:19092` | `redis:6379` |
| Ubuntu에서 Java 실행 | `localhost:9092` | `localhost:6379` |
| Windows에서 Java 실행 | SSH 터널의 `localhost:9092` | SSH 터널의 `localhost:6379` |

```bash
cd ~/invencore-infra
sudo docker compose ps
sudo docker compose exec -T redis redis-cli ping
sudo docker compose exec -T kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server kafka:19092 --list
sudo docker inspect postgres-postgres-1 --format '{{json .NetworkSettings.Networks}}'
```

PostgreSQL은 별도 스택이므로 실제 네트워크와 접속 주소를 확인합니다. 같은 Docker 네트워크의 서비스 이름 또는 백엔드에서 도달 가능한 호스트 주소를 사용합니다. `host.docker.internal`도 PostgreSQL이 호스트 loopback에만 바인딩되어 있으면 접근할 수 없습니다. 인프라 네트워크만 연결했다고 DB 연결까지 완료되지는 않습니다.

PostgreSQL 데이터, Kafka 데이터, Redis 데이터, 앱 `uploads`는 각각 별도 영속 영역입니다. 앱 재배포에 `down -v`나 볼륨 삭제를 사용하지 않습니다. DB와 첨부는 함께 백업하며 앱 이미지 롤백으로 데이터가 복원되지는 않습니다.

상세 설정: [PostgreSQL](POSTGRESQL.md), [Kafka·Redis](KAFKA_REDIS_SERVER.md).

## 4. 환경 설정

기존 `.env.docker`를 유지하고 다음 키를 확인합니다. 예제의 자리표시자를 실제 값으로 바꾸며 기존 비밀값을 새로 생성하거나 덮어쓰지 않습니다.

| 키 | 설정 기준 |
| --- | --- |
| `DB_URL` | 도달 가능한 `jdbc:postgresql://DB_HOST:5432/invencore` |
| `DB_USERNAME`, `DB_PASSWORD` | 기존 PostgreSQL 앱 계정 |
| `JWT_SECRET` | 기존 서버 비밀값 유지 |
| `APP_IMAGE_TAG` | CI가 성공한 전체 commit SHA |
| `FRONTEND_PORT` | 실제 서버 진입 포트. 아래 명령은 8081 예시 |
| `CORS_ORIGINS` | 실제 HTTPS Origin과 허용할 개발 Origin |
| `GW_SYNC_MODE`, `GW_SYNC_ENABLED` | `external`, `true` |
| `INFRA_NETWORK` | `invencore-infra-net` |
| `KAFKA_BOOTSTRAP_SERVERS` | `kafka:19092` |
| `REDIS_HOST`, `REDIS_PORT` | `redis`, `6379` |

```bash
cd /opt/homeserver/apps/InvenCore
sudoedit .env.docker
sudo chmod 600 .env.docker
```

환경 파일은 Git에 올리지 않습니다. `config --quiet`로 비밀값을 출력하지 않고 검증합니다. 환경 변수 변경은 restart만으로 반영되지 않으므로 Compose로 재생성합니다.

## 5. CI: 테스트와 이미지 게시

개발 PC에서 변경을 검토·커밋하고 main에 push하면 `InvenCore Docker CI`가 실행됩니다. GitHub에서 수동 실행도 가능합니다.

1. Java 17 백엔드 테스트와 배포·모니터링 스크립트 검사
2. backend·frontend Docker 이미지 빌드 (프런트 Dockerfile에서 lint·test·build)
3. Compose 설정과 Nginx 프록시 검증
4. 임시 PostgreSQL·Kafka·Redis 및 호스트 조회 서비스로 smoke test
5. 검증 성공 후 GHCR에 전체 SHA와 latest 태그 게시

이미지는 `ghcr.io/seulgae/invencore-backend`와 `ghcr.io/seulgae/invencore-frontend`입니다. 두 이미지에 같은 전체 SHA를 사용합니다.

**현재 서버 자동 배포 job은 없습니다.** CI 성공은 이미지 게시 완료이며 Ubuntu 컨테이너 갱신 완료가 아닙니다.

## 6. 서버 수동 배포

권장 진입점은 [현재 서버용 deploy.sh](../deployment/docker/DEPLOY_SCRIPT.md)입니다. 전체 SHA 지정, 기존 환경 파일 유지, 인프라·소켓 점검 후 앱만 교체합니다. 아래는 같은 Compose 구성을 직접 실행할 때의 참고입니다.

현재 운영 프로젝트 이름 `invencore-app`과 환경 파일을 유지합니다. 서버 로컬 변경을 확인하고 충돌은 직접 해결한 후 진행합니다. private 패키지는 `sudo docker login ghcr.io`로 인증합니다. 토큰을 명령 인수나 문서에 기록하지 않습니다.

```bash
cd /opt/homeserver/apps/InvenCore
git status --short
git pull --ff-only

# 기존 APP_IMAGE_TAG를 복구용으로 기록한 후 CI 성공 전체 SHA로 변경
sudoedit .env.docker

app() {
  sudo docker compose --env-file .env.docker -p invencore-app \
    -f compose.app.yml -f compose.ghcr.yml "$@"
}
app config --quiet &&
app pull &&
app up -d --no-build --pull never &&
app ps
```

호스트 모니터링을 사용하는 서버는 [호스트 조회 서비스](../deployment/monitoring/README.md)를 먼저 설치합니다. 위 `app` 함수의 파일 목록에 `-f compose.monitoring.yml`도 추가하고 검증·pull·up 모두 같은 목록을 사용합니다. 해당 overlay의 `/run/invencore-host` 경로가 준비되어 있어야 합니다.

## 7. HTTPS와 개발 접속

`FRONTEND_PORT`가 다르면 아래 8082를 실제 포트로 바꿉니다. Funnel 변경은 외부 트래픽 대상을 바꾸므로 먼저 내부 health를 확인합니다.

```bash
curl -fsS http://127.0.0.1:8082/api/health
sudo tailscale funnel --bg http://127.0.0.1:8082
tailscale funnel status
curl -fsS https://seulgae-server.tailac4b36.ts.net/api/health
```

Funnel에서 HTTPS를 종료하고 frontend Nginx가 `/api`를 `backend:8080`에 전달합니다. HTTPS Origin은 CORS에 정확히 등록합니다. 과거 H2 후보 배포 절차를 PostgreSQL 환경에 그대로 적용하지 않습니다.

Windows에서 Java를 직접 개발할 때는 별도 PowerShell 창에서 터널을 유지합니다.

```powershell
ssh -N -o ExitOnForwardFailure=yes -L 9092:127.0.0.1:9092 -L 6379:127.0.0.1:6379 invencore-server
```

## 8. 배포 검증과 복구

```bash
app ps
app logs --tail 100 backend
sudo docker inspect invencore-app-backend-1 --format '{{json .NetworkSettings.Networks}}'
curl -fsS http://127.0.0.1:8082/api/health
curl -fsS http://127.0.0.1:8082/api/gw-sync/status
```

브라우저에서 회원가입·로그인·게시글·첨부를 확인합니다. DB는 PostgreSQL 연결 로그와 앱 재시작 후 데이터 유지로 확인합니다. GW 상태 표시만으로 연결 성공을 판단하지 말고 원본 변경 후 대상 revision 일치와 Redis HIT를 확인합니다. Kafka 실습은 `EXTERNAL_KAFKA` 모드와 실제 소비를 확인합니다.

| 증상 | 확인 항목 |
| --- | --- |
| SSH 별칭 해석 실패 | Windows에서 실행했는지, SSH config 존재 여부 |
| Docker permission denied | sudo 사용 여부 |
| CORS 403 | 실제 Origin, backend 환경 변수, 재생성 여부 |
| Nginx 502 | backend health, 앱 기본 네트워크, DNS |
| PostgreSQL 연결 실패 | DB 계정·URL·네트워크·접속 허용 |
| Kafka 연결 실패 | 내부 listener `kafka:19092`, advertised listener, 네트워크 |
| Redis fallback | Redis 연결·인증·네트워크 확인 |

롤백은 `.env.docker`의 `APP_IMAGE_TAG`를 기록한 이전 SHA로 변경하고 6단계의 검증·pull·up을 반복합니다. DB 스키마 호환성은 별도 확인하며 데이터 복원은 백업 절차로 처리합니다. 현재 자동 롤백은 구현되어 있지 않습니다.
