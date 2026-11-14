> GHCR 운영 배포는 [현재 deploy.sh 안내](DEPLOY_SCRIPT.md)를 사용하세요. 아래 짧은 태그 예시는 로컬 직접 빌드용이며 GHCR SHA 태그로 사용할 수 없습니다.

# Hyper-V Ubuntu · Docker 앱 배포

> DB 전환 후에는 DB_URL/DB_USERNAME/DB_PASSWORD 설정이 필수입니다. 후보 앱은 별도 PostgreSQL DB/스키마로 검증하세요. 이 문서의 과거 H2 동작 설명은 전환 전 기록입니다. 저장소의 docs/POSTGRESQL.md를 먼저 확인하세요.

Tailscale HTTPS Origin 수정과 GHCR SHA 고정 배포는 [HTTPS Funnel 안내](HTTPS_FUNNEL.md)를 먼저 확인하세요. 해당 절차는 기존 `.env.docker`와 H2 컨테이너를 유지한 병행 검증을 제공합니다.

2026-11-14 기준입니다. 회원가입 CORS 수정과 새 앱 배포 파일을 다룹니다. 기존 `docker run` 컨테이너와 PostgreSQL 스택을 유지한 채 별도 Compose 프로젝트를 먼저 검증합니다. 이 문서의 명령은 안내이며 원격 서버에서 자동 실행하지 않았습니다.

## 1. 회원가입 403 원인과 검증

제공한 환경의 브라우저 Origin은 `http://localhost:8081`입니다. 기존 `application.yml`은 5173·5174만 허용했고, Nginx는 `Host $host`로 공개 포트를 제외했습니다. 따라서 브라우저의 `Origin`과 백엔드가 본 주소가 달라지면 CORS 검사를 거쳐 8081 Origin이 거부됩니다. GET은 브라우저가 Origin 헤더 없이 보낼 수 있으므로 중복 확인 GET 200과 가입 POST 403이 동시에 발생할 수 있습니다.

가입 `/api/members/register`는 이미 `permitAll`, CSRF는 이미 비활성화되어 있습니다. JWT 필터는 토큰 없는 공개 요청을 다음 필터로 넘깁니다. 인증·인가를 더 완화하지 않고 8081 Origin을 명시적으로 추가했습니다. 실제 서버 access log의 상태·바이트 수만으로 응답 본문까지 확정할 수는 없으므로 아래 검증 요청으로 확인합니다.

`MemberCorsTests`에서 수정 전 가입 POST와 OPTIONS 모두 403이 재현됐습니다. 수정 후 POST는 201, OPTIONS는 200이며 허용하지 않은 Origin은 여전히 403입니다. `RequestBoardAuthenticationTests`로 공개 CRUD와 다른 보호 API의 401 응답도 함께 검사했습니다. 이 테스트는 H2를 사용하며 PostgreSQL이나 원격 서버에 연결하지 않습니다.

```powershell
# 개발 PC, 저장소 루트
.\backend\gradlew.bat -p backend test --tests '*MemberCorsTests' --tests '*RequestBoardAuthenticationTests'
```

이미 배포된 이미지에 긴급히 적용할 최소 환경 설정은 다음과 같습니다. `CORS_ORIGINS`는 백엔드 컨테이너의 환경변수이며 프론트 컨테이너에만 넣으면 효과가 없습니다. 실행 중인 컨테이너의 환경변수는 `docker restart`로 변경되지 않으므로 재생성이 필요합니다. 단, 기존 H2 메모리 데이터가 있으면 바로 교체하지 말고 아래 병행 검증 절차를 사용합니다.

```text
CORS_ORIGINS=http://localhost:8081,http://127.0.0.1:8081
```

## 2. 현재 파일·DB 상태

| 파일 / 항목 | 현재 상태 |
| --- | --- |
| `backend/src/main/resources/application.yml` | 기본 H2 메모리 DB, Docker Origin 추가 |
| `backend/build.gradle` | H2 드라이버. PostgreSQL JDBC 의존성은 아직 없음 |
| `backend/Dockerfile` | Java 17 다단계 빌드, 비 root 실행, healthcheck용 curl |
| `frontend/Dockerfile` | Node 22 빌드 → Nginx 정적 제공. 소스 뷰어에 필요한 백엔드 파일도 빌드 시 복사 |
| `frontend/nginx.conf` | Compose DNS `backend:8080`, `/api` 경로·Host 포트 유지, SPA fallback |
| `compose.app.yml` | 새 프론트·백엔드 앱 스택. 기존 컨테이너 이름을 재사용하지 않음 |
| 루트 `compose.yml` | 기존 선택적 Kafka·Redis 스택. 이번 변경에서 유지 |
| PostgreSQL `postgres-postgres-1` | 사용자 제공 정보상 별도 설치. 이 앱에서 연결하지 않음 |

