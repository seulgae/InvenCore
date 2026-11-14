# Ubuntu 호스트 모니터링 화면

기준: 2026-11-14. `ServerCapacityPage.jsx`는 인증된 `GET /api/server-capacity/host`를 조회합니다.

- CPU·메모리·루트 디스크를 카드와 사용률 막대로 표시합니다.
- 10초 자동 갱신을 켜거나 끄고 수동 새로고침을 할 수 있습니다.
- 요청이 끝난 뒤 다음 조회를 예약해 중첩을 방지하고, 화면 이탈 시 요청·타이머를 취소합니다.
- 실패 시 마지막 결과임을 명시합니다. 로컬 PC·컨테이너 수치로 대체하지 않습니다.
- Hyper-V Ubuntu VM 전체 기준이며 루트 이외 마운트는 포함하지 않습니다.

[설치·수집 기준·안전 배포](../../../../deployment/monitoring/README.md)

기존 `docs/screenshots/capacity-practice.jpg`는 이전 파싱 실습 화면으로, 새 호스트 모니터링의 실측 캡처가 아닙니다.
