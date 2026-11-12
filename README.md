# InvenCore

기능을 실행하고 구현 코드·클래스·메서드·아키텍처를 함께 살펴보는 개인 기술 인벤토리입니다. React와 Spring Boot로 구성되어 있으며, IntelliJ 스타일의 다크 작업창에서 기능별 카드를 탐색합니다.

## 현재 제공하는 예제

| 카드 | 구현 내용 | 실행 조건 |
| --- | --- | --- |
| 택배 공장 · Kafka 미니게임 | 움직이는 작업 카드와 다음 행동 버튼으로 순서·보관·중복 방어 체험 | 기본 로컬 모형, external에서 실제 Kafka 사용 |
| GW 데이터 연동 | JPA 원본 → 이벤트 → JPA 대상 → 형상 캐시 | 로그인 불필요, 기본 로컬 모드. 외부 모드 선택 가능 |
| 병렬 스트림 성능 비교 | 같은 CPU 연산의 순차·병렬 처리 시간 비교 | 로그인 불필요, 서버 시작 시 데이터 준비 |
| 인덱스 튜닝 성능 비교 | 복합 인덱스 유무에 따른 조회 시간·실행 계획 비교 | 로그인 불필요, H2 실측 |
| 요청 게시판 | 검색·페이지네이션·게시글 작성·수정·삭제 | 로그인 불필요, 공용 작성자 `demo` |
| 파일 첨부 | 게시글과 파일 전송, 확장자 검사, 다운로드·교체·삭제 | 로그인 불필요, 백엔드 필요 |
| 댓글과 답글 | 부모 ID 기반 댓글·답글 조회·등록·수정·삭제 | 로그인 불필요, 백엔드 필요 |
| JWT 인증 | 회원가입, BCrypt 비밀번호 해시, JWT 로그인 | 백엔드 필요 |
| 서버용량조사 | Linux 서버 자원 수집·결과 저장 | 기본 비활성, 별도 설정과 로그인 필요 |
| AWS CI/CD 배포 가이드 | 기존 배포 이력·명령어·설정·배포 자동화·복구 참고 자료 | AWS 미연결, 템플릿 비활성 |

각 카드에 구현 노트, 실행, 소스 코드, 아키텍처, 클래스·메서드·라이브러리 탭이 있습니다. 소스·구조도는 백엔드 없이 확인할 수 있습니다. GW 예제는 기본 로컬 모드의 내부 이벤트·메모리 캐시와 외부 모드의 Kafka·Redis를 제공합니다. 성능 실험은 MyBatis Mapper XML을 사용하며, 기존 게시판·인증과 GW 예제는 JPA를 사용합니다.

## 기술 구성

기능 예제 9개 카드의 **실행 · 구현 실습**에서 Java TODO 과제와 검사 버튼을 제공합니다. 기존 완성 예제와 독립된 샘플로 연습하며, 인덱스 과제는 별도 H2 DB를 사용하고 SSH 과제는 서버 접속 없이 응답만 파싱합니다. Kafka 과제는 작성한 코드로 게임도 실행할 수 있습니다. [전체 9개 카드 실습 안내](docs/INVENTORY_PRACTICE.md)에 파일 경로, 과제별 계약, 개별/전체 테스트 명령을 정리했습니다. 과제 테스트는 선택 실행이며 TODO 작성 전에는 실패하는 것이 정상입니다.

10번째 **AWS CI/CD 배포 가이드** 카드는 미래 배포를 위한 참고 자료입니다. [전체 AWS 가이드](docs/AWS_CICD.md)와 [비활성 템플릿](deployment/README.md)에 기존 SSH 배포 이력, EC2·IAM·OIDC·S3·SSM 설정, 테스트·빌드·systemd·Nginx·상태 확인·롤백을 정리했습니다. 실제 AWS 배포를 수행하지 않았으며, 기존 workflow는 비활성 상태로 유지합니다.

- 백엔드: Java 17, Spring Boot 4.0.1, Gradle Wrapper, Spring MVC, JPA, MyBatis, Spring Security, Validation, JJWT, Apache SSHD
- 프론트엔드: React 19, React Router 7, Axios, Vite 7, ESLint
- DB: H2 메모리 DB. 별도 DB 설치가 필요하지 않습니다.
- 데이터 연동: Spring Data Redis, Spring for Apache Kafka

