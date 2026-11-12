/** 카드별 실습 과제의 목표·파일·검사 기준을 구성합니다. */
const exercise = (file, title, goal, steps, hint, load) => ({
  file,
  title,
  goal,
  steps,
  hint,
  load,
  path: `backend/src/main/java/com/inven/core/backend/api/practice/${file}.java`,
});

export const inventoryPractice = {
  "parallel-stream": exercise(
    "UserParallelCode",
    "공유 변수 없는 병렬 집계",
    "같은 입력을 순차·병렬로 처리하고 결과가 같은지 검증합니다.",
    ["aggregate에 work 연산 적용", "long 합계 reduction 구현", "빈 입력과 큰 수 처리"],
    "mapToLong · sum · parallelStream. 속도는 실행 환경에 따라 달라집니다. 검사 통과만으로 병렬 실행이나 속도 향상을 증명하지는 않습니다.",
    () =>
      import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/practice/UserParallelCode.java"),
  ),
  "index-tuning": exercise(
    "UserIndexCode",
    "인덱스 전후 실행 계획",
    "직접 작성한 SQL을 별도 H2에 실행해 집계와 인덱스 사용을 확인합니다.",
    [
      "sumSql: customer_id = ? 합계 작성",
      "indexSql: customer_id 인덱스 DDL 작성",
      "빈 결과 0 · EXPLAIN 확인",
    ],
    "SUM · COALESCE · PreparedStatement. 실습 테이블은 practice_orders(id, customer_id, amount). 별칭은 total입니다.",
    () =>
      import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/practice/UserIndexCode.java"),
  ),
  "gw-sync": exercise(
    "UserGwCode",
    "늦게 도착한 이벤트 막기",
    "업무 revision을 비교해 중복 반영과 과거 상태로의 복귀를 막습니다.",
    [
      "shouldApply 버전 정책 구현",
      "같은 버전과 과거 버전 무시",
      "삭제 후 과거 이벤트와 버전 건너뛰기 검사",
    ],
    "Kafka offset이 아닌 업무 revision 비교입니다. 삭제도 버전을 남기는 tombstone으로 생각하세요.",
    () =>
      import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/practice/UserGwCode.java"),
  ),
  capacity: exercise(
    "UserCapacityCode",
    "SSH 응답을 컬럼으로 변환",
    "실제 서버 접속 없이 df 출력 샘플을 구조화합니다.",
    ["parseDisk에서 공백·탭 분리", "total / used / percent 반환", "누락 컬럼과 잘못된 퍼센트 거부"],
    "trim · split(\\s+) · Integer.parseInt. Use%는 정수 0..100이며 % 기호가 있어야 합니다.",
    () =>
      import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/practice/UserCapacityCode.java"),
  ),
  auth: exercise(
    "UserAuthCode",
    "BCrypt 비밀번호 저장과 검증",
    "기존 인증 서비스처럼 PasswordEncoder를 사용해 원문과 저장 해시를 비교합니다.",
    ["encode를 PasswordEncoder에 위임", "matches로 검증", "틀린 비밀번호와 누락값 처리"],
    "같은 원문도 salt 때문에 해시가 달라집니다. 인증 토큰 발급과 로그인 기능 전체를 구현하는 과제는 아닙니다.",
    () =>
      import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/practice/UserAuthCode.java"),
  ),
  board: exercise(
    "UserBoardCode",
    "페이징의 경계 조건",
    "목록 조회의 페이지 크기·시작 위치·정렬 규칙을 구현합니다.",
    ["PageRequest 생성 · id 내림차순", "page >= 0, size 1..100 검증", "long offset과 경계값 검사"],
    "PageRequest.of · Sort.Direction.DESC. 이 제한은 실습 규칙이며 기존 게시판 API는 바뀌지 않습니다.",
    () =>
      import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/practice/UserBoardCode.java"),
  ),
  files: exercise(
    "UserFilesCode",
    "첨부파일 입력 정책",
    "이름·확장자·크기를 검증하는 작은 정책 함수를 만듭니다.",
    [
      "allowed에서 경로 포함 이름 거부",
      "png / jpg / jpeg / pdf / txt 허용",
      "1바이트..5MiB 크기 검사",
    ],
    "Locale.ROOT로 대소문자 처리. 확장자 검사만으로 안전한 업로드가 완성되지는 않습니다. 기존 업로드 정책과 별개입니다.",
    () =>
      import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/practice/UserFilesCode.java"),
  ),
  comments: exercise(
    "UserCommentsCode",
    "댓글과 답글 묶기",
    "순서가 섞인 평면 목록을 게시글별 한 단계 댓글 트리로 변환합니다.",
    [
      "boardId로 게시글 격리",
      "부모와 직접 답글 연결 · id 정렬",
      "고아·다른 게시글·다단계 답글 제외",
    ],
    "Map으로 parentId별 그룹을 만든 뒤 루트에 연결하세요. 입력은 변경하지 않습니다. N+1 조회 개선을 위한 DTO 변환 연습입니다.",
    () =>
      import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/practice/UserCommentsCode.java"),
  ),
};
