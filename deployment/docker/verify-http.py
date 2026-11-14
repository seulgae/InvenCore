"""Smoke-test loaded CI images without printing credentials or JWT values."""
import http.client
import json
import sys
import time
import uuid
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
    status, _, _ = request("POST", path, {}, origin="https://unlisted.example", extra={
        "Forwarded": "proto=https;host=unlisted.example", "X-Forwarded-Proto": "https",
    })
    assert status == 403, "Unlisted Origin was accepted"
status, _, _ = request("GET", "/api/private-example")
assert status == 401, "Protected API became public"
print("Docker HTTPS-Origin registration/login, CORS rejection and protected API smoke checks passed")
