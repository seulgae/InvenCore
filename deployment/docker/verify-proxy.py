"""Check the real Nginx image against the CI-only probe receiver."""
import http.client
import json
import sys
import time
from urllib.parse import urlsplit

PUBLIC_HOST = "seulgae-server.tailac4b36.ts.net"
base = urlsplit(sys.argv[1])
for attempt in range(30):
    try:
        connection = http.client.HTTPConnection(base.hostname, base.port, timeout=5)
        connection.request("GET", "/api/header-probe")
        response = connection.getresponse()
        if response.status == 200:
            response.read()
            break
    except OSError:
        pass
    time.sleep(2)
else:
    raise SystemExit("Nginx probe did not become ready")

for host, supplied, expected in ((PUBLIC_HOST, "http", "https"),
                                 ("localhost:8082", "https", "http"),
                                 ("unlisted.example", "https", "http")):
    connection = http.client.HTTPConnection(base.hostname, base.port, timeout=5)
    connection.request("GET", "/api/header-probe", headers={
        "Host": host, "X-Forwarded-Proto": supplied,
        "Forwarded": "proto=https;host=unlisted.example",
        "X-Forwarded-Host": "unlisted.example", "X-Forwarded-Port": "443",
        "X-Forwarded-For": "spoofed-client",
    })
    response = connection.getresponse()
    assert response.status == 200, "Nginx proxy failed"
    headers = json.loads(response.read())
    assert headers["Host"] == host, "Host/port was not preserved"
    assert headers["X-Forwarded-Proto"] == expected, "Unexpected upstream scheme"
    assert not headers["Forwarded"], "Untrusted Forwarded header was copied"
    assert not headers["X-Forwarded-Host"], "Untrusted forwarded host was copied"
    assert not headers["X-Forwarded-Port"], "Untrusted forwarded port was copied"
    assert "spoofed-client" not in headers["X-Forwarded-For"], "Untrusted IP chain was copied"
print("Nginx Host, public HTTPS route and forwarded-header overwrite checks passed")