H2는 프로세스를 종료하면 계정·게시글·조사 결과가 초기화됩니다. 첨부파일은 DB와 별도로 백엔드 실행 디렉터리의 `uploads/`에 저장됩니다. 기존 외부 DB 드라이버와 접속 설정은 사용하지 않습니다.

## 로컬 실행

JDK 17과 Node.js 22.12 이상, npm이 필요합니다. 저장소 루트에서 아래 명령을 실행합니다.

### 백엔드

```powershell
.\backend\gradlew.bat -p backend bootRun
```

macOS/Linux에서는 `./backend/gradlew -p backend bootRun`을 사용합니다.

- API: `http://localhost:8080/api`
- 상태 확인: `GET /api/health`

### 프론트엔드

별도 터미널에서 실행합니다.

```powershell
cd frontend
npm ci
npm run dev
```

터미널에 표시된 주소로 접속합니다. 기본 포트는 5173이며 사용 중이면 다음 빈 포트를 선택합니다. `/api` 요청은 Vite가 `http://localhost:8080`으로 전달합니다. 사용하지 않는 프론트엔드 API 주소 환경 파일은 두지 않습니다.

## 프로젝트 구조

```text
backend/
  src/main/java/com/inven/core/backend/
    api/                       orderlab, gwsync, benchmark, member, requestboard, comment, serverCapacity
    config/                    SecurityConfig, GlobalExceptionHandler
    security/                  JWT 인증 필터
    util/                      JWT 생성·검증
  src/main/resources/          현재 실행 설정·MyBatis Mapper XML
  src/test/                    시작 확인·비로그인 CRUD·인증 회귀 테스트
frontend/
  config/                      공개 소스 허용 목록과 Vite 플러그인
  src/api/                     공용 Axios 클라이언트
  src/components/inventory/    코드·메서드·구조도·실행 패널
  src/data/                    카드 메타데이터와 메서드 설명
  src/pages/                   IDE 레이아웃·인벤토리·실행 화면
  src/styles/                  화면 스타일과 공통 다크 테마
```

기능별로 Controller → Service → Repository를 구분합니다. 카드 설명과 메서드 노트는 `frontend/src/data/`에서 관리하며, 소스·클래스·메서드 본문과 의존성 선언은 실제 프로젝트 파일에서 읽습니다. 배포 빌드에는 빌드 시점의 내용이 포함됩니다.

## 주요 API

| 경로 | 용도 |
| --- | --- |
| `GET /api/health` | 백엔드 상태 |
| `POST /api/order-lab/runs` | 주문 수(1~6)·파티션 전략(KEYED/SPREAD)으로 4단계 이벤트 생성 |
| `GET /api/order-lab/runs/{id}` | 실행별 발행 확인·처리 기록·그룹별 최종 상태 |
| `GET /api/order-lab/state` | 모드·토픽·두 그룹의 파티션 오프셋·lag |
| `GET /api/order-lab/practice` | 현재 JVM의 Java TODO 기본 계약 검사 결과 |
| `POST /api/order-lab/groups/{group}/{action}` | PROCESSING/AUDIT 그룹의 pause/resume/restart/replay |
| `POST /api/order-lab/groups/{group}/replay/{runId}` | 게임 주문이 발행된 파티션의 해당 실행 시작 오프셋으로 seek |
| `GET /api/gw-sync/status` | GW 기능 활성 설정·토픽·캐시 TTL |
| `GET`, `POST /api/gw-sync/items` | 최근 원본 20개·원본 생성 |
| `GET /api/gw-sync/items/{id}` | 원본 DB·대상 DB·Redis 형상과 연동 상태 |
| `PUT`, `DELETE /api/gw-sync/items/{id}` | 원본 수정·논리 삭제 이벤트 준비 |
| `GET /api/benchmarks` | 성능 실험 데이터·실행 환경 상태 |
| `POST /api/benchmarks/streams` | 순차·병렬 스트림 시간 측정 |
| `POST /api/benchmarks/indexes` | 복합 인덱스 유무 비교·실행 계획 |
| `POST /api/members/register`, `POST /api/members/login` | 인증 예제 |
| `GET /api/members/check-username` | 아이디 중복 확인 |
| `GET`, `POST /api/requestboards` | 게시글 목록·등록 |
| `GET`, `PUT`, `DELETE /api/requestboards/{id}` | 게시글 상세·수정·삭제 |
| `GET /api/requestboards/download/{id}` | 첨부 다운로드 |
| `GET /api/comments/requestboard/{id}` | 댓글·답글 조회 |
| `POST /api/comments`, `PUT`, `DELETE /api/comments/{id}` | 댓글·답글 변경 |
| `GET /api/server-capacity`, `GET /api/server-capacity/servers`, `POST /api/server-capacity/check` | 선택적 서버용량조사 |

