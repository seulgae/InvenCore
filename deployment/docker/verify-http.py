"""Smoke-test loaded CI images without printing credentials or JWT values."""
import http.client
import json
import sys
import time
import uuid
from datetime import datetime, timezone
from urllib.parse import urlsplit

ORIGIN = "https://seulgae-server.tailac4b36.ts.net"
base = urlsplit(sys.argv[1])


def request(method, path, body=None, origin=ORIGIN, extra=None):
    connection = http.client.HTTPConnection(base.hostname, base.port, timeout=5)
    headers = {"Host": "seulgae-server.tailac4b36.ts.net", "Origin": origin}
    headers.update(extra or {})
    if body is not None:
        body = json.dumps(body)
        headers["Content-Type"] = "application/json"
    connection.request(method, path, body=body, headers=headers)
    response = connection.getresponse()
    return response.status, dict((key.lower(), value) for key, value in response.getheaders()), response.read()


for attempt in range(45):
    try:
        status, _, body = request("GET", "/api/health")
        if status == 200 and json.loads(body).get("status") == "UP":
            break
    except (OSError, ValueError):
        pass
    time.sleep(2)
else:
    raise SystemExit("Application did not become ready")

credentials = {"username": "Smoke" + uuid.uuid4().hex[:10], "password": uuid.uuid4().hex[:12] + "aA1!"}
for path, expected in (("/api/members/register", 201), ("/api/members/login", 200)):
    status, headers, _ = request("OPTIONS", path, extra={
        "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type",
    })
    assert status == 200 and headers.get("access-control-allow-origin") == ORIGIN, "HTTPS preflight failed"
    status, headers, body = request("POST", path, credentials)
    assert status == expected, "Public authentication request failed: " + str(status)
    assert headers.get("access-control-allow-origin") == ORIGIN, "Unexpected allowed Origin"
    assert json.loads(body).get("success") is True, "Authentication result was not successful"
    if path.endswith("login"):
        assert json.loads(body).get("token"), "Login did not issue a token"
        token = json.loads(body)["token"]
    status, _, _ = request("POST", path, {}, origin="https://unlisted.example", extra={
        "Forwarded": "proto=https;host=unlisted.example", "X-Forwarded-Proto": "https",
    })
    assert status == 403, "Unlisted Origin was accepted"
status, _, _ = request("GET", "/api/private-example")
assert status == 401, "Protected API became public"
status, _, body = request("POST", "/api/guestbook", {
    "nickname": "CIvisitor", "message": "통합 방명록 검증 🌱", "avatar": "sprout",
})
assert status == 201, "Anonymous guestbook write failed: " + str(status)
entry_id = json.loads(body)["id"]
status, _, body = request("GET", "/api/guestbook")
assert status == 200 and any(entry["id"] == entry_id for entry in json.loads(body)["content"]), "Persisted guestbook entry was not listed"
if "--host-query" in sys.argv:
    status, _, _ = request("GET", "/api/server-capacity/host")
    assert status == 401, "Host metrics became public"
    measured = []
    for _ in range(2):
        started = datetime.now(timezone.utc)
        status, headers, body = request("GET", "/api/server-capacity/host", extra={"Authorization": "Bearer " + token})
        assert status == 200, "Live host request failed: " + str(status)
        assert headers.get("cache-control") == "no-store", "Host metrics must not be cached"
        metrics = json.loads(body)
        at = datetime.fromisoformat(metrics["measuredAt"].replace("Z", "+00:00"))
        assert at >= started, "Host reply was not measured during this request"
        assert metrics["memoryTotalBytes"] > 0 and metrics["diskTotalBytes"] > 0
        assert metrics["logicalCpuCount"] > 0 and 0 <= metrics["cpuUsage"] <= 100
        measured.append(at)
    assert measured[1] > measured[0], "Host measurement was reused"
    print("Authenticated Docker-to-host queries produced two fresh measurements")
print("Docker HTTPS-Origin registration/login, CORS rejection and protected API smoke checks passed")
