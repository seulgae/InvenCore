import importlib.util
import json
from pathlib import Path
import tempfile
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

    def test_atomic_replace_preserves_only_latest_snapshot(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "capacity.json"
            collector.atomic_write(output, {"schemaVersion": 1})
            collector.atomic_write(output, {"schemaVersion": 2})
            self.assertEqual(json.loads(output.read_text()), {"schemaVersion": 2})
            self.assertEqual(list(Path(directory).iterdir()), [output])


if __name__ == "__main__":
    unittest.main()