게시판 API는 공용 샘플 데이터를 변경합니다. 게시판 요청에는 JWT를 전송하지 않으며, JWT 예제와 서버용량조사의 인증은 별도로 유지됩니다.

## 실행 설정

백엔드의 `application.yml`을 기준으로 동작합니다.

| 환경 변수 | 용도 |
| --- | --- |
| `JWT_SECRET`, `JWT_EXPIRATION` | JWT 서명 키·유효기간. 기본 30분 |
| `FILE_UPLOAD_DIR` | 첨부파일 저장 위치 |
| `CORS_ORIGINS` | 허용할 브라우저 Origin을 쉼표로 구분 |
| `JPA_SHOW_SQL`, `LOG_LEVEL` | SQL 출력·애플리케이션 로그 |
| `BENCHMARK_ROWS` | 성능 실험의 테이블별 행 수. 기본 300,000, 허용 범위 1,000~1,000,000 |
| `GW_SYNC_ENABLED` | GW 연동 활성화. 기본 true |
| `GW_SYNC_MODE` | local(기본): 내부 이벤트·메모리 캐시 / external: Kafka·Redis |
| `KAFKA_BOOTSTRAP_SERVERS` | Kafka 주소. 기본 localhost:9092 |
| `REDIS_HOST`, `REDIS_PORT` | Redis 주소. 기본 localhost:6379 |

기본 DB는 H2이며 JPA가 테이블을 관리합니다. 로컬 개발용 JWT 기본값이 있으므로 외부에 공개하는 환경에서는 `JWT_SECRET`을 별도로 지정합니다. 파일과 전체 multipart 요청에는 각각 5MB 한도가 적용됩니다.

### 성능 비교 실험

서버 시작 시 `bench_plain`, `bench_indexed`에 동일한 결정적 데이터를 기본 30만 행씩 생성합니다. 두 테이블 모두 기본키가 있으며, 후자에만 `(account_id, state)` 복합 인덱스를 추가합니다. 실험 데이터는 게시판 데이터와 분리되어 있고 H2 종료 시 초기화됩니다.

병렬 비교는 같은 숫자 목록을 숫자당 64회 변환해 합산하며, 최대 4개 작업자의 전용 `ForkJoinPool`에서 `parallelStream()`을 실행합니다. 인덱스 비교는 같은 조건의 집계 쿼리 8개를 한 묶음으로 측정하며 `EXPLAIN ANALYZE`도 제공합니다. Service → MyBatis Mapper → Mapper XML 구조로 조회합니다. XML은 backend/src/main/resources/mappers/benchmark/BenchmarkMapper.xml에 있으며 @Mapper 인터페이스를 자동 등록합니다. JPA와 같은 H2 DataSource를 공유합니다. MyBatis 2차 캐시는 비활성화하고 1차 캐시는 STATEMENT 범위로 제한해 반복 측정마다 실제 SQL을 실행합니다.

측정은 카드의 실행 버튼을 눌러 시작합니다. 결과 검증 후 워밍업 2회와 본 측정 5회를 실행하고, 두 방식의 순서를 교대합니다. 중앙값·최소/최대·전체 측정값·속도 비율·시간 변화율·checksum을 표시하며 화면 내 최근 8회 결과를 보관합니다. 서버 전체에서 한 실험만 동시에 실행할 수 있습니다.

측정 응답인 `Status`, `Measurement`, `Comparison`은 불변 record로 정의하며, Lombok `@Builder`로 생성합니다. 서비스에서는 `builder()`의 필드별 메서드를 통해 환경·개별 측정값·최종 비교 결과를 조립합니다.

