# 백엔드 패키지 안내

Java 17 · Spring Boot 4 · H2 메모리 DB를 사용하는 기술 인벤토리 예제입니다.

[전체 카드·실행 이미지 인덱스](../docs/EXAMPLES.md)

| 기능 패키지 | 포함 예제 |
| --- | --- |
| [Kafka 미니게임](src/main/java/com/inven/core/backend/api/orderlab/README.md) | 그룹·오프셋·순서·재처리 |
| [GW 데이터 연동](src/main/java/com/inven/core/backend/api/gwsync/README.md) | JPA 원본→대상, JSON 형상 캐시 |
| [성능 비교](src/main/java/com/inven/core/backend/api/benchmark/README.md) | 병렬 스트림 + 복합 인덱스 |
| [JWT 인증](src/main/java/com/inven/core/backend/api/member/README.md) | 회원가입·BCrypt·JWT |
| [게시판·첨부](src/main/java/com/inven/core/backend/api/requestboard/README.md) | CRUD·검색·Multipart·다운로드 |
| [댓글·답글](src/main/java/com/inven/core/backend/api/comment/README.md) | 부모와 직계 답글 |
| [서버용량조사](src/main/java/com/inven/core/backend/api/serverCapacity/README.md) | 선택적 외부 SSH 수집 |
| [Java 구현 과제](src/main/java/com/inven/core/backend/api/practice/README.md) | Kafka 외 8개 독립 검사 |

공통 인증은 `security/JwtAuthenticationFilter`, 토큰 처리는 `util/JwtUtil`, HTTP 공개 경로·예외 응답은 `config`, 상태 확인은 `controller/HealthController`가 담당합니다. 기능별 README의 소스 링크에서 함께 따라갈 수 있습니다.

[프로젝트 실행·환경 설정](../README.md) · [향후 AWS 배포 참고](../deployment/README.md)
