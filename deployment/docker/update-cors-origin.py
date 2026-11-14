#!/usr/bin/env python3
"""Update only CORS_ORIGINS, keeping secrets and other dotenv settings unchanged."""

import argparse
import os
from pathlib import Path
import re
import stat
import tempfile
from datetime import datetime, timezone
from urllib.parse import urlsplit


REQUIRED_ORIGINS = [
    "http://localhost:5173", "http://127.0.0.1:5173",
    "http://localhost:5174", "http://127.0.0.1:5174",
    "http://localhost:8081", "http://127.0.0.1:8081",
    "http://localhost:8082", "http://127.0.0.1:8082",
    "https://seulgae-server.tailac4b36.ts.net",
]


def merge_origins(raw):
    """Accept simple dotenv values; reject ambiguous interpolation instead of losing it."""
    raw = raw.strip()
    comment = ""
    if raw.startswith(("'", '"')):
        quote = raw[0]
        end = raw.find(quote, 1)
        if end < 0:
            raise ValueError("Unclosed CORS_ORIGINS quote")
        value, suffix = raw[1:end], raw[end + 1:].strip()
        if suffix and not suffix.startswith("#"):
            raise ValueError("Unsupported CORS_ORIGINS suffix")
        comment = suffix
    else:
        parts = re.split(r"\s+#", raw, maxsplit=1)
        value = parts[0]
        comment = ("#" + parts[1]) if len(parts) == 2 else ""
    if any(char in value for char in "$\\\r\n\"'"):
        raise ValueError("Resolve complex CORS_ORIGINS manually; file was not changed")
    origins = [item.strip() for item in value.split(",") if item.strip()]
    for origin in origins:
        parsed = urlsplit(origin)
        if (parsed.scheme not in ("http", "https") or not parsed.netloc or
                parsed.path or parsed.query or parsed.fragment or parsed.username or
                parsed.password or "*" in origin or any(char.isspace() for char in origin)):
            raise ValueError("Use exact http/https origins without paths or wildcards")
        parsed.port  # Reject invalid port numbers before changing anything.
    merged = list(dict.fromkeys(origins + REQUIRED_ORIGINS))
    return ",".join(merged) + ((" " + comment) if comment else "")


def update_file(filename):
    """Back up the original, then atomically replace only its CORS assignment."""
    path = Path(filename).resolve(strict=True)
    if not path.is_file():
        raise ValueError("Expected an existing dotenv file")
    original = path.read_bytes()
    text = original.decode("utf-8")
    lines = text.splitlines(keepends=True)
    pattern = re.compile(r"^[ \t]*(?:export[ \t]+)?CORS_ORIGINS[ \t]*=[ \t]*(.*?)(?:\r?\n)?$")
    matches = [(i, pattern.match(line)) for i, line in enumerate(lines) if pattern.match(line)]
    if len(matches) > 1:
        raise ValueError("Multiple CORS_ORIGINS assignments; file was not changed")
    newline = "\r\n" if b"\r\n" in original else "\n"
    if matches:
        index, match = matches[0]
        replacement = "CORS_ORIGINS=" + merge_origins(match.group(1))
        lines[index] = replacement + (newline if lines[index].endswith("\n") else "")
    else:
        if lines and not lines[-1].endswith("\n"):
            lines[-1] += newline
        lines.append("CORS_ORIGINS=" + merge_origins("") + newline)
    updated = "".join(lines).encode("utf-8")
    if original == updated:
        return False
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    backup = path.with_name(path.name + ".backup-" + stamp)
    descriptor = os.open(backup, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, "wb") as stream:
        stream.write(original)
    descriptor, temporary = tempfile.mkstemp(prefix=path.name + ".", dir=path.parent)
    try:
        with os.fdopen(descriptor, "wb") as stream:
            stream.write(updated)
        os.chmod(temporary, stat.S_IMODE(path.stat().st_mode) & 0o600)
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)
    return True


if __name__ == "__main__":
    arguments = argparse.ArgumentParser(description=__doc__)
    arguments.add_argument("file", help="existing .env.docker; values are never printed")
    try:
        changed = update_file(arguments.parse_args().file)
    except (ValueError, OSError, UnicodeError):
        raise SystemExit("CORS update failed. Check file format/permissions; no values were printed.")
    print("CORS updated; protected backup created. Containers were not changed." if changed
          else "CORS already includes the required origins. Containers were not changed.")