수치는 현재 서버의 실측이며 개선을 보장하지 않습니다. CPU·JIT·GC·캐시에 영향을 받는 학습용 비교로, H2 메모리 DB 결과를 운영 DB 성능으로 해석하지 않습니다. 시간에 데이터 생성·실행 계획 확인·HTTP 왕복은 포함하지 않으며, 인덱스 실험에는 연결 획득과 MyBatis Mapper 호출·SQL 실행·집계가 포함됩니다.

### GW 연동: 로컬 데모와 외부 서비스 모드

기본값은 `GW_SYNC_ENABLED=true`, `GW_SYNC_MODE=local`입니다. 백엔드와 프론트엔드를 실행하고 **GW 데이터 연동 → 실행**을 열면 됩니다. Docker·Kafka·Redis 설치 없이 원본 생성·수정·삭제와 두 DB·캐시 형상을 확인할 수 있습니다.

| 구분 | local (기본) | external |
| --- | --- | --- |
| 이벤트 전달 | Spring 내부 이벤트 | Kafka JSON 메시지, ID key |
| 형상 캐시 | ConcurrentHashMap의 JSON 스냅샷 | Redis hash의 JSON 스냅샷 |
| 캐시 버전 제어 | 원자적 compute | Lua 원자적 비교 |
| TTL | 기본 60초 | 기본 60초 |
| 실패 처리 | 원본 발행 대기를 다음 주기에 재시도 | 발행 재시도, 수신 재시도 후 DLT |
| 외부 서비스 | 없음 | Kafka·Redis 필요 |

로컬 모드는 실제 Kafka·Redis를 실행하거나 흉내 낸 서버를 띄우지 않습니다. 브로커·파티션·오프셋·DLT 기능은 외부 모드에만 있습니다. 화면과 상태 API에 모드·전달 방식·캐시 종류를 명시합니다. 환경 변수를 변경하면 백엔드를 재시작해야 합니다. 기능 전체를 끄려면 `GW_SYNC_ENABLED=false`를 사용합니다.

두 모드 모두 `gw_source`와 `gw_target` JPA 테이블, 변경 이벤트와 대상 반영 서비스를 공유합니다. 원본과 `revision`, `publishedRevision`을 같은 트랜잭션으로 저장합니다. 스케줄러가 1초마다 최대 20개 대기 원본을 조회해 전달하고 성공한 버전만 발행 확인합니다. 대상은 원본 행 잠금과 revision 비교로 중복·역순 이벤트를 방어합니다. 빠른 연속 변경은 최신 형상으로 합쳐질 수 있어 모든 중간 변경 이력을 보관하지는 않습니다.

대상 DB 커밋 이후 모드별 캐시가 JSON 형상을 저장합니다. 로컬 캐시는 만료된 항목을 쓰기·조회 시 정리하며, cache miss는 DB 형상으로 다시 채웁니다. 삭제는 양쪽 테이블과 캐시에 삭제 표시와 버전을 남겨 오래된 이벤트로 되살아나는 것을 방지합니다.

| 담당 | 클래스 |
| --- | --- |
| 공통 원본·대상 처리 | GwSourceService, GwProjectionService, GwQueryService |
| 로컬 이벤트 전달 | GwLocalEventPublisher, GwLocalEventListener |
| 로컬 형상 캐시 | GwLocalSnapshotCache |
| 외부 Kafka 발행·수신 | GwEventPublisher, GwEventListener, GwKafkaConfig |
| 외부 Redis 캐시 | GwSnapshotCache |
| 캐시 공통 계약 | GwCacheStore |

화면은 원본 DB·대상 DB·캐시 형상을 2.5초마다 비교합니다. 형상 비교를 위해 두 DB도 직접 조회하며 캐시를 통한 DB 조회 생략을 주장하지 않습니다. `LOCAL_HIT`, `LOCAL_MISS_FILLED`, `LOCAL_EMPTY`는 메모리 캐시 상태이며 Redis 연결 성공을 의미하지 않습니다.

