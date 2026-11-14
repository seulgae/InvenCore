"""CI-only header receiver. Never copied into either production image."""
import json
from http.server import BaseHTTPRequestHandler, HTTPServer


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        body = json.dumps({name: self.headers.get(name) for name in (
            "Host", "X-Forwarded-Proto", "Forwarded", "X-Forwarded-Host",
            "X-Forwarded-Port", "X-Forwarded-For",
        )}).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    HTTPServer(("0.0.0.0", 8080), Handler).serve_forever()
