"""Behavior checks for each unit. These call the same CLI the learner uses."""

from pathlib import Path
import subprocess
import tempfile


def result(label, ok, detail):
    return {"label": label, "ok": bool(ok), "detail": detail}


def note(root, relative):
    path = root / relative
    if not path.is_file():
        return result(relative, False, "File is missing.")
    content = path.read_text(encoding="utf-8")
    if "TODO" in content or len(content.strip()) < 120:
        return result(relative, False, "Replace the TODO and write a concrete explanation.")
    return result(relative, True, "Written.")


def sprout(root, *args):
    try:
        return subprocess.run(
            ["cargo", "run", "--quiet", "--", *map(str, args)],
            cwd=root,
            text=True,
            capture_output=True,
            timeout=120,
            check=False,
        )
    except FileNotFoundError:
        return None
    except subprocess.TimeoutExpired:
        return None


def command_result(label, process, expected=None, should_fail=False, nonempty=False):
    if process is None:
        return result(label, False, "Cargo is missing or the command timed out.")
    if should_fail:
        ok = process.returncode != 0
        detail = "Rejected as expected." if ok else "This invalid program was accepted."
    else:
        ok = process.returncode == 0
        detail = "Command ran." if ok else (process.stderr.strip() or "Command failed.")[:300]
    if ok and expected is not None:
        ok = process.stdout.strip() == expected
        detail = f"Expected {expected!r}; got {process.stdout.strip()!r}."
    if ok and nonempty:
        ok = bool(process.stdout.strip())
        detail = "Output is present." if ok else "Command printed no output."
    return result(label, ok, detail)


def check(root: Path, unit):
    if unit == 1:
        return [
            note(root, "work/01-language.md"),
            note(root, "work/01-pipeline.md"),
            command_result("--help", sprout(root, "--help"), nonempty=True),
        ]
    if unit == 2:
        expected = "\n".join(
            [
                "LET let",
                "IDENT answer",
                "COLON :",
                "TYPE_INT int",
                "EQUAL =",
                "INT 12",
                "SEMICOLON ;",
                "RETURN return",
                "IDENT answer",
                "SEMICOLON ;",
            ]
        )
        with tempfile.TemporaryDirectory() as temp:
            invalid = Path(temp) / "invalid.sp"
            invalid.write_text("@", encoding="utf-8")
            bad = sprout(root, "tokens", invalid)
        return [
            note(root, "work/02-dfa.md"),
            command_result("token order", sprout(root, "tokens", "examples/tokens.sp"), expected=expected),
            command_result("invalid character", bad, should_fail=True),
        ]
    if unit == 3:
        return [
            note(root, "work/03-parser.md"),
            command_result("valid AST", sprout(root, "ast", "examples/precedence.sp"), nonempty=True),
            command_result("syntax error", sprout(root, "ast", "examples/bad_syntax.sp"), should_fail=True),
        ]
    if unit == 4:
        return [
            note(root, "work/04-semantics.md"),
            command_result("valid program", sprout(root, "check", "examples/factorial.sp")),
            command_result("undefined name", sprout(root, "check", "examples/bad_name.sp"), should_fail=True),
            command_result("wrong type", sprout(root, "check", "examples/bad_type.sp"), should_fail=True),
        ]
    if unit == 5:
        return [
            note(root, "work/05-frames.md"),
            command_result("factorial", sprout(root, "interpret", "examples/factorial.sp"), expected="120"),
            command_result("loop", sprout(root, "interpret", "examples/loop.sp"), expected="6"),
        ]
    if unit == 6:
        return [
            note(root, "work/06-ir.md"),
            command_result("IR dump", sprout(root, "ir", "examples/factorial.sp"), nonempty=True),
            command_result("IR factorial", sprout(root, "ir-run", "examples/factorial.sp"), expected="120"),
            command_result("IR loop", sprout(root, "ir-run", "examples/loop.sp"), expected="6"),
        ]
    if unit == 7:
        plain = sprout(root, "ir", "examples/fold.sp")
        optimized = sprout(root, "ir-opt", "examples/fold.sp")
        changed = (
            plain is not None
            and optimized is not None
            and plain.returncode == 0
            and optimized.returncode == 0
            and bool(optimized.stdout.strip())
            and plain.stdout != optimized.stdout
        )
        return [
            note(root, "work/07-optimization.md"),
            result("optimized IR changes", changed, "The fold example must have a visible IR change."),
            command_result("IR result remains 14", sprout(root, "ir-run", "examples/fold.sp"), expected="14"),
        ]
    if unit == "native":
        return [
            command_result("native factorial", sprout(root, "run", "--native", "examples/factorial.sp"), expected="120"),
            command_result("native loop", sprout(root, "run", "--native", "examples/loop.sp"), expected="6"),
        ]
    raise ValueError(f"Unknown unit: {unit}")
