"""Deploy a specific verified GHCR SHA without overwriting environment files or deleting data."""
import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import urllib.request
from urllib.parse import urlsplit


class DeploymentError(RuntimeError):
    """An operator-safe message with no expanded config or credentials."""


def require_release(value):
    if not re.fullmatch(r"[a-f0-9]{40}", value):
        raise DeploymentError("CI가 성공한 전체 40자리 소문자 SHA를 지정하세요. 짧은 SHA와 latest는 사용할 수 없습니다.")
    return value


def command(args, env, capture=False):
    result = subprocess.run(args, env=env, text=True, capture_output=capture)
    if result.returncode:
        # Captured Compose/inspect output may contain secrets; never echo it.
        raise DeploymentError("명령 실행 실패: " + " ".join(args[:3]) + ". 설정·권한·연결을 확인하세요.")
    return result.stdout.strip() if capture else ""


def endpoint(host, port):
    if not isinstance(host, str) or not re.fullmatch(r"[a-zA-Z0-9._:-]+", host):
        raise DeploymentError("서버 연결 주소 형식을 확인하세요.")
    port = int(port)
    if not 1 <= port <= 65535:
        raise DeploymentError("서버 연결 포트 범위를 확인하세요.")
    return host, str(port)


def plan(config, release, monitoring):
    services = config["services"]
    backend, frontend = services["backend"], services["frontend"]
    for name, service in (("backend", backend), ("frontend", frontend)):
        if service["image"] != f"ghcr.io/seulgae/invencore-{name}:{release}":
            raise DeploymentError("두 이미지가 지정한 전체 SHA와 일치하지 않습니다.")
    settings = backend["environment"]
    for name in ("DB_USERNAME", "DB_PASSWORD", "JWT_SECRET"):
        value = str(settings.get(name) or "")
        if not value or value.startswith("REPLACE_"):
            raise DeploymentError(name + " 설정이 필요합니다. 기존 비밀값을 유지하세요.")
    url = settings.get("DB_URL", "")
    if not url.startswith("jdbc:postgresql://"):
        raise DeploymentError("DB_URL은 PostgreSQL JDBC 주소여야 합니다.")
    db = urlsplit(url.removeprefix("jdbc:"))
    if not db.path.strip("/") or db.username is not None:
        raise DeploymentError("DB_URL의 DB 이름·주소 형식을 확인하세요. 계정은 별도 환경변수로 지정합니다.")
    database = endpoint(db.hostname, db.port or 5432)
    networks = [value["name"] for value in config.get("networks", {}).values() if value.get("external")]
    if not networks:
        raise DeploymentError("기존 인프라의 공용 외부 Docker 네트워크가 필요합니다.")
    ports = [port for port in frontend.get("ports", []) if int(port["target"]) == 80]
    if len(ports) != 1 or ports[0].get("host_ip") != "127.0.0.1":
        raise DeploymentError("프론트엔드 80 포트를 127.0.0.1의 한 포트에 게시해야 합니다.")
    _, port = endpoint("127.0.0.1", ports[0]["published"])
    mode = settings.get("GW_SYNC_MODE", "external")
    enabled = str(settings.get("GW_SYNC_ENABLED", "true")).lower() == "true"
    probes = [("PostgreSQL", [database])]
    if enabled and mode == "external":
        bootstrap = []
        for address in settings.get("KAFKA_BOOTSTRAP_SERVERS", "").split(","):
            host, separator, kafka_port = address.strip().rpartition(":")
            if not separator:
                raise DeploymentError("KAFKA_BOOTSTRAP_SERVERS의 host:port 형식을 확인하세요.")
            bootstrap.append(endpoint(host, kafka_port))
        probes.extend([
            ("Kafka", bootstrap),
            ("Redis", [endpoint(settings.get("REDIS_HOST"), settings.get("REDIS_PORT", 6379))]),
        ])
    socket = None
    if monitoring:
        mounts = [mount for mount in backend.get("volumes", []) if mount.get("target") == "/run/invencore-host"]
        if len(mounts) != 1 or not mounts[0].get("read_only"):
            raise DeploymentError("호스트 조회 소켓의 읽기 전용 마운트가 필요합니다.")
        if settings.get("HOST_CAPACITY_SOCKET") != "/run/invencore-host/capacity.sock":
            raise DeploymentError("호스트 조회 소켓의 컨테이너 경로를 확인하세요.")
        socket = str(Path(mounts[0]["source"]) / "capacity.sock")
    return {"image": backend["image"], "port": port, "networks": networks,
            "probes": probes, "socket": socket, "mode": mode if enabled else "disabled"}


