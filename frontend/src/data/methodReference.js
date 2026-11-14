export const methodNotes = {
  getHostCapacity: [
    "Ubuntu 전체 자원 조회",
    "인증된 요청 → Ubuntu 소켓 직접 질의 → 현재 측정 수치 검증 → 캐시 없이 응답",
  ],
  selectPartition: [
    "직접 구현하는 파티션 선택",
    "TODO 1: KEYED의 동일 주문 고정·다른 주문 분산, SPREAD의 단계별 순환 분배를 작성합니다. LEARNER 이벤트의 실제 목적지에 적용됩니다.",
  ],
  nextOffset: [
    "직접 구현하는 다음 위치",
    "TODO 2: 처리한 offset 다음 위치를 계산합니다. LEARNER의 로컬 체크포인트와 실제 Kafka commitSync에 전달합니다.",
  ],
  shouldApply: [
    "직접 구현하는 업무 버전 방어",
    "TODO 3: 새 업무 버전만 반영하고 같은 버전·과거 버전은 거부합니다. offset이 아니라 업무 sequence를 비교합니다.",
  ],
  inspectCode: [
    "학습 코드 기본 계약 검사",
    "미구현 예외·반환 범위를 확인하고 세 과제의 샘플 입력 결과를 반환합니다. 전체 정답 증명이 아닌 빠른 준비 검사입니다.",
  ],
  replayOffsets: [
    "미션 시작 위치 선택",
    "실행의 발행 완료 이벤트에서 파티션별 최소 offset을 구함 → 해당 파티션 콜백에 seek 요청. 이전 실행 전체를 되감지 않습니다.",
  ],
  replayFrom: [
    "현재 주문 위치로 되감기",
    "소비 그룹의 실제 일시정지 확인 → 해당 주문이 있는 파티션만 시작 offset으로 이동 → 재개 시 그 위치부터 읽음",
  ],
  publishOrders: [
    "단계별 이벤트 발행",
    "미발행 주문 이벤트를 생성 순으로 조회 → 모드별 전송 → partition·offset 저장. 실패 시 다음 주기 재시도",
  ],
  consumeLocalOrders: [
    "로컬 소비 모형",
    "일시정지하지 않은 그룹별로 DB 로그를 파티션 2→1→0 순서로 읽음 → 대상 반영 → 메모리 체크포인트 갱신. 실제 Kafka 측정은 아닙니다.",
  ],
  acceptOrder: [
    "Kafka 주문 이벤트 수신",
    "JSON 매핑·키 검증 → 모드별 다음 offset 계산 → 공통 JPA 반영 → REFERENCE는 acknowledge, LEARNER는 계산한 위치로 commitSync. 주문 전용 MANUAL_IMMEDIATE 설정 사용",
  ],
  replayBeginning: [
    "파티션 시작으로 seek",
    "해당 소비 그룹에 할당된 파티션의 시작 오프셋으로 seek 요청. 다른 그룹의 위치는 바꾸지 않습니다.",
  ],
  control: [
    "소비 그룹 제어",
    "실습 전용 그룹만 일시정지·재개·같은 그룹으로 재시작·처음부터 재처리. 재처리는 실제 일시정지 확인 후 허용",
  ],
  keyPartition: [
    "키별 파티션 선택",
    "Kafka 기본 키 해시와 같은 Murmur2로 고정 3개 파티션 중 하나를 선택. 실험 재현을 위해 발행 시 파티션을 명시",
  ],
  consume: [
    "주문 상태 반영과 관측",
    "주문의 첫 이벤트 행 잠금 → 그룹별 projection 조회 → 업무 버전·누락 비교 → 상태와 처리 기록 저장. Kafka 커밋은 별도 단계",
  ],
  dispatchPending: [
    "로컬 이벤트 전달",
    "커밋된 대기 원본 조회 → Spring 이벤트 발행 → 대상 처리 성공 후 발행 버전 확인. 실패 시 다음 주기 재시도",
  ],
  onLocalChange: [
    "로컬 이벤트 수신",
    "내부 변경 이벤트 → 외부 모드와 동일한 GwProjectionService로 대상 버전 검증·JPA 반영",
  ],
  cacheLocalSnapshot: ["로컬 커밋 후 캐시", "대상 트랜잭션 커밋 후 JSON 형상을 메모리 캐시에 저장"],
  saveLocalSnapshot: [
    "메모리 형상 저장",
    "만료 항목 정리 → JSON 직렬화 → ConcurrentHashMap.compute로 revision 비교·TTL 저장",
  ],
  startGwKafka: [
    "외부 모드 시작",
    "Kafka 토픽·DLT 명시적 생성 확인 → GW Kafka 리스너 시작. local 모드에서는 이 설정 클래스가 등록되지 않습니다.",
  ],
  revise: [
    "원본 변경",
    "이름·설명 수정 → revision 증가 → 변경 시각 갱신. 변경과 발행 대기가 같은 원본 행에 저장됩니다.",
  ],
  remove: [
    "삭제 이벤트 준비",
    "삭제 표시 → revision 증가. 행을 보존해 오래된 이벤트로 되살아나는 것을 방지합니다.",
  ],
  markPublished: [
    "발행 버전 확인",
    "Kafka ack를 받은 revision까지 발행 완료 표시. 이미 저장된 더 최신 revision은 대기로 유지합니다.",
  ],
  create: [
    "원본 생성",
    "설정 활성 여부 확인 → 빌더로 원본 구성 → JPA 저장. 별도 발행 스케줄러가 커밋된 대기 행을 조회합니다.",
  ],
  pending: [
    "발행 대기 조회",
    "revision > publishedRevision인 원본을 최대 20개 조회 → 변경 이벤트로 매핑",
  ],
  confirmPublished: ["Kafka 전송 확인", "원본 행 잠금 → ack를 받은 버전까지 발행 확인"],
  publishPending: [
    "Kafka 이벤트 발행",
    "커밋된 대기 데이터 조회 → ID를 key로 JSON 발행 → broker ack 대기 → 발행 버전 갱신. 실패 시 다음 주기 재시도",
  ],
  receive: [
    "Kafka 메시지 수신",
    "JSON → GwChangedEvent 매핑 → 스키마·입력값·key 검증 → JPA 대상 반영. 예외는 재시도 후 .DLT로 이동",
  ],
  project: [
    "대상 형상 반영",
    "원본 행 잠금 → 대상 revision 비교 → 더 최신 이벤트만 저장 → 캐시 갱신용 스냅샷 이벤트 발행",
  ],
  apply: [
    "이벤트를 엔티티에 매핑",
    "이름·설명·삭제 표시·revision·원본 변경 시각 복사 → 대상 동기화 시각 기록",
  ],
  afterProjectionCommitted: [
    "커밋 이후 캐시 저장",
    "대상 DB 트랜잭션이 커밋된 뒤 Redis Lua로 버전 비교·형상 저장. Redis 실패는 DB 반영을 되돌리지 않습니다.",
  ],
  inspect: [
    "형상 조회",
    "원본·대상 DB와 모드별 캐시 조회. local은 메모리 JSON, external은 Redis를 사용합니다. miss는 DB 형상으로 채우고 Redis 장애 시 DB로 대체합니다.",
  ],
  store: [
    "Redis 형상 기록",
    "Lua에서 revision을 원자적으로 비교 → 이전 형상 덮어쓰기 방지 → JSON 스냅샷과 TTL 저장",
  ],
  validate: ["연동 이벤트 검증", "스키마 버전·ID·revision·이름·설명 길이·변경 시각 검사"],
  createTable: ["비교 테이블 생성", "XML의 indexed 분기로 고정된 테이블 선택 → 동일 스키마 생성"],
  countRows: ["데이터 수 확인", "COUNT(*)로 현재 행 수 조회 → 재생성 필요 여부 판단"],
  clearTable: ["실험 데이터 초기화", "크기를 변경할 때 실험 전용 테이블 데이터만 삭제"],
  seedPlain: ["결정적 데이터 생성", "행 수를 바인딩해 generate_series로 같은 규칙의 데이터 생성"],
  copyIndexed: ["동일 데이터 복제", "기준 테이블의 모든 행을 인덱스 비교 테이블로 복제"],
  createIndex: ["복합 인덱스 생성", "bench_indexed에만 (account_id, state) 복합 인덱스 생성"],
  analyze: ["통계 갱신", "ANALYZE로 옵티마이저 통계 갱신"],
  databaseVersion: ["DB 버전 조회", "version() 결과를 측정 환경 정보에 표시"],
  sumAmount: [
    "동일 조건 집계",
    "고정 테이블 분기 → accountId·state 바인딩 → SUM(amount) 반환. MyBatis 결과 캐시 미사용",
  ],
  explain: ["실제 실행 계획 조회", "동일 집계 SQL에 EXPLAIN ANALYZE 적용 → 인덱스·스캔 수 확인"],
  initialize: [
    "비교 데이터 준비",
    "MyBatis Mapper XML로 테이블 생성 → 행 수 확인 → 데이터 생성·복제 → 복합 인덱스 생성·통계 갱신 → 숫자 목록 구성 → 준비 상태 공개",
  ],
  status: [
    "실험 환경 조회",
    "데이터 준비 여부·행 수·논리 CPU·전용 풀 작업자 수·Java·PostgreSQL 버전을 Status.builder()로 조립해 반환",
  ],
  score: [
    "동일 CPU 연산",
    "입력 숫자마다 64회 비트 변환·회전 수행 → 정수 범위로 마스킹. 두 방식 모두 같은 순수 함수를 사용합니다.",
  ],
  streams: [
    "순차·병렬 스트림 비교",
    "같은 목록의 stream()과 전용 ForkJoinPool 안의 parallelStream()에 동일 score·합계를 적용 → 공통 측정 함수 호출",
  ],
  indexes: [
    "인덱스 비교",
    "양쪽 EXPLAIN ANALYZE 수집 → 같은 조건의 집계 쿼리 배치를 공통 측정 함수로 비교",
  ],
  queryBatch: [
    "고정 조회 부하",
    "인덱스 유무를 Mapper에 전달 → XML의 고정 테이블 분기 → 8개 계정·상태 조건을 바인딩해 조회 → 결과 합산",
  ],
  measure: [
    "공정한 반복 측정",
    "사전 결과 비교 → 2회 워밍업 → 5회 실행 순서 교대 → 표본별 checksum 확인 → 중앙값·시간 변화율 계산 → Comparison.builder()로 결과 조립",
  ],
  time: [
    "실행 시간 측정",
    "nanoTime 시작 → 실제 작업 및 결과 소비 → 경과 시간 기록 → 기대 checksum 확인",
  ],
  summarize: [
    "측정값 요약",
    "표본 정렬 → 중앙값·최소·최대 산출 → Measurement.builder()로 전체 표본과 checksum을 함께 조립",
  ],
  tryAcquire: [
    "동시 실행 제어",
    "초기화 완료 여부 확인 → 서버 프로세스 공용 ReentrantLock 획득 시도",
  ],
  release: ["실험 잠금 해제", "컨트롤러의 finally에서 잠금을 반환해 다음 측정을 허용"],
  close: ["작업자 풀 종료", "애플리케이션 종료 시 전용 ForkJoinPool 정리"],

  checkAndSaveServerCapacity: [
    "조사 및 결과 저장",
    "사용자·서버별 마지막 조사 날짜 확인 → SSH 수집 → 기존 결과 갱신 또는 신규 저장 → 조사 시각 저장",
  ],
  getServerCapacityFromSsh: [
    "SSH 자원 수집",
    "외부 키 파일 경로 확인 → 키 로드 → SSH 연결·인증 → df/free/top 실행 → 출력 파싱 → 연결 종료",
  ],
  parseSshOutput: [
    "명령 출력 파싱",
    "출력을 줄별로 분리 → 디스크 열 추출 → 메모리 열 추출 → CPU us 값 추출 → DTO 구성",
  ],
  getLatestServerCapacities: [
    "저장된 용량 조회",
    "Repository 전체 조회 → 엔티티를 DTO로 변환해 목록 반환",
  ],
  getMonitoredServers: [
    "서버 설정 목록 조회",
    "설정 문자열을 서버별로 분리 → 각 필드 파싱 → 서버 연결 정보 목록 반환",
  ],
  checkServerCapacity: [
    "조사 API",
    "인증 사용자 확인 → 서비스 호출 → 일일 제한은 429, 기타 실패는 500으로 응답",
  ],
  login: [
    "로그인",
    "아이디·비밀번호를 사용해 로그인 요청을 처리합니다. 프론트 서비스는 응답 토큰을 저장하고, 백엔드 서비스는 BCrypt 비교 후 토큰을 발급합니다.",
  ],
  register: ["회원가입", "아이디 중복 확인 → BCrypt 해시 → 일반 사용자 역할로 회원 저장"],
  checkUsernameAvailability: [
    "아이디 중복 확인",
    "회원 조회 결과를 바탕으로 사용 가능한 아이디인지 반환",
  ],
  generateToken: [
    "JWT 발급",
    "사용자명·발급 시각·만료 시각 설정 → 비밀키로 서명 → JWT 문자열 반환",
  ],
  validateToken: ["JWT 검증", "서명과 만료를 검증하며 파싱 성공 여부를 boolean으로 반환"],
  getClaimsFromToken: ["JWT Claims 파싱", "서명 검증 키 설정 → 서명된 토큰 파싱 → payload 반환"],
  getUsernameFromToken: ["토큰 사용자 추출", "검증된 Claims의 subject를 반환"],
  doFilterInternal: [
    "요청 인증 필터",
    "Bearer 헤더 추출 → 토큰 검증 → 사용자 추출 → ROLE_USER 인증 객체 생성 → 필터 체인 진행",
  ],
  createRequestBoard: [
    "게시글 생성",
    "입력값 확인 → 선택적 파일 저장 → 공용 demo 이름을 작성자로 지정 → 게시글 저장",
  ],
  getRequestBoards: [
    "페이지·검색 조회",
    "페이지·크기 범위 조정 → 검색어 유무에 따라 Repository 조회 → DTO 페이지 반환",
  ],
  getRequestBoardById: ["게시글 상세 조회", "ID로 게시글 조회 → 없으면 예외 → DTO 반환"],
  updateRequestBoard: [
    "게시글 수정",
    "게시글 조회 → 입력 검증 → 파일 교체·삭제 처리 → 제목·내용 변경",
  ],
  deleteRequestBoard: ["게시글 삭제", "게시글 조회 → 첨부파일 삭제 시도 → DB 게시글 삭제"],
  downloadFile: [
    "첨부 다운로드",
    "게시글 조회 → 파일 경로 확인 → Resource 생성 → 존재·읽기 가능 여부 확인",
  ],
  handleFileUpdate: [
    "첨부 교체·삭제",
    "삭제 플래그 처리 → 기존 파일 삭제 → 새 확장자 검사·UUID 파일명 생성 → 파일 저장 및 엔티티 갱신",
  ],
  validateFileExtension: [
    "파일 형식 검사",
    "파일명에서 확장자 추출 → 소문자 변환 → 허용 확장자 집합과 비교",
  ],
  createComment: ["댓글·답글 등록", "게시글 ID·부모 ID·내용·공용 demo 작성자를 엔티티에 담아 저장"],
  getCommentsByRequestBoardId: [
    "댓글 트리 조회",
    "부모 댓글 조회 → 부모별 답글 조회 → 부모 DTO에 답글 목록 연결",
  ],
  updateComment: ["댓글 수정", "ID 조회 → 내용 변경"],
  deleteComment: ["댓글 삭제", "ID 조회 → 직계 답글 삭제 → 원 댓글 삭제"],
  toDTO: ["응답 DTO 변환", "엔티티의 응답에 필요한 필드를 DTO에 복사"],
  convertToDTO: ["응답 DTO 변환", "댓글 엔티티의 ID·소속·내용·작성자·생성 시각을 DTO에 복사"],
  logout: ["로그아웃", "브라우저 sessionStorage에서 토큰·사용자명·역할 제거"],
  join: ["회원가입 요청", "회원가입 API에 아이디와 비밀번호 전송"],
  handleSubmit: [
    "폼 전송",
    "기본 제출 방지 → 입력 검증 → 요청 데이터 구성 → API 전송 → 성공 이동 또는 오류 표시",
  ],
  fetchPage: [
    "게시글 목록 요청",
    "조회 상태 초기화 → 검색어·페이지 요청 상태 갱신 → Effect에서 API 조회와 목록·로딩 상태 반영",
  ],
  fetchServers: ["서버 목록 요청", "서버 설정 API 조회 → 모니터링 대상 상태 갱신"],
  fetchCapacities: [
    "용량 결과 요청",
    "API 조회 → 서버 번호별 데이터 맵 구성 → 상태 갱신 → 로딩 종료",
  ],
  handleCheckCapacity: [
    "서버 조사 요청",
    "선택한 서버의 진행 상태 설정 → 조사 API 요청 → 결과 재조회 → 제한·실패 처리",
  ],
};

