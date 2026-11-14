import { inventoryPractice } from "./inventoryPractice";
import { deploymentSources } from "./deploymentGuide";
// 소스 뷰어에는 명시적으로 선택한 구현 파일만 공개합니다.
// 런타임 설정·인증정보·개인키는 가져오지 않으며 배포 예시는 민감정보가 없는 템플릿만 사용합니다.
const backend = "../../../backend/src/main/java/com/inven/core/backend/";

/** 소스 파일의 표시 경로와 지연 로딩 함수를 구성합니다. */
const source = (path, load) => ({ path, load });
const sources = {
  orderLab: [
    source(
      "backend/src/main/java/com/inven/core/backend/api/orderlab/practice/UserKafkaCode.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/orderlab/practice/UserKafkaCode.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/orderlab/practice/OrderLabPractice.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/orderlab/practice/OrderLabPractice.java"),
    ),
    source(
      "frontend/src/components/inventory/KafkaPracticePanel.jsx",
      () => import("../components/inventory/KafkaPracticePanel.jsx?raw"),
    ),
    source(
      "frontend/src/components/inventory/ParcelFactoryGame.jsx",
      () => import("../components/inventory/ParcelFactoryGame.jsx?raw"),
    ),
    source(
      "frontend/src/pages/gwsync/OrderLabPage.jsx",
      () => import("../pages/gwsync/OrderLabPage.jsx?raw"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabDto.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabDto.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabEvent.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabEvent.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabDelivery.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabDelivery.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabProjection.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabProjection.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabEventRepository.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabEventRepository.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabDeliveryRepository.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabDeliveryRepository.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabProjectionRepository.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabProjectionRepository.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabStore.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabStore.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabEngine.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabEngine.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabPublisher.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabPublisher.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabLocalEngine.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabLocalEngine.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabKafkaConsumer.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabKafkaConsumer.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabKafkaConfig.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabKafkaConfig.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabKafkaEngine.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabKafkaEngine.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabController.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabController.java"),
    ),
  ],
  gwSync: [
    source(
      "backend/src/main/java/com/inven/core/backend/api/gwsync/config/GwSyncConfig.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/gwsync/config/GwSyncConfig.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/gwsync/cache/GwCacheStore.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/gwsync/cache/GwCacheStore.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/gwsync/cache/GwLocalSnapshotCache.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/gwsync/cache/GwLocalSnapshotCache.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/gwsync/messaging/GwLocalEventPublisher.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/gwsync/messaging/GwLocalEventPublisher.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/gwsync/messaging/GwLocalEventListener.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/gwsync/messaging/GwLocalEventListener.java"),
    ),
    source(
      "frontend/src/pages/gwsync/GwSyncPage.jsx",
      () => import("../pages/gwsync/GwSyncPage.jsx?raw"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/gwsync/entity/GwSource.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/gwsync/entity/GwSource.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/gwsync/entity/GwTarget.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/gwsync/entity/GwTarget.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/gwsync/dto/GwSyncDto.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/gwsync/dto/GwSyncDto.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/gwsync/event/GwChangedEvent.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/gwsync/event/GwChangedEvent.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/gwsync/repository/GwSourceRepository.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/gwsync/repository/GwSourceRepository.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/gwsync/repository/GwTargetRepository.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/gwsync/repository/GwTargetRepository.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/gwsync/service/GwSourceService.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/gwsync/service/GwSourceService.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/gwsync/service/GwProjectionService.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/gwsync/service/GwProjectionService.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/gwsync/service/GwQueryService.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/gwsync/service/GwQueryService.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/gwsync/messaging/GwEventPublisher.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/gwsync/messaging/GwEventPublisher.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/gwsync/messaging/GwEventListener.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/gwsync/messaging/GwEventListener.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/gwsync/cache/GwSnapshotCache.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/gwsync/cache/GwSnapshotCache.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/gwsync/controller/GwSyncController.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/gwsync/controller/GwSyncController.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/gwsync/config/GwSyncProperties.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/gwsync/config/GwSyncProperties.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/gwsync/config/GwKafkaConfig.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/gwsync/config/GwKafkaConfig.java"),
    ),
  ],
  benchmark: [
    source(
      "backend/src/main/java/com/inven/core/backend/api/benchmark/mapper/BenchmarkMapper.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/benchmark/mapper/BenchmarkMapper.java"),
    ),
    source(
      "backend/src/main/resources/mappers/benchmark/BenchmarkMapper.xml",
      () =>
        import("virtual:inventory-source/backend/src/main/resources/mappers/benchmark/BenchmarkMapper.xml"),
    ),
    source(
      "frontend/src/pages/benchmark/BenchmarkPage.jsx",
      () => import("../pages/benchmark/BenchmarkPage.jsx?raw"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/benchmark/BenchmarkService.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/benchmark/BenchmarkService.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/benchmark/BenchmarkController.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/benchmark/BenchmarkController.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/benchmark/BenchmarkDataInitializer.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/benchmark/BenchmarkDataInitializer.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/benchmark/BenchmarkResult.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/benchmark/BenchmarkResult.java"),
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
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/member/service/MemberService.java"),
    ),
    source(
      `${backend}security/JwtAuthenticationFilter.java`,
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/security/JwtAuthenticationFilter.java"),
    ),
    source(
      `${backend}util/JwtUtil.java`,
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/util/JwtUtil.java"),
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
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/requestboard/controller/RequestBoardController.java"),
    ),
    source(
      `${backend}api/requestboard/service/impl/RequestBoardServiceImpl.java`,
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/requestboard/service/impl/RequestBoardServiceImpl.java"),
    ),
    source(
      `${backend}api/requestboard/repository/RequestBoardRepository.java`,
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/requestboard/repository/RequestBoardRepository.java"),
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
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/comment/controller/CommentController.java"),
    ),
    source(
      `${backend}api/comment/service/CommentService.java`,
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/comment/service/CommentService.java"),
    ),
    source(
      `${backend}api/comment/entity/Comment.java`,
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/comment/entity/Comment.java"),
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
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/requestboard/controller/RequestBoardController.java"),
    ),
    source(
      `${backend}api/requestboard/service/impl/RequestBoardServiceImpl.java`,
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/requestboard/service/impl/RequestBoardServiceImpl.java"),
    ),
    source(
      `${backend}api/requestboard/entity/RequestBoard.java`,
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/requestboard/entity/RequestBoard.java"),
    ),
  ],
  capacity: [
    source(
      "backend/src/main/java/com/inven/core/backend/api/serverCapacity/controller/HostCapacityController.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/serverCapacity/controller/HostCapacityController.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/serverCapacity/service/HostCapacityService.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/serverCapacity/service/HostCapacityService.java"),
    ),
    source(
      "backend/src/main/java/com/inven/core/backend/api/serverCapacity/dto/HostCapacityDTO.java",
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/serverCapacity/dto/HostCapacityDTO.java"),
    ),
    source(
      "deployment/monitoring/collect-host-capacity.py",
      () => import("virtual:inventory-source/deployment/monitoring/collect-host-capacity.py"),
    ),
    source(
      "deployment/monitoring/invencore-host-capacity.service",
      () =>
        import("virtual:inventory-source/deployment/monitoring/invencore-host-capacity.service"),
    ),
    source(
      "deployment/monitoring/invencore-host-capacity.timer",
      () => import("virtual:inventory-source/deployment/monitoring/invencore-host-capacity.timer"),
    ),
    source(
      "compose.monitoring.yml",
      () => import("virtual:inventory-source/compose.monitoring.yml"),
    ),

    source(
      "frontend/src/pages/servercapacity/ServerCapacityPage.jsx",
      () => import("../pages/servercapacity/ServerCapacityPage.jsx?raw"),
    ),
    source(
      `${backend}api/serverCapacity/controller/ServerCapacityController.java`,
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/serverCapacity/controller/ServerCapacityController.java"),
    ),
    source(
      `${backend}api/serverCapacity/service/impl/ServerCapacityServiceImpl.java`,
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/serverCapacity/service/impl/ServerCapacityServiceImpl.java"),
    ),
    source(
      `${backend}api/serverCapacity/entity/ServerCapacity.java`,
      () =>
        import("virtual:inventory-source/backend/src/main/java/com/inven/core/backend/api/serverCapacity/entity/ServerCapacity.java"),
    ),
  ],
};

