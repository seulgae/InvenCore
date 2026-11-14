import contextlib
import importlib.util
import io
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("deploy", Path(__file__).with_name("deploy.py"))
deploy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deploy)
SHA = "a" * 40


def configuration():
    return {
        "services": {
            "backend": {
                "image": "ghcr.io/seulgae/invencore-backend:" + SHA,
                "environment": {"DB_URL": "jdbc:postgresql://postgres:5432/test", "DB_USERNAME": "test",
                    "DB_PASSWORD": "synthetic-test-password", "JWT_SECRET": "synthetic-test-key",
                    "GW_SYNC_ENABLED": "true", "GW_SYNC_MODE": "external",
                    "KAFKA_BOOTSTRAP_SERVERS": "kafka:19092", "REDIS_HOST": "redis",
                    "HOST_CAPACITY_SOCKET": "/run/invencore-host/capacity.sock"},
                "volumes": [{"source": "/run/invencore-host", "target": "/run/invencore-host", "read_only": True}],
            },
            "frontend": {"image": "ghcr.io/seulgae/invencore-frontend:" + SHA,
                "ports": [{"target": 80, "published": "8082", "host_ip": "127.0.0.1"}]},
        },
        "networks": {"infrastructure": {"name": "test-infra", "external": True}},
    }


class DeploymentTests(unittest.TestCase):
    def test_captured_docker_failure_never_echoes_config_secrets(self):
        canary = "synthetic-private-value-not-for-output"
        result = deploy.subprocess.CompletedProcess([], 1, canary, canary)
        with patch.object(deploy.subprocess, "run", return_value=result):
            with self.assertRaises(deploy.DeploymentError) as failure:
                deploy.command(["docker", "compose", "config"], {}, capture=True)
            self.assertNotIn(canary, str(failure.exception))

    def test_short_old_latest_and_malformed_tags_fail_before_docker(self):
        for value in ("6e33f2d7eb8b", "latest", "A" * 40, "a" * 39, "a;echo no"):
            with patch.object(deploy.sys, "argv", ["deploy.py", value]), patch.object(deploy, "command") as command:
                with self.assertRaises(deploy.DeploymentError):
                    deploy.main()
                command.assert_not_called()
        self.assertEqual(deploy.require_release(SHA), SHA)

    def test_plan_uses_postgres_endpoints_actual_frontend_port_and_readonly_socket(self):
        value = deploy.plan(configuration(), SHA, True)
        self.assertEqual(value["port"], "8082")
        self.assertEqual(value["networks"], ["test-infra"])
        self.assertEqual([name for name, _ in value["probes"]], ["PostgreSQL", "Kafka", "Redis"])
        self.assertTrue(value["socket"].endswith("capacity.sock"))
        config = configuration()
        config["services"]["backend"]["volumes"][0]["read_only"] = False
        with self.assertRaises(deploy.DeploymentError):
            deploy.plan(config, SHA, True)

    def test_missing_secrets_or_unexpected_image_cannot_be_deployed(self):
        for key in ("DB_PASSWORD", "JWT_SECRET"):
            config = configuration()
            config["services"]["backend"]["environment"][key] = ""
            with self.assertRaises(deploy.DeploymentError):
                deploy.plan(config, SHA, True)
        config = configuration()
        config["services"]["frontend"]["image"] = "ghcr.io/seulgae/invencore-frontend:latest"
        with self.assertRaises(deploy.DeploymentError):
            deploy.plan(config, SHA, True)
        self.assertFalse(deploy.current_postgres(["DB_URL=jdbc:h2:mem:old"]))
        self.assertFalse(deploy.current_postgres(["JAVA_TOOL_OPTIONS=example"]))
        self.assertTrue(deploy.current_postgres(["DB_URL=jdbc:postgresql://postgres:5432/test"]))

    def test_check_and_cancel_never_recreate_containers_or_overwrite_env(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            original = b"APP_IMAGE_TAG=6e33f2d7eb8b\nJWT_SECRET=synthetic-fixture\n"
            (root / ".env.docker").write_bytes(original)
            for name in ("compose.app.yml", "compose.ghcr.yml", "compose.monitoring.yml"):
                (root / name).touch()
            calls = []
            def command(args, env, capture=False):
                self.assertEqual(env["APP_IMAGE_TAG"], SHA)
                calls.append(args)
                if args[-3:] == ["config", "--format", "json"]:
                    return json.dumps(configuration())
                return ""
            for option in ("--check", None):
                argv = ["deploy.py", SHA, "--app-dir", directory, "--local-images"]
                if option:
                    argv.append(option)
                with patch.object(deploy.sys, "argv", argv), patch.object(deploy, "command", side_effect=command), \
                     patch.object(deploy, "reachable", return_value=True), patch("builtins.input", return_value="no"), \
                     contextlib.redirect_stdout(io.StringIO()):
                    deploy.main()
                self.assertEqual((root / ".env.docker").read_bytes(), original)
            self.assertFalse(any("up" in args or "down" in args for args in calls))

    def test_legacy_replacement_requires_explicit_review_and_yes(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            original = b"APP_IMAGE_TAG=old\n"
            (root / ".env.docker").write_bytes(original)
            for name in ("compose.app.yml", "compose.ghcr.yml", "compose.monitoring.yml"):
                (root / name).touch()
            calls = []
            def command(args, env, capture=False):
                calls.append(args)
                if args[-3:] == ["config", "--format", "json"]:
                    return json.dumps(configuration())
                if args[-4:] == ["ps", "-a", "-q", "backend"]:
                    return "old-backend"
                if args[:2] == ["docker", "inspect"]:
                    return json.dumps([{"Config": {"Env": ["DB_URL=jdbc:h2:mem:old"]}}])
                return ""
            argv = ["deploy.py", SHA, "--app-dir", directory, "--local-images"]
            with patch.object(deploy.sys, "argv", argv), patch.object(deploy, "command", side_effect=command), \
                 patch.object(deploy, "reachable", return_value=True), patch("builtins.input") as confirmation, \
                 contextlib.redirect_stdout(io.StringIO()):
                with self.assertRaises(deploy.DeploymentError):
                    deploy.main()
                confirmation.assert_not_called()
            self.assertFalse(any("up" in args for args in calls))
            with patch.object(deploy.sys, "argv", argv + ["--allow-db-transition"]), \
                 patch.object(deploy, "command", side_effect=command), \
                 patch.object(deploy, "reachable", return_value=True), \
                 patch.object(deploy, "verify_http") as verify, patch("builtins.input", return_value="yes"), \
                 contextlib.redirect_stdout(io.StringIO()):
                deploy.main()
                verify.assert_called_once_with("8082", True)
            up = next(args for args in calls if "up" in args)
            self.assertEqual(up[-2:], ["backend", "frontend"])
            self.assertIn("--wait", up)
            self.assertNotIn("down", up)
            self.assertEqual((root / ".env.docker").read_bytes(), original)


if __name__ == "__main__":
    unittest.main()