형상은 컬럼별 입력칸으로 표시합니다. 원본의 `name`, `description`을 직접 입력·수정하고 저장하면 대상과 캐시에 전달됩니다. ID·revision·발행 확인 버전·삭제 표시·처리 시각은 자동 관리하며, 대상·캐시 컬럼은 읽기 전용입니다. JSON 원문은 각 형상에서 펼쳐 확인할 수 있습니다. 자동 조회 중에도 원본에 입력 중인 값은 유지됩니다.

외부 모드는 Docker Compose를 사용할 수 있는 환경에서 다음과 같이 실행합니다. Compose의 Kafka(KRaft)와 Redis 포트는 루프백 주소에만 공개합니다.

```powershell
docker compose up -d
$env:GW_SYNC_MODE='external'
$env:GW_SYNC_ENABLED='true'
.\backend\gradlew.bat -p backend bootRun
```

IntelliJ에서는 실행 구성 환경 변수에 `GW_SYNC_MODE=external`을 지정합니다. 외부 모드에서만 Kafka 토픽을 생성하고 리스너를 시작합니다. 원본 ID를 Kafka key로 사용하며 broker ack 후 발행 버전을 갱신합니다. 수신 실패는 최초 시도 후 1초 간격 2회 재시도하고 `invencore.gw.changed.v1.DLT`로 격리합니다. DLT 자동 재처리는 구현하지 않았습니다. 발행 완료 확인 전에 중단되면 중복 전송될 수 있으므로 정확히 한 번 전달을 보장하지 않습니다.

Redis key는 `invencore:gw:target:{id}`이며 `revision`, `snapshot`을 보관합니다. 장애 시 `UNAVAILABLE_DB_FALLBACK`과 DB 형상을 반환합니다. DB와 Redis는 하나의 트랜잭션이 아니므로 캐시 갱신 실패 시 기존 값은 TTL까지 뒤처질 수 있습니다. 설정 활성 표시는 외부 연결 성공을 의미하지 않습니다.

두 테이블은 같은 H2 메모리 DB 안에 있습니다. 서버 재시작 시 DB·발행 대기·로컬 캐시는 사라집니다. 외부 모드는 원본이 없는 과거 Kafka 이벤트를 무시합니다. 운영용 영속 DB·별도 대상 서비스·전체 이벤트 이력은 이 예제 범위에 포함하지 않습니다. Compose에도 영속 볼륨을 구성하지 않았습니다.

### 택배 공장 · Kafka 미니게임

Java를 직접 구현하는 과제는 [학습 가이드](docs/KAFKA_PRACTICE.md)에 있습니다. `UserKafkaCode.java`의 파티션 선택·다음 오프셋·업무 버전 방어 TODO를 작성하고 `-PorderLabPractice` 학습 테스트를 실행한 뒤, 화면 검사 후 LEARNER 모드로 플레이합니다. 일반 REFERENCE 모드는 TODO와 분리됩니다. [Kafka 용어 사전](docs/KAFKA_GLOSSARY.md)은 20개 용어를 게임 요소·의미·주의점으로 정리합니다.

첫 화면은 설치 없이 브라우저에서 플레이하는 택배 공장 미니게임입니다. 레일·작업자·검수원·트럭으로 상태를 표현하고, 세 미션을 제공합니다. 같은 택배를 같은 레일에 보내기, 작업자를 쉬게 한 동안 카드를 보관했다가 이어 처리하기, 완료 기록을 되감아도 중복 발송을 막기입니다. 별과 완료 판정은 현재 실행의 JPA 처리 기록·발송 상태·재처리 무시 결과에 연결됩니다. 애니메이션은 처리 기록의 시각화이며 실행 시간을 측정하지 않습니다. 게임 진행 별은 현재 화면에서만 유지됩니다.

`게임 뒤의 기술 보기`를 펼치면 기존 파티션·오프셋·소비 그룹·처리 기록과 직접 제어 화면을 확인할 수 있습니다. 기본 연습 모드가 실제 Kafka라는 뜻은 아니며 게임에도 모드를 표시합니다.

게임의 되감기는 현재 주문의 파티션별 시작 오프셋으로 이동해 이전 실습 기록을 전부 다시 읽는 대기를 줄입니다. 해당 파티션의 그 위치 이후 이벤트도 함께 읽으며, 다른 파티션의 위치는 바꾸지 않습니다. 기술 상세의 전체 토픽 시작부터 재처리 버튼은 별도로 유지합니다.

