"""Create a disposable GW record and verify real Kafka projection and Redis HIT.

Intended for CI or an explicitly selected demo deployment. The soft-deleted
fixture remains in PostgreSQL; no application tables or cache keys are purged.
"""

import json
import sys
import time
import urllib.request
import uuid


def verify(base):
    def request(path, method="GET", body=None):
        payload = None if body is None else json.dumps(body).encode()
        req = urllib.request.Request(
            base.rstrip("/") + "/api/gw-sync" + path,
            data=payload,
            method=method,
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            return json.load(response)

    status = request("/status")
    if not (status["enabled"] and status["mode"] == "EXTERNAL"
            and status["transport"] == "KAFKA" and status["cacheProvider"] == "REDIS"):
        raise AssertionError("External Kafka/Redis mode is not enabled")

    def await_revision(item_id, revision, deleted=False):
        deadline = time.monotonic() + 30
        last = None
        while time.monotonic() < deadline:
            last = request("/items/" + item_id)
            target = last.get("target")
            cache = last.get("cache") or {}
            cached = cache.get("snapshot") or {}
            if (last["source"]["publishedRevision"] >= revision
                    and target and target["revision"] == revision
                    and target["deleted"] == deleted
                    and cache.get("state") == "HIT" and cache.get("ttlSeconds", 0) > 0
                    and cached.get("revision") == revision and cached.get("deleted") == deleted):
                return
            time.sleep(0.25)
        raise AssertionError("Kafka/Redis did not converge; cache state="
                             + str((last or {}).get("cache", {}).get("state")))

    item = request("/items", "POST", {
        "name": "server-smoke-" + uuid.uuid4().hex[:12],
        "description": "Disposable Kafka/PostgreSQL/Redis verification",
    })
    deleted = False
    try:
        await_revision(item["id"], 1)
        request("/items/" + item["id"], "PUT", {
            "name": item["name"], "description": "Updated through Kafka",
        })
        await_revision(item["id"], 2)
        request("/items/" + item["id"], "DELETE")
        deleted = True
        await_revision(item["id"], 3, deleted=True)
    finally:
        if not deleted:
            request("/items/" + item["id"], "DELETE")
    print("PASS: external Kafka create/update/delete, PostgreSQL projection, Redis HIT and TTL")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: verify-external.py http://127.0.0.1:8082")
    verify(sys.argv[1])
