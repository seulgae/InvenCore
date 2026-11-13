# 기술 인벤토리 구현 과제

9개 구현형 카드에 Java 구현 과제가 있습니다. AWS CI/CD 참고 카드는 배포 가이드입니다. **카드 → 실행 탭 → 직접 구현 과제**에서 TODO 소스와 검사 버튼을 확인하세요. 브라우저의 소스 보기는 읽기 전용입니다. IntelliJ에서 코드를 수정하고 백엔드를 다시 실행해야 검사에 반영됩니다.

완성 예제의 구조와 실제 실행 이미지는 [패키지별 예제 인덱스](EXAMPLES.md)에서 확인합니다.

기존 완성 예제는 그대로 사용할 수 있습니다. 아래 8개 새 과제는 독립된 샘플을 실행하는 연습 공간이며 기존 업무 서비스에 자동 적용되지 않습니다. Kafka 과제는 검사 통과 후 **내 Java 코드로 플레이**를 선택하면 게임 처리에 실제로 적용됩니다.

## 과제 목록

새 과제 경로: `backend/src/main/java/com/inven/core/backend/api/practice/`

| 카드 | 수정 파일 | 직접 구현할 내용 | 완료 기준 |
| --- | --- | --- | --- |
| 택배 공장 · Kafka | `api/orderlab/practice/UserKafkaCode.java` | 파티션 선택, 다음 커밋 오프셋, 중복/역전 이벤트 판단 | 계약 테스트 + 내 코드로 게임 3개 미션 |
| GW 데이터 연동 | `UserGwCode.java` | `shouldApply(storedRevision, incomingRevision)` | 최초/최신 버전 반영, 중복·과거 버전 무시 |
| Parallel Stream | `UserParallelCode.java` | `aggregate(values, parallel, work)` | 순차·병렬 합계 일치, 빈 목록 0, long 범위 |
| 인덱스 튜닝 | `UserIndexCode.java` | `sumSql()`, `indexSql()` | 실제 H2 집계 결과 일치와 EXPLAIN 인덱스 사용 |
| 서버 용량 조사 | `UserCapacityCode.java` | `parseDisk(line)` | df 컬럼 매핑, 탭/공백, 불완전한 응답 거부 |
| 인증 | `UserAuthCode.java` | `encode`, `matches` | BCrypt salt, 정상/실패/누락 비밀번호 처리 |
| 요청게시판 | `UserBoardCode.java` | `page(page, size)` | 0 기준 페이지, id 내림차순, 크기 제한과 offset |
| 첨부파일 | `UserFilesCode.java` | `allowed(filename, bytes)` | 허용 확장자·크기 경계·경로 포함 이름 거부 |
| 댓글 | `UserCommentsCode.java` | `threads(rows, boardId)` | 게시글 격리, 부모/직접 답글 정렬, 고아·다단계 제외 |

TODO에는 입력 조건과 반환 형식을 적어 두었습니다. 작성 전에는 `UnsupportedOperationException`이 발생하며 화면은 이를 **TODO 미구현**으로 표시합니다. 검사 결과는 서버가 실행 중인 코드 기준이며 완료 상태를 저장하거나 코드를 자동 수정하지 않습니다.

## 하나씩 풀기

1. 먼저 기존 완성 예제를 실행해 동작을 확인합니다.
2. 해당 카드 실행 탭에서 TODO 소스를 읽고 IntelliJ에서 같은 파일을 엽니다.
3. TODO 메서드를 작성합니다. 클래스명·메서드 시그니처·Component 등록은 유지합니다.
4. 아래 명령으로 해당 과제만 검사합니다.
5. 백엔드를 다시 실행한 뒤 화면의 **반영된 내 Java 코드 검사**로 결과를 확인합니다. 변경한 소스가 화면에 남아 있다면 소스 탭도 다시 엽니다.
6. 마지막으로 완성 서비스의 같은 로직을 찾아 차이를 복기합니다. 예를 들어 댓글 변환 과제를 마쳤다면 `CommentService`의 부모별 조회와 비교해 보세요.

