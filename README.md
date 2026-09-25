# Sprout compiler lab

Build a small compiler on an ARM Linux server, one unit at a time. The lab tells you what to read, what to build, and what its checks can verify. You write the compiler. The starter already has a Rust command, examples, unit worksheets, checks, and a local browser interface.

The recommended path uses Logos for tokens and a hand-written parser. You can choose LALRPOP for LR parsing or write the lexer by hand. Flex and Bison fit as short C exercises. The stages after parsing use the same AST, interpreter, three-address IR, and optional Cranelift backend. Bun builds and checks the browser UI; uv keeps the Python lab runner in its own environment.

Each unit has a short SVG trace in the browser lab. Step through it, answer the prompt, then reveal the explanation. The diagrams draw on the unit's examples and checks. They run locally and load no image library or remote media.

## Start on the server

Install Git, [uv](https://docs.astral.sh/uv/getting-started/installation/), [Bun](https://bun.sh/docs/installation), and stable Rust. uv creates the Python environment. For Rust on AArch64 Linux, use the [rustup instructions](https://rust-lang.github.io/rustup/installation/). Clone the repository with your GitHub access, then run:

```sh
cd sprout-compiler-lab
sh scripts/setup.sh
uv run python lab.py serve
```

The lab listens on `127.0.0.1:8765` on the server. From your own computer, open an SSH tunnel:

```sh
ssh -L 8765:127.0.0.1:8765 USER@SERVER
```

Visit [http://127.0.0.1:8765](http://127.0.0.1:8765). Keep the tunnel and lab process running while you work.

If GitHub SSH access is already set up on the server, clone with:

```sh
git clone git@github.com:Raghav-56/sprout-compiler-lab.git
```

The repository is private. On a new server, authenticate GitHub CLI and run `gh repo clone Raghav-56/sprout-compiler-lab`, or configure an SSH key for GitHub.

## Work without the browser

```sh
uv run python lab.py status
uv run python lab.py next
uv run python lab.py check 1
uv run python lab.py mark 1 language done
```

The `next` command shows the first unit that still needs work. `check 1` starts with failures because the Unit 1 worksheets contain `TODO` markers. Fill them in, mark the three tasks, and run the check again. When the check passes, the lab moves to Unit 2.

The lab saves your checkmarks and last check results in `.lab/progress.json`. Git ignores that file. Commit your compiler code and worksheets as you go.

## What the checks expect

Read [the command contract](CONTRACT.md) before implementing a unit. The checks call the same `sprout` commands you use in a terminal. Unit 2 checks token order. Unit 3 checks valid and broken syntax. Later units compare interpreter, IR, and native results. The Unit 7 native check is optional.

Run `cargo test` for Rust, `uv run python -m unittest discover -s tests -v` for the lab runner, and `bun test` for the browser logic. The setup script runs all three. `uv run python lab.py check N` runs the staged behavior checks for your compiler; unfinished units are expected to fail.

Read [the full project plan](PROJECT_PLAN.md) for the language, tool choices, and Mermaid diagrams. The plan follows PCIT702's unit order. The repo does not publish class PDFs or the textbook.

## File map

| Path | What it is |
|---|---|
| `src/main.rs` | Your compiler entry point. It starts with the command names and no solutions. |
| `examples/` | Small valid and invalid Sprout programs used by staged checks. |
| `work/` | Worksheets for diagrams and decisions that a program cannot grade. |
| `lab/units.json` | The source of truth for unit instructions and reading links. |
| `lab/checks.py` | The checks that call your compiler. |
| `lab/web/` | The browser interface served by `lab.py`. |
| `course-labs/` | Small C Flex and Bison examples for Units 2 and 3. |
| `package.json` | Bun build and browser tests. |
| `pyproject.toml` | uv-managed Python environment for the lab runner. |
| `PROJECT_PLAN.md` | Full route through all seven units. |

The UI binds to localhost so it does not expose the lab to the public internet. Use the SSH tunnel to reach it.
