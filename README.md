# InvenCore

직접 실행하고 구현 코드·메서드·아키텍처를 확인하는 기술 인벤토리입니다. 기술 카드와 Java TODO 실습을 제공하고, 방명록은 별도 화면으로 운영합니다.

## 현재 구성

| 구성 | 현재 기준 |
| --- | --- |
| Backend | Java 17 · Spring Boot 4.0.1 · Gradle · JPA · MyBatis |
| Database | PostgreSQL 18 · H2 의존성/실행 설정 제거 |
| Messaging / Cache | 실제 Kafka·Redis를 사용하는 external 모드가 기본. local 모드는 명시적으로 선택 |
| Frontend | React 19 · Vite · 별도 방명록 · 기술 카드 |
| Production | Ubuntu Docker Compose · Nginx · Tailscale Funnel HTTPS |
| CI | 전체 테스트 → 두 이미지 빌드 → 실제 연동 검사 → GHCR SHA/latest 게시 |
| Delivery | 성공 SHA를 이용한 수동 배포. Ubuntu 자동 배포는 아직 없음 |

## 화면과 예제

| 화면/카드 | 기능 |
| --- | --- |
| 기술 인벤토리 `/` | 카드 목록·구현 노트·실행·소스·클래스/메서드·구조도 |
| 방명록 `/guestbook` | 공개 닉네임·캐릭터·인사말 작성, 최신순 페이지 조회, PostgreSQL 저장 |
| Kafka 미니게임 | 파티션·오프셋·그룹·지연·재처리·업무 버전 방어와 Java 구현 과제 |
| GW 데이터 연동 | JPA 원본 → Kafka → JPA 대상 → Redis 형상 캐시 |
| 병렬 스트림 | 같은 CPU 작업의 순차/병렬 처리 측정 |
| 인덱스 튜닝 | PostgreSQL 동일 SQL의 복합 인덱스 비교·실제 실행 계획 |
| 서버용량조사 | 클릭 → 인증된 API → Ubuntu 로컬 소켓 직접 측정 → 카드 표시 |
| JWT 인증 | BCrypt·회원가입·로그인·JWT·비밀번호 보기/숨기기 |
| 요청 게시판·파일·댓글 | 공개 CRUD·첨부파일·댓글/답글 |
| Ubuntu 서버 CI/CD 가이드 | 현재 서버 설정·인프라·환경변수·CI·SHA 배포·HTTPS·검증·롤백 |

가이드 카드의 기존 주소 `/inventory/aws-cicd`는 호환을 위해 유지하지만 내용은 현재 Ubuntu 운영 기준입니다. 방명록과 요청게시판은 별도 기능입니다. 메인 상단은 기술 인벤토리/방명록으로 구성합니다.

## 로컬 실행

PostgreSQL과 DB_URL·DB_USERNAME·DB_PASSWORD 설정이 필요합니다. 실제 비밀번호·JWT 키·`.env.docker`·SSH 개인키는 커밋하지 않습니다.

```powershell
# 비밀값은 본인 로컬 환경/IDE에 설정하고 공유하지 않습니다.
$env:DB_URL = "jdbc:postgresql://localhost:5432/invencore"
$env:DB_USERNAME = "invencore"
# DB_PASSWORD, JWT_SECRET은 로컬 환경에서 별도로 설정
.\backend\gradlew.bat -p backend bootRun
```

기본 external 모드는 Kafka·Redis에 연결합니다. 해당 서버가 없는 개발 환경은 `GW_SYNC_MODE=local`을 명시합니다. local 모드도 DB는 PostgreSQL이며 H2로 대체되지 않습니다. Kafka 클라이언트가 도달 가능한 advertised listener 주소가 필요합니다.

```powershell
cd frontend
npm ci
npm run dev
```

기본 접속은 `http://localhost:5173`이고 `/api`는 백엔드 8080으로 전달됩니다. Docker에서는 Nginx가 같은 경로를 프록시합니다.

## 설정

