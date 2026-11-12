# InvenCore

기능을 실행하고 구현 코드·클래스·메서드·아키텍처를 함께 살펴보는 개인 기술 인벤토리입니다. React와 Spring Boot로 구성되어 있으며, IntelliJ 스타일의 다크 작업창에서 기능별 카드를 탐색합니다.

## 현재 제공하는 예제

| 카드 | 구현 내용 | 실행 조건 |
| --- | --- | --- |
| 병렬 스트림 성능 비교 | 같은 CPU 연산의 순차·병렬 처리 시간 비교 | 로그인 불필요, 서버 시작 시 데이터 준비 |
| 인덱스 튜닝 성능 비교 | 복합 인덱스 유무에 따른 조회 시간·실행 계획 비교 | 로그인 불필요, H2 실측 |
| 요청 게시판 | 검색·페이지네이션·게시글 작성·수정·삭제 | 로그인 불필요, 공용 작성자 `demo` |
| 파일 첨부 | 게시글과 파일 전송, 확장자 검사, 다운로드·교체·삭제 | 로그인 불필요, 백엔드 필요 |
| 댓글과 답글 | 부모 ID 기반 댓글·답글 조회·등록·수정·삭제 | 로그인 불필요, 백엔드 필요 |
| JWT 인증 | 회원가입, BCrypt 비밀번호 해시, JWT 로그인 | 백엔드 필요 |
| 서버용량조사 | Linux 서버 자원 수집·결과 저장 | 기본 비활성, 별도 설정과 로그인 필요 |

각 카드에 구현 노트, 실행, 소스 코드, 아키텍처, 클래스·메서드·라이브러리 탭이 있습니다. 소스·구조도는 백엔드 없이 확인할 수 있습니다. Redis와 Kafka는 의존성만 준비되어 있고 기능은 아직 구현하지 않았습니다. MyBatis는 추가되어 있지 않습니다.

## 기술 구성

- 백엔드: Java 17, Spring Boot 4.0.1, Gradle Wrapper, Spring MVC, JPA, Spring Security, Validation, JJWT, Apache SSHD
- 프론트엔드: React 19, React Router 7, Axios, Vite 7, ESLint
- DB: H2 메모리 DB. 별도 DB 설치가 필요하지 않습니다.
- 의존성 준비: Spring Data Redis, Spring for Apache Kafka

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
    api/                       benchmark, member, requestboard, comment, serverCapacity
    config/                    SecurityConfig, GlobalExceptionHandler
    security/                  JWT 인증 필터
    util/                      JWT 생성·검증
  src/main/resources/          현재 실행 설정
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

기본 DB는 H2이며 JPA가 테이블을 관리합니다. 로컬 개발용 JWT 기본값이 있으므로 외부에 공개하는 환경에서는 `JWT_SECRET`을 별도로 지정합니다. 파일과 전체 multipart 요청에는 각각 5MB 한도가 적용됩니다.

### 성능 비교 실험

서버 시작 시 `bench_plain`, `bench_indexed`에 동일한 결정적 데이터를 기본 30만 행씩 생성합니다. 두 테이블 모두 기본키가 있으며, 후자에만 `(account_id, state)` 복합 인덱스를 추가합니다. 실험 데이터는 게시판 데이터와 분리되어 있고 H2 종료 시 초기화됩니다.

병렬 비교는 같은 숫자 목록을 숫자당 64회 변환해 합산하며, 최대 4개 작업자의 전용 `ForkJoinPool`에서 `parallelStream()`을 실행합니다. 인덱스 비교는 같은 조건의 집계 쿼리 8개를 한 묶음으로 측정하며 `EXPLAIN ANALYZE`도 제공합니다. JDBC로 조회하고 JPA Repository는 사용하지 않습니다.

측정은 카드의 실행 버튼을 눌러 시작합니다. 결과 검증 후 워밍업 2회와 본 측정 5회를 실행하고, 두 방식의 순서를 교대합니다. 중앙값·최소/최대·전체 측정값·속도 비율·시간 변화율·checksum을 표시하며 화면 내 최근 8회 결과를 보관합니다. 서버 전체에서 한 실험만 동시에 실행할 수 있습니다.

수치는 현재 서버의 실측이며 개선을 보장하지 않습니다. CPU·JIT·GC·캐시에 영향을 받는 학습용 비교로, H2 메모리 DB 결과를 운영 DB 성능으로 해석하지 않습니다. 시간에 데이터 생성·실행 계획 확인·HTTP 왕복은 포함하지 않으며, 인덱스 실험에는 연결 획득과 JDBC 조회·집계가 포함됩니다.

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
npm run build
```

백엔드 테스트는 별도 H2 메모리 DB를 사용하며 실제 SSH 서버에 접속하지 않습니다. 프론트 빌드 결과는 `frontend/dist/`, 백엔드 실행 JAR은 `backend/build/libs/`에 생성됩니다.

## 카드 추가·수정

`frontend/src/data/inventory.js`에 카드와 소스 연결을 등록하고 `FeatureDemo.jsx`에 실행 화면을 연결합니다. 백엔드 소스를 공개하려면 `frontend/config/inventorySourcePlugin.js` 허용 목록에도 정확한 경로를 추가합니다. 런타임 설정·개인키·환경 파일은 공개하지 않습니다. `build.gradle`은 기능별 의존성 표시를 위해 명시적으로 허용되어 있습니다.

프론트엔드 화면 구성과 링크 규칙은 [frontend/README.md](frontend/README.md)를 참고하세요.
