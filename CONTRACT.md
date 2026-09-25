# Command contract for the lab

The lab checks observable behavior through the `sprout` command. Keep these names even if you change Rust modules or choose a different parser.

| Unit | Command | Expected behavior |
|---|---|---|
| 1 | `sprout --help` | Print available commands and exit successfully. |
| 2 | `sprout tokens FILE` | Print `KIND lexeme` on each line, in source order. Invalid characters cause a nonzero exit. |
| 3 | `sprout ast FILE` | Print a nonempty AST for valid source. Invalid syntax causes a nonzero exit. |
| 4 | `sprout check FILE` | Accept valid source. Reject undefined names and type errors. |
| 5 | `sprout interpret FILE` | Print the integer returned by `main` and exit successfully. |
| 6 | `sprout ir FILE`, `sprout ir-run FILE` | Print three-address code; execute it and print `main`'s integer result. |
| 7 | `sprout ir-opt FILE`, `sprout run --native FILE` | Print optimized IR; optionally run native ARM64 code and print the result. |

For token output, use these names for the first fixture: `LET`, `IDENT`, `COLON`, `TYPE_INT`, `EQUAL`, `INT`, `SEMICOLON`, and `RETURN`. A token line has one space between the name and the lexeme. Ignore whitespace and comments.

Diagnostics go to standard error. A rejected program exits with a nonzero code. The commands that run a program print only its returned integer to standard output, followed by a newline. This keeps the lab checks independent of your internal types.

The checks deliberately cover a small public contract. Use the unit guides to inspect the parts an automatic check cannot judge, such as your explanation of a grammar conflict or activation record.
