"""Ubuntu 호스트에서 실행합니다. 집계 수치만 JSON으로 원자적으로 교체합니다."""
import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import shutil
import tempfile
import time


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


def atomic_write(destination, data):
    destination = Path(destination)
    # 디렉터리는 운영자가 준비합니다. 파일 교체 중에도 독자는 완성된 JSON만 읽습니다.
    descriptor, temporary = tempfile.mkstemp(prefix=".capacity-", dir=destination.parent)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as output:
            json.dump(data, output, allow_nan=False)
            output.write("\n")
            output.flush()
            os.fsync(output.fileno())
        os.chmod(temporary, 0o644)
        os.replace(temporary, destination)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


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


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    atomic_write(args.output, collect())
