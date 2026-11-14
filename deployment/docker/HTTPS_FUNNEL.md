# Tailscale Funnel HTTPS · CORS 수정과 SHA 고정 배포

> DB 전환 후에는 DB_URL/DB_USERNAME/DB_PASSWORD 설정이 필수입니다. 후보 앱은 별도 PostgreSQL DB/스키마로 검증하세요. 이 문서의 과거 H2 동작 설명은 전환 전 기록입니다. 저장소의 docs/POSTGRESQL.md를 먼저 확인하세요.

대상 Origin은 `https://seulgae-server.tailac4b36.ts.net`입니다. 2026-11-14 수정 전 외부 주소에 토큰 없는 로그인 POST `{}`와 OPTIONS를 전송했고, 둘 다 **403 `Invalid CORS request`**를 반환했습니다. 기존 허용 목록에 HTTPS Origin이 빠진 것이 실제 응답으로 확인되었습니다.

## 코드·프록시 변경

- `application.yml`, `compose.app.yml`, `deployment/docker/env.example`에 HTTPS Origin과 기존 5173·5174·8081·8082 localhost/127.0.0.1 주소를 명시했습니다. 와일드카드는 사용하지 않습니다.
- `SecurityConfig`는 YAML의 Origin 정의를 사용합니다. 공개 가입·로그인, JWT 필터, 나머지 인증 정책은 그대로입니다.
- Nginx는 `/api/`와 공개 Host/포트를 보존합니다. Funnel이 TLS를 종료하는 지정된 호스트에 대해서만 upstream `X-Forwarded-Proto=https`를 설정하고 나머지는 실제 Nginx 연결 scheme을 사용합니다.
- 클라이언트가 보낸 `X-Forwarded-Proto`를 그대로 복사하지 않습니다. `Forwarded`·forwarded host/port는 제거하고 forwarded IP chain도 직접 연결한 peer로 덮어씁니다. Host에 따른 scheme은 배포 경로의 메타데이터이며 신원이나 권한을 증명하는 값이 아닙니다.
- Spring의 `server.forward-headers-strategy=none`을 명시했습니다. 현재 JWT REST API는 프록시 헤더로 절대 URL·쿠키를 계산할 필요가 없고, CORS는 명시적인 Origin 목록으로 처리하므로 임의 프록시 헤더 신뢰를 활성화하지 않습니다.

추후 도메인·TLS 경로를 바꾸거나 절대 URL/리다이렉트가 필요해지면 Nginx map과 신뢰할 프록시 경계를 함께 검토합니다. HTTP 내부 홉을 HTTPS로 암호화했다는 의미는 아닙니다.

## 테스트와 CI 범위

`MemberHttpsCorsTests`는 HTTPS 및 기존 Docker Origin에서 실제 가입 201·로그인 200·JWT 발급, 9개 Origin의 사전 요청, 미허용 도메인과 유사 도메인 403, 위조 Forwarded로 CORS 우회 불가, 보호 API 401을 검사합니다. 기존 보안 테스트도 유지합니다.

Docker CI는 백엔드 전체 테스트와 환경 파일 보존 검사 → 두 이미지 빌드 → 실제 Nginx 헤더 검사 → 두 컨테이너를 통한 가입·로그인·CORS 차단·보호 API 검사 → GHCR 게시 → commit SHA 태그 manifest 확인 순서입니다. CI용 헤더 수신기와 테스트 계정은 임시 runner에만 생성하며 프로덕션 이미지에는 포함하지 않습니다. 비밀번호·JWT 원문은 테스트 결과에 출력하지 않습니다.

**GitHub Actions 성공과 GHCR 게시가 Ubuntu 배포 완료를 뜻하지 않습니다. CD/SSH 자동 배포는 추가하지 않았습니다.**

## 1. 현재 PostgreSQL 배포 기준

DB는 PostgreSQL이고 Kafka·Redis는 external 모드가 기본입니다. [통합 서버 배포 안내](../../docs/SERVER_CICD.md)와 [PostgreSQL 연결](../../docs/POSTGRESQL.md)을 기준으로 합니다. 이전 H2 컨테이너가 남아 있다면 중지 전 데이터 이관 여부를 확인합니다.

