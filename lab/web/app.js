import { checkMessage, firstUnfinished, progressPercent } from "./model.js";
import { VISUALS, frameFor } from "./visuals.js";

let lab = null;
let selected = null;
let visualUnit = null;
let visualStep = 0;
let answerVisible = false;
const SVG_NS = "http://www.w3.org/2000/svg";

const byId = (id) => document.getElementById(id);

function node(tag, className, text) {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (text !== undefined) item.textContent = text;
  return item;
}

async function request(path, body) {
  const options = body === undefined ? {} : {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
  const response = await fetch(path, options);
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || "Request failed.");
  return value;
}

function currentUnit() {
  return lab.units.find((unit) => unit.id === selected);
}

function svgNode(tag, attributes = {}) {
  const item = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attributes)) item.setAttribute(key, String(value));
  return item;
}

function center(item) {
  return { x: item.x + item.w / 2, y: item.y + 29 };
}

function edgePoints(from, to) {
  const a = center(from);
  const b = center(to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const leave = Math.min(Math.abs((from.w / 2) / (ux || 0.0001)), Math.abs(29 / (uy || 0.0001)));
  const arrive = Math.min(Math.abs((to.w / 2) / (ux || 0.0001)), Math.abs(29 / (uy || 0.0001)));
  return {
    x1: a.x + ux * (leave + 2),
    y1: a.y + uy * (leave + 2),
    x2: b.x - ux * (arrive + 3),
    y2: b.y - uy * (arrive + 3),
  };
}

function buildDiagram(visual) {
  const svg = byId("visual-svg");
  svg.replaceChildren();
  svg.setAttribute("viewBox", `0 0 ${visual.width} ${visual.height}`);
  svg.setAttribute("aria-label", visual.title);
  const defs = svgNode("defs");
  const marker = svgNode("marker", { id: "diagram-arrow", viewBox: "0 0 8 8", refX: 7, refY: 4, markerWidth: 8, markerHeight: 8, orient: "auto" });
  marker.append(svgNode("path", { d: "M 0 0 L 8 4 L 0 8 Z", class: "diagram-arrow" }));
  defs.append(marker);
  svg.append(defs);
  const nodes = new Map(visual.nodes.map((item) => [item.id, item]));
  visual.edges.forEach(([fromId, toId, label]) => {
    const from = nodes.get(fromId);
    const to = nodes.get(toId);
    if (label === "back") {
      const x1 = from.x + from.w / 2;
      const y1 = from.y + 58;
      const x2 = to.x + to.w / 2;
      const y2 = to.y + 64;
      svg.append(svgNode("path", {
        d: `M ${x1} ${y1} C ${x1} 248, ${x2} 248, ${x2} ${y2}`,
        class: "diagram-edge",
        "marker-end": "url(#diagram-arrow)",
      }));
      const text = svgNode("text", { x: (x1 + x2) / 2, y: 245, class: "diagram-edge-label", "text-anchor": "middle" });
      text.textContent = label;
      svg.append(text);
      return;
    }
    const points = edgePoints(from, to);
    const line = svgNode("line", { ...points, class: "diagram-edge", "marker-end": "url(#diagram-arrow)" });
    svg.append(line);
    if (label) {
      const text = svgNode("text", {
        x: (points.x1 + points.x2) / 2,
        y: (points.y1 + points.y2) / 2 - 8,
        class: "diagram-edge-label",
        "text-anchor": "middle",
      });
      text.textContent = label;
      svg.append(text);
    }
  });
  visual.nodes.forEach((item) => {
    const group = svgNode("g", { "data-node-id": item.id, class: "diagram-node" });
    group.append(svgNode("rect", { x: item.x, y: item.y, width: item.w, height: 58, rx: 12 }));
    const title = svgNode("text", { x: item.x + item.w / 2, y: item.y + 25, "text-anchor": "middle", class: "diagram-title" });
    title.textContent = item.label;
    const note = svgNode("text", { x: item.x + item.w / 2, y: item.y + 43, "text-anchor": "middle", class: "diagram-note" });
    note.textContent = item.note;
    group.append(title, note);
    svg.append(group);
  });
}

function renderVisual() {
  const visual = VISUALS[selected];
  if (!visual) return;
  if (visualUnit !== selected) {
    visualUnit = selected;
    visualStep = 0;
    answerVisible = false;
    buildDiagram(visual);
  }
  const frame = frameFor(selected, visualStep);
  const active = new Set(frame.active);
  byId("visual-svg").querySelectorAll("[data-node-id]").forEach((item) => {
    item.classList.toggle("active", active.has(item.dataset.nodeId));
  });
  byId("visual-title").textContent = visual.title;
  byId("visual-prompt").textContent = visual.prompt;
  byId("visual-count").textContent = `Step ${visualStep + 1} of ${visual.frames.length}`;
  byId("visual-frame-title").textContent = frame.title;
  byId("visual-frame-detail").textContent = frame.detail;
  byId("visual-prev").disabled = visualStep === 0;
  byId("visual-next").disabled = visualStep === visual.frames.length - 1;
  byId("visual-answer").textContent = visual.answer;
  byId("visual-answer").hidden = !answerVisible;
  byId("visual-reveal").textContent = answerVisible ? "Hide answer" : "Show answer";
  byId("visual-reveal").setAttribute("aria-expanded", String(answerVisible));
}

function showResults(record) {
  const list = byId("check-results");
  list.replaceChildren();
  if (!record) return;
  record.results.forEach((item) => {
    const row = node("div", item.ok ? "check-item" : "check-item fail");
    row.append(node("strong", "", item.ok ? "PASS" : "FAIL"));
    row.append(node("span", "", item.label + ". " + item.detail));
    list.append(row);
  });
}

function render() {
  const unit = currentUnit();
  if (!unit) return;
  byId("progress-count").textContent = lab.completed + " of " + lab.total + " units";
  byId("progress-fill").style.width = progressPercent(lab.completed, lab.total) + "%";
  byId("progress-track").setAttribute("aria-valuenow", String(lab.completed));
  byId("unit-list").replaceChildren();
  lab.units.forEach((item) => {
    const button = node("button", "unit-link" + (item.id === selected ? " active" : ""));
    button.type = "button";
    button.setAttribute("aria-current", item.id === selected ? "step" : "false");
    button.append(node("span", "unit-index", String(item.id).padStart(2, "0")));
    button.append(node("span", "unit-name", item.title));
    if (item.done) button.append(node("span", "unit-complete", "✓"));
    button.addEventListener("click", () => { selected = item.id; render(); });
    byId("unit-list").append(button);
  });

  byId("unit-number").textContent = "Unit " + String(unit.id).padStart(2, "0") + " / 07";
  byId("unit-title").textContent = unit.title;
  byId("unit-summary").textContent = unit.summary;
  byId("unit-result").textContent = unit.result;
  byId("unit-state").textContent = unit.done ? "Complete" : unit.last_check?.ok ? "Check passed" : "In progress";
  byId("unit-state").classList.toggle("done", unit.done);
  renderVisual();
  byId("read-list").replaceChildren();
  unit.read.forEach((source) => {
    const link = node("a", "resource");
    link.href = source.url;
    if (source.url.startsWith("https://")) {
      link.target = "_blank";
      link.rel = "noopener";
    }
    const title = node("span", "resource-title", source.label);
    title.append(node("span", "", "↗"));
    link.append(title, node("small", "", source.why));
    byId("read-list").append(link);
  });

  byId("task-list").replaceChildren();
  unit.steps.forEach((step) => {
    const label = node("label", "task" + (unit.marked[step.id] ? " checked" : ""));
    const input = node("input");
    input.type = "checkbox";
    input.checked = Boolean(unit.marked[step.id]);
    const words = node("span", "", step.text);
    if (step.optional) words.append(node("small", "optional", "Optional"));
    label.append(input, words);
    input.addEventListener("change", async () => {
      input.disabled = true;
      try {
        lab = await request("/api/mark", { unit: unit.id, task: step.id, done: input.checked });
        render();
      } catch (error) {
        byId("message").textContent = error.message;
        input.disabled = false;
      }
    });
    byId("task-list").append(label);
  });
  byId("check-description").textContent = unit.check;
  byId("check-command").textContent = unit.try;
  byId("check-time").textContent = unit.last_check ? "Last run " + new Date(unit.last_check.at).toLocaleString() : "Not run yet";
  byId("run-native").classList.toggle("hidden", unit.id !== 7);
  byId("previous-unit").disabled = selected === 1;
  byId("next-unit").disabled = selected === lab.total;
  byId("message").textContent = "";
  showResults(unit.last_check);
}

async function runCheck(unit) {
  const button = unit === "native" ? byId("run-native") : byId("run-check");
  button.disabled = true;
  byId("message").textContent = "Running the checks on this server…";
  try {
    const record = await request("/api/check", { unit });
    lab = await request("/api/state");
    render();
    if (unit === "native") showResults(record);
    byId("message").textContent = checkMessage(record);
  } catch (error) {
    byId("message").textContent = error.message;
  } finally {
    button.disabled = false;
  }
}

async function start() {
  try {
    lab = await request("/api/state");
    selected = firstUnfinished(lab.units) || 1;
    render();
  } catch (error) {
    byId("unit-title").textContent = "The lab could not load";
    byId("unit-summary").textContent = error.message;
  }
}

byId("run-check").addEventListener("click", () => runCheck(selected));
byId("run-native").addEventListener("click", () => runCheck("native"));
byId("previous-unit").addEventListener("click", () => { selected -= 1; render(); });
byId("next-unit").addEventListener("click", () => { selected += 1; render(); });
byId("visual-prev").addEventListener("click", () => { visualStep -= 1; renderVisual(); });
byId("visual-next").addEventListener("click", () => { visualStep += 1; renderVisual(); });
byId("visual-reveal").addEventListener("click", () => { answerVisible = !answerVisible; renderVisual(); });
byId("copy-command").addEventListener("click", async () => {
  await navigator.clipboard.writeText(byId("check-command").textContent);
  byId("copy-command").textContent = "Copied";
  setTimeout(() => { byId("copy-command").textContent = "Copy"; }, 1400);
});
start();
