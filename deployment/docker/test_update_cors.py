import importlib.util
from pathlib import Path
import tempfile
import unittest


spec = importlib.util.spec_from_file_location("cors_update", Path(__file__).with_name("update-cors-origin.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class CorsEnvironmentUpdateTests(unittest.TestCase):
    def test_keeps_other_settings_backup_and_custom_origin(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / ".env.docker"
            original = b'JWT_SECRET=synthetic-fixture\r\nFRONTEND_PORT=8082\r\nCORS_ORIGINS="https://custom.example,http://localhost:8082" # keep\r\n'
            path.write_bytes(original)
            self.assertTrue(module.update_file(path))
            result = path.read_bytes()
            self.assertTrue(result.startswith(b'JWT_SECRET=synthetic-fixture\r\nFRONTEND_PORT=8082\r\n'))
            self.assertIn(b'https://custom.example', result)
            self.assertIn(module.REQUIRED_ORIGINS[-1].encode(), result)
            self.assertIn(b'# keep\r\n', result)
            backups = list(path.parent.glob(".env.docker.backup-*"))
            self.assertEqual(1, len(backups))
            self.assertEqual(original, backups[0].read_bytes())
            self.assertFalse(module.update_file(path))
            self.assertEqual(1, len(list(path.parent.glob(".env.docker.backup-*"))))

    def test_adds_missing_assignment_without_losing_last_line(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / ".env.docker"
            path.write_bytes(b'FRONTEND_PORT=8082')
            module.update_file(path)
            self.assertTrue(path.read_text().startswith('FRONTEND_PORT=8082\nCORS_ORIGINS='))

    def test_rejects_ambiguous_or_wildcard_values_before_writing(self):
        for cors in ['${OTHER_ORIGINS}', '*', '"unclosed', 'https://a.example/path', 'https://*.example', 'https://a.example#fragment']:
            with self.subTest(cors=cors), tempfile.TemporaryDirectory() as directory:
                path = Path(directory) / ".env.docker"
                original = ('CORS_ORIGINS=' + cors + '\n').encode()
                path.write_bytes(original)
                with self.assertRaises(ValueError):
                    module.update_file(path)
                self.assertEqual(original, path.read_bytes())
                self.assertEqual([], list(path.parent.glob(".env.docker.backup-*")))

    def test_duplicate_assignments_are_not_rewritten(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / ".env.docker"
            original = b'CORS_ORIGINS=http://localhost:8081\nCORS_ORIGINS=http://localhost:8082\n'
            path.write_bytes(original)
            with self.assertRaises(ValueError):
                module.update_file(path)
            self.assertEqual(original, path.read_bytes())


if __name__ == "__main__":
    unittest.main()
