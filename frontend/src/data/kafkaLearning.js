export const kafkaTerms = [
  {
    name: "Record / Event",
    ko: "레코드·이벤트",
    game: "작업 카드 한 장",
    meaning:
      "한 번 발생한 변경을 담은 메시지입니다. 이 예제는 주문의 접수·결제·포장·발송을 각각 별도 이벤트로 저장합니다.",
    caution: "eventId는 이벤트 식별자이고 offset은 저장된 파티션에서의 위치입니다.",
  },
  {
    name: "Producer",
    ko: "생산자",
    game: "카드를 보내는 주문 접수대",
    meaning:
      "토픽에 레코드를 발행하는 클라이언트입니다. OrderLabPublisher가 KafkaTemplate을 통해 보냅니다.",
    caution: "전송 성공은 주문 업무 처리가 끝났다는 뜻이 아닙니다.",
  },
  {
    name: "Broker",
    ko: "브로커",
    game: "레일과 기록을 보관하는 공장 서버",
    meaning: "Kafka 서버입니다. 레코드 저장과 클라이언트 요청을 처리합니다.",
    caution: "기본 local 모드에는 실제 Kafka 브로커가 없습니다.",
  },
  {
    name: "Topic",
    ko: "토픽",
    game: "주문 작업 카드 기록함",
    meaning: "이름으로 구분한 이벤트 로그입니다. 실습 전용 토픽은 invencore.order.lab.v1입니다.",
    caution:
      "읽었다고 레코드가 삭제되는 것은 아닙니다. 보관 정책에 따라 남아 있어 재처리할 수 있습니다.",
  },
  {
    name: "Partition",
    ko: "파티션",
    game: "색깔 레일 하나",
    meaning: "토픽을 나눈 순서 있는 로그입니다. 순서는 같은 파티션 안에서만 보장됩니다.",
    caution: "서로 다른 레일의 앞뒤 순서는 비교할 수 없습니다.",
  },
  {
    name: "Key",
    ko: "키",
    game: "같은 택배를 묶는 주문 ID",
    meaning: "같은 업무의 이벤트를 같은 파티션으로 보내는 기준으로 쓸 수 있습니다.",
    caution:
      "파티션 수와 분배 규칙이 고정돼 있어야 같은 키가 같은 파티션으로 갑니다. Kafka가 잘못 발행한 업무 순서를 고쳐주지는 않습니다.",
  },
  {
    name: "Offset",
    ko: "오프셋",
    game: "레일 안의 카드 위치 번호",
    meaning:
      "레코드가 파티션에 기록된 위치입니다. 예를 들어 P0의 7번과 P1의 7번은 다른 위치입니다.",
    caution:
      "주문 업무 순번(sequence)과 다릅니다. 파티션이 다르면 숫자 크기로 먼저 발생한 이벤트를 판단할 수 없습니다.",
  },
  {
    name: "Consumer",
    ko: "소비자",
    game: "카드를 읽고 처리하는 작업자",
    meaning: "파티션에서 읽은 레코드로 업무를 처리하는 클라이언트입니다.",
    caution: "읽은 위치와 처리 완료를 커밋한 위치는 다를 수 있습니다.",
  },
  {
    name: "Consumer Group",
    ko: "소비 그룹",
    game: "배송 팀과 독립 검수 팀",
    meaning:
      "같은 그룹의 소비자는 파티션을 나눠 처리합니다. 다른 그룹은 각자 위치를 관리하며 같은 이벤트를 독립적으로 읽습니다.",
    caution:
      "일반 소비 그룹에서 같은 파티션은 한 시점에 그룹 내 한 소비자에게 할당됩니다. 같은 그룹의 모두에게 복사되는 방식은 아닙니다.",
  },
  {
    name: "Concurrency",
    ko: "소비 동시성",
    game: "한 팀의 작업자 수",
    meaning: "이 예제의 실제 Kafka 모드는 그룹마다 3개 리스너 소비자를 만듭니다.",
    caution:
      "파티션이 3개라면 같은 그룹에 소비자를 더 늘려도 동시에 담당할 파티션이 없는 소비자는 대기합니다. 속도 증가를 보장하지 않습니다.",
  },
  {
    name: "Committed Offset",
    ko: "커밋 오프셋",
    game: "다음에 이어 읽을 책갈피",
    meaning:
      "그룹별·파티션별로 저장한 재시작 위치입니다. offset 41을 처리했다면 보통 42를 커밋합니다.",
    caution:
      "마지막 처리 번호를 그대로 저장하는 것이 아닙니다. DB 저장과 Kafka 커밋은 이 예제에서 별도 단계입니다.",
  },
  {
    name: "Consumer Lag",
    ko: "소비 지연·적체",
    game: "아직 커밋되지 않은 카드 수",
    meaning:
      "화면에서는 파티션의 끝 오프셋에서 커밋 오프셋을 뺀 값입니다. 멈춘 팀에 새 카드가 오면 커집니다.",
    caution:
      "이미 읽어 처리 중인 것도 포함할 수 있어 정확한 작업 큐 길이와 같지는 않습니다. 이 화면은 실습 토픽 전체 기준입니다.",
  },
  {
    name: "Acknowledgment / Commit",
    ko: "소비 확인·커밋",
    game: "일을 끝내고 책갈피 저장",
    meaning:
      "참고 예제는 JPA 반영 뒤 acknowledgment.acknowledge()를 호출합니다. 내 코드 모드는 계산한 다음 오프셋을 consumer.commitSync로 저장합니다.",
    caution:
      "주문 리스너는 MANUAL_IMMEDIATE입니다. 생산자의 acks 설정과 소비자의 처리 완료 커밋은 다른 개념입니다.",
  },
  {
    name: "acks / Idempotent Producer",
    ko: "생산자 전송 확인·멱등 발행",
    game: "접수대가 공장에 기록됐는지 확인",
    meaning:
      "현재 생산자는 acks=all과 enable.idempotence=true를 사용합니다. 생산자 재시도로 생기는 중복을 줄이는 설정입니다.",
    caution:
      "업무 중복 처리를 모두 막거나 종단 간 정확히 한 번 처리를 보장하지 않습니다. 현재 단일 브로커 예제는 복제 장애 실험도 아닙니다.",
  },
  {
    name: "Seek / Replay",
    ko: "위치 이동·재처리",
    game: "완료 카드 기록 되감기",
    meaning:
      "소비 위치를 바꿔 이미 남아 있는 기록을 다시 읽습니다. 게임은 현재 주문의 시작 위치, 상세 실습은 토픽 시작 위치로 이동합니다.",
    caution:
      "다른 그룹의 커밋을 바꾸거나 기록을 지우는 동작이 아닙니다. 이동한 위치 이후 다른 주문도 읽을 수 있습니다.",
  },
  {
    name: "Idempotency",
    ko: "업무 멱등성",
    game: "같은 작업을 다시 읽어도 두 번 발송하지 않기",
    meaning:
      "같은 작업을 반복해도 업무 결과가 중복되지 않도록 처리합니다. 이 예제는 더 새로운 업무 sequence만 반영합니다.",
    caution:
      "DB에 단순히 같은 메시지를 다시 insert하는 것만으로 보장되지 않습니다. 업무 종류에 맞는 중복 기준과 트랜잭션이 필요합니다.",
  },
  {
    name: "At-least-once",
    ko: "한 번 이상 전달",
    game: "처리한 카드가 다시 올 수 있음",
    meaning: "DB 저장 후 Kafka 커밋 전에 중단되면 같은 이벤트가 다시 전달될 수 있습니다.",
    caution:
      "재전달을 고려한 업무 멱등성이 필요합니다. 이 예제는 정확히 한 번 처리를 주장하지 않습니다.",
  },
  {
    name: "DLT",
    ko: "실패 이벤트 격리 토픽",
    game: "반복 실패한 카드 보관함",
    meaning:
      "애플리케이션의 오류 처리기가 재시도 후 실패 레코드를 별도 토픽에 보냅니다. 이 프로젝트는 .DLT 이름을 사용합니다.",
    caution:
      "Kafka가 모든 실패를 자동 해결하는 기능은 아닙니다. 원인 수정과 재처리 정책은 별도로 필요합니다.",
  },
  {
    name: "Rebalance",
    ko: "소비자 재할당",
    game: "팀원이 바뀌어 레일 담당 다시 정하기",
    meaning: "소비자가 그룹에 들어오거나 나갈 때 파티션 담당이 달라질 수 있습니다.",
    caution:
      "파티션 할당과 재처리를 고려해야 합니다. 로컬 모형은 실제 그룹 코디네이터를 재현하지 않습니다.",
  },
  {
    name: "Retention",
    ko: "보관 정책",
    game: "카드 기록을 남겨두는 기간·크기",
    meaning: "브로커의 정책에 따라 레코드를 보관합니다. 남아 있는 범위에서만 재처리할 수 있습니다.",
    caution:
      "항상 offset 0부터 다시 읽을 수 있는 것은 아닙니다. 가장 이른 남은 위치는 beginning offset으로 확인합니다.",
  },
];

