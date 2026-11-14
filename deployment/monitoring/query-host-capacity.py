"""Query the local Ubuntu agent once; no credentials or cached files are used."""
import argparse
import json
import socket


def query(path):
    with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as connection:
        connection.settimeout(5)
        connection.connect(path)
        connection.sendall(b"CAPACITY/1\n")
        with connection.makefile("rb") as reply:
            content = reply.readline(8194)
        if len(content) > 8193 or not content.endswith(b"\n"):
            raise ValueError("Invalid host query response")
        result = json.loads(content)
        if result.get("error") or result.get("schemaVersion") != 1:
            raise ValueError("Host measurement failed")
        return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--socket", default="/run/invencore-host/capacity.sock")
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()
    result = query(args.socket)
    if not args.quiet:
        print(json.dumps(result, indent=2))