Windows PowerShell, 프로젝트 루트 기준:

```powershell
# 예: GW 과제만 실행
.\backend\gradlew.bat -p backend test --tests "*InventoryPracticeContractTests.gwSync" -PinventoryPractice

# 8개 새 과제 전체
.\backend\gradlew.bat -p backend test --tests "*InventoryPracticeContractTests" -PinventoryPractice

# 기존 Kafka 과제
.\backend\gradlew.bat -p backend test --tests "*OrderLabPracticeContractTests" -PorderLabPractice

# 9개 카드 전체 과제
.\backend\gradlew.bat -p backend test --tests "*PracticeContractTests" -PinventoryPractice -PorderLabPractice

# 기존 완성 기능 회귀 검사: 과제 테스트는 건너뜀
.\backend\gradlew.bat -p backend test
```

Linux/macOS에서는 `./backend/gradlew -p backend ...`를 사용하세요. JDK 17이 필요합니다.

| 카드 | 개별 테스트 메서드 |
| --- | --- |
| GW | `gwSync` |
| 병렬 처리 | `parallelStream` |
| 인덱스 | `indexTuning` |
| 서버 용량 | `capacity` |
| 인증 | `auth` |
| 게시판 | `board` |
| 첨부파일 | `files` |
| 댓글 | `comments` |

## 과제별 계약과 복기 포인트

### 1. Kafka: 파티션·오프셋·멱등성

[Kafka 실습 가이드](KAFKA_PRACTICE.md)와 [용어 정리](KAFKA_GLOSSARY.md)를 함께 읽으세요. 동일 주문의 파티션 고정과 여러 파티션 분산을 비교하고, 커밋은 마지막 처리 위치의 다음 오프셋이라는 점을 확인합니다. 재생 후 중복 이벤트가 실제 업무 상태를 다시 변경하지 않는지 게임에서 확인합니다. 기본 local은 동작 모델이며 실제 브로커 실습은 external 모드입니다.

### 2. GW: 업무 버전 비교

`stored=0,incoming=1 → true`, `3,5 → true`, `5,5 → false`, `5,2 → false`, `5,6 → true`. 삭제도 버전을 남기는 것으로 생각하세요. 버전 5의 삭제 후 2가 재전달돼도 부활하면 안 됩니다. 이 함수는 버전 비교만 담당하며 실제 JPA 잠금·트랜잭션·캐시 갱신까지 구현한 것은 아닙니다. 완성 예제의 `GwProjectionService`와 비교하세요.

### 3. 병렬 집계: 공유 상태 제거

work는 순수한 `LongUnaryOperator`입니다. 각 값에 적용한 결과를 더하세요. `parallel=false`는 순차 stream, true는 parallelStream으로 구현합니다. `[3000000000,4]`에 두 배 연산을 적용하면 `6000000008`입니다. 원본 목록을 변경하거나 외부 누적 변수를 공유하지 마세요. 검사는 결과 정합성을 확인하며 실제 병렬 사용 여부나 속도 향상을 보장하지 않습니다. 기존 벤치마크에서 별도로 실행 시간·워밍업·샘플 편차를 관찰하세요.

### 4. 인덱스: 실제 SQL과 실행 계획

검사마다 별도 H2 메모리 DB를 생성하고 종료 시 폐기합니다. 애플리케이션·벤치마크 테이블에는 접근하지 않습니다. 테이블은 `practice_orders(id BIGINT PRIMARY KEY, customer_id BIGINT, amount BIGINT)`입니다.

- `sumSql`: customer_id를 `?` 하나로 바인딩하고 `amount` 합계를 `total`이라는 별칭으로 반환합니다. 없는 고객은 0입니다.
- `indexSql`: customer_id 인덱스 이름은 `idx_practice_customer`로 만드세요.
- ID 1..10000, 고객 ID는 ID % 100, 금액은 ID인 데이터에서 고객 42의 합계는 499200입니다.
- 인덱스 전후 합계가 같고 `EXPLAIN`에 해당 인덱스가 등장해야 합니다. 실행 시간 비율로 합격을 판단하지 않습니다.

