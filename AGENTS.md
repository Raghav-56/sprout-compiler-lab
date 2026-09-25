# Working in the Sprout lab

The repository is a learner's compiler project. The Rust starter intentionally leaves Units 2 to 7 unimplemented. Keep the staged checks honest. A unit passes only when its CLI behavior works.

Read `CONTRACT.md` before changing the command interface. Keep the unit instructions in `lab/units.json` aligned with the checks in `lab/checks.py`. Use `bun run build` after changing the browser JavaScript.

When helping the learner, explain the current unit and the next small change. Implement compiler code when the learner asks for it. Preserve their own language decisions in `work/`.

Run `cargo test`, `uv run python -m unittest discover -s tests -v`, and `bun test` for changes to their respective parts. Run the staged check for the unit you changed. Later units may fail until the learner implements them.
