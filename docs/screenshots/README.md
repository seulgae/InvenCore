# 실행 화면 캡처 목록

2026-11-13 실제 로컬 화면 16장입니다. [전체 예제 인덱스](../EXAMPLES.md)에서 패키지 README로 이동할 수 있습니다.

기본 H2 메모리 DB와 local GW·Kafka 학습 모형을 사용했습니다. 원격 SSH 수집·외부 Kafka/Redis·실제 AWS 배포는 수행하지 않았습니다. 화면의 계정·게시글은 합성 샘플입니다.

| 이미지 | 확인한 동작 / 범위 |
| --- | --- |
| [parallel-stream-result.jpg](parallel-stream-result.jpg) | 30만 행 기준 순차·병렬 CPU 연산의 실제 측정 결과. 환경별로 달라집니다. |
| [index-tuning-result.jpg](index-tuning-result.jpg) | 동일한 30만 행 두 테이블에 대한 복합 인덱스 유무의 실제 집계 시간 비교. |
| [gw-sync-created.jpg](gw-sync-created.jpg) | 기본 local 모드에서 원본 v1·대상 v1과 메모리 형상 캐시를 연동한 실제 화면. |
| [gw-sync-updated.jpg](gw-sync-updated.jpg) | 원본 수정 후 revision 2가 대상과 캐시에 반영된 local 모드 실행 화면. |
| [kafka-order-complete.jpg](kafka-order-complete.jpg) | local 학습 모형에서 같은 레일의 접수→결제→포장→발송을 실제 처리 기록으로 확인한 화면. |
| [kafka-paused-backlog.jpg](kafka-paused-backlog.jpg) | 주문 처리 그룹은 일시정지하고 감사 그룹만 12개 이벤트를 기록한 local 모형. |
| [kafka-replay-result.jpg](kafka-replay-result.jpg) | local 모드에서 재처리한 과거·중복 작업 4장을 차단하고 정상 발송은 1개를 유지한 화면. |
| [auth-registered.jpg](auth-registered.jpg) | 문서용 임시 계정 ReadmeDemo의 회원가입 완료. 비밀번호·토큰 원문은 포함하지 않았습니다. |
| [auth-logged-in.jpg](auth-logged-in.jpg) | 동일한 임시 계정의 로그인 완료와 AUTHENTICATED 상태. |
| [board-list.jpg](board-list.jpg) | 문서용 샘플 게시글 등록 완료 후 조회한 실제 목록. |
| [files-attached.jpg](files-attached.jpg) | 실제 저장한 첨부파일의 다운로드 링크가 표시된 게시글 상세. |
| [comments-thread.jpg](comments-thread.jpg) | 실제 저장된 부모 댓글과 직계 답글. 작성자는 공개 예제의 demo입니다. |
| [capacity-practice.jpg](capacity-practice.jpg) | SSH 비활성 상태에서 고정 df 샘플 과제만 검사한 화면. TODO 미구현은 의도된 학습 상태이며 원격 수집 성공 화면이 아닙니다. |
| [aws-cicd-guide.jpg](aws-cicd-guide.jpg) | AWS 배포 가이드의 배포·상태 확인 단계. 템플릿 설명 화면이며 실제 AWS 명령은 실행하지 않았습니다. |
| [aws-cicd-architecture.jpg](aws-cicd-architecture.jpg) | 아직 배포하지 않은 AWS 참고 구조도. GitHub Actions·S3·SSM·EC2의 역할을 설명하는 화면. |
| [inventory-overview.jpg](inventory-overview.jpg) | 현재 기술 인벤토리의 카드 목록. 총 10개 예제가 등록되어 있습니다. |

## 촬영 환경과 재현

- 프론트: `http://localhost:5175`
- 백엔드: `http://127.0.0.1:18080`
- Java 17 · H2 메모리 DB · 비교 테이블당 300000행
- 실행 모드: `GW_SYNC_MODE=local`
- [캡처별 원본 경로와 모드](captures.json)
- [첨부파일 샘플](../fixtures/readme-demo.txt)

같은 파일명으로 이미지를 갱신할 때는 README·날짜·모드도 함께 맞춥니다. 배율·시각·ID는 촬영 당시 값이며 다시 실행하면 달라질 수 있습니다.
