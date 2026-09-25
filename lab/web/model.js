export function progressPercent(completed, total) {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, (completed / total) * 100));
}

export function firstUnfinished(units) {
  return units.find((unit) => !unit.done)?.id ?? null;
}

export function checkMessage(record) {
  return record.ok
    ? "Checks passed."
    : "Some checks failed. The result below shows what to fix.";
}
