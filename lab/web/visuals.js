export const VISUALS = {
  1: {
    title: "Follow one program through the compiler",
    prompt: "A variable name has never been declared. Which stage should catch it?",
    answer: "Name resolution. The lexer can recognize the name and the parser can place it in a valid expression, but the resolver must find its declaration.",
    width: 740,
    height: 190,
    nodes: [
      { id: "source", label: "Source", note: "characters", x: 10, y: 68, w: 90 },
      { id: "tokens", label: "Tokens", note: "lexer", x: 115, y: 68, w: 90 },
      { id: "ast", label: "AST", note: "parser", x: 220, y: 68, w: 90 },
      { id: "typed", label: "Typed AST", note: "names+types", x: 325, y: 68, w: 90 },
      { id: "ir", label: "IR", note: "lowering", x: 430, y: 68, w: 90 },
      { id: "optimized", label: "Opt IR", note: "your passes", x: 535, y: 68, w: 90 },
      { id: "native", label: "ARM64", note: "Cranelift", x: 640, y: 68, w: 90 },
    ],
    edges: [["source", "tokens"], ["tokens", "ast"], ["ast", "typed"], ["typed", "ir"], ["ir", "optimized"], ["optimized", "native"]],
    frames: [
      { active: ["source", "tokens"], title: "Characters become tokens", detail: "The lexer groups characters such as 12 and return into tokens. It cannot tell whether a name was declared." },
      { active: ["tokens", "ast"], title: "Tokens become a tree", detail: "The parser checks the grammar and groups 2 + 3 * 4 as 2 + (3 * 4)." },
      { active: ["ast", "typed"], title: "Names and types get meaning", detail: "The resolver connects a use of x to a declaration. The type checker rejects a bool returned from an int function." },
      { active: ["typed", "ir", "optimized", "native"], title: "The program becomes runnable", detail: "Your IR expresses control flow. Your passes improve it. Cranelift lowers it to instructions for the server's ARM64 CPU." },
    ],
  },
  2: {
    title: "Watch the lexer choose tokens",
    prompt: "Why does ifx become one identifier instead of IF followed by x?",
    answer: "The identifier pattern consumes all three characters. The shorter keyword match does not win.",
    width: 740,
    height: 190,
    nodes: [
      { id: "ifx", label: "ifx", note: "IDENT", x: 28, y: 68, w: 115 },
      { id: "eq", label: "==", note: "EQUAL_EQUAL", x: 170, y: 68, w: 115 },
      { id: "number", label: "12", note: "INT", x: 312, y: 68, w: 115 },
      { id: "semi", label: ";", note: "SEMICOLON", x: 454, y: 68, w: 115 },
      { id: "end", label: "EOF", note: "end of input", x: 596, y: 68, w: 115 },
    ],
    edges: [["ifx", "eq"], ["eq", "number"], ["number", "semi"], ["semi", "end"]],
    frames: [
      { active: ["ifx"], title: "Read ifx", detail: "The scanner keeps reading while the identifier rule still matches. The token is IDENT, with lexeme ifx." },
      { active: ["eq"], title: "Read ==", detail: "The scanner looks ahead. Two equals signs form one comparison token." },
      { active: ["number"], title: "Read 12", detail: "The integer rule consumes both digits. The following semicolon ends that token." },
      { active: ["semi", "end"], title: "Finish the stream", detail: "Punctuation becomes its own token, followed by an end-of-input marker." },
    ],
  },
  3: {
    title: "See precedence in the AST",
    prompt: "Where does multiplication sit in the tree for 2 + 3 * 4?",
    answer: "The multiplication node is the right child of addition. The tree means 2 + (3 * 4), which evaluates to 14.",
    width: 740,
    height: 290,
    nodes: [
      { id: "add", label: "Add", note: "+", x: 318, y: 20, w: 104 },
      { id: "two", label: "2", note: "left", x: 145, y: 125, w: 104 },
      { id: "mul", label: "Multiply", note: "*", x: 492, y: 125, w: 104 },
      { id: "three", label: "3", note: "left", x: 424, y: 218, w: 104 },
      { id: "four", label: "4", note: "right", x: 610, y: 218, w: 104 },
    ],
    edges: [["add", "two"], ["add", "mul"], ["mul", "three"], ["mul", "four"]],
    frames: [
      { active: ["add"], title: "The outer operation is addition", detail: "The parser gives the whole expression an Add root." },
      { active: ["mul", "three", "four"], title: "Multiplication groups first", detail: "The right side of Add is a Multiply subtree containing 3 and 4." },
      { active: ["two", "add", "mul"], title: "Read the finished tree", detail: "Evaluate the Multiply subtree, then add 2. A different tree would produce a different result." },
    ],
  },
  4: {
    title: "Resolve a name through nested scopes",
    prompt: "Inside the block, which x does return x refer to?",
    answer: "The inner x. Lookup starts in the current block. The resolver can give that declaration its own symbol ID, separate from the outer x.",
    width: 740,
    height: 245,
    nodes: [
      { id: "main", label: "main scope", note: "function", x: 18, y: 84, w: 122 },
      { id: "outer", label: "x = 1", note: "symbol 1", x: 185, y: 25, w: 122 },
      { id: "block", label: "inner block", note: "new scope", x: 185, y: 145, w: 122 },
      { id: "inner", label: "x = 2", note: "symbol 2", x: 375, y: 145, w: 122 },
      { id: "use", label: "return x", note: "uses symbol 2", x: 575, y: 145, w: 142 },
    ],
    edges: [["main", "outer"], ["main", "block"], ["block", "inner"], ["inner", "use"]],
    frames: [
      { active: ["main", "outer"], title: "The function declares x", detail: "The outer declaration receives one symbol ID." },
      { active: ["block", "inner"], title: "A block introduces another x", detail: "The inner declaration shadows the outer one and gets a different ID." },
      { active: ["inner", "use"], title: "Lookup starts nearby", detail: "The use inside the block resolves to the inner declaration." },
    ],
  },
  5: {
    title: "Trace a recursive call stack",
    prompt: "When factorial(1) returns, which call continues next?",
    answer: "factorial(2). It is the caller directly below factorial(1), and it still has its own n and return location.",
    width: 740,
    height: 335,
    nodes: [
      { id: "main", label: "main", note: "waits for result", x: 275, y: 245, w: 190 },
      { id: "f3", label: "factorial(3)", note: "n = 3", x: 275, y: 170, w: 190 },
      { id: "f2", label: "factorial(2)", note: "n = 2", x: 275, y: 95, w: 190 },
      { id: "f1", label: "factorial(1)", note: "returns 1", x: 275, y: 20, w: 190 },
    ],
    edges: [["main", "f3"], ["f3", "f2"], ["f2", "f1"]],
    frames: [
      { active: ["main", "f3"], title: "main calls factorial(3)", detail: "A new frame holds n = 3. main waits for the return value." },
      { active: ["main", "f3", "f2"], title: "factorial(3) calls factorial(2)", detail: "The n = 3 frame stays alive while the n = 2 frame runs." },
      { active: ["main", "f3", "f2", "f1"], title: "factorial(2) calls factorial(1)", detail: "The base case returns 1. Each call has its own parameter slot." },
      { active: ["main", "f3", "f2"], title: "factorial(2) resumes", detail: "The base-case frame is gone. factorial(2) uses the returned 1 to compute 2." },
      { active: ["main", "f3"], title: "factorial(3) resumes", detail: "The n = 2 frame is gone. factorial(3) uses the returned 2 to compute 6." },
      { active: ["main"], title: "main receives 6", detail: "The recursive calls have returned. Only main's frame remains." },
    ],
  },
  6: {
    title: "Walk a loop's control flow",
    prompt: "Which edge sends control back for another iteration?",
    answer: "The edge from the body block to the test block. The loop exits when the test follows the false edge to return.",
    width: 740,
    height: 270,
    nodes: [
      { id: "entry", label: "Entry", note: "n = 3; sum = 0", x: 25, y: 100, w: 130 },
      { id: "test", label: "Test", note: "n > 0?", x: 220, y: 100, w: 130 },
      { id: "body", label: "Body", note: "sum += n; n--", x: 425, y: 25, w: 160 },
      { id: "exit", label: "Return", note: "sum", x: 425, y: 178, w: 160 },
    ],
    edges: [["entry", "test"], ["test", "body", "true"], ["test", "exit", "false"], ["body", "test", "back"]],
    frames: [
      { active: ["entry", "test"], title: "Initialize and test", detail: "The first block sets n and sum. The branch asks whether n is still positive." },
      { active: ["test", "body"], title: "Take the true edge", detail: "The body adds n to sum and decrements n." },
      { active: ["body", "test"], title: "Jump back", detail: "Control returns to the test. The IR has a branch, not a while keyword." },
      { active: ["test", "exit"], title: "Take the false edge", detail: "When n reaches zero, return sum. The example returns 6." },
    ],
  },
  7: {
    title: "Watch an optimization preserve meaning",
    prompt: "What must stay the same when the middle instructions disappear?",
    answer: "The returned value. Both instruction sequences return 14; the optimized one does less work at runtime.",
    width: 740,
    height: 230,
    nodes: [
      { id: "source", label: "2 + 3 * 4", note: "source", x: 18, y: 84, w: 130 },
      { id: "mul", label: "t1 = 3 * 4", note: "plain IR", x: 194, y: 20, w: 140 },
      { id: "add", label: "t2 = 2 + t1", note: "plain IR", x: 385, y: 20, w: 140 },
      { id: "folded", label: "return 14", note: "optimized IR", x: 285, y: 150, w: 140 },
      { id: "result", label: "14", note: "same result", x: 590, y: 84, w: 130 },
    ],
    edges: [["source", "mul"], ["mul", "add"], ["add", "result"], ["source", "folded"], ["folded", "result"]],
    frames: [
      { active: ["source", "mul", "add"], title: "The plain IR computes both operations", detail: "A temporary holds 3 * 4. A second temporary adds 2." },
      { active: ["source", "folded"], title: "Constant folding does the work early", detail: "The compiler can calculate 14 once, before the program runs." },
      { active: ["add", "folded", "result"], title: "Both paths return 14", detail: "The interpreter and native path should still return 14. That is the check that matters." },
    ],
  },
};

export function frameFor(unitId, index) {
  const visual = VISUALS[unitId];
  if (!visual) return null;
  return visual.frames[Math.max(0, Math.min(index, visual.frames.length - 1))];
}

export function validVisual(visual) {
  if (!visual || !visual.frames?.length || !visual.nodes?.length) return false;
  const ids = new Set(visual.nodes.map((node) => node.id));
  return ids.size === visual.nodes.length
    && visual.nodes.every((node) => node.x >= 0 && node.y >= 0 && node.x + node.w <= visual.width && node.y + 58 <= visual.height)
    && visual.edges.every(([from, to]) => ids.has(from) && ids.has(to))
    && visual.frames.every((frame) => frame.active.length && frame.active.every((id) => ids.has(id)));
}