/** 기능의 실행 흐름을 설명할 단계 항목을 구성합니다. */
const step = (layer, name, description) => ({ layer, name, description });
export const inventory = [
  {
    id: "kafka-lab",
    number: "09",
    title: "Kafka 미니게임",
    subtitle: "PLAY THE PIPELINE / KAFKA",
    category: "메시징·데이터 연동",
    icon: "≋",
    color: "blue",
    tags: ["Mini Game", "Kafka", "Replay"],
    endpoint: "POST /api/order-lab/runs",
    summary: "택배 공장의 세 미션으로 순서 지키기·밀린 작업 이어가기·중복 배송 막기를 체험합니다.",
    description:
      "Java TODO 세 곳을 직접 작성해 같은 게임에 적용할 수 있습니다. 키 분배·다음 오프셋·업무 버전 방어를 구현하고 계약 검사 후 내 코드 모드로 실행합니다. 게임과 연결한 Kafka 용어 사전과 상세 기록도 제공합니다.",
    features: [
      "순서대로 보내기 · 쉬어도 보관하기 · 중복 배송 방어 3개 미션",
      "다음 행동 버튼 · 움직이는 작업 카드 · 실제 처리 기록의 느린 재생",
      "기술 상세에서 파티션·오프셋·재처리 관찰",
    ],
    caveats: [
      "순서는 파티션 안에서만 보장됩니다. 오프셋은 업무 순번이 아니며 파티션 사이에서 비교할 수 없습니다.",
      "기본 local 모드는 교육용 모형입니다. GW_SYNC_MODE=external일 때 실제 Kafka Admin 오프셋과 소비자 처리 기록을 사용합니다.",
      "게임의 재처리는 현재 주문이 시작된 오프셋부터 읽으므로 이후 기록도 함께 읽을 수 있습니다. DB와 오프셋은 하나의 트랜잭션이 아니며 정확히 한 번 처리를 보장하지 않습니다.",
    ],
    steps: [
      step(
        "CREATE",
        "OrderLabStore.start",
        "4단계 주문 이벤트를 JPA에 개별 저장 · KEYED 또는 SPREAD 분기",
      ),
      step(
        "PUBLISH",
        "OrderLabPublisher",
        "미발행 이벤트를 순서대로 전송 · 실제 partition/offset 확인",
      ),
      step(
        "CONSUME",
        "OrderLabKafkaConsumer / OrderLabLocalEngine",
        "두 그룹 독립 소비 · 외부 모드는 그룹별 3개 소비자",
      ),
      step("PROJECT", "OrderLabStore.consume", "업무 버전·누락 검사 · 처리 기록과 최종 상태 저장"),
      step("OBSERVE", "OrderLabKafkaEngine.state", "브로커 시작·끝·그룹별 커밋 오프셋과 lag 조회"),
      step("CONTROL", "OrderLabEngine.control", "일시정지·재개·재시작·시작 오프셋 seek"),
    ],
    tables: ["order_lab_event", "order_lab_delivery", "order_lab_projection"],
    sources: sources.orderLab,
  },
  {
    id: "gw-sync",
    number: "08",
    title: "GW 데이터 연동",
    subtitle: "LOCAL DEMO / KAFKA / REDIS",
    category: "메시징·데이터 연동",
    icon: "⇄",
    color: "blue",
    tags: ["Local Demo", "JPA", "Kafka / Redis"],
    endpoint: "POST /api/gw-sync/items",
    summary:
      "외부 서버 없이 두 테이블과 형상 캐시를 연동하고, Kafka·Redis 모드로 전환할 수 있습니다.",
    description:
      "기본 로컬 모드는 Spring 내부 이벤트와 메모리 JSON 캐시로 동작합니다. 외부 모드는 Kafka와 Redis를 사용합니다. 두 모드 모두 원본의 발행 대기 버전과 대상 revision을 비교하고 DB 커밋 후 형상을 캐시합니다.",
    features: [
      "원본 생성·수정·삭제 이벤트와 대상 반영",
      "로컬 내부 이벤트 / 외부 Kafka · 버전 검증 · 재시도",
      "메모리 / Redis JSON 형상 · TTL · 외부 모드 DLT",
    ],
    caveats: [
      "기본 local 모드는 별도 설치 없이 실행합니다. GW_SYNC_MODE=external일 때만 Kafka·Redis가 필요합니다.",
      "최신 상태 연동 예제이며 빠른 변경은 합쳐질 수 있습니다. H2 데이터는 재시작 시 초기화됩니다.",
      "Redis는 최종적 일관성의 파생 캐시이며, 갱신 실패 시 TTL까지 이전 형상을 보관할 수 있습니다.",
    ],
    steps: [
      step("SOURCE", "GwSourceService", "JPA 원본·발행 대기 revision을 같은 트랜잭션으로 저장"),
      step(
        "PUBLISH",
        "GwLocalEventPublisher / GwEventPublisher",
        "대기 조회 → 내부 이벤트 또는 Kafka 전송 → 처리 확인 후 발행 버전 갱신",
      ),
      step(
        "CONSUME",
        "GwLocalEventListener / GwEventListener",
        "내부 이벤트 수신 또는 Kafka JSON 매핑 → 공통 JPA 반영",
      ),
      step("TARGET", "GwProjectionService", "동일 ID 잠금 · revision 비교 · JPA 대상 반영"),
      step(
        "CACHE",
        "GwLocalSnapshotCache / GwSnapshotCache",
        "DB 커밋 후 원자적 버전 비교 · 메모리 또는 Redis에 JSON·TTL 저장",
      ),
      step("VIEW", "GwSyncPage", "두 DB와 캐시 형상 비교 · 2.5초 상태 갱신"),
    ],
    tables: ["gw_source", "gw_target"],
    sources: sources.gwSync,
  },
  {
    id: "parallel-stream",
    number: "06",
    title: "병렬 스트림 성능 비교",
    subtitle: "SEQUENTIAL / PARALLEL STREAM",
    category: "성능 최적화",
    icon: "∥",
    color: "blue",
    tags: ["parallelStream", "ForkJoinPool", "MyBatis"],
    endpoint: "POST /api/benchmarks/streams",
    summary: "동일한 CPU 연산을 순차·병렬 스트림으로 실행하고 실제 시간을 비교합니다.",
    description: "동일한 CPU 연산을 순차·병렬 스트림으로 실행하고 실제 시간을 비교합니다.",
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
        description: "MyBatis Mapper XML로 DB 데이터 준비 · 숫자 목록 구성",
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
    category: "성능 최적화",
    icon: "⌗",
    color: "blue",
    tags: ["MyBatis", "H2", "EXPLAIN ANALYZE"],
    endpoint: "POST /api/benchmarks/indexes",
    summary: "동일 데이터의 두 테이블에서 복합 인덱스 유무에 따른 조회 시간을 비교합니다.",
    description: "동일 데이터의 두 테이블에서 복합 인덱스 유무에 따른 조회 시간을 비교합니다.",
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
        description: "MyBatis Mapper로 동일 데이터 복제 · 복합 인덱스 생성",
      },
      {
        layer: "API",
        name: "BenchmarkController",
        description: "한 번에 하나의 실험만 허용",
      },
      {
        layer: "QUERY",
        name: "BenchmarkMapper.sumAmount",
        description: "Service → Mapper → XML SQL · 캐시 없이 8개 집계 조회",
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
    subtitle: "UBUNTU HOST RESOURCE MONITOR",
    category: "서버 모니터링",
    icon: ">_",
    color: "amber",
    tags: ["Ubuntu", "Docker", "Spring Boot"],
    endpoint: "GET /api/server-capacity/host",
    route: "/servercapacity",
    summary: "Ubuntu 전체 자원 사용량을 한눈에.",
    description:
      "Ubuntu 호스트의 CPU·메모리·루트 디스크를 수집하고, 읽기 전용 JSON을 통해 컨테이너의 인증된 API와 연결합니다. 수집 시각과 실제 사용률을 카드로 표시합니다.",
    features: [
      "CPU·메모리·디스크 사용률 카드",
      "10초 자동 갱신과 수동 새로고침",
      "수집 중단·오래된 결과 감지",
    ],
    caveats: [
      "Ubuntu에 호스트 수집기와 타이머를 설치하고 compose.monitoring.yml을 함께 적용해야 합니다.",
      "Hyper-V Ubuntu VM 전체 기준입니다. Windows 전체나 개별 컨테이너 제한을 나타내지 않습니다.",
      "로그인이 필요하며 30초 이상 오래된 결과는 503으로 처리합니다. 기본 호스트 모드에서는 JPA에 이력을 저장하지 않습니다.",
      "기존 SSH·JPA 예제는 SERVER_CAPACITY_MODE=ssh로 별도 활성화합니다. 현재 화면은 호스트 모니터링용입니다.",
    ],
    steps: [
      step("HOST", "collect-host-capacity.py", "Ubuntu /proc·루트 디스크 수집"),
      step("TIMER", "systemd timer", "10초마다 집계 JSON 원자적 교체"),
      step("MOUNT", "compose.monitoring.yml", "수집 디렉터리만 읽기 전용 공유"),
      step("API", "HostCapacityService", "형식·수집 시각 검증 후 인증된 조회"),
      step("CLIENT", "ServerCapacityPage", "사용률 카드와 수집 시각 표시"),
    ],
    tables: [],
    sources: sources.capacity,
  },
  {
    id: "auth",
    number: "02",
    title: "JWT 인증",
    subtitle: "STATELESS AUTHENTICATION",
    category: "인증·보안",
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
      step("FILTER", "JwtAuthenticationFilter", "Bearer 토큰 → SecurityContext"),
    ],
    tables: ["Member"],
    sources: sources.auth,
  },
  {
    id: "board",
    number: "03",
    title: "요청 게시판",
    subtitle: "SEARCHABLE CRUD",
    category: "웹 기능 구현",
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
    category: "웹 기능 구현",
    icon: "↥",
    color: "blue",
    tags: ["Multipart", "UUID", "File I/O"],
    endpoint: "POST /api/requestboards",
    route: "/requestboard/regist",
    summary: "게시글과 파일을 하나의 요청으로 저장.",
    description:
      "FormData에 JSON DTO와 첨부파일을 함께 담아 전송합니다. 서버는 허용 확장자를 확인하고 UUID를 붙인 이름으로 로컬 디렉터리에 저장합니다.",
    features: ["최대 5MB 첨부파일", "UUID 파일명과 원본 파일명 분리", "첨부 교체·삭제 및 다운로드"],
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
    category: "웹 기능 구현",
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
  {
    id: "aws-cicd",
    number: "10",
    title: "AWS CI/CD 배포 가이드",
    subtitle: "DEPLOYMENT PLAYBOOK / REFERENCE",
    category: "배포·운영",
    kind: "guide",
    icon: "↗",
    color: "amber",
    tags: ["AWS EC2", "GitHub Actions", "참고 템플릿"],
    endpoint: "Amazon Linux 2023 · EC2 · Nginx · systemd",
    summary: "기존 AWS 배포 이력부터 테스트·자동 배포·상태 확인·롤백까지.",
    description:
      "Git에서 찾은 기존 SSH 배포 이력을 정리하고, 다음 배포를 위한 OIDC·S3·SSM 기반 EC2 배포 가이드를 제공합니다. 명령어와 설정을 복사해 검토할 수 있으며, 지금 AWS에 연결하거나 자동 배포를 실행하지 않습니다.",
    features: [
      "기존 GitHub Actions 배포·비활성화 이력 확인",
      "AWS 기본 설정·IAM·OIDC·SSM·Nginx·systemd 참고 구성",
      "테스트·빌드·릴리스 패키징·상태 확인·자동/수동 롤백",
    ],
    caveats: [
      "새 전용 Amazon Linux 2023 EC2를 가정한 참고 템플릿입니다. 기존 서버의 현재 구성과 실제 AWS 자원은 확인하지 않았습니다.",
      "템플릿은 자동 실행 경로 밖에 있습니다. 실제 값 설정과 AWS 검증 후 활성화하며, 재시작 방식이므로 무중단 배포는 아닙니다.",
      "현재 H2 메모리 DB는 재시작하면 계정·게시글·파일 메타데이터가 초기화됩니다. 운영 DB·HTTPS·백업·공개 범위는 별도 검토가 필요합니다.",
    ],
    steps: [
      step("HISTORY", "Git history", "SSH 배포 및 비활성화 이력 확인"),
      step("BUILD", "GitHub Actions", "테스트·빌드·동일 commit 릴리스 패키징"),
      step("IDENTITY", "OIDC / IAM", "production 환경에 제한한 임시 역할"),
      step("DELIVERY", "S3 / SSM", "비공개 산출물과 검토한 배포 문서"),
      step("RUNTIME", "EC2 / systemd / Nginx", "릴리스 전환·API·정적 화면 제공"),
      step("RECOVERY", "Health / Rollback", "상태 확인 실패 시 이전 코드 복구"),
    ],
    tables: ["release.tar.gz", "S3 releases/", "EC2 releases/", "업로드 별도 보관"],
    sources: deploymentSources,
  },
];
// 각 카드의 소스 목록에 해당 Java 실습 파일을 연결합니다.
for (const item of inventory) {
  const practice = inventoryPractice[item.id];
  if (practice) item.sources = [source(practice.path, practice.load), ...item.sources];
}
export const categories = ["All", ...new Set(inventory.map((item) => item.category))];

/** 소스 파일 경로를 화면에 표시할 경로로 변환합니다. */
export function displayPath(path) {
  return path.replace("../../../backend/", "backend/");
}