| 변수 | 용도 |
| --- | --- |
| DB_URL / DB_USERNAME / DB_PASSWORD | PostgreSQL JDBC 연결 |
| JWT_SECRET / JWT_EXPIRATION | JWT 서명과 만료. 실제 키는 환경으로 공급 |
| CORS_ORIGINS | 정확한 Origin 목록. 기존 설정을 지정하면 기본 목록을 대체 |
| GW_SYNC_MODE | 기본 external, 별도 개발 모드 local |
| GW_SYNC_ENABLED | GW·주문 실습 리스너/발행 실행 여부 |
| KAFKA_BOOTSTRAP_SERVERS | Docker 기본 kafka:19092, Java 직접 실행 기본 localhost:9092 |
| REDIS_HOST / REDIS_PORT / REDIS_USERNAME / REDIS_PASSWORD | Redis 연결 |
| INFRA_NETWORK | 기존 Kafka·Redis의 외부 Docker 네트워크 |
| BENCHMARK_ROWS | 기본 30만 행. 같은 데이터의 순차/병렬·인덱스 비교 |
| HOST_CAPACITY_SOCKET | Ubuntu 직접 조회 소켓. compose.monitoring.yml로 연결 |
| FEATURE_SERVER_CAPACITY_ENABLED / SERVER_CAPACITY_MODE | 기본 활성화/host. 기존 SSH 예제는 명시적인 ssh 모드 |
| FILE_UPLOAD_DIR | DB와 별도로 보존할 첨부파일 저장 경로 |

백엔드 재시작 후 PostgreSQL 데이터는 같은 DB/스키마를 계속 사용합니다. Redis/local 소비 체크포인트·JVM 메모리 상태·Kafka 브로커 로그는 서로 다른 저장소입니다. 단순 이미지 롤백은 DB 스키마나 이전 H2 메모리 데이터를 복원하지 않습니다.

## 주요 API

| 경로 | 접근/용도 |
| --- | --- |
| `/api/health` | 공개 상태 조회 |
| `/api/members/register`, `/login`, `/check-username` | 공개 가입·로그인·중복 확인 (공통 접두사 /api/members) |
| `GET/POST /api/guestbook` | 공개 방명록 |
| `/api/requestboards`, `/api/comments` | 공개 샘플 CRUD |
| `/api/benchmarks/**`, `/api/gw-sync/**`, `/api/order-lab/**` | 공개 기술 예제 |
| `POST /api/practice/*/check` | Java TODO 계약 검사 |
| `GET /api/server-capacity/host` | JWT 인증 후 Ubuntu 직접 조회 |

## 테스트·빌드

```powershell
.\backend\gradlew.bat -p backend test bootJar
cd frontend
npm run lint
npm test
npm run build
```

전체 백엔드 테스트는 Docker의 임시 PostgreSQL 18과 Redis, Embedded Kafka를 사용합니다. 운영 DB에 테스트하지 않습니다. 예제 TODO 계약은 선택 검사이므로 미작성 항목은 기본 테스트에서 건너뜁니다.

Python 검사는 `python3 -m unittest discover -s deployment/docker -p 'test_*.py' -v` 및 `deployment/monitoring`에 같은 명령으로 실행합니다. 현재 Windows에 Docker가 없다면 전체 DB 통합 검사는 Docker 가능한 환경 또는 GitHub Actions에서 실행합니다.

## 서버 적용과 문서

- [Ubuntu 서버 설정·CI/CD 통합 가이드](docs/SERVER_CICD.md)
- [PostgreSQL 전환·접속·데이터 보존](docs/POSTGRESQL.md)
- [실제 Kafka·Redis 연동](docs/KAFKA_REDIS_SERVER.md)
- [Ubuntu 직접 자원 조회 설치](deployment/monitoring/README.md)
- [Tailscale HTTPS·CORS·SHA 배포](deployment/docker/HTTPS_FUNNEL.md)
- [Docker 기본 안내](deployment/docker/README.md)
- [현재 서버용 deploy.sh 설치·실행](deployment/docker/DEPLOY_SCRIPT.md)
- [모든 예제 패키지 README·과거 실행 캡처](docs/EXAMPLES.md)
- [Java 실습](docs/INVENTORY_PRACTICE.md) · [Kafka 실습](docs/KAFKA_PRACTICE.md) · [용어](docs/KAFKA_GLOSSARY.md)

Compose는 compose.app.yml + compose.ghcr.yml을 사용하며 모니터링은 compose.monitoring.yml도 함께 적용합니다. 기존 환경변수와 PostgreSQL·Kafka·Redis 볼륨을 유지합니다. 재배포에 `down -v`를 사용하지 않습니다. 예전 H2 컨테이너가 살아 있다면 데이터 보존 여부를 결정하기 전에 중지하지 않습니다.

소스 뷰어는 명시적 허용 목록만 빌드에 포함합니다. 새 외부 소스 파일을 추가할 때 frontend/config/inventorySourcePlugin.js와 frontend/Dockerfile의 COPY를 함께 확인합니다.
