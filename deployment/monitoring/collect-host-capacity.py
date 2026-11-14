"""Ubuntu 호스트에 직접 질의할 때마다 새로 측정하는 로컬 조회 서비스입니다."""
import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import shutil
import time
import socket
import socketserver
import stat
import signal
import sys
import threading
import errno


def cpu_sample(text):
    lines = text.splitlines()
    # guest/guest_nice는 user/nice에 이미 포함되므로 합산하지 않습니다.
    values = [int(value) for value in lines[0].split()[1:9]]
    if len(values) != 8 or not lines[0].startswith("cpu "):
        raise ValueError("Invalid /proc/stat CPU data")
    count = sum(line.startswith("cpu") and line[3:4].isdigit() for line in lines)
    if count < 1 or min(values) < 0:
        raise ValueError("Invalid CPU count or counters")
    return sum(values), values[3] + values[4], count


def cpu_usage(before, after):
    total = after[0] - before[0]
    idle = after[1] - before[1]
    if total <= 0 or idle < 0 or idle > total or before[2] != after[2]:
        raise ValueError("CPU counters changed unexpectedly; retry next collection")
    return round(100 * (total - idle) / total, 2)


def memory_usage(text):
    fields = {}
    for line in text.splitlines():
        key, value = line.split(":", 1)
        if key in ("MemTotal", "MemAvailable"):
            number, unit = value.split()
            if unit != "kB":
                raise ValueError("Unsupported memory unit")
            fields[key] = int(number) * 1024
    total, available = fields["MemTotal"], fields["MemAvailable"]
    if not 0 <= available <= total or total <= 0:
        raise ValueError("Invalid host memory counters")
    return total, total - available, available


def collect():
    stat = Path("/proc/stat")
    before = cpu_sample(stat.read_text())
    time.sleep(0.5)
    after = cpu_sample(stat.read_text())
    total, used, available = memory_usage(Path("/proc/meminfo").read_text())
    disk = shutil.disk_usage("/")
    # available은 비특권 사용자 기준입니다. 예약 블록 때문에 total-used와 다를 수 있습니다.
    return {
        "schemaVersion": 1,
        "measuredAt": datetime.now(timezone.utc).isoformat(),
        "cpuUsage": cpu_usage(before, after),
        "logicalCpuCount": after[2],
        "memoryTotalBytes": total,
        "memoryUsedBytes": used,
        "memoryAvailableBytes": available,
        "diskTotalBytes": disk.total,
        "diskUsedBytes": disk.used,
        "diskAvailableBytes": disk.free,
    }


class CapacityHandler(socketserver.StreamRequestHandler):
    def handle(self):
        self.request.settimeout(2)
        try:
            # 고정된 조회 명령만 허용합니다. 입력을 셸 명령으로 실행하지 않습니다.
            if self.rfile.readline(65) != b"CAPACITY/1\n":
                result = {"error": "INVALID_REQUEST"}
            else:
                try:
                    result = self.server.measure()
                except Exception:
                    result = {"error": "UNAVAILABLE"}
            self.wfile.write(json.dumps(result, allow_nan=False).encode() + b"\n")
        except (OSError, ValueError):
            pass  # 연결 종료가 다른 조회에 영향을 주지 않습니다.


class HostQueryServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    address_family = getattr(socket, "AF_UNIX", socket.AF_INET)
    daemon_threads = True
    request_queue_size = 8

    def __init__(self, address, measure=collect):
        self.measure = measure
        self.slots = threading.BoundedSemaphore(4)
        super().__init__(address, CapacityHandler)
        if isinstance(address, str):
            # 로컬 사용자에게 /proc와 같은 집계 정보 조회만 허용합니다.
            os.chmod(address, 0o666)

    def process_request(self, request, client_address):
        if not self.slots.acquire(blocking=False):
            try:
                request.settimeout(1)
                request.sendall(b'{"error":"BUSY"}\n')
            finally:
                self.shutdown_request(request)
            return
        try:
            super().process_request(request, client_address)
        except Exception:
            self.slots.release()
            raise

    def process_request_thread(self, request, client_address):
        try:
            super().process_request_thread(request, client_address)
        finally:
            self.slots.release()


def prepare_socket(path):
    destination = Path(path)
    if not destination.exists():
        return
    if not stat.S_ISSOCK(destination.lstat().st_mode):
        raise ValueError("Refusing to replace a non-socket path")
    with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as probe:
        probe.settimeout(1)
        try:
            probe.connect(path)
        except OSError as error:
            if error.errno not in (errno.ECONNREFUSED, errno.ENOENT):
                raise
            destination.unlink(missing_ok=True)
        else:
            raise ValueError("Host capacity service is already running")


def serve(path):
    prepare_socket(path)
    stopped = threading.Event()
    signal.signal(signal.SIGTERM, lambda *_: stopped.set())
    signal.signal(signal.SIGINT, lambda *_: stopped.set())
    with HostQueryServer(path) as server:
        server.timeout = 0.5
        try:
            while not stopped.is_set():
                server.handle_request()
        finally:
            Path(path).unlink(missing_ok=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--socket")
    mode.add_argument("--once", action="store_true")
    args = parser.parse_args()
    if not sys.platform.startswith("linux"):
        parser.error("Run on the Ubuntu host, not inside the application container")
    if args.once:
        print(json.dumps(collect(), allow_nan=False))
    else:
        serve(args.socket)
