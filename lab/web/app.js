import { checkMessage, firstUnfinished, progressPercent } from "./model.js";

let lab = null;
let selected = null;

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
byId("copy-command").addEventListener("click", async () => {
  await navigator.clipboard.writeText(byId("check-command").textContent);
  byId("copy-command").textContent = "Copied";
  setTimeout(() => { byId("copy-command").textContent = "Copy"; }, 1400);
});
start();