/** 메서드 바로 위의 Javadoc을 읽어 파일별 설명을 우선 사용합니다. */
function methodDescription(text, start, name, fallback) {
  const before = text.slice(0, start);
  const commentStart = before.lastIndexOf("/**");
  if (commentStart >= 0) {
    const end = before.indexOf("*/", commentStart);
    // 주석과 선언 사이에는 공백과 애너테이션만 허용합니다.
    const between = before.slice(end + 2).replace(/@[\w.]+(?:\s*\([^)]*\))?/g, "");
    if (end >= 0 && !between.trim()) {
      const description = before
        .slice(commentStart + 3, end)
        .split(/\r?\n/)
        .map((line) => line.replace(/^\s*\*?\s?/, "").trim())
        .filter((line) => line && !line.startsWith("@"))
        .join(" ");
      if (description) {
        return [description.split(/(?<=[.!?])\s/)[0], description];
      }
    }
  }
  return methodNotes[name] || fallback;
}

/** 문자열과 주석의 중괄호를 제외하고 함수 본문이 끝나는 위치를 찾습니다. */
function endOfBody(text, start) {
  let depth = 0,
    quote = "",
    lineComment = false,
    blockComment = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i],
      next = text[i + 1];
    if (lineComment) {
      if (c === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (c === "*" && next === "/") {
        blockComment = false;
        i++;
      }
      continue;
    }
    if (quote) {
      if (c === "\\") i++;
      else if (c === quote) quote = "";
      continue;
    }
    if (c === "/" && next === "/") {
      lineComment = true;
      i++;
      continue;
    }
    if (c === "/" && next === "*") {
      blockComment = true;
      i++;
      continue;
    }
    if ("\"'`".includes(c)) {
      quote = c;
      continue;
    }
    if (c === "{") depth++;
    if (c === "}" && --depth === 0) return i + 1;
  }
  return text.length;
}

