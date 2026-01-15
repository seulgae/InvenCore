# InvenCore 프로젝트

이 프로젝트는 Spring Boot를 사용한 백엔드와 React를 사용한 프론트엔드로 구성된 풀스택 웹 애플리케이션입니다.

## 🛠️ 기술 스택 (Tech Stack)

### Backend
- **Framework**: Spring Boot (버전 정보는 `pom.xml` 또는 `build.gradle` 확인 필요)
- **Language**: Java (JDK 버전 정보는 `pom.xml` 또는 `build.gradle` 확인 필요)
- **Dependencies**:
  - Spring Web
  - Lombok

### Frontend
- **Framework**: React
- **Build Tool**: Vite
- **Language**: JavaScript (JSX)
- **Dependencies**:
  - Axios (HTTP Client)

### Build & Package
- **Backend**: Maven 또는 Gradle (프로젝트 구성에 따라 다름)
- **Frontend**: npm 또는 yarn

---

## ⚙️ 프로젝트 설정 및 실행 방법

### Prerequisites

프로젝트를 실행하기 위해 다음 소프트웨어가 설치되어 있어야 합니다.

- **JDK**: 17 또는 그 이상 (프로젝트 `pom.xml` 또는 `build.gradle`의 `java.version` 확인)
- **Node.js**: 18.x 또는 그 이상
- **IDE**: IntelliJ IDEA, VS Code 등

### 1. Backend 서버 실행

1.  프로젝트를 IDE(예: IntelliJ)로 엽니다.
2.  `backend` 디렉토리로 이동합니다.
3.  IDE에서 `InvenCoreApplication.java` 파일을 찾아 실행하거나, 터미널에서 아래 명령어를 입력합니다.

    ```bash
    # Maven 사용 시
    ./mvnw spring-boot:run

    # Gradle 사용 시
    ./gradlew bootRun
    ```
4.  서버가 정상적으로 실행되면 `http://localhost:8080` 에서 동작합니다.

### 2. Frontend 서버 실행

1.  새 터미널을 엽니다.
2.  `frontend` 디렉토리로 이동합니다.

    ```bash
    cd frontend
    ```
3.  필요한 패키지를 설치합니다.

    ```bash
    npm install
    ```
4.  개발 서버를 시작합니다.

    ```bash
    npm run dev
    ```
5.  프론트엔드 애플리케이션이 `http://localhost:5173` 에서 실행됩니다. 브라우저에서 이 주소로 접속하세요.

---

## 📖 API 엔드포인트

- `POST /api/members/register`: 회원가입
- `POST /api/members/login`: 로그인
