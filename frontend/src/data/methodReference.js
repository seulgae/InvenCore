export const methodNotes = {
  initialize: [
    "비교 데이터 준비",
    "실험 전용 테이블 생성 → 행 수 확인 → 결정적 데이터 생성·복제 → 복합 인덱스 생성 → 통계 갱신 → 숫자 목록 구성 → 준비 상태 공개",
  ],
  status: [
    "실험 환경 조회",
    "데이터 준비 여부·행 수·논리 CPU·전용 풀 작업자 수·Java·H2 버전 반환",
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
    "내부의 고정된 테이블 이름에만 SQL 적용 → 8개 계정·상태 조건을 파라미터로 전달 → 결과 합산",
  ],
  measure: [
    "공정한 반복 측정",
    "사전 결과 비교 → 2회 워밍업 → 5회 실행 순서 교대 → 표본별 checksum 확인 → 중앙값·시간 변화율 계산",
  ],
  time: [
    "실행 시간 측정",
    "nanoTime 시작 → 실제 작업 및 결과 소비 → 경과 시간 기록 → 기대 checksum 확인",
  ],
  summarize: [
    "측정값 요약",
    "표본 정렬 → 중앙값·최소·최대 산출 → 원래 실행 순서의 전체 표본과 checksum 보관",
  ],
  tryAcquire: [
    "동시 실행 제어",
    "초기화 완료 여부 확인 → 서버 프로세스 공용 ReentrantLock 획득 시도",
  ],
  release: [
    "실험 잠금 해제",
    "컨트롤러의 finally에서 잠금을 반환해 다음 측정을 허용",
  ],
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
  register: [
    "회원가입",
    "아이디 중복 확인 → BCrypt 해시 → 일반 사용자 역할로 회원 저장",
  ],
  checkUsernameAvailability: [
    "아이디 중복 확인",
    "회원 조회 결과를 바탕으로 사용 가능한 아이디인지 반환",
  ],
  generateToken: [
    "JWT 발급",
    "사용자명·발급 시각·만료 시각 설정 → 비밀키로 서명 → JWT 문자열 반환",
  ],
  validateToken: [
    "JWT 검증",
    "서명과 만료를 검증하며 파싱 성공 여부를 boolean으로 반환",
  ],
  getClaimsFromToken: [
    "JWT Claims 파싱",
    "서명 검증 키 설정 → 서명된 토큰 파싱 → payload 반환",
  ],
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
  getRequestBoardById: [
    "게시글 상세 조회",
    "ID로 게시글 조회 → 없으면 예외 → DTO 반환",
  ],
  updateRequestBoard: [
    "게시글 수정",
    "게시글 조회 → 입력 검증 → 파일 교체·삭제 처리 → 제목·내용 변경",
  ],
  deleteRequestBoard: [
    "게시글 삭제",
    "게시글 조회 → 첨부파일 삭제 시도 → DB 게시글 삭제",
  ],
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
  createComment: [
    "댓글·답글 등록",
    "게시글 ID·부모 ID·내용·공용 demo 작성자를 엔티티에 담아 저장",
  ],
  getCommentsByRequestBoardId: [
    "댓글 트리 조회",
    "부모 댓글 조회 → 부모별 답글 조회 → 부모 DTO에 답글 목록 연결",
  ],
  updateComment: ["댓글 수정", "ID 조회 → 내용 변경"],
  deleteComment: ["댓글 삭제", "ID 조회 → 직계 답글 삭제 → 원 댓글 삭제"],
  toDTO: ["응답 DTO 변환", "엔티티의 응답에 필요한 필드를 DTO에 복사"],
  convertToDTO: [
    "응답 DTO 변환",
    "댓글 엔티티의 ID·소속·내용·작성자·생성 시각을 DTO에 복사",
  ],
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
  fetchServers: [
    "서버 목록 요청",
    "서버 설정 API 조회 → 모니터링 대상 상태 갱신",
  ],
  fetchCapacities: [
    "용량 결과 요청",
    "API 조회 → 서버 번호별 데이터 맵 구성 → 상태 갱신 → 로딩 종료",
  ],
  handleCheckCapacity: [
    "서버 조사 요청",
    "선택한 서버의 진행 상태 설정 → 조사 API 요청 → 결과 재조회 → 제한·실패 처리",
  ],
};

// Scan braces while ignoring strings and comments, so braces in log messages
// and JSON literals do not truncate the displayed method body.
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
export function extractMethods(text, java) {
  const pattern = java
    ? /^\s*(?:public|private|protected)\s+(?:(?:static|final|synchronized)\s+)*(?:[\w<>,?[\].]+\s+)+(\w+)\s*\(([^)]*)\)\s*(?:throws[^{]+)?\{/gm
    : /^\s*(?:export\s+)?(?:const\s+(\w+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>|(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\))\s*\{/gm;
  return [...text.matchAll(pattern)].map((match) => {
    const name = match[1] || match[3];
    const start = match.index + match[0].search(/\S/);
    const end = endOfBody(text, match.index + match[0].lastIndexOf("{"));
    return {
      name,
      params: match[2] || match[4] || "없음",
      line: text.slice(0, start).split("\n").length,
      code: text.slice(start, end),
      note: methodNotes[name] || [
        java ? "클래스 메서드" : "화면 처리 함수",
        "아래 실제 구현에서 분기·호출 순서와 반환 처리를 확인할 수 있습니다.",
      ],
    };
  });
}
