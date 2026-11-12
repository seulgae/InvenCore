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
- `components/inventory/FeatureDemo.jsx`: 기존 화면과 실제 API 연결
- `pages/benchmark/BenchmarkPage.jsx`: 병렬 스트림·인덱스 튜닝 비교, 시간 차트·반복값·실행 계획·최근 실행
- `data/inventory.js`, `data/methodReference.js`: 카드 설명과 메서드 노트
- `styles/Theme.css`: 공통 다크 테마와 IDE 작업창 스타일

## 링크와 데이터

- `/`: 카드 목록. 검색 `q`, 분류 `category`, 정렬 `sort`를 URL에 저장
- `/inventory/:itemId`: 카드 상세
- `?tab=source&file=2`: 소스 탭에서 세 번째 파일 선택
- `/requestboard`, `/requestboard/regist`, `/requestboard/:id`, `/requestboard/edit/:id`: 요청 게시판 실행 화면
- `/servercapacity`: 인증이 필요한 선택적 서버용량조사 화면

게시판·댓글·파일 첨부는 로그인 없이 실행하며, 작성자는 `demo`입니다. JWT 인증은 별도 예제입니다. 실제 실행의 변경 사항은 백엔드 데이터에 반영됩니다. 코드와 구조도는 백엔드 없이도 열 수 있습니다.

성능 비교 카드는 `/inventory/parallel-stream?tab=demo`, `/inventory/index-tuning?tab=demo`에서 실행합니다. `/api/benchmarks`는 로그인 없이 호출합니다. 서버 시작 시 기본 30만 행씩 두 테이블을 준비하고, 버튼 실행으로 실제 측정값을 표시합니다. 워밍업 2회·측정 5회의 중앙값을 비교하며 느려진 결과도 그대로 표시합니다. 최근 8회 기록은 현재 화면에서만 유지됩니다. 데이터 크기는 백엔드의 `BENCHMARK_ROWS`로 조절합니다.

소스 뷰어는 예제 복사본 대신 실제 파일을 읽습니다. 백엔드 구현 파일은 `config/inventorySourcePlugin.js`의 명시적 허용 목록으로만 공개합니다. 새 카드나 소스 추가 시 설명·구조도·라이브러리 목록·메서드 노트를 함께 확인하세요. 런타임 설정과 키 파일은 포함하지 않습니다.

빌드하려면 형제 디렉터리인 `../backend`도 함께 있어야 합니다. 빌드 결과는 `dist/`에 생성됩니다. 외부 서버 배포 방법은 현재 저장소에서 별도로 구성하지 않습니다.
