# Java TODO로 완성하는 택배 공장

학습 파일: `backend/src/main/java/com/inven/core/backend/api/orderlab/practice/UserKafkaCode.java`

이 파일의 TODO 세 곳은 직접 작성하도록 비워 두었습니다. 컴파일은 되지만 아직 실행하면 `UnsupportedOperationException`이 발생하는 시작 코드입니다. 기본 `REFERENCE` 모드는 완성된 구현을 사용하므로 계속 플레이할 수 있습니다.

## 진행 순서

1. IntelliJ에서 `UserKafkaCode.java`를 열고 TODO 1~3을 작성합니다.
2. 저장소 루트 터미널에서 아래 학습 테스트를 실행합니다.
3. 테스트가 통과하면 백엔드를 다시 빌드·실행합니다. DevTools를 사용할 때도 수정한 Java가 컴파일되어 서버에 반영되어야 합니다.
4. 카드 실행 화면에서 **반영된 내 코드 검사**를 누릅니다.
5. 기본 계약 검사 통과 후 **내 Java 코드로 플레이**를 선택합니다.
6. 세 미션을 플레이하고 기술 상세에서 파티션·커밋·재처리 결과를 확인합니다.

```powershell
.\backend\gradlew.bat -p backend test --tests "*OrderLabPracticeContractTests" -PorderLabPractice
```

macOS/Linux:

```sh
./backend/gradlew -p backend test --tests '*OrderLabPracticeContractTests' -PorderLabPractice
```

TODO가 비어 있는 처음에는 학습 테스트가 실패하는 것이 정상입니다. 일반 빌드에서는 이 과제 테스트 4개를 건너뛰고, `-PorderLabPractice`를 줄 때 실행합니다. 결과는 `backend/build/reports/tests/test/index.html`에서 확인할 수 있습니다. 브라우저는 임의의 Java를 컴파일하지 않고 현재 서버에 반영된 세 메서드의 기본 계약을 검사합니다.

## TODO 1 — 파티션 선택

메서드: `selectPartition(orderId, sequence, partitions, routing)`

- 반환값은 `0 <= 값 < partitions`입니다.
- KEYED에서는 같은 orderId의 모든 단계가 같은 파티션이어야 합니다.
- 다른 주문들도 하나의 파티션에 모두 몰리지 않게 분산합니다.
- SPREAD는 partitions=3에서 sequence 1,2,3,4를 0,1,2,0으로 보냅니다.
- 힌트: 키 해시·나머지 연산을 사용하고 음수 결과에 주의합니다. 참고 구현의 Murmur2를 그대로 쓸 필요는 없습니다. 파티션을 명시해서 보내므로 직접 만든 안정적인 분배 함수를 사용할 수 있습니다.

연결: `OrderLabStore.start` → 작성한 함수 → 이벤트의 destinationPartition → 실제 Kafka ProducerRecord 또는 로컬 모형.

게임 확인: 같은 택배를 같은 레일로 보내고 네 작업 카드가 같은 파티션에서 순서대로 처리되는지 봅니다. SPREAD의 전역 순서는 보장되지 않습니다.

## TODO 2 — 다음 오프셋

메서드: `nextOffset(processedOffset)`

- 오프셋 0 처리 후 다음 위치는 1입니다.
- 오프셋 41 처리 후 커밋할 다음 위치는 42입니다.
- 입력·반환형은 long입니다. 큰 오프셋을 int로 잘라내지 않습니다.
- 입력 범위는 0 이상 Long.MAX_VALUE 미만입니다.

연결: 내 코드 모드에서는 로컬 체크포인트 계산과 실제 Kafka 리스너의 `consumer.commitSync` 인자에 사용합니다. JPA 반영이 성공한 뒤 커밋하며, 주문 실습용 컨테이너는 `MANUAL_IMMEDIATE`입니다. 완성 예제는 `acknowledgment.acknowledge()`를 호출합니다. 기존 GW 리스너의 RECORD 설정과는 분리되어 있습니다.

게임 확인: 기술 상세에서 커밋 위치와 lag를 보고, 재시작 시 완료한 위치 다음부터 이어 읽는지 확인합니다. DB 트랜잭션과 Kafka 커밋은 하나의 트랜잭션이 아닙니다.

## TODO 3 — 중복·과거 버전 방어

메서드: `shouldApply(storedSequence, incomingSequence)`

- 처음 0에서 1은 반영합니다.
- 4에서 5는 반영합니다.
- 4에서 4는 중복이므로 반영하지 않습니다.
- 4에서 2는 과거 상태이므로 반영하지 않습니다.
- 힌트: 업무 sequence를 비교합니다. 서로 다른 파티션의 offset을 비교하는 문제가 아닙니다.

연결: `OrderLabStore.consume` → 작성한 함수 → 그룹별 `OrderLabProjection` 반영 여부. 되감기 후 같은 레코드를 다시 받아도 이미 완료한 업무를 다시 반영하지 않도록 합니다.

게임 확인: 되감기 방어전에서 발송 택배는 1건을 유지하고 중복·과거 작업 차단 수가 증가해야 합니다.

## 검사 범위와 실행 모드

- 화면 검사와 과제 테스트는 정해진 입력에 대한 계약 검사입니다. 모든 경우의 정확성을 증명하지는 않습니다.
- 계약 검사를 통과하지 않은 LEARNER 실행은 409로 거절하고 REFERENCE는 유지합니다.
- 이벤트에 learner 표시를 저장하므로 이미 발행한 이벤트는 해당 구현 경로로 처리됩니다. 실행 중 학습 코드를 바꾼 경우 새 미션을 시작해 비교하세요.
- local은 내부 모형이며 실제 브로커는 없습니다. external은 실제 Kafka를 사용합니다. 구현 선택(REFERENCE/LEARNER)과 실행 환경(local/external)은 서로 다른 설정입니다.
- 통합 테스트는 테스트 전용 학습 구현을 주입해 실제 브로커 연결 경로를 검증합니다. 테스트가 통과했다고 TODO 파일이 작성됐다는 뜻은 아닙니다.
- 테스트와 서버는 서로 다른 JVM입니다. 테스트 후 실행 중인 서버에도 수정 코드가 반영됐는지 확인하세요.

용어 정리: [Kafka 용어 사전](KAFKA_GLOSSARY.md)