SQL은 MyBatis XML로 옮길 수 있는 쿼리 작성 연습입니다. 이 과제에서는 JDBC로 격리 실행하며 기존 `BenchmarkMapper.xml`은 수정하지 않습니다.

### 5. 용량 조사: 파싱과 접속의 분리

입력 `/dev/sda 100G 25G 75G 25% /`는 `Disk("100G","25G",25)`입니다. 헤더 없는 데이터 한 줄을 받습니다. 공백/탭, 0%/100%를 지원하고 null·공백·6컬럼 미만·퍼센트 형식 오류는 `IllegalArgumentException`으로 거부하세요. 저장된 출력만 사용하며 SSH 활성화나 개인키가 필요하지 않습니다. SSH 접속과 전체 CPU/메모리 파싱은 기존 완성 코드를 확인하세요.

### 6. 인증: 검증은 PasswordEncoder에 위임

`encode`는 전달받은 encoder를 사용합니다. 같은 비밀번호도 다른 해시가 생성돼야 합니다. `matches`는 원문과 저장된 해시를 비교하며 null 원문/저장 해시, 빈 저장 해시는 false입니다. 샘플 비밀번호만 사용하며 회원 DB를 변경하지 않습니다. 검사에서는 속도를 위해 BCrypt cost 4를 사용하지만 기존 로그인 encoder 설정은 유지합니다. 로그인 전체나 JWT 구현 과제는 아닙니다.

### 7. 게시판: 페이지 요청의 경계

`page >= 0`, `size = 1..100`, 범위 밖은 `IllegalArgumentException`. `PageRequest`와 `id DESC` 정렬을 반환하세요. page 2, size 20은 offset 40입니다. 큰 페이지의 offset은 int 범위를 넘을 수 있습니다. 이 크기 제한은 과제 규칙이며 기존 게시판 API 정책을 변경하지 않습니다.

### 8. 첨부: 허용 목록 검증

png/jpg/jpeg/pdf/txt 확장자를 대소문자 구분 없이 허용합니다. 크기는 1..5242880 바이트입니다. null·공백·`.`·`..`·슬래시·역슬래시 포함 이름과 나머지 확장자는 false입니다. 파일을 디스크에 쓰지 않습니다. 기존 업로드 정책과 별도이며 확장자 검사만으로 완전한 파일 보안을 구현했다고 볼 수 없습니다. 실제 저장 키, MIME/내용 검증은 추가 학습 주제입니다.

### 9. 댓글: 평면 목록을 트리로

입력은 수정할 수 없는 목록일 수 있습니다. 해당 boardId의 parentId=null인 부모를 id 오름차순으로 반환하고 직접 답글도 id 오름차순으로 연결하세요. 다른 게시글, 존재하지 않는 부모, 답글의 답글은 제외합니다. 댓글이 없으면 빈 목록입니다. DB 접근 없이 DTO 변환을 연습하므로 N+1 쿼리 자체를 해결한 것은 아닙니다. 완성 서비스의 조회를 일괄 조회로 바꾸는 후속 과제로 확장할 수 있습니다.

## 검사 구조

`InventoryPractice`의 동일한 고정 샘플을 화면 검사와 `InventoryPracticeContractTests`가 공유합니다. `POST /api/practice/{cardId}/check`는 해당 TODO만 호출하고 항목별 passed/detail 및 전체 ready를 반환합니다. 알 수 없는 카드 ID는 404입니다. Kafka는 기존 `GET /api/order-lab/practice`를 사용합니다.

일반 `InventoryPracticeTests`는 테스트 전용 구현으로 검사기의 정상/실패 경로와 실제 H2 인덱스 검사를 검증합니다. TODO 정답을 사용자 파일에 채워 넣지는 않습니다. 일반 테스트 통과와 사용자 과제 완료는 다른 결과입니다. 정해진 샘플 통과가 모든 입력에 대한 정확성이나 운영 준비를 보장하지는 않습니다.