export const kafkaSources = [
  {
    title: "Apache Kafka 설계",
    url: "https://kafka.apache.org/41/design/design/",
  },
  {
    title: "KafkaConsumer와 오프셋",
    url: "https://kafka.apache.org/41/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html",
  },
  {
    title: "Spring Kafka 리스너와 Ack",
    url: "https://docs.spring.io/spring-kafka/reference/4.0/kafka/receiving-messages/listener-annotation.html",
  },
  {
    title: "Spring Kafka Seek",
    url: "https://docs.spring.io/spring-kafka/reference/4.0/kafka/seek.html",
  },
];

export const kafkaExercises = [
  {
    id: "partition",
    title: "같은 주문을 같은 파티션으로",
    method: "selectPartition",
    rule: "KEYED는 같은 주문의 4단계를 같은 파티션에, SPREAD는 0→1→2→0으로 보내세요. 반환값은 0~2입니다.",
    hint: "고정된 파티션 수에서 주문 ID를 해시하세요. 음수 나머지에 주의하세요.",
    observe: "레일 선택 미션에서 한 주문의 카드가 같은 레일에 모이는지 확인합니다.",
  },
  {
    id: "offset",
    title: "처리한 다음 위치를 저장하기",
    method: "nextOffset",
    rule: "처리한 오프셋 뒤의 위치를 반환하세요. 0 처리 후 1, 41 처리 후 42가 다음 읽을 위치입니다.",
    hint: "오프셋은 long입니다. 마지막 처리 번호와 다음 위치를 구분하세요.",
    observe: "내 코드가 로컬 체크포인트와 실제 Kafka consumer.commitSync에 전달됩니다.",
  },
  {
    id: "idempotency",
    title: "중복·과거 업무 버전 막기",
    method: "shouldApply",
    rule: "저장 버전보다 새로운 업무 sequence만 true로 반환하세요. 같은 버전과 과거 버전은 false입니다.",
    hint: "이 비교의 기준은 업무 sequence입니다. 파티션의 offset을 비교하지 않습니다.",
    observe: "되감기 미션에서 발송 건수는 그대로이고 중복 작업 차단 수가 증가해야 합니다.",
  },
];