카드의 실행 탭(`/inventory/kafka-lab?tab=demo`)에서 `CREATED → PAID → PACKED → SHIPPED` 주문 이벤트를 생성합니다. 기존 GW 연동은 최신 상태를 합칠 수 있지만, 주문 실습은 각 단계 이벤트를 별도 JPA 행으로 저장해 순서와 재처리를 관찰합니다. `order_lab_event`, `order_lab_delivery`, `order_lab_projection`을 사용하며 기존 GW 테이블·토픽을 제어하지 않습니다.

1. **순서 범위:** KEYED로 3개 주문을 생성해 주문별 같은 파티션과 증가하는 offset을 확인합니다. SPREAD는 같은 주문의 단계들을 서로 다른 파티션에 발행합니다. 분산 시 업무 순서 누락을 관측할 수 있지만 실행마다 역순을 보장하는 실험은 아닙니다.
2. **독립 소비와 backlog:** 주문 처리 그룹을 일시정지하고 완료 상태를 기다린 뒤 새 실습을 생성합니다. 감사 그룹의 처리는 계속되고 주문 처리 그룹의 lag가 쌓입니다. 재개하면 backlog를 처리합니다.
3. **재시작:** 같은 그룹 ID로 소비자를 재시작합니다. 마지막 커밋 위치부터 이어 읽습니다. 브로커 장애나 프로세스 강제 종료를 흉내 내는 버튼은 아닙니다.
4. **재처리와 멱등성:** 처리가 끝난 그룹을 일시정지 → 처음부터 재처리 → 재개합니다. 시작 오프셋부터 다시 읽어 처리 기록은 늘어나지만 업무 sequence 비교로 과거·중복 상태를 무시합니다. 명령은 실습 토픽 전체 기준이므로 이전 실행도 다시 읽을 수 있습니다.

`GW_SYNC_MODE=local`은 실제 Kafka가 아닌 학습용 모형입니다. 메모리 체크포인트와 DB 이벤트 로그를 사용하고 파티션을 2→1→0 순서로 읽어 파티션 간 전역 순서가 없다는 원리를 보여줍니다. Kafka 처리량·실제 소비 순서·브로커 오프셋으로 해석하지 않습니다.

`GW_SYNC_MODE=external`은 전용 `invencore.order.lab.v1` 토픽의 3개 파티션과 두 소비 그룹(각 concurrency=3)을 사용합니다. KEYED는 고정 3개 파티션에서 Kafka 기본 키 해시와 같은 Murmur2로 계산한 파티션을 명시하고, SPREAD는 단계별로 파티션을 바꿉니다. 이벤트는 생성 순으로 전송하고 broker ack의 partition/offset을 저장합니다. 수신 기록에는 실제 partition·offset·소비 작업자 이름을 기록합니다.

실제 끝·시작·커밋 오프셋은 Kafka Admin API로 조회합니다. 커밋 오프셋은 마지막 처리 번호가 아니라 **다음에 읽을 위치**입니다. lag는 토픽 전체의 끝−커밋으로 표시하며, 아직 커밋이 없으면 시작 오프셋을 기준으로 계산합니다. 화면은 2초마다 상태를 갱신하고 실행별 최근 처리 기록 240개를 표시합니다.