def current_postgres(environment):
    # Inspect only the running container, independently of the desired .env config.
    values = dict(entry.split("=", 1) for entry in environment if "=" in entry)
    return any(values.get(name, "").startswith("jdbc:postgresql://")
               for name in ("DB_URL", "SPRING_DATASOURCE_URL"))


def reachable(image, networks, endpoints, env):
    for network in networks:
        for host, port in endpoints:
            probe = ["docker", "run", "--rm", "--read-only", "--cap-drop=ALL",
                     "--security-opt=no-new-privileges", "--add-host=host.docker.internal:host-gateway", "--network", network,
                     "--entrypoint", "timeout", image, "5", "bash", "-c",
                     'exec 3<>"/dev/tcp/$1/$2"', "--", host, port]
            if subprocess.run(probe, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0:
                return True
    return False


def verify_http(port, external):
    base = "http://127.0.0.1:" + port
    def read(path):
        with urllib.request.urlopen(base + path, timeout=10) as response:
            return json.load(response)
    if read("/api/health").get("status") != "UP":
        raise DeploymentError("API health가 UP이 아닙니다.")
    if "content" not in read("/api/guestbook"):
        raise DeploymentError("방명록 조회 검증에 실패했습니다.")
    if external:
        state = read("/api/gw-sync/status")
        if not (state.get("enabled") and state.get("transport") == "KAFKA" and state.get("cacheProvider") == "REDIS"):
            raise DeploymentError("Kafka·Redis external 모드 상태를 확인하세요.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("release", help="Successful CI commit: full 40-character SHA")
    parser.add_argument("--app-dir", default="/opt/homeserver/apps/InvenCore")
    parser.add_argument("--env-file", default=".env.docker")
    parser.add_argument("--check", action="store_true", help="Read-only checks and pull; no app recreation")
    parser.add_argument("--local-images", action="store_true", help="Use images already loaded locally instead of pulling")
    parser.add_argument("--without-monitoring", action="store_true", help="Do not mount the host query socket")
    parser.add_argument("--allow-db-transition", action="store_true", help="Data preservation reviewed for an older/unverified backend")
    args = parser.parse_args()
    release = require_release(args.release)
    app = Path(args.app_dir).resolve()
    env_file = Path(args.env_file)
    if not env_file.is_absolute():
        env_file = app / env_file
    files = [app / "compose.app.yml", app / "compose.ghcr.yml"]
    if not args.without_monitoring:
        files.append(app / "compose.monitoring.yml")
    for file in [env_file, *files]:
        if not file.is_file():
            raise DeploymentError("필수 환경/Compose 파일이 없습니다: " + file.name)
    env = os.environ.copy()
    env["APP_IMAGE_TAG"] = release  # Overrides an obsolete tag in .env without changing the file.
    compose = ["docker", "compose", "--env-file", str(env_file), "-p", "invencore-app"]
    for file in files:
        compose.extend(["-f", str(file)])
    print("[1/5] Compose·PostgreSQL 설정 검증", flush=True)
    command(["docker", "info"], env, capture=True)
    command(compose + ["config", "--quiet"], env)
    data = json.loads(command(compose + ["config", "--format", "json"], env, capture=True))
    selected = plan(data, release, not args.without_monitoring)
    for network in selected["networks"]:
        command(["docker", "network", "inspect", network], env, capture=True)
    print("[2/5] 지정 SHA 이미지 확인: " + release, flush=True)
    if not args.local_images:
        command(compose + ["pull", "backend", "frontend"], env)
    for name in ("backend", "frontend"):
        command(["docker", "image", "inspect", data["services"][name]["image"]], env, capture=True)
    print("[3/5] 인프라 TCP·호스트 조회 서비스 점검", flush=True)
    for name, endpoints in selected["probes"]:
        if not reachable(selected["image"], selected["networks"], endpoints, env):
            raise DeploymentError(name + " 연결 실패. DB/서비스 이름·포트·공용 네트워크를 확인하세요. 기존 앱은 변경하지 않았습니다.")
        print(name + " TCP 연결 확인 (인증 여부는 앱 시작 시 확인)", flush=True)
    if selected["socket"]:
        command([sys.executable, str(app / "deployment/monitoring/query-host-capacity.py"),
                 "--socket", selected["socket"], "--quiet"], env, capture=True)
    old = command(compose + ["ps", "-a", "-q", "backend"], env, capture=True)
    if old:
        current = json.loads(command(["docker", "inspect", old.splitlines()[0]], env, capture=True))[0]
        if not current_postgres(current["Config"].get("Env") or []) and not args.allow_db_transition:
            raise DeploymentError("실행 중인 백엔드의 PostgreSQL 설정을 확인할 수 없습니다. 기존 데이터 보존·이관을 검토한 뒤에만 --allow-db-transition을 지정하세요. 앱은 교체하지 않았습니다.")
    print("[4/5] 현재 상태와 배포 확인", flush=True)
    command(compose + ["ps"], env)
    print("목표 SHA: " + release + " / 프론트 포트: " + selected["port"] + " / GW 모드: " + selected["mode"], flush=True)
    if args.check:
        print("사전 점검 완료. 앱 컨테이너·환경 파일·DB·볼륨은 변경하지 않았습니다.")
        return
    print("PostgreSQL·Kafka·Redis 서비스와 볼륨은 유지합니다. 앱 교체 중 잠시 연결이 끊길 수 있습니다.")
    print("현재 DB의 백업·데이터 보존 및 새 버전과의 스키마 호환성을 확인한 뒤 진행하세요.")
    if args.allow_db_transition:
        print("DB 전환 옵션이 지정되었습니다. 기존 데이터 보존·이관 완료 여부를 확인하세요.")
    if input("배포하려면 yes 입력: ").strip() != "yes":
        print("배포 취소")
        return
    print("[5/5] 앱 교체·healthy 대기·읽기 전용 API 검증", flush=True)
    command(compose + ["up", "-d", "--no-build", "--pull", "never", "--wait", "--wait-timeout", "180", "backend", "frontend"], env)
    verify_http(selected["port"], selected["mode"] == "external")
    command(compose + ["ps"], env)
    print("배포 완료. 브라우저에서 로그인 후 서버 용량의 '지금 조회'도 확인하세요.")


if __name__ == "__main__":
    try:
        main()
    except (ValueError, RuntimeError, OSError, KeyError, TypeError, EOFError):
        # The exception text may include URLs/config from third-party libraries.
        # Known validation/runtime messages above contain no credentials.
        error = sys.exc_info()[1]
        print("ERROR: " + (str(error) if isinstance(error, DeploymentError) else "배포 점검에 실패했습니다. 서비스 상태와 설정을 확인하세요."), file=sys.stderr)
        print("실패 시 DB/볼륨 삭제나 자동 롤백은 실행하지 않습니다. 앱 교체 후 실패했다면 컨테이너 상태와 로그를 별도로 확인하세요.", file=sys.stderr)
        sys.exit(1)