/** Java·React·Mapper 소스에서 메서드별 코드와 설명을 추출합니다. */
export function extractMethods(text, java) {
  if (text.includes("<mapper namespace=")) {
    return [
      ...text.matchAll(/<(select|insert|update|delete)\s+id="([^"]+)"[^>]*>[\s\S]*?<\/\1>/g),
    ].map((match) => ({
      name: match[2],
      params: "Mapper 인터페이스의 @Param 바인딩",
      line: text.slice(0, match.index).split("\n").length,
      code: match[0],
      note: methodNotes[match[2]] || ["Mapper SQL", "실제 XML SQL과 파라미터 바인딩을 확인합니다."],
    }));
  }
  if (java && /\binterface\s+BenchmarkMapper\b/.test(text)) {
    return [...text.matchAll(/^[ \t]*[\w.$]+(?:<[^();\n]+>)?(?:\[\])*\s+(\w+)\s*\(([\s\S]*?)\);/gm)].map(
      (match) => ({
        name: match[1],
        params: match[2].trim() || "없음",
        line: text.slice(0, match.index).split("\n").length,
        code: match[0].trim(),
        note: methodDescription(text, match.index, match[1], [
          "Mapper 메서드",
          "동일 ID의 XML SQL을 실행합니다.",
        ]),
      }),
    );
  }
  const pattern = java
    ? /^[ \t]*(?:public|private|protected)\s+(?:(?:static|final|synchronized)\s+)*(?:[\w<>,?[\].]+\s+)+(\w+)\s*\(((?:[^()]|\([^()]*\))*)\)\s*(?:throws[^{]+)?\{/gm
    : /^[ \t]*(?:export\s+(?:default\s+)?)?(?:const\s+(\w+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>|(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\))\s*\{/gm;
  return [...text.matchAll(pattern)].map((match) => {
    const name = match[1] || match[3];
    const start = match.index + match[0].search(/\S/);
    const end = endOfBody(text, match.index + match[0].lastIndexOf("{"));
    return {
      name,
      params: match[2] || match[4] || "없음",
      line: text.slice(0, start).split("\n").length,
      code: text.slice(start, end),
      note: methodDescription(text, start, name, [
        java ? "클래스 메서드" : "화면 처리 함수",
        "아래 실제 구현에서 분기·호출 순서와 반환 처리를 확인할 수 있습니다.",
      ]),
    };
  });
}
