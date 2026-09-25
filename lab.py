#!/usr/bin/env python3
"""Run the Sprout lab in a terminal or a local browser."""

import argparse
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import sys
from threading import Lock
from urllib.parse import urlparse

from lab import checks


ROOT = Path(__file__).resolve().parent
UNITS = json.loads((ROOT / "lab" / "units.json").read_text(encoding="utf-8"))
PROGRESS = ROOT / ".lab" / "progress.json"
LOCK = Lock()


def read_progress():
    if not PROGRESS.exists():
        return {"tasks": {}, "checks": {}}
    return json.loads(PROGRESS.read_text(encoding="utf-8"))


def save_progress(data):
    PROGRESS.parent.mkdir(parents=True, exist_ok=True)
    temporary = PROGRESS.with_suffix(".tmp")
    temporary.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    temporary.replace(PROGRESS)


def find_unit(unit_id):
    return next((unit for unit in UNITS if unit["id"] == int(unit_id)), None)


def unit_state(unit, progress):
    tasks = progress["tasks"].get(str(unit["id"]), {})
    required = [step for step in unit["steps"] if not step.get("optional")]
    marked = sum(bool(tasks.get(step["id"])) for step in required)
    check = progress["checks"].get(str(unit["id"]))
    passed = bool(check and check["ok"])
    return {
        **unit,
        "marked": tasks,
        "marked_count": marked,
        "required_count": len(required),
        "last_check": check,
        "done": marked == len(required) and passed,
    }


def state():
    progress = read_progress()
    units = [unit_state(unit, progress) for unit in UNITS]
    next_unit = next((unit["id"] for unit in units if not unit["done"]), None)
    return {
        "units": units,
        "next_unit": next_unit,
        "completed": sum(unit["done"] for unit in units),
        "total": len(units),
        "native_check": progress["checks"].get("native"),
    }


def mark(unit_id, task_id, done):
    unit = find_unit(unit_id)
    if unit is None or task_id not in {step["id"] for step in unit["steps"]}:
        raise ValueError("Unknown unit or task.")
    with LOCK:
        progress = read_progress()
        progress["tasks"].setdefault(str(unit["id"]), {})[task_id] = bool(done)
        save_progress(progress)
    return state()


def run_check(unit_id):
    key = str(unit_id)
    if key != "native" and find_unit(key) is None:
        raise ValueError("Unknown unit.")
    results = checks.check(ROOT, "native" if key == "native" else int(key))
    record = {
        "ok": all(item["ok"] for item in results),
        "at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "results": results,
    }
    with LOCK:
        progress = read_progress()
        progress["checks"][key] = record
        save_progress(progress)
    return record


class Handler(BaseHTTPRequestHandler):
    def send_bytes(self, body, content_type, status=200):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def json_response(self, value, status=200):
        self.send_bytes(json.dumps(value).encode("utf-8"), "application/json; charset=utf-8", status)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/state":
            return self.json_response(state())
        assets = {
            "/": ("lab/web/index.html", "text/html; charset=utf-8"),
            "/style.css": ("lab/web/style.css", "text/css; charset=utf-8"),
            "/app.js": ("lab/web/dist/app.js", "text/javascript; charset=utf-8"),
            "/PROJECT_PLAN.md": ("PROJECT_PLAN.md", "text/plain; charset=utf-8"),
            "/CONTRACT.md": ("CONTRACT.md", "text/plain; charset=utf-8"),
        }
        if path not in assets:
            return self.send_bytes(b"Not found", "text/plain; charset=utf-8", 404)
        name, content_type = assets[path]
        file = ROOT / name
        if not file.exists():
            return self.send_bytes(b"Not found", "text/plain; charset=utf-8", 404)
        return self.send_bytes(file.read_bytes(), content_type)

    def do_POST(self):
        path = urlparse(self.path).path
        if path not in {"/api/mark", "/api/check"}:
            return self.json_response({"error": "Not found"}, 404)
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if size < 1 or size > 4096:
                raise ValueError("Request is too large.")
            data = json.loads(self.rfile.read(size))
            if path == "/api/mark":
                answer = mark(data["unit"], data["task"], data["done"])
            else:
                answer = run_check(data["unit"])
            return self.json_response(answer)
        except (ValueError, KeyError, TypeError, json.JSONDecodeError) as error:
            return self.json_response({"error": str(error)}, 400)


def print_check(record):
    for item in record["results"]:
        label = "PASS" if item["ok"] else "FAIL"
        print(f"{label}  {item['label']}: {item['detail']}")
    return 0 if record["ok"] else 1


def main(argv=None):
    parser = argparse.ArgumentParser(description="Your local Sprout compiler lab")
    sub = parser.add_subparsers(dest="action", required=True)
    sub.add_parser("status", help="Show progress for all seven units")
    sub.add_parser("next", help="Show the next unfinished unit")
    run = sub.add_parser("check", help="Run a unit's automated checks")
    run.add_argument("unit", choices=[str(n) for n in range(1, 8)] + ["native"])
    toggle = sub.add_parser("mark", help="Mark a hands-on task done or undone")
    toggle.add_argument("unit", type=int, choices=range(1, 8))
    toggle.add_argument("task")
    toggle.add_argument("value", choices=["done", "undo"])
    serve = sub.add_parser("serve", help="Open the local lab interface")
    serve.add_argument("--port", type=int, default=8765)
    args = parser.parse_args(argv)

    if args.action == "status":
        current = state()
        for unit in current["units"]:
            label = "done" if unit["done"] else f"{unit['marked_count']}/{unit['required_count']} tasks"
            check = "passed" if unit["last_check"] and unit["last_check"]["ok"] else "pending"
            print(f"{unit['id']}. {unit['title']}: {label}; check {check}")
        return 0
    if args.action == "next":
        current = state()
        unit = next((item for item in current["units"] if item["id"] == current["next_unit"]), None)
        if unit is None:
            print("All seven units are complete.")
            return 0
        print(f"Unit {unit['id']}: {unit['title']}\n{unit['summary']}\n")
        print("Read:")
        for source in unit["read"]:
            print(f"  {source['label']}: {source['url']}")
        print("\nDo:")
        for task in unit["steps"]:
            mark_text = "x" if unit["marked"].get(task["id"]) else " "
            optional = " (optional)" if task.get("optional") else ""
            print(f"  [{mark_text}] {task['id']}: {task['text']}{optional}")
        print(f"\nCheck: {unit['try']}")
        return 0
    if args.action == "check":
        return print_check(run_check(args.unit))
    if args.action == "mark":
        mark(args.unit, args.task, args.value == "done")
        return 0
    if args.action == "serve":
        if not 1 <= args.port <= 65535:
            parser.error("Port must be between 1 and 65535.")
        address = ("127.0.0.1", args.port)
        with ThreadingHTTPServer(address, Handler) as server:
            print(f"Lab running at http://127.0.0.1:{args.port}", flush=True)
            server.serve_forever()
    return 0


if __name__ == "__main__":
    sys.exit(main())
