#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."

if ! command -v uv >/dev/null 2>&1; then
  printf '%s\n' 'uv is missing. Install it from https://docs.astral.sh/uv/getting-started/installation/'
  exit 1
fi
if ! command -v bun >/dev/null 2>&1; then
  printf '%s\n' 'Bun is missing. Install it from https://bun.sh/docs/installation'
  exit 1
fi
if ! command -v cargo >/dev/null 2>&1; then
  printf '%s\n' 'Cargo is missing. Install stable Rust: https://rust-lang.github.io/rustup/installation/'
  exit 1
fi

printf '%s\n' 'Preparing the Python lab and browser UI…'
uv sync --locked
bun run build
printf '%s\n' 'Checking the Rust starter…'
cargo test
printf '%s\n' 'Checking the lab runner…'
uv run python -m unittest discover -s tests -v
printf '%s\n' 'Checking the browser logic…'
bun test
printf '%s\n' ''
uv run python lab.py next
printf '%s\n' ''
printf '%s\n' 'Open the lab with: uv run python lab.py serve'
