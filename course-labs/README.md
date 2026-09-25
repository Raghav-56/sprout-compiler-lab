# Flex and Bison side labs

These small C programs let you inspect the generators named in PCIT702. Sprout stays a Rust project.

On the ARM Linux server, run:

```sh
sh course-labs/build.sh
printf 'let answer: int = 12;\n' | course-labs/bin/lexer
printf '2 + 3 * 4\n' | course-labs/bin/calc
```

The first command prints token kinds and lexemes. The calculator prints `14`. Read `lexer.l` and `parser.y` before changing them. Then try `ifx` versus `if`, and change one precedence rule to see what Bison reports.

These programs use Flex, Bison, and a C compiler. Build them when you reach Units 2 and 3. They are not required to build or check the Rust starter.
