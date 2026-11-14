const source = (path, load) => ({ path, load });
export const deploymentSources = [
  source("docs/SERVER_CICD.md", () => import("virtual:inventory-source/docs/SERVER_CICD.md")),
  source(
    ".github/workflows/docker-publish.yml",
    () => import("virtual:inventory-source/.github/workflows/docker-publish.yml"),
  ),
  source("compose.app.yml", () => import("virtual:inventory-source/compose.app.yml")),
  source("compose.ghcr.yml", () => import("virtual:inventory-source/compose.ghcr.yml")),
  source("docs/POSTGRESQL.md", () => import("virtual:inventory-source/docs/POSTGRESQL.md")),
  source(
    "docs/KAFKA_REDIS_SERVER.md",
    () => import("virtual:inventory-source/docs/KAFKA_REDIS_SERVER.md"),
  ),
  source("compose.monitoring.yml", () => import("virtual:inventory-source/compose.monitoring.yml")),
];
const app =
  "sudo docker compose --env-file .env.docker -p invencore-app -f compose.app.yml -f compose.ghcr.yml";
const section = (title, tag, where, summary, points, commands, files) => ({
  title,
  tag,
  where,
  summary,
  points,
  commands,
  files,
});
export const deploymentSteps = [
  section(
    "서버 접속과 기본 점검",
    "SERVER",
    "Windows PowerShell → Ubuntu",
    "Ubuntu 설치 이후 SSH·Docker·작업 경로를 확인합니다.",
    [
      "Windows에서 ssh invencore-server로 접속합니다. Ubuntu 안에서 이 별칭을 실행하지 않습니다.",
      "앱 경로는 /opt/homeserver/apps/InvenCore, Kafka·Redis 경로는 ~/invencore-infra입니다.",
      "Docker 권한이 없으면 sudo를 사용합니다. 기존 컨테이너와 자원을 확인합니다.",
    ],
    "# Windows PowerShell\nssh invencore-server\n# 아래부터 Ubuntu\ncd /opt/homeserver/apps/InvenCore\nsudo docker version\nsudo docker compose version\nsudo docker ps\nfree -h\ndf -h /",
    ["SERVER_CICD.md"],
  ),
  section(
    "컨테이너·데이터·네트워크",
    "INFRA",
    "Ubuntu / 기존 인프라",
    "앱, PostgreSQL, Kafka·Redis를 분리해 관리합니다.",
    [
      "Kafka 4.1.2(KRaft)와 Redis 8(AOF)은 별도 Compose에서 healthy로 확인했습니다.",
      "백엔드는 앱 기본 네트워크와 invencore-infra-net을 사용합니다. 내부 주소는 kafka:19092, redis:6379입니다.",
      "PostgreSQL 네트워크는 별도 확인 대상입니다. 인프라 네트워크 연결만으로 DB 연결이 보장되지 않습니다.",
      "앱 uploads와 DB·Kafka·Redis 볼륨은 별개입니다. 재배포에 down -v를 사용하지 않습니다.",
    ],
    "cd ~/invencore-infra\nsudo docker compose ps\nsudo docker compose exec -T redis redis-cli ping\nsudo docker compose exec -T kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server kafka:19092 --list\nsudo docker inspect postgres-postgres-1 --format '{{json .NetworkSettings.Networks}}'",
    ["compose.app.yml", "POSTGRESQL.md", "KAFKA_REDIS_SERVER.md"],
  ),
  section(
    "환경 변수와 비밀값",
    "CONFIG",
    "Ubuntu / 기존 .env.docker",
    "기존 환경 파일을 유지하면서 현재 앱 설정을 맞춥니다.",
    [
      "DB_URL, DB_USERNAME, DB_PASSWORD, JWT_SECRET은 필수입니다. 예제로 기존 환경 파일을 덮어쓰지 않습니다.",
      "GW_SYNC_MODE=external, KAFKA_BOOTSTRAP_SERVERS=kafka:19092, REDIS_HOST=redis, REDIS_PORT=6379를 사용합니다.",
      "DB_URL은 백엔드가 도달할 수 있는 PostgreSQL 주소입니다. 컨테이너의 localhost는 자기 자신입니다.",
      "CORS_ORIGINS는 실제 HTTPS Origin을 정확히 등록합니다. 환경 변수 변경은 컨테이너 재생성으로 반영합니다.",
    ],
    `cd /opt/homeserver/apps/InvenCore\nsudoedit .env.docker\nsudo chmod 600 .env.docker\n${app} config --quiet`,
    ["compose.app.yml", "POSTGRESQL.md"],
  ),
  section(
    "GitHub Actions · GHCR",
    "CI",
    "개발 PC / GitHub Actions",
    "main push → 테스트 → 이미지 검증 → GHCR 게시가 자동으로 실행됩니다.",
    [
      "활성 workflow는 docker-publish.yml입니다. Java 17 테스트, 배포 스크립트 검사, 두 이미지 빌드를 실행합니다.",
      "Nginx 프록시 및 PostgreSQL·Kafka·Redis smoke test를 통과한 이미지만 게시합니다.",
      "두 이미지에 같은 전체 커밋 SHA와 latest 태그가 붙습니다. 배포에는 CI 성공 SHA를 사용합니다.",
      "현재 Ubuntu 자동 배포 job은 없습니다. push만으로 운영 컨테이너가 갱신되지는 않습니다.",
    ],
    "# 개발 PC: 변경 검토·커밋 후\ngit push origin main\n# GitHub Actions에서 InvenCore Docker CI 성공 확인\n# 성공한 실행의 전체 commit SHA 기록",
    ["docker-publish.yml", "compose.ghcr.yml"],
  ),
  section(
    "검증된 이미지 수동 배포",
    "DELIVERY",
    "Ubuntu / 앱 디렉터리",
    "동일 SHA의 두 이미지를 내려받고 기존 Compose 프로젝트에 반영합니다.",
    [
      "서버 로컬 변경부터 확인하고 git pull 충돌은 덮어쓰지 말고 해결합니다.",
      "private GHCR은 sudo docker login ghcr.io로 읽기 권한을 가진 계정 인증이 필요합니다.",
      ".env.docker의 APP_IMAGE_TAG를 CI 성공 전체 SHA로 변경하고 이전 SHA를 기록합니다.",
      "모니터링 사용 시 호스트 조회 서비스를 먼저 설치하고 모든 Compose 명령에 -f compose.monitoring.yml을 동일하게 추가합니다.",
    ],
    `cd /opt/homeserver/apps/InvenCore\ngit status --short\ngit pull --ff-only\n# 이전 SHA 기록 후 APP_IMAGE_TAG 수정\nsudoedit .env.docker\n${app} config --quiet &&\n${app} pull &&\n${app} up -d --no-build --pull never &&\n${app} ps`,
    ["compose.app.yml", "compose.ghcr.yml", "compose.monitoring.yml", "SERVER_CICD.md"],
  ),
  section(
    "HTTPS · 프록시 · 개발 접속",
    "HTTPS",
    "Ubuntu / Windows 구분",
    "Nginx를 진입점으로 API를 연결하고 Funnel로 HTTPS를 제공합니다.",
    [
      "아래 8081은 예시입니다. .env.docker의 실제 FRONTEND_PORT와 Funnel 대상 포트를 일치시킵니다.",
      "프런트 Nginx는 backend:8080으로 /api를 전달하고 SPA deep link를 처리합니다.",
      "공개 Origin은 https://seulgae-server.tailac4b36.ts.net입니다. CORS 설정과 정확히 일치해야 합니다.",
      "Kafka·Redis SSH 터널은 Windows에서 Java를 실행할 때 사용합니다. 서버 컨테이너 사이에는 필요 없습니다.",
    ],
    "# Ubuntu: 실제 FRONTEND_PORT로 변경\ncurl -fsS http://127.0.0.1:8082/api/health\nsudo tailscale funnel --bg http://127.0.0.1:8082\ntailscale funnel status\n\n# Windows PowerShell 별도 창 (로컬 Java 개발 시)\nssh -N -o ExitOnForwardFailure=yes -L 9092:127.0.0.1:9092 -L 6379:127.0.0.1:6379 invencore-server",
    ["SERVER_CICD.md", "KAFKA_REDIS_SERVER.md"],
  ),
  section(
    "검증 · 장애 대응 · 롤백",
    "OPERATIONS",
    "Ubuntu / 브라우저",
    "기동 상태와 실제 기능을 검증하고 이전 SHA로 복구합니다.",
    [
      "PostgreSQL 전환과 서버형 연동은 현재 소스 기준입니다. 최신 이미지의 실제 서버 반영 여부는 별도 확인이 필요합니다.",
      "회원가입·로그인·게시글·첨부와 DB 지속성을 확인합니다. GW 원본/대상 revision 일치와 Redis HIT도 확인합니다.",
      "403은 Origin/CORS, 502는 backend health·DNS, Kafka 오류는 네트워크와 advertised listener를 점검합니다.",
      "APP_IMAGE_TAG를 이전 SHA로 바꾸고 배포 단계를 반복합니다. 이미지 롤백은 DB 데이터·스키마 복원이 아닙니다.",
    ],
    `cd /opt/homeserver/apps/InvenCore\n${app} ps\n${app} logs --tail 100 backend\nsudo docker inspect invencore-app-backend-1 --format '{{json .NetworkSettings.Networks}}'\n# 실제 FRONTEND_PORT 사용\ncurl -fsS http://127.0.0.1:8082/api/health\ncurl -fsS http://127.0.0.1:8082/api/gw-sync/status`,
    ["SERVER_CICD.md", "POSTGRESQL.md", "KAFKA_REDIS_SERVER.md"],
  ),
];
export const deploymentTools = [
  ["Ubuntu / SSH", "설치 완료 서버", "접속·운영"],
  ["Docker Compose", "앱 / DB / Kafka·Redis 분리", "네트워크·컨테이너·볼륨"],
  ["GitHub Actions / GHCR", "전체 commit SHA", "테스트·이미지 검증·게시"],
  ["PostgreSQL / Kafka / Redis", "기존 DB / KRaft / AOF", "데이터·이벤트·캐시"],
  ["Nginx / Tailscale Funnel", "내부 HTTP / 외부 HTTPS", "정적 파일·API·HTTPS"],
];
export const deploymentFunctions = [
  ["CI", "docker-publish.yml", "검증 성공 후 두 이미지 게시"],
  ["앱 구성", "compose.app.yml", "환경·볼륨·리소스·healthcheck"],
  ["SHA 지정", "compose.ghcr.yml", "동일 태그로 GHCR 이미지 선택"],
  ["호스트 모니터링", "compose.monitoring.yml", "Ubuntu 조회 서비스 socket 연결"],
];
export const deploymentLinks = [];