앱 Compose는 PostgreSQL과 기존 서버의 Kafka·Redis를 사용합니다. DB_* 설정을 유지하고 GW_SYNC_MODE=external, KAFKA_BOOTSTRAP_SERVERS=kafka:19092, REDIS_HOST=redis를 사용합니다. 백엔드는 invencore-infra-net에 연결됩니다. 자세한 전환 절차는 [서버 연결 안내](../../docs/KAFKA_REDIS_SERVER.md)를 참고하세요.

PostgreSQL 18 컨테이너가 healthy라는 사실만으로 앱이 그 DB를 사용하는 것은 아닙니다. 실제 전환에는 PostgreSQL JDBC 드라이버, URL·사용자·비밀번호, Docker 네트워크 연결과 스키마·데이터 이관이 필요합니다. 현재 시작 시 실행되는 벤치마크 SQL에는 `SYSTEM_RANGE`, `H2VERSION()`, `ANALYZE TABLE` 등 H2 전용 구문도 있으므로 URL만 바꾸면 안 됩니다. 독립 인덱스 과제의 일회용 H2는 별도의 학습용 DB입니다. PostgreSQL 전환은 이번 403 수정과 분리해 검증해야 합니다.

## 3. 기존 데이터를 유지하며 새 소스 준비

이번 변경을 커밋·푸시한 다음 Ubuntu에서 실행합니다. 아래 명령은 Ubuntu Bash 기준입니다.

```bash
cd /opt/homeserver/apps/InvenCore
git status --short
git pull --ff-only

# 기존 컨테이너와 자원 상태 확인. 기존 backend는 계속 실행합니다.
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
free -h
docker stats --no-stream invencore-backend-test invencore-frontend-test
```

로컬 수정이 있으면 내용을 먼저 정리하고 pull합니다. `git reset --hard`나 자동 덮어쓰기를 사용하지 않습니다. 병행 실행은 기존·새 백엔드의 메모리를 함께 사용하므로 자원이 부족하면 테스트 크기를 줄이거나 별도 검증 시간을 잡습니다.

**기존 `invencore-backend-test`를 stop/restart/recreate하면 기존 회원·게시글 등 H2 메모리 데이터가 사라집니다.** 컨테이너를 남겨 두거나 이미지·볼륨을 백업하는 것만으로 그 메모리 DB가 보존되지는 않습니다. 현재는 기존 백엔드를 계속 실행한 채 신규 앱에 별도 샘플 데이터를 만듭니다. 기존 데이터가 필요하면 기존 앱에서 조회·다운로드 가능한 자료를 별도로 보관하고, 계정·모든 테이블의 영속 이관 방식을 결정한 뒤 전환해야 합니다. 업로드 파일도 실제 저장 경로를 확인해 별도로 보관합니다.

## 4. 비밀값을 파일에 준비하고 새 스택 빌드

`.env.docker`는 Git과 Docker build context에서 제외됩니다. 실제 값이나 `docker inspect` 전체 결과를 공유하거나 커밋하지 않습니다. `.env.docker`를 이미 사용 중이면 덮어쓰지 않습니다.

```bash
cd /opt/homeserver/apps/InvenCore
umask 077
if [ ! -e .env.docker ]; then
  {
    printf 'JWT_SECRET=%s\n' "$(openssl rand -hex 48)"
    cat deployment/docker/env.example
  } > .env.docker
fi
chmod 600 .env.docker

# 키는 출력하지 않고 이번 소스의 이미지 태그만 기록합니다.
tag=$(git rev-parse --short=12 HEAD)
sed -i "s/^APP_IMAGE_TAG=.*/APP_IMAGE_TAG=$tag/" .env.docker

# 환경 예제는 새 프론트 8082, 기존/신규 터널 Origin 8081·8082를 허용합니다.
docker compose --env-file .env.docker -p invencore-app -f compose.app.yml config --quiet
docker compose --env-file .env.docker -p invencore-app -f compose.app.yml build
docker compose --env-file .env.docker -p invencore-app -f compose.app.yml up -d
docker compose --env-file .env.docker -p invencore-app -f compose.app.yml ps
```

`config --quiet`를 사용해 확장된 JWT 값이 터미널에 출력되지 않게 합니다. 두 이미지는 같은 태그를 사용합니다. 새 백엔드의 호스트 포트는 공개하지 않고, 프론트만 `127.0.0.1:8082`에 게시합니다. 프로젝트 네트워크·업로드 볼륨은 기존 수동 컨테이너 및 PostgreSQL과 별개입니다.

## 5. 새 스택 검증

Ubuntu에서:

