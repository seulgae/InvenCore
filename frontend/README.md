# InvenCore 기술 인벤토리

기능별 카드에서 구현 노트, 실제 실행 화면, 소스 코드와 아키텍처를 확인하는 React 프론트엔드입니다.

## 실행

```sh
npm ci
npm run dev
```

개발 서버의 `/api` 요청은 `http://localhost:8080`으로 전달됩니다. 코드·구조도는 백엔드 없이 열 수 있으며, 실제 기능 실행에는 백엔드가 필요합니다. 서버용량조사는 별도의 기능 활성화·서버 목록·SSH 키 설정이 필요합니다.

## 화면과 소스 구성

- `src/data/inventory.js`: 카드 메타데이터, 구현 설명, 구조도 노드, 공개할 소스 연결
- `src/pages/InventoryPage.jsx`: 분류·검색·정렬을 지원하는 카드 보관함
- `src/pages/InventoryDetailPage.jsx`: 아이템별 노트·실행·소스·아키텍처 작업창
- `src/components/inventory`: 소스 탐색기, 구조도, 실제 기능 실행 패널
- `config/inventorySourcePlugin.js`: 허용 목록에 있는 백엔드 구현 파일을 소스 모듈로 제공

`/inventory/:itemId?tab=source&file=2`처럼 아이템·탭·파일을 직접 연결할 수 있습니다. 인벤토리 검색·분류·정렬도 URL에 보관됩니다.

## 아이템 추가

`inventory.js`에 아이템 메타데이터와 구조도, 실제 구현 파일을 등록하고 `FeatureDemo.jsx`에 실행 화면을 연결합니다. 새 백엔드 소스를 공개하려면 `inventorySourcePlugin.js`의 허용 목록에도 정확한 파일 경로를 추가합니다.

소스는 예제 복사본이 아닌 실제 프로젝트 파일에서 읽습니다. 배포 빌드에는 빌드 시점의 내용이 포함되고, 개발 중에는 선택한 백엔드 파일의 변경을 감지합니다. 설정 파일·환경변수 파일·개인키는 공개 목록에 포함하지 않습니다.

실행 탭은 실제 API를 사용하며, 작성·수정·삭제는 실제 데이터에 반영됩니다. DB 설정과 백엔드 실행 방법은 루트 README를 참고하세요.

## 검증

```sh
npm run build
npm run lint
```