기존 .env.docker를 유지하면서 CORS만 병합합니다. 아래 작업은 컨테이너를 바꾸지 않습니다. pull이 실패하면 이후 작업을 중단하세요.

```bash
cd /opt/homeserver/apps/InvenCore
git status --short
git pull --ff-only
python3 deployment/docker/update-cors-origin.py .env.docker
```

CI 성공 SHA를 기존 환경 파일의 APP_IMAGE_TAG에 지정하고 DB 접속·인프라 네트워크를 점검합니다. 설정 원문이나 확장된 전체 Compose 설정은 공유하지 않습니다.

```bash
app() {
  sudo docker compose --env-file .env.docker -p invencore-app \
    -f compose.app.yml -f compose.ghcr.yml "$@"
}
app config --quiet
app pull
```

Ubuntu 자원 직접 조회를 사용하면 먼저 [호스트 서비스 설치](../monitoring/README.md)를 완료하고, 위 함수에 `-f compose.monitoring.yml`도 넣어 모든 명령에서 같은 파일 목록을 유지합니다.

## 2. 데이터·연결 확인 후 적용

기존 PostgreSQL DB·계정·네트워크·볼륨을 유지합니다. 새 앱을 다른 포트에 띄워도 같은 DB_URL이면 같은 데이터베이스를 사용하므로 격리된 빈 DB라고 가정하지 않습니다. 후보 앱 검증은 별도 테스트 DB/스키마를 준비한 뒤 진행합니다.

현재 운영 DB와 보존 상태를 확인한 뒤에만 갱신합니다.

```bash
app up -d --no-build --pull never backend frontend
app ps
```

Funnel 대상 포트는 기존 FRONTEND_PORT를 유지합니다. 현재 서버의 8082 또는 설정한 실제 포트로 내부 health를 확인하고 HTTPS를 검증합니다. 기존 PostgreSQL 컨테이너·볼륨을 삭제하거나 down -v를 실행하지 않습니다. 이전 이미지로 복귀해도 DB 스키마 변경이나 H2 메모리 데이터는 복구되지 않습니다.

## 5. 외부 HTTPS에서 검증

Ubuntu 또는 curl이 설치된 환경에서:

```bash
origin=https://seulgae-server.tailac4b36.ts.net
curl -fsS "$origin/api/health"

curl -i -X OPTIONS "$origin/api/members/login" \
  -H "Origin: $origin" -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type'

# 존재하지 않는 테스트 아이디: 인증 실패 401이어야 하며 CORS 403이면 안 됩니다.
curl -i -X POST "$origin/api/members/login" -H "Origin: $origin" \
  -H 'Content-Type: application/json' \
  --data '{"username":"MissingHttpsVerificationUser","password":""}'

# 잘못된 가입 DTO는 400이어야 합니다. 계정은 생성하지 않습니다.
curl -i -X POST "$origin/api/members/register" -H "Origin: $origin" \
  -H 'Content-Type: application/json' --data '{}'

curl -i -X OPTIONS "$origin/api/members/login" \
  -H 'Origin: https://unlisted.example' -H 'Access-Control-Request-Method: POST'
```

예상 결과는 health 200, 허용 OPTIONS 200과 정확한 HTTPS `Access-Control-Allow-Origin`, 잘못된 로그인 401, 잘못된 가입 400, 미허용 OPTIONS 403입니다. 마지막으로 실제 브라우저에서 테스트 계정 가입·로그인·로그아웃을 확인합니다. H2에서 PostgreSQL로 전환했다면 별도 이관 전에는 이전 회원이 자동으로 존재하지 않습니다. Network 탭의 토큰·비밀번호는 공유하지 않습니다.

## 참고

[기존 Docker 배포 안내](README.md) · [Spring 프록시 헤더 설명](https://docs.spring.io/spring-boot/how-to/webserver.html#howto.webserver.use-behind-a-proxy-server) · [Nginx map](https://nginx.org/en/docs/http/ngx_http_map_module.html) · [Tailscale Funnel](https://tailscale.com/docs/features/tailscale-funnel)
