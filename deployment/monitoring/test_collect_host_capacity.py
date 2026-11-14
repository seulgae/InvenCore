import importlib.util
import json
import socket
import threading
from unittest.mock import Mock
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("collector", Path(__file__).with_name("collect-host-capacity.py"))
collector = importlib.util.module_from_spec(spec)
spec.loader.exec_module(collector)


class HostCapacityTests(unittest.TestCase):
    def test_cpu_excludes_guest_and_combines_idle_iowait(self):
        before = collector.cpu_sample("cpu  100 20 30 400 50 0 0 0 40 10\ncpu0 1\ncpu1 1\n")
        after = collector.cpu_sample("cpu  150 20 40 430 60 0 0 0 70 20\ncpu0 1\ncpu1 1\n")
        self.assertEqual(before, (600, 450, 2))
        self.assertEqual(collector.cpu_usage(before, after), 60)

    def test_cpu_reset_or_no_sample_is_not_zero_usage(self):
        for after in [(100, 50, 2), (90, 40, 2), (200, 80, 3)]:
            with self.assertRaises(ValueError):
                collector.cpu_usage((100, 50, 2), after)

    def test_memory_uses_available_including_reclaimable_cache(self):
        self.assertEqual(collector.memory_usage("MemTotal: 1000 kB\nMemFree: 20 kB\nMemAvailable: 400 kB\n"),
                         (1024000, 614400, 409600))
        with self.assertRaises(ValueError):
            collector.memory_usage("MemTotal: 100 kB\nMemAvailable: 400 kB\n")


class QueryServerTests(unittest.TestCase):
    def setUp(self):
        # Test handler semantics on a loopback socket on every platform.
        class TestServer(collector.HostQueryServer):
            address_family = socket.AF_INET
        self.measure = Mock(side_effect=lambda: {"schemaVersion": 1, "sample": self.measure.call_count})
        self.server = TestServer(("127.0.0.1", 0), self.measure)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)

    def request(self, command=b"CAPACITY/1\n"):
        with socket.create_connection(self.server.server_address, timeout=2) as connection:
            connection.sendall(command)
            with connection.makefile("rb") as response:
                return json.loads(response.readline())

    def test_only_requests_trigger_measurement_and_every_request_is_fresh(self):
        self.measure.assert_not_called()
        self.assertEqual(self.request()["sample"], 1)
        self.assertEqual(self.request()["sample"], 2)
        self.assertEqual(self.measure.call_count, 2)

    def test_invalid_command_never_executes_collection(self):
        self.assertEqual(self.request(b"rm -rf /\n"), {"error": "INVALID_REQUEST"})
        self.assertEqual(self.request(b"X" * 100 + b"\n"), {"error": "INVALID_REQUEST"})
        self.measure.assert_not_called()

    def test_measurement_failure_returns_error_not_previous_success(self):
        self.request()
        self.measure.side_effect = OSError("read failed")
        self.assertEqual(self.request(), {"error": "UNAVAILABLE"})

    def test_busy_requests_are_bounded(self):
        for _ in range(4):
            self.server.slots.acquire()
        try:
            self.assertEqual(self.request(), {"error": "BUSY"})
            self.measure.assert_not_called()
        finally:
            for _ in range(4):
                self.server.slots.release()


if __name__ == "__main__":
    unittest.main()
