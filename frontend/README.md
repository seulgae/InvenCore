# InvenCore 프론트엔드

IntelliJ 스타일 다크 작업창에서 기술 카드를 탐색하고, 실제 기능·구현 소스·아키텍처를 확인하는 React 애플리케이션입니다.

## 실행과 검사

이 디렉터리에서 실행합니다. Node.js 22.12 이상이 필요합니다.

```sh
npm ci
npm run dev
npm run lint
npm run build
```

개발 서버 주소는 터미널 출력을 확인하세요. `/api`는 Vite에서 `http://localhost:8080`으로 프록시합니다. 별도의 API 주소 `.env`는 사용하지 않습니다. 백엔드 실행·H2·선택 기능 설정은 [루트 README](../README.md)를 참고하세요.

## 화면 구성

- `pages/MainPage.jsx`: Project 트리, 도구 창, 문서 탭, 로그인 모달, 상태 표시줄
- `pages/InventoryPage.jsx`: 카드 검색·분류·정렬
- `pages/InventoryDetailPage.jsx`: 노트·실행·소스·아키텍처·구현 자료 탭
- `components/inventory/SourceViewer.jsx`: 파일 탐색·구문 강조·줄 번호·복사
- `components/inventory/ImplementationReference.jsx`: 관련 의존성, 클래스 import, 메서드별 실제 코드
- `components/inventory/ArchitectureView.jsx`: 카드 메타데이터 기반 호출 흐름
- `components/inventory/ImplementationNotes.jsx`: 폭을 제한한 구현 노트, 핵심 구현·세로 처리 흐름·조건·핵심 소스 목록
- `components/inventory/FeatureDemo.jsx`: 기존 화면과 실제 API 연결
- `components/inventory/JavaPracticePanel.jsx`, `data/inventoryPractice.js`: Kafka 외 8개 카드의 Java TODO·힌트·소스 링크·실행 코드 검사. SSH 카드도 로그인 없이 독립 과제를 검사합니다. [전체 과제 안내](../docs/INVENTORY_PRACTICE.md)
- `pages/benchmark/BenchmarkPage.jsx`: 병렬 스트림·인덱스 튜닝 비교, 시간 차트·반복값·실행 계획·최근 실행
- `pages/gwsync/GwSyncPage.jsx`: JPA 원본·연동 대상·모드별 형상 캐시 비교, 생성·수정·논리 삭제와 상태 갱신
- `pages/gwsync/OrderLabPage.jsx`: 주문 상태 이벤트 실험실. 키/파티션 전략, 두 소비 그룹 제어, offset·lag·재처리·업무 버전 방어 관찰
- `components/inventory/ParcelFactoryGame.jsx`: 택배 공장 미니게임. 레일 선택·잠든 작업자·되감기 방어전의 성공 여부를 실제 처리 기록으로 판단합니다. 세부 Kafka 기록은 펼쳐 확인합니다.
- `components/inventory/KafkaPracticePanel.jsx`, `data/kafkaLearning.js`: Java TODO 과제·코드 검사·구현 선택과 게임에 연결한 용어 20개 검색. 실제 Java 편집과 테스트는 IntelliJ·Gradle에서 진행합니다.
- GW 형상은 컬럼별 입력칸으로 표시합니다. 원본 name·description은 직접 편집하고, 자동 컬럼과 대상·캐시는 읽기 전용으로 비교합니다. JSON 원문은 별도로 펼칠 수 있습니다.
- `data/inventory.js`, `data/methodReference.js`: 카드 설명과 메서드 노트
- `styles/Theme.css`: 공통 다크 테마와 IDE 작업창 스타일

## 링크와 데이터

주문 이벤트 실험실은 `/inventory/kafka-lab?tab=demo`에서 실행합니다. 기본 local 모형과 external Kafka 실측을 구분합니다. 실습 ID는 sessionStorage에 보관하고 서버 초기화로 실행이 없으면 새 실습 안내를 표시합니다. 파티션 상태는 전용 실습 토픽 전체, 타임라인·처리 기록은 선택 실행 기준입니다. 일시정지 후 새 이벤트를 발행하거나 처음부터 재처리·재개하여 lag와 중복 방어를 관찰합니다.

GW 연동 카드는 `/inventory/gw-sync?tab=demo`에서 실행합니다. 기본 local 모드는 외부 서버 없이 실행합니다. 실제 Kafka·Redis를 사용하려면 백엔드를 `GW_SYNC_MODE=external`로 실행합니다. 화면에서 현재 모드·이벤트 전달·캐시 종류를 구분하며, 최근 원본 20개와 두 DB·캐시 스냅샷을 2.5초마다 비교합니다. 캐시 상태의 LOCAL 접두사는 메모리 캐시를 의미합니다.

- `/`: 카드 목록. 검색 `q`, 분류 `category`, 정렬 `sort`를 URL에 저장
- `/inventory/:itemId`: 카드 상세
- `?tab=source&file=2`: 소스 탭에서 세 번째 파일 선택
- `/requestboard`, `/requestboard/regist`, `/requestboard/:id`, `/requestboard/edit/:id`: 요청 게시판 실행 화면
- `/servercapacity`: 인증이 필요한 선택적 서버용량조사 화면

게시판·댓글·파일 첨부는 로그인 없이 실행하며, 작성자는 `demo`입니다. JWT 인증은 별도 예제입니다. 실제 실행의 변경 사항은 백엔드 데이터에 반영됩니다. 코드와 구조도는 백엔드 없이도 열 수 있습니다.

성능 비교 카드는 `/inventory/parallel-stream?tab=demo`, `/inventory/index-tuning?tab=demo`에서 실행합니다. `/api/benchmarks`는 로그인 없이 호출합니다. 서버 시작 시 기본 30만 행씩 두 테이블을 준비하고, 버튼 실행으로 실제 측정값을 표시합니다. 워밍업 2회·측정 5회의 중앙값을 비교하며 느려진 결과도 그대로 표시합니다. 최근 8회 기록은 현재 화면에서만 유지됩니다. 데이터 크기는 백엔드의 `BENCHMARK_ROWS`로 조절합니다. 데이터 생성·조회는 MyBatis Mapper XML로 수행하며, 카드에서 Mapper 인터페이스와 SQL 문별 설명·원문을 확인할 수 있습니다.

소스 뷰어는 예제 복사본 대신 실제 파일을 읽습니다. 백엔드 구현 파일은 `config/inventorySourcePlugin.js`의 명시적 허용 목록으로만 공개합니다. 새 카드나 소스 추가 시 설명·구조도·라이브러리 목록·메서드 노트를 함께 확인하세요. 런타임 설정과 키 파일은 포함하지 않습니다.

빌드하려면 형제 디렉터리인 `../backend`도 함께 있어야 합니다. 빌드 결과는 `dist/`에 생성됩니다. 외부 서버 배포 방법은 현재 저장소에서 별도로 구성하지 않습니다.
