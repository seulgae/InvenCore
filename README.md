# InvenCore 프로젝트 (Fullstack) - 배포 완전체 README.md

InvenCore는 **Spring Boot 기반 백엔드**와 **React(Vite) 기반 프론트엔드**로 구성된 **풀스택 재고 관리 웹 애플리케이션**입니다.  
본 문서는 **로컬 실행 + 운영 배포(Backend/Frontend) + 환경변수 + CORS + Nginx 서빙**까지 포함한 통합 안내서입니다.

---

## 📦 1. 프로젝트 구성

- **Backend**: 재고 관리 및 핵심 비즈니스 로직 제공 (REST API)
- **Frontend**: 사용자 UI 제공 및 백엔드 API 호출

---

## 🛠️ 2. 기술 스택 (Tech Stack)

### Backend
- **Framework**: Spring Boot **4.0.1**
- **Language**: Java **17**
- **Build Tool**: Gradle
- **Database**: PostgreSQL
- **Core Dependencies**
  - Spring Web
  - Spring Data JPA
  - Spring Security (JWT)
  - Spring Boot Validation
- **Libraries**
  - Lombok
  - JJWT (Java JWT)
  - PostgreSQL Driver

### Frontend
- **Framework**: React
- **Build Tool**: Vite
- **Language**: JavaScript (JSX)
- **HTTP Client**: Axios

---

## ⚙️ 3. 로컬 개발 환경 설정 및 실행

### 3-1. 사전 준비 (Prerequisites)

- **JDK**: 17 이상
- **Node.js**: 18.x 이상
- **PostgreSQL**
- (선택) IntelliJ / VS Code

---

### 3-2. PostgreSQL 설정

PostgreSQL 서버를 설치하고 아래 정보로 데이터베이스 및 사용자를 생성합니다.

- **데이터베이스 이름**: `invencore`
- **사용자 이름**: `invenmaster`
- **비밀번호**: `invencore123`

`backend/src/main/resources/application.yml`의 datasource 설정을 확인/수정합니다.

예시:

```yaml
datasource:
  url: jdbc:postgresql://localhost:5432/invencore
  username: invenmaster
  password: invencore123
```

---

### 3-3. 프로젝트 클론

```bash
git clone [프로젝트_레포지토리_URL]
cd InvenCore
```

---

## ✅ 4. Backend 실행 (Local)

### 4-1. IDE 실행
1. IntelliJ 등 IDE로 프로젝트 오픈
2. `backend` 의존성 Gradle 동기화
3. `backend/src/main/java/com/inven/core/InvenCoreApplication.java` 실행

### 4-2. 터미널 실행 (Gradle)

```bash
cd backend
./gradlew bootRun
```

- 접속: `http://localhost:8080`

---

## ✅ 5. Frontend 실행 (Local)

```bash
cd frontend
npm install
npm run dev
```

- 접속: `http://localhost:5173`

---

## 🔐 6. Frontend 환경변수 설정 (.env)

프론트엔드에서 백엔드 API 주소를 바꿀 수 있도록 `.env`를 사용하는 것을 권장합니다.

### 6-1. 개발용 예시 (`frontend/.env.development`)
```env
VITE_API_BASE_URL=http://localhost:8080
```

### 6-2. 운영용 예시 (`frontend/.env.production`)
```env
VITE_API_BASE_URL=https://api.your-domain.com
```

### 6-3. Axios 예시
```js
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
});
```

---

## 🌍 7. Backend CORS 설정 예시

운영 환경에서 프론트 도메인 접근을 허용하려면 CORS 설정이 필요합니다.

### 7-1. application.yml 예시 (allowed-origins)
```yaml
cors:
  allowed-origins:
    - http://localhost:5173
    - https://your-domain.com
```

### 7-2. Spring Security CORS 설정 예시 (권장 방식)
> 프로젝트 구조에 맞게 `SecurityConfig`에 반영하세요.

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowCredentials(true);
    config.addAllowedOrigin("http://localhost:5173");
    config.addAllowedOrigin("https://your-domain.com");
    config.addAllowedHeader("*");
    config.addAllowedMethod("*");

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
}
```

---

## 🚀 8. Backend 배포 방법 (운영)

### 8-1. JAR 빌드

```bash
cd backend
./gradlew bootJar
```

- 생성 위치: `backend/build/libs/`
- 예시 파일명: `InvenCore-0.0.1-SNAPSHOT.jar`

---

### 8-2. 서버 실행

```bash
# 기본 프로필 실행
java -jar InvenCore-0.0.1-SNAPSHOT.jar

# 운영(prod) 프로필 실행
java -jar InvenCore-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

---

### 8-3. 운영 application.yml 설정 예시

```yaml
datasource:
  url: jdbc:postgresql://[DB_HOST]:5432/invencore
  username: invenmaster
  password: invencore123

file:
  upload-dir: /home/ec2-user/app/upload

jwt:
  secret: ${JWT_SECRET}
```

> ✅ 운영 환경에서는 `jwt.secret`을 코드/파일에 박지 말고 **환경 변수로 주입**하는 것을 강력히 권장합니다.

---

## 🌐 9. Frontend 배포 방법 (Vite Build + Nginx)

### 9-1. 프론트 빌드

```bash
cd frontend
npm install
npm run build
```

- 빌드 결과물: `frontend/dist/`

---

### 9-2. dist 파일 서버로 업로드

예시 (서버 경로):
- `/var/www/invencore/`

업로드 예시:

```bash
# 로컬에서 서버로 dist 업로드 예시
scp -r dist/* ec2-user@YOUR_SERVER_IP:/var/www/invencore/
```

---

### 9-3. Nginx 설정 예시 (정적 서빙 + SPA 라우팅)

`/etc/nginx/conf.d/invencore.conf` 예시:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/invencore;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

설정 반영:

```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔁 10. (권장) Nginx로 API Reverse Proxy 구성

프론트 도메인과 API 도메인을 통합하면 CORS/인증 문제가 훨씬 단순해집니다.

### 10-1. 예시 구조
- Front: `https://your-domain.com`
- API: `https://your-domain.com/api` → Backend로 프록시

### 10-2. Nginx 설정 예시

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/invencore;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

이 경우 프론트 `.env.production`은 이렇게 쓰는 게 깔끔합니다:

```env
VITE_API_BASE_URL=/api
```

---

## 📖 11. 주요 API 엔드포인트

- `POST /api/members/register` : 회원가입
- `POST /api/members/login` : 로그인
- (추가 API는 프로젝트 확장에 따라 계속 추가)

---

## ✅ 12. 실행 주소 요약

### Local
- Backend: `http://localhost:8080`
- Frontend: `http://localhost:5173`

### Production (예시)
- Frontend: `https://your-domain.com`
- Backend(API):
  - 분리 도메인: `https://api.your-domain.com`
  - 프록시 통합: `https://your-domain.com/api`
