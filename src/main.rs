use std::env;
use std::process::ExitCode;

const HELP: &str = "Sprout compiler lab

Usage:
  sprout --help
  sprout tokens FILE
  sprout ast FILE
  sprout check FILE
  sprout interpret FILE
  sprout ir FILE
  sprout ir-run FILE
  sprout ir-opt FILE
  sprout run --native FILE

The commands are the lab's public contract. Implement them one unit at a time.
Run uv run python lab.py next to see your next task.";

fn main() -> ExitCode {
    let args: Vec<String> = env::args().skip(1).collect();
    if args.is_empty() || matches!(args[0].as_str(), "--help" | "-h" | "help") {
        println!("{HELP}");
        return ExitCode::SUCCESS;
    }

    eprintln!(
        "'{}' is waiting for you. Open the lab and follow the unit guide.",
        args[0]
    );
    ExitCode::from(2)
}
