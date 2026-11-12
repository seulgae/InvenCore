// Only explicitly selected implementation files are exposed in the source viewer.
// Configuration, credentials, private keys and environment files are never imported.
const backend = "../../../backend/src/main/java/com/inven/core/backend/";
const source = (path, load) => ({ path, load });
const sources = {
  benchmark: [
    source(
      "frontend/src/pages/benchmark/BenchmarkPage.jsx",
      () => import("../pages/benchmark/BenchmarkPage.jsx?raw"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/benchmark/BenchmarkService.java",
      () =>
        import(
          "virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/benchmark/BenchmarkService.java"
        ),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/benchmark/BenchmarkController.java",
      () =>
        import(
          "virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/benchmark/BenchmarkController.java"
        ),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/benchmark/BenchmarkDataInitializer.java",
      () =>
        import(
          "virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/benchmark/BenchmarkDataInitializer.java"
        ),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/benchmark/BenchmarkResult.java",
      () =>
        import(
          "virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/benchmark/BenchmarkResult.java"
        ),
    ),
  ],
  auth: [
    source(
      "frontend/src/services/authService.jsx",
      () => import("../services/authService.jsx?raw"),
    ),
    source(
      `${backend}api/member/service/MemberService.java`,
      () =>
        import(
          "virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/member/service/MemberService.java"
        ),
    ),
    source(
      `${backend}security/JwtAuthenticationFilter.java`,
      () =>
        import(
          "virtual:inventory-source/backend/src/main/java/com/inven/core/backend/security/JwtAuthenticationFilter.java"
        ),
    ),
    source(
      `${backend}util/JwtUtil.java`,
      () =>
        import(
          "virtual:inventory-source/backend/src/main/java/com/inven/core/backend/util/JwtUtil.java"
        ),
    ),
  ],
  board: [
    source(
      "frontend/src/pages/requestboard/RequestBoardList.jsx",
      () => import("../pages/requestboard/RequestBoardList.jsx?raw"),
    ),
    source(
      `${backend}api/requestboard/controller/RequestBoardController.java`,
      () =>
        import(
          "virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/requestboard/controller/RequestBoardController.java"
        ),
    ),
    source(
      `${backend}api/requestboard/service/impl/RequestBoardServiceImpl.java`,
      () =>
        import(
          "virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/requestboard/service/impl/RequestBoardServiceImpl.java"
        ),
    ),
    source(
      `${backend}api/requestboard/repository/RequestBoardRepository.java`,
      () =>
        import(
          "virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/requestboard/repository/RequestBoardRepository.java"
        ),
    ),
  ],
  comments: [
    source(
      "frontend/src/pages/requestboard/RequestBoardDetail.jsx",
      () => import("../pages/requestboard/RequestBoardDetail.jsx?raw"),
    ),
    source(
      `${backend}api/comment/controller/CommentController.java`,
      () =>
        import(
          "virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/comment/controller/CommentController.java"
        ),
    ),
    source(
      `${backend}api/comment/service/CommentService.java`,
      () =>
        import(
          "virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/comment/service/CommentService.java"
        ),
    ),
    source(
      `${backend}api/comment/entity/Comment.java`,
      () =>
        import(
          "virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/comment/entity/Comment.java"
        ),
    ),
  ],
  files: [
    source(
      "frontend/src/pages/requestboard/RequestBoardRegist.jsx",
      () => import("../pages/requestboard/RequestBoardRegist.jsx?raw"),
    ),
    source(
      `${backend}api/requestboard/controller/RequestBoardController.java`,
      () =>
        import(
          "virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/requestboard/controller/RequestBoardController.java"
        ),
    ),
    source(
      `${backend}api/requestboard/service/impl/RequestBoardServiceImpl.java`,
      () =>
        import(
          "virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/requestboard/service/impl/RequestBoardServiceImpl.java"
        ),
    ),
    source(
      `${backend}api/requestboard/entity/RequestBoard.java`,
      () =>
        import(
          "virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/requestboard/entity/RequestBoard.java"
        ),
    ),
  ],
  capacity: [
    source(
      "frontend/src/pages/servercapacity/ServerCapacityPage.jsx",
      () => import("../pages/servercapacity/ServerCapacityPage.jsx?raw"),
    ),
    source(
      `${backend}api/serverCapacity/controller/ServerCapacityController.java`,
      () =>
        import(
          "virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/serverCapacity/controller/ServerCapacityController.java"
        ),
    ),
    source(
      `${backend}api/serverCapacity/service/impl/ServerCapacityServiceImpl.java`,
      () =>
        import(
          "virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/serverCapacity/service/impl/ServerCapacityServiceImpl.java"
        ),
    ),
    source(
      `${backend}api/serverCapacity/entity/ServerCapacity.java`,
      () =>
        import(
          "virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/serverCapacity/entity/ServerCapacity.java"
        ),
    ),
  ],
};
const step = (layer, name, description) => ({ layer, name, description });
export const inventory = [
  {
    id: "parallel-stream",
    number: "06",
    title: "병렬 스트림 성능 비교",
    subtitle: "SEQUENTIAL / PARALLEL STREAM",
    category: "Performance",
    icon: "∥",
    color: "blue",
    tags: ["parallelStream", "ForkJoinPool", "CPU"],
    endpoint: "POST /api/benchmarks/streams",
    summary:
      "동일한 CPU 연산을 순차·병렬 스트림으로 실행하고 실제 시간을 비교합니다.",
    description:
      "동일한 CPU 연산을 순차·병렬 스트림으로 실행하고 실제 시간을 비교합니다.",
    features: [
      "시작 시 30만 행과 숫자 목록 자동 준비",
      "전용 ForkJoinPool 최대 4개 작업자",
      "2회 워밍업 · 5회 교대 측정 · checksum 검증",
    ],
    caveats: [
      "작업량·CPU·JIT·GC에 따라 병렬 처리도 더 느릴 수 있습니다.",
      "DB 조회나 대기 시간이 없는 CPU 작업 비교이며 JMH 정밀 측정은 아닙니다.",
    ],
    steps: [
      {
        layer: "STARTUP",
        name: "BenchmarkDataInitializer",
        description: "DB 비교 데이터와 숫자 목록 준비",
      },
      {
        layer: "API",
        name: "BenchmarkController",
        description: "실험 종류 확인 · 동시 실행 제어",
      },
      {
        layer: "COMPUTE",
        name: "BenchmarkService.streams",
        description: "stream / parallelStream · 동일한 score 연산",
      },
      {
        layer: "MEASURE",
        name: "BenchmarkService.measure",
        description: "워밍업 · 순서 교대 · nanoTime 측정",
      },
      {
        layer: "VIEW",
        name: "BenchmarkPage",
        description: "중앙값 · 전체 표본 · 실행 이력 표시",
      },
    ],
    tables: ["bench_plain", "bench_indexed"],
    sources: sources.benchmark,
  },
  {
    id: "index-tuning",
    number: "07",
    title: "인덱스 튜닝 성능 비교",
    subtitle: "TABLE SCAN / COMPOSITE INDEX",
    category: "Performance",
    icon: "⌗",
    color: "blue",
    tags: ["H2", "SQL", "EXPLAIN ANALYZE"],
    endpoint: "POST /api/benchmarks/indexes",
    summary:
      "동일 데이터의 두 테이블에서 복합 인덱스 유무에 따른 조회 시간을 비교합니다.",
    description:
      "동일 데이터의 두 테이블에서 복합 인덱스 유무에 따른 조회 시간을 비교합니다.",
    features: [
      "동일 데이터의 인덱스 유무 테이블 자동 준비",
      "복합 인덱스 (account_id, state)",
      "EXPLAIN ANALYZE · scan count · 집계 결과 일치 확인",
    ],
    caveats: [
      "두 테이블 모두 기본키 인덱스가 있고 한쪽에만 추가 복합 인덱스가 있습니다.",
      "H2 메모리 DB의 워밍업 후 결과이며 운영 DB의 디스크 성능을 대표하지 않습니다.",
    ],
    steps: [
      {
        layer: "STARTUP",
        name: "BenchmarkDataInitializer",
        description: "동일 데이터 복제 · 한쪽 복합 인덱스 생성",
      },
      {
        layer: "API",
        name: "BenchmarkController",
        description: "한 번에 하나의 실험만 허용",
      },
      {
        layer: "QUERY",
        name: "BenchmarkService.queryBatch",
        description: "같은 조건으로 8개 집계 쿼리 실행",
      },
      {
        layer: "MEASURE",
        name: "BenchmarkService.indexes",
        description: "실행 계획 수집 · 2회 워밍업 · 5회 측정",
      },
      {
        layer: "VIEW",
        name: "BenchmarkPage",
        description: "비교 시간 · 배율 · 전체 실행 계획 표시",
      },
    ],
    tables: ["bench_plain", "bench_indexed"],
    sources: sources.benchmark,
  },

  {
    id: "capacity",
    number: "01",
    title: "서버용량조사",
    subtitle: "SSH RESOURCE MONITOR",
    category: "Infrastructure",
    icon: ">_",
    color: "amber",
    tags: ["SSH", "Linux", "Spring Boot"],
    endpoint: "POST /api/server-capacity/check",
    route: "/servercapacity",
    summary: "SSH 연결부터 자원 수집, 결과 저장까지.",
    description:
      "Apache SSHD로 Linux 서버에 키 인증을 수행하고 df, free, top의 출력을 파싱합니다. 수집한 서버별 자원 정보는 JPA로 저장합니다.",
    features: [
      "서버별 디스크 · 메모리 · CPU 조회",
      "사용자·서버별 하루 한 번 조사 제한",
      "기존 서버 정보 갱신과 최근 결과 조회",
    ],
    caveats: [
      "기본 설정에서는 비활성화되어 있습니다. 서버 목록, SSH 키, 기능 활성화 설정이 필요합니다.",
      "명령은 Linux 기준이며 CPU 사용률은 top 출력의 us 값을 사용합니다.",
      "서버 연결 정보는 요청 DTO에서 받습니다. 운영 시 서버 측 허용 대상 검증이 필요합니다.",
    ],
    steps: [
      step("CLIENT", "ServerCapacityPage", "서버 선택 및 조사 요청"),
      step("API", "ServerCapacityController", "로그인 사용자와 요청 DTO 전달"),
      step(
        "SERVICE",
        "ServerCapacityServiceImpl",
        "일일 제한 확인 · SSH 명령 실행 · 파싱",
      ),
      step("REMOTE", "Linux / SSH", "df -h / · free -m · top -bn1"),
      step("PERSISTENCE", "JPA Repository", "용량 정보와 조사 시각 저장"),
    ],
    tables: ["ServerCapacity", "ServerCapacityCheckLog"],
    sources: sources.capacity,
  },
  {
    id: "auth",
    number: "02",
    title: "JWT 인증",
    subtitle: "STATELESS AUTHENTICATION",
    category: "Security",
    icon: "◈",
    color: "violet",
    tags: ["JWT", "BCrypt", "Spring Security"],
    endpoint: "POST /api/members/login",
    summary: "회원가입, 암호화, 토큰 발급과 요청 인증.",
    description:
      "회원가입 시 비밀번호를 BCrypt로 해시합니다. 로그인 검증 후 JWT를 발급하고, 브라우저는 sessionStorage의 토큰을 Authorization 헤더로 전송합니다.",
    features: [
      "회원가입 및 아이디 중복 확인",
      "JWT 서명·만료 검증",
      "인증 필터에서 SecurityContext 설정",
    ],
    caveats: [
      "리프레시 토큰은 구현되어 있지 않습니다. 만료되면 다시 로그인합니다.",
      "현재 필터는 모든 인증 사용자에게 ROLE_USER를 부여합니다. DB의 숫자 역할과 별도입니다.",
    ],
    steps: [
      step("CLIENT", "authService / Axios", "아이디·비밀번호 전송, 토큰 보관"),
      step("API", "MemberController", "로그인 및 회원가입 요청 수신"),
      step("SERVICE", "MemberService", "BCrypt 비교 · 회원 조회"),
      step("TOKEN", "JwtUtil", "서명된 JWT 발급·검증"),
      step(
        "FILTER",
        "JwtAuthenticationFilter",
        "Bearer 토큰 → SecurityContext",
      ),
    ],
    tables: ["Member"],
    sources: sources.auth,
  },
  {
    id: "board",
    number: "03",
    title: "요청 게시판",
    subtitle: "SEARCHABLE CRUD",
    category: "Backend",
    icon: "{ }",
    color: "sage",
    tags: ["JPA", "Pagination", "Validation"],
    endpoint: "GET /api/requestboards",
    route: "/requestboard",
    summary: "검색과 페이지네이션을 갖춘 게시글 CRUD.",
    description:
      "컨트롤러는 요청을 DTO로 받고 서비스에 위임합니다. 공용 demo 작성자로 처리하고, Repository에서 제목·내용 검색과 페이지 단위 조회를 처리합니다.",
    features: [
      "제목·내용 검색과 서버 페이지네이션",
      "로그인 없이 작성 · 수정 · 삭제",
      "DTO 검증과 트랜잭션 경계",
    ],
    caveats: [
      "페이지 크기는 최대 50개입니다.",
      "게시글 삭제 시 연결된 댓글을 함께 삭제하는 처리는 아직 없습니다.",
    ],
    steps: [
      step("CLIENT", "RequestBoardList", "검색어 · 페이지 번호 전송"),
      step("API", "RequestBoardController", "DTO 검증 · 공용 demo 작성자"),
      step("SERVICE", "RequestBoardServiceImpl", "공개 데모 비즈니스 로직"),
      step("DATA", "RequestBoardRepository", "제목·내용 검색 · Pageable"),
      step("DATABASE", "RequestBoard", "게시글 저장 및 조회"),
    ],
    tables: ["RequestBoard"],
    sources: sources.board,
  },
  {
    id: "files",
    number: "04",
    title: "파일 첨부",
    subtitle: "MULTIPART FILE HANDLING",
    category: "Backend",
    icon: "↥",
    color: "blue",
    tags: ["Multipart", "UUID", "File I/O"],
    endpoint: "POST /api/requestboards",
    route: "/requestboard/regist",
    summary: "게시글과 파일을 하나의 요청으로 저장.",
    description:
      "FormData에 JSON DTO와 첨부파일을 함께 담아 전송합니다. 서버는 허용 확장자를 확인하고 UUID를 붙인 이름으로 로컬 디렉터리에 저장합니다.",
    features: [
      "최대 5MB 첨부파일",
      "UUID 파일명과 원본 파일명 분리",
      "첨부 교체·삭제 및 다운로드",
    ],
    caveats: [
      "파일은 DB가 아닌 서버 로컬 디렉터리에 저장됩니다.",
      "기존 파일을 먼저 삭제하는 교체 순서로 인해 새 업로드 실패 시 파일이 유실될 수 있습니다.",
    ],
    steps: [
      step("CLIENT", "RequestBoardRegist", "FormData = JSON Blob + File"),
      step("API", "@RequestPart", "DTO와 MultipartFile 분리"),
      step("SERVICE", "File validation", "허용 확장자 확인 · UUID 생성"),
      step("STORAGE", "Local filesystem", "업로드 디렉터리에 파일 저장"),
      step("DATABASE", "RequestBoard", "파일 경로와 원본 이름 저장"),
    ],
    tables: ["RequestBoard.filePath", "RequestBoard.fileName"],
    sources: sources.files,
  },
  {
    id: "comments",
    number: "05",
    title: "댓글과 답글",
    subtitle: "THREADED DISCUSSION",
    category: "Backend",
    icon: "//",
    color: "rose",
    tags: ["Parent ID", "JPA", "Public Demo"],
    endpoint: "GET /api/comments/requestboard/{id}",
    route: "/requestboard",
    summary: "부모 댓글과 답글을 연결하는 데이터 구조.",
    description:
      "requestBoardId와 parentId로 댓글의 소속과 계층을 구분합니다. 부모 댓글을 조회한 뒤 각 부모의 답글을 묶어 DTO로 반환합니다.",
    features: [
      "부모 댓글 및 한 단계 답글 조회",
      "최대 1,000자 입력 검증",
      "공개 수정·삭제와 직계 답글 삭제",
    ],
    caveats: [
      "게시글 및 부모 댓글의 존재·소속 검증은 아직 없습니다.",
      "조회 시 부모 댓글마다 답글 쿼리가 추가됩니다. 다단계 답글 트리는 지원하지 않습니다.",
    ],
    steps: [
      step("CLIENT", "RequestBoardDetail", "게시글 ID 기준 댓글 조회·등록"),
      step("API", "CommentController", "DTO 검증 · 공용 demo 작성자"),
      step("SERVICE", "CommentService", "공개 댓글 처리 · 부모별 답글 구성"),
      step("DATA", "CommentRepository", "게시글·부모 ID 기반 조회"),
      step("DATABASE", "Comment", "requestBoardId / parentId 저장"),
    ],
    tables: ["Comment"],
    sources: sources.comments,
  },
];
export const categories = [
  "All",
  ...new Set(inventory.map((item) => item.category)),
];
export function displayPath(path) {
  return path.replace("../../../backend/", "backend/");
}