Kafka는 파티션 안의 로그 순서를 제공하며 파티션 사이의 전체 순서를 제공하지 않습니다. 동일 키라도 생산자가 잘못된 업무 순서로 발행하면 이를 자동으로 복원하지 않습니다. 주문 리스너는 MANUAL_IMMEDIATE로 JPA 반영 후 수동 커밋합니다. REFERENCE는 acknowledge, LEARNER는 작성한 다음 offset으로 commitSync를 사용합니다. DB 반영과 커밋은 단일 트랜잭션이 아니므로 재전달이 가능하며 업무 버전 비교로 방어합니다. [Kafka 설계 문서](https://kafka.apache.org/41/design/design/), [KafkaConsumer 오프셋 설명](https://kafka.apache.org/41/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html), [Spring Kafka seek](https://docs.spring.io/spring-kafka/reference/4.0/kafka/seek.html)를 참고하세요.

실제 브로커 복제 장애·성능 벤치마크·Kafka Streams는 구현 범위에 포함하지 않습니다. H2와 로컬 모형은 서버 재시작 시 초기화됩니다. 외부 모드는 원본 주문이 없는 이전 Kafka 이벤트를 무시합니다.

### 선택적 서버용량조사

실제 서버 주소·계정·개인키는 저장소에 포함하지 않습니다. 기존 접속 정보와 키, 과거 배포 예시는 제거했습니다. 기능을 사용하는 경우에만 다음 값을 외부에서 지정합니다.

- `FEATURE_SERVER_CAPACITY_ENABLED=true`
- `SSH_PEM_FILE`: 실행 머신에서 읽을 수 있는 외부 개인키 파일 경로
- `MONITORED_SERVERS`: `서버번호,타입,호스트,포트,사용자` 형식. 여러 서버는 세미콜론으로 구분

키는 애플리케이션에 패키징하거나 임시 파일로 복사하지 않고 지정한 외부 파일에서 읽습니다. 대상은 Linux이며 `df`, `free`, `top` 명령을 사용합니다. 로그인 사용자·서버별 하루 한 번 조사할 수 있습니다. 기본 실행에는 키나 원격 서버가 필요하지 않습니다.

## 빌드와 검사

```powershell
.\backend\gradlew.bat -p backend build
cd frontend
npm run lint
npm test
npm run build
```

백엔드 테스트는 별도 H2 메모리 DB를 사용하며 실제 SSH 서버에 접속하지 않습니다. 프론트 빌드 결과는 `frontend/dist/`, 백엔드 실행 JAR은 `backend/build/libs/`에 생성됩니다.

GW 로컬 통합 테스트는 외부 연결 없이 생성·수정·삭제와 형상 캐시 반영을 확인하고, 캐시 단위 테스트는 TTL 만료·버전 역행 방지를 검증합니다. 외부 모드 통합 테스트는 임베디드 Kafka 브로커로 원본→대상 생성·수정·삭제, 중복·역순 방어와 DLT를 검증합니다. Redis 연결은 모킹하며 JSON 역직렬화·장애 시 DB 대체를 검사합니다. 실제 Redis 서버와 Compose 통합 실행은 별도로 검증해야 합니다.

## 카드 추가·수정

주문 실험실 테스트는 로컬 모형의 파티션 분산·lag·재처리와 실제 임베디드 Kafka의 동일 키 순서·증가하는 파티션 오프셋·독립 그룹·커밋 기반 재시작·seek 재처리를 검증합니다. 실제 외부 Docker 브로커를 실행한 테스트는 아닙니다.

`frontend/src/data/inventory.js`에 카드와 소스 연결을 등록하고 `FeatureDemo.jsx`에 실행 화면을 연결합니다. 백엔드 소스를 공개하려면 `frontend/config/inventorySourcePlugin.js` 허용 목록에도 정확한 경로를 추가합니다. 런타임 설정·개인키·환경 파일은 공개하지 않습니다. `build.gradle`은 기능별 의존성 표시를 위해 명시적으로 허용되어 있습니다.

프론트엔드 화면 구성과 링크 규칙은 [frontend/README.md](frontend/README.md)를 참고하세요.

## 소스 작성 기준

Java는 공백 4칸, React·JavaScript는 공백 2칸을 사용하며 `.editorconfig`에 기준을 기록했습니다. 메서드 사이를 빈 줄로 구분하고 애너테이션·조건문·반복문·긴 인자 목록을 여러 줄로 정리합니다. 메서드 위에는 역할을 설명하고, 트랜잭션·오프셋·캐시 버전 방어 등은 필요한 처리 이유를 덧붙입니다. 실습 TODO는 구현하지 않은 상태를 유지합니다.

인벤토리의 메서드 설명은 해당 소스의 Javadoc을 우선 읽으며, 주석이 없는 항목은 기존 메서드 노트를 사용합니다. `frontend`의 `npm test`는 여러 줄 Mapper 선언, 파라미터 애너테이션, 파일별 설명 구분을 검사합니다.