```bash
curl -fsS http://127.0.0.1:8082/api/health

curl -i -X OPTIONS http://127.0.0.1:8082/api/members/register \
  -H 'Origin: http://localhost:8082' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type'

# 빈 DTO는 회원을 생성하지 않습니다. 403 대신 입력 검증 400이면 CORS를 통과한 것입니다.
curl -i -X POST http://127.0.0.1:8082/api/members/register \
  -H 'Origin: http://localhost:8082' \
  -H 'Content-Type: application/json' --data '{}'
```

상태 확인은 200, 사전 요청은 200과 `Access-Control-Allow-Origin: http://localhost:8082`, 빈 가입 입력은 400을 기대합니다. 실제 가입은 다음 브라우저 단계에서 고유 테스트 아이디로 확인합니다.

Windows PowerShell에서 서버 계정명을 실제 계정으로 바꿉니다:

```powershell
ssh -N -L 8082:127.0.0.1:8082 YOUR_UBUNTU_USER@192.168.250.10
```

`http://localhost:8082/inventory/auth?tab=demo`에서 회원가입 → 로그인, 게시판 작성·첨부 다운로드를 확인합니다. 기존 `http://localhost:8081` 터널과 기존 H2 데이터는 이 과정에서 그대로 남습니다. 실제 배포 도메인으로 접속한다면 그 **브라우저 Origin**을 CORS에 명시해야 하며, SSH 서버의 사설 IP를 무조건 넣는 것은 같은 의미가 아닙니다.

## 6. 검증 후 프론트만 8081로 전환

신규 DB는 기존 DB와 다른 빈 H2 인스턴스입니다. 기존 데이터가 필요하면 이 단계보다 먼저 이관 방법을 결정합니다. 아래 단계에서도 기존 백엔드는 중지하지 않습니다.

```bash
cd /opt/homeserver/apps/InvenCore

# 기존 프론트만 중지합니다. 기존 H2를 가진 backend-test는 계속 실행합니다.
docker stop invencore-frontend-test
sed -i 's/^FRONTEND_PORT=8082$/FRONTEND_PORT=8081/' .env.docker

# backend 재생성을 방지하고 frontend만 포트를 변경합니다.
docker compose --env-file .env.docker -p invencore-app -f compose.app.yml up -d --no-deps frontend
curl -fsS http://127.0.0.1:8081/api/health
```

새 프론트도 기존 방식의 SSH 8081 터널로 접속합니다. CORS는 처음부터 8081·8082를 허용했으므로 포트 전환 때문에 새 백엔드를 교체할 필요가 없습니다. 실제 회원가입과 로그인은 8081에서도 다시 확인합니다.

문제가 있으면 기존 프론트로 돌아갑니다:

```bash
docker compose --env-file .env.docker -p invencore-app -f compose.app.yml stop frontend
docker start invencore-frontend-test
```

기존 백엔드가 계속 살아 있고 기존 네트워크도 유지되어 있을 때 이전 데이터로 돌아갈 수 있습니다. 새 Compose를 나중에 다시 올릴 때는 현재 `.env.docker`의 8081 포트가 기존 프론트와 충돌하지 않는지 먼저 확인합니다. `down -v`, `docker volume rm`, PostgreSQL 스택의 재생성·DB 삭제 명령은 이 절차에 포함하지 않습니다.

## 7. 여전히 실패하면 확인할 항목

| 관측 | 확인 |
| --- | --- |
| 403 + `Invalid CORS request` | 백엔드의 실제 `CORS_ORIGINS`, 브라우저 Origin, 이미지·컨테이너 갱신 여부 |
| OPTIONS는 통과하고 POST 403 | POST 응답 본문·Spring Security 로그, 현재 배포 소스와 테스트 소스 차이 |
| 400 | DTO 입력 검증. 아이디·비밀번호 형식 확인 |
| 401 | 보호 경로 또는 다른 배포의 보안 설정. 회원가입은 토큰 없이 가능해야 함 |
| Nginx 502 | backend health·네트워크 DNS·컨테이너 상태 |
| 시작 중 DB·SQL 예외 | 실제 datasource 설정과 H2 전용 벤치마크 SQL, PostgreSQL 연결 여부 |
| OOM 종료 | 리소스 상태와 `BENCHMARK_ROWS`. 값을 바꾸며 백엔드를 교체하면 H2가 초기화됨 |

Docker 실제 빌드·실행·Nginx 프록시와 Ubuntu 적용은 이 작업 환경에서 실행하지 못했습니다. 적용 후 위 HTTP 검증이 필요합니다.

참고: [Spring CORS](https://docs.spring.io/spring-framework/reference/web/webmvc-cors.html), [Compose health 의존 순서](https://docs.docker.com/compose/how-tos/startup-order/), [Compose 네트워크](https://docs.docker.com/compose/how-tos/networking/).
