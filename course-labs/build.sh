#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."

for tool in flex bison cc; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    printf '%s\n' "$tool is missing."
    exit 1
  fi
done

mkdir -p course-labs/bin
flex -o course-labs/bin/lexer.c course-labs/lexer.l
cc -std=c17 -Wall -Wextra -o course-labs/bin/lexer course-labs/bin/lexer.c
bison -d -o course-labs/bin/parser.c course-labs/parser.y
cc -std=c17 -Wall -Wextra -o course-labs/bin/calc course-labs/bin/parser.c
printf '%s\n' 'Built course-labs/bin/lexer and course-labs/bin/calc'
