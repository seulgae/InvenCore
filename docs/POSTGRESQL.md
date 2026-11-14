# PostgreSQL 전환

앱과 테스트에서 H2 드라이버 및 접속 설정을 제거했습니다. 기존 PostgreSQL 서버를 사용하며 새 운영 DB 컨테이너나 볼륨을 만들지 않습니다.

## 실행 설정

`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`를 실행 환경에 설정합니다. 비밀번호에는 기본값이 없습니다. 예시는 `deployment/templates/application.env.example`(직접 실행)과 `deployment/docker/env.example`(Docker)에 있습니다. Spring 표준 `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`도 사용할 수 있습니다. Compose에서는 DB_* 변수가 필수입니다.

```powershell
$env:DB_URL='jdbc:postgresql://localhost:5432/invencore'
$env:DB_USERNAME='invencore'
# DB_PASSWORD에는 설치된 PostgreSQL의 실제 비밀번호를 설정합니다.
cd backend
.\gradlew.bat bootRun
```

앱 계정에는 대상 데이터베이스 CONNECT와 대상 스키마 USAGE/CREATE, 앱 테이블 접근 권한, 실습용 TEMP 권한이 필요합니다. JPA의 기존 `ddl-auto: update`로 엔티티 테이블과 IDENTITY 키를 관리합니다. 벤치마크 두 테이블 및 복합 인덱스는 MyBatis가 생성합니다. 다른 앱이 사용하는 스키마와 분리된 전용 DB 또는 스키마를 사용하세요.

Docker 안의 `localhost`는 백엔드 컨테이너 자신입니다. 기존 PostgreSQL과 공용 Docker 네트워크를 사용한다면 `DB_URL`에 DB 서비스명과 내부 포트를 지정합니다. 호스트에 공개된 DB 포트로 연결한다면 `host.docker.internal`을 사용할 수 있습니다. 호스트의 `127.0.0.1`에만 바인딩된 DB 포트는 이 주소로 접근할 수 없으므로 공용 네트워크를 구성해야 합니다. 실제 PostgreSQL 스택의 네트워크/포트/계정은 서버에서 확인해야 합니다.

## SQL 호환성

- `SYSTEM_RANGE`를 `generate_series`로 바꾸고 BIGINT 입력으로 생성해 곱셈 오버플로를 방지했습니다.
- `H2VERSION()`은 `version()`, `ANALYZE TABLE`은 `ANALYZE`로 교체했습니다.
- PostgreSQL의 `EXPLAIN ANALYZE`는 여러 행을 반환하므로 전체 행을 합쳐 표시합니다.
- 인덱스 실습은 같은 DataSource의 전용 연결에서 트랜잭션과 임시 테이블을 사용합니다. `search_path`를 `pg_temp`로 제한하며 커밋하지 않습니다. 검사 성공/실패 모두 finally에서 명시적으로 롤백합니다. 검사 시간 제한은 3초입니다. 학습자 코드 실행을 보안 샌드박스로 제공하는 기능은 아닙니다.
- JPA 엔티티의 TEXT, BOOLEAN, TIMESTAMP, 문자열 enum, IDENTITY는 Hibernate PostgreSQL 방언을 통해 처리합니다.

PostgreSQL 공식 참고: [generate_series](https://www.postgresql.org/docs/18/functions-srf.html), [임시 테이블](https://www.postgresql.org/docs/18/sql-createtable.html).

## 데이터와 재시작

이번 변경은 드라이버·설정·SQL 전환입니다. 실행 중인 H2 메모리의 기존 회원/게시글을 PostgreSQL로 복사하지 않습니다. 필요한 데이터가 있다면 **기존 H2 앱을 종료하기 전에** 별도 추출/이관이 필요합니다. PostgreSQL DB가 비어 있으면 새 테이블로 시작합니다. 기존 DB의 테이블·볼륨 삭제는 수행하지 않습니다.

앱 재시작 후 PostgreSQL 데이터는 유지됩니다. 업로드 원문은 기존 uploads 볼륨/디렉터리에 남으므로 DB와 파일을 함께 백업합니다. GW 로컬 캐시와 로컬 소비 위치 같은 메모리 상태는 별개이며 재시작 시 사라집니다. 로컬 주문 발행 위치는 저장된 마지막 offset 다음으로 복구해 중복 위치를 방지합니다. 로컬 소비는 처음부터 재전달할 수 있으며 기존 업무 sequence 검사로 중복 반영을 막습니다. 후보 앱으로 검증할 때는 별도 DB/스키마를 사용하세요. 같은 DB를 지정하면 기존 앱과 데이터를 공유합니다. 과거 H2 환경의 스크린샷과 실측치는 PostgreSQL 측정 결과가 아닙니다.

## 검증

```powershell
cd backend
.\gradlew.bat test
```

통합 테스트와 SQL 실습 검사 테스트는 Testcontainers의 `postgres:18-alpine`에서 실행되므로 로컬 Docker 엔진이 필요합니다. 개발/운영 DB 계정을 사용하지 않습니다. Spring 컨텍스트마다 별도 스키마를 만들며 테스트 종료 시 컨테이너가 폐기됩니다. CI의 이미지 smoke test에도 별도 PostgreSQL을 띄웁니다.

## 현재 홈서버의 DB 연결 확인

기존 PostgreSQL 컨테이너 `postgres-postgres-1`은 호스트에 5432를 게시하지 않은 구성이므로 앱의 `host.docker.internal:5432`로 바로 연결할 수 없습니다. 기존 DB를 재생성하지 말고 앱과 공용 Docker 네트워크를 연결합니다.

```bash
sudo docker network inspect invencore-infra-net --format '{{range .Containers}}{{println .Name}}{{end}}'
# 위 목록에 postgres-postgres-1이 없을 때만:
sudo docker network connect invencore-infra-net postgres-postgres-1
```

이 경우 기존 환경 파일에서 DB_URL은 `jdbc:postgresql://postgres-postgres-1:5432/homeserver`, DB_USERNAME은 기존 `appuser`, DB_PASSWORD는 기존 값을 사용합니다. 네트워크 추가는 기존 데이터/볼륨을 지우지 않습니다. PostgreSQL 스택을 나중에 재생성할 때도 이 네트워크 연결이 유지되도록 해당 스택의 Compose에 외부 네트워크를 별도로 반영해야 합니다.
