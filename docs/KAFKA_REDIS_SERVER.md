# Kafka · Redis 서버 연결

기본 실행 모드를 `external`로 전환했습니다. GW는 Kafka 발행/소비와 PostgreSQL projection, Redis 캐시를 사용하고 주문 실습은 실제 Kafka의 파티션·오프셋·소비 그룹을 사용합니다. 교육용 로컬 모형은 `GW_SYNC_MODE=local`로 명시했을 때만 사용합니다.

## 기존 서버 구성

서버 구축 세션에서 사용한 인프라는 `~/invencore-infra`, 네트워크는 `invencore-infra-net`입니다. 이 변경은 인프라 컨테이너를 새로 만들거나 기존 볼륨을 삭제하지 않습니다. 이번 작업 환경에서는 SSH가 차단되어 실제 서버 상태를 재확인하지 못했습니다.

| 실행 위치 | Kafka bootstrap | Redis |
| --- | --- | --- |
| 서버의 앱 컨테이너 | `kafka:19092` | `redis:6379` |
| Ubuntu 호스트에서 Java 직접 실행 | `127.0.0.1:9092` | `127.0.0.1:6379` |
| Windows에서 Java 직접 실행 | SSH 터널의 `localhost:9092` | SSH 터널의 `localhost:6379` |

기존 Kafka advertised listeners는 `INTERNAL://kafka:19092,EXTERNAL://localhost:9092`입니다. 컨테이너에서 EXTERNAL 주소를 사용하면 Kafka가 메타데이터로 반환하는 localhost가 앱 자신을 가리키므로 내부 listener를 사용해야 합니다. 서버의 공개 포트는 루프백 바인딩을 유지합니다.

## 서버 앱 컨테이너

`compose.app.yml`은 백엔드를 앱 기본 네트워크와 기존 인프라 외부 네트워크에 연결합니다. 프론트엔드는 앱 기본 네트워크를 사용합니다. 기존 `.env.docker`에 DB/JWT 등 설정을 보존하고 다음 값을 추가 또는 갱신합니다. 같은 이름을 중복 작성하지 마세요.

```dotenv
GW_SYNC_ENABLED=true
GW_SYNC_MODE=external
INFRA_NETWORK=invencore-infra-net
KAFKA_BOOTSTRAP_SERVERS=kafka:19092
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_USERNAME=
REDIS_PASSWORD=
```

현재 인프라 기록상 Redis 인증은 없습니다. 추후 Redis에서 인증을 켜면 동일 계정/비밀번호를 위 환경변수에 설정합니다. PostgreSQL 연결은 별도이며 [PostgreSQL 안내](POSTGRESQL.md)의 DB_* 설정을 유지합니다. 이번 네트워크 연결이 PostgreSQL까지 자동 연결하는 것은 아닙니다.

변경한 소스/이미지를 서버에 반영한 뒤 Ubuntu에서 확인하고 앱을 재생성합니다. 실제로 사용하는 이미지 태그와 Compose 프로젝트명을 유지하세요.

```bash
cd ~/invencore-infra
sudo docker compose ps
sudo docker network inspect invencore-infra-net --format '{{range .Containers}}{{println .Name}}{{end}}'
sudo docker compose exec -T kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server kafka:19092 --list
sudo docker compose exec -T redis redis-cli ping

cd /opt/homeserver/apps/InvenCore
# 기존 env/이미지 태그를 유지하고 실제 운영 중인 Compose 프로젝트 이름을 사용합니다.
sudo docker compose --env-file .env.docker -p invencore-app -f compose.app.yml -f compose.ghcr.yml -f compose.monitoring.yml config --quiet
sudo docker compose --env-file .env.docker -p invencore-app -f compose.app.yml -f compose.ghcr.yml -f compose.monitoring.yml up -d
sudo docker compose --env-file .env.docker -p invencore-app -f compose.app.yml -f compose.ghcr.yml -f compose.monitoring.yml logs --tail 100 backend
```

새 코드를 서버에서 직접 빌드하는 경우 `compose.ghcr.yml`을 제외하고 `up -d --build`를 사용합니다. `docker compose down -v`나 기존 인프라용 `compose.yml` 실행은 필요하지 않습니다. 저장소 루트의 `compose.yml`은 별도의 로컬 실습용 인프라이므로 서버에 이미 설치한 인프라와 중복 실행하지 않습니다.

## Windows 개발 실행

Windows 터미널에서 다음 터널을 유지합니다. 이 방식은 로컬 프로세스만 서버로 연결하며 Windows에 별도 Kafka/Redis를 실행하지 않습니다.

```powershell
ssh -N -o ExitOnForwardFailure=yes -L 9092:127.0.0.1:9092 -L 6379:127.0.0.1:6379 invencore-server
```

백엔드의 기본 bootstrap/Redis 주소는 localhost이므로 `GW_SYNC_MODE=external` 및 PostgreSQL DB_* 설정을 유지한 채 실행합니다. 컨테이너용 `kafka:19092`를 Windows 실행 환경에 복사하지 마세요.

## 동작 확인

`/api/gw-sync/status`에서 EXTERNAL / KAFKA / REDIS를 확인합니다. 이 API는 설정을 표시하므로 연결 성공 자체를 보장하지 않습니다. 실제 확인은 GW 항목 생성 → 발행 확인 revision 증가 → 대상 revision 일치 → Redis HIT와 양수 TTL 순서로 진행합니다. Redis 오류 시 `UNAVAILABLE_DB_FALLBACK`은 DB 대체 응답이며 Redis 연결 성공이 아닙니다.

주문 실습은 새 실행을 만들고 런타임 모드가 `EXTERNAL_KAFKA`인지 확인합니다. 기존 로컬 모형으로 만든 실행의 offset은 실제 Kafka offset이 아니므로 새 실행으로 검증합니다. 외부 Kafka 소비 위치는 브로커의 소비 그룹에 저장됩니다.

## 자동 검증

`KafkaRedisServerIntegrationTests`는 PostgreSQL Testcontainers + Embedded Kafka의 실제 프로토콜 + Redis 컨테이너를 함께 사용합니다. 로컬 bean 미등록, 원본 변경의 대상 반영, Redis Lua의 이전 revision 덮어쓰기 방지, TTL, 캐시 재충전, 삭제 반영을 검사합니다. Docker가 있는 환경에서 `backend/gradlew test`로 실행하며 운영 서버에는 테스트 데이터를 쓰지 않습니다.
