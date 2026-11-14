# Tailscale Funnel HTTPS · CORS 수정과 SHA 고정 배포

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

## 1. 서버 파일 갱신, 기존 환경변수 보존

이 변경이 main에 올라가고 해당 SHA의 Docker CI가 성공한 뒤 Ubuntu Bash에서 실행합니다.

```bash
cd /opt/homeserver/apps/InvenCore
git status --short
git pull --ff-only
git check-ignore .env.docker

# 실제 키를 출력하지 않습니다. 다른 환경변수·기존 사용자 지정 Origin을 유지합니다.
python3 deployment/docker/update-cors-origin.py .env.docker
```

이 스크립트는 CORS 필드만 갱신하고 변경 전 내용을 권한 제한된 `.env.docker.backup-*`에 보관합니다. 두 파일 모두 Git/Docker build context 제외 대상입니다. 파일 내용이나 `docker compose config`의 전체 확장 결과를 공유하지 않습니다. 복잡한 변수 참조·중복 CORS 대입은 임의로 덮어쓰지 않고 실패합니다. 이 단계는 파일만 바꾸며 실행 중 컨테이너나 H2를 바꾸지 않습니다. `.env.docker`에 기존 CORS 값이 있으면 새 이미지의 기본값보다 우선하므로 이 갱신이 필요합니다.

```bash
# 최종 응답/성공한 Actions 실행의 전체 40자리 SHA로 바꿉니다.
release=REPLACE_WITH_SUCCESSFUL_40_CHARACTER_COMMIT_SHA
[[ "$release" =~ ^[a-f0-9]{40}$ ]] || { echo '올바른 릴리스 SHA가 필요합니다.'; return 1 2>/dev/null || exit 1; }

app() {
  APP_IMAGE_TAG="$release" docker compose --env-file .env.docker \
    -p invencore-app -f compose.app.yml -f compose.ghcr.yml "$@"
}

app config --quiet
app pull
```

`compose.ghcr.yml`이 GHCR 주소를 지정합니다. 로컬 이미지 이름이나 움직이는 latest 태그와 혼동하지 않도록 SHA로 고정합니다. 기존 GHCR 접근 권한을 사용하고, private package라면 서버의 기존 인증 상태를 확인합니다. 토큰을 명령 인자나 로그에 출력하지 않습니다.

## 2. 데이터 유지가 필요하면 기존 앱을 재생성하지 않기

현재 DB는 H2 메모리입니다. **기존 `invencore-app-backend-1`을 재생성·중지·재시작하면 기존 회원·게시글이 사라집니다.** 이전 이미지로 되돌려도 메모리 DB가 복원되지는 않습니다. 업로드 볼륨은 첨부파일만 보존합니다. PostgreSQL 컨테이너는 설치되어 있을 뿐 앱과 연결되지 않았습니다.

기존 데이터가 필요하면 아래의 병행 검증까지만 진행합니다. 영속 DB 전환·필요 데이터 이관을 결정하기 전에는 기존 프로젝트의 `up`으로 backend를 교체하지 않습니다. 프록시에서 Origin을 제거하거나 CORS 검사를 우회하는 방식으로 데이터 보존을 대신하지 않습니다.

## 3. 기존 앱을 유지한 채 8083에서 병행 검증

VM에 두 앱을 함께 실행할 메모리가 충분한지, 8083이 비어 있는지 확인합니다.

```bash
free -h
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
ss -ltn '( sport = :8083 )'

candidate() {
  APP_IMAGE_TAG="$release" FRONTEND_PORT=8083 docker compose --env-file .env.docker \
    -p invencore-https-check -f compose.app.yml -f compose.ghcr.yml "$@"
}

candidate config --quiet
candidate pull
candidate up -d --no-build --pull never
candidate ps
curl -fsS http://127.0.0.1:8083/api/health

# 실제 새 컨테이너에 임시 테스트 계정을 생성합니다. 키·토큰·비밀번호는 출력하지 않습니다.
python3 deployment/docker/verify-http.py http://127.0.0.1:8083
```

스크립트는 지정된 HTTPS Host/Origin을 사용해 새 Nginx와 Spring을 확인합니다. 외부 TLS 터널 자체를 검사하는 것은 아니며 실제 HTTPS는 5단계에서 확인합니다. 새 프로젝트는 별도 네트워크·업로드 볼륨과 **빈 H2 DB**를 사용합니다. 기존 앱·기존 테스트 컨테이너·PostgreSQL은 그대로입니다. `FRONTEND_PORT=8083`은 이 후보 프로젝트에만 적용되며 원래 `.env.docker`의 8082를 덮어쓰지 않습니다.

## 4. 검토 후에만 서비스 전환

### 선택 A: 병행 앱으로 Funnel 전환

신규 H2가 빈 DB라는 점과 기존 데이터 이관 필요 여부를 검토한 뒤 선택합니다. 기존 백엔드는 계속 살아 있으므로 기존 H2를 바로 잃지는 않지만, 접속자는 후보 앱의 새 DB를 보게 됩니다.

```bash
# 새 컨테이너를 검증했고 새 DB 사용을 결정한 뒤에만 실행합니다.
sudo tailscale funnel --bg http://127.0.0.1:8083
tailscale funnel status
```

문제가 있으면 기존 앱이 계속 실행 중인 상태에서 원래 8082로 되돌립니다.

```bash
sudo tailscale funnel --bg http://127.0.0.1:8082
tailscale funnel status
```

두 DB는 동기화되지 않으므로 전환 후 생성된 데이터가 이전 앱으로 복사되지는 않습니다. 후보 프로젝트를 정식으로 유지하면 프로젝트명·관리 포트가 바뀐다는 점도 운영 기록에 남깁니다.

### 선택 B: 기존 invencore-app을 갱신

**H2 초기화를 허용하거나 데이터 이관을 완료한 경우에만** 실행합니다. 기존 컨테이너의 이미지를 바꾸므로 이 명령으로 backend가 재생성될 수 있습니다.

```bash
app up -d --no-build --pull never backend frontend
app ps
curl -fsS http://127.0.0.1:8082/api/health
```

현재 서버의 `.env.docker`가 `FRONTEND_PORT=8082`인 전제이며 다른 값이면 실제 포트로 확인합니다. PostgreSQL 서비스·볼륨 삭제나 `down -v`는 어느 절차에도 사용하지 않습니다.

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

예상 결과는 health 200, 허용 OPTIONS 200과 정확한 HTTPS `Access-Control-Allow-Origin`, 잘못된 로그인 401, 잘못된 가입 400, 미허용 OPTIONS 403입니다. 마지막으로 실제 브라우저에서 테스트 계정 가입·로그인·로그아웃을 확인합니다. 새 H2로 전환했다면 이전 앱의 회원이 자동으로 존재하지 않으므로 가입부터 진행합니다. Network 탭의 토큰·비밀번호는 공유하지 않습니다.

## 참고

[기존 Docker 배포 안내](README.md) · [Spring 프록시 헤더 설명](https://docs.spring.io/spring-boot/how-to/webserver.html#howto.webserver.use-behind-a-proxy-server) · [Nginx map](https://nginx.org/en/docs/http/ngx_http_map_module.html) · [Tailscale Funnel](https://tailscale.com/docs/features/tailscale-funnel)
