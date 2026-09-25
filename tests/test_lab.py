import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import threading
import unittest
from urllib.request import Request, urlopen
from http.server import ThreadingHTTPServer


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
spec = importlib.util.spec_from_file_location("sprout_lab_runner", ROOT / "lab.py")
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)


class LabTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.old_progress = runner.PROGRESS
        runner.PROGRESS = Path(self.temp.name) / "progress.json"

    def tearDown(self):
        runner.PROGRESS = self.old_progress
        self.temp.cleanup()

    def test_manifest_has_seven_distinct_units_and_tasks(self):
        self.assertEqual([unit["id"] for unit in runner.UNITS], list(range(1, 8)))
        for unit in runner.UNITS:
            tasks = [step["id"] for step in unit["steps"]]
            self.assertEqual(len(tasks), len(set(tasks)))
            self.assertTrue(unit["read"])
            self.assertTrue(unit["check"])

    def test_task_marks_do_not_complete_a_unit_before_its_check(self):
        for task in runner.UNITS[0]["steps"]:
            runner.mark(1, task["id"], True)
        self.assertFalse(runner.state()["units"][0]["done"])
        data = runner.read_progress()
        data["checks"]["1"] = {"ok": True, "at": "2026-01-01T00:00:00+00:00", "results": []}
        runner.save_progress(data)
        self.assertTrue(runner.state()["units"][0]["done"])
        self.assertEqual(runner.state()["next_unit"], 2)

    def test_unit_one_check_fails_on_starter_notes(self):
        results = runner.checks.check(ROOT, 1)
        self.assertFalse(results[0]["ok"])
        self.assertFalse(results[1]["ok"])
        self.assertTrue(results[2]["ok"])

    def test_http_state_and_asset(self):
        server = ThreadingHTTPServer(("127.0.0.1", 0), runner.Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            base = f"http://127.0.0.1:{server.server_port}"
            with urlopen(base + "/api/state") as response:
                state = json.load(response)
            self.assertEqual(state["next_unit"], 1)
            with urlopen(base + "/") as response:
                page = response.read().decode("utf-8")
            self.assertIn("Sprout compiler lab", page)
            self.assertIn('id="visual-svg"', page)
            with urlopen(base + "/app.js") as response:
                script = response.read().decode("utf-8")
            self.assertIn("progress-count", script)
            self.assertIn("visual-svg", script)
            request = Request(
                base + "/api/mark",
                data=json.dumps({"unit": 1, "task": "language", "done": True}).encode("utf-8"),
                headers={"Content-Type": "application/json"},
            )
            with urlopen(request) as response:
                changed = json.load(response)
            self.assertTrue(changed["units"][0]["marked"]["language"])
            request = Request(
                base + "/api/check",
                data=json.dumps({"unit": 1}).encode("utf-8"),
                headers={"Content-Type": "application/json"},
            )
            with urlopen(request) as response:
                record = json.load(response)
            self.assertFalse(record["ok"])
        finally:
            server.shutdown()
            server.server_close()
            thread.join()


if __name__ == "__main__":
    unittest.main()
