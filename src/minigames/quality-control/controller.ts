import type { Scenario, State } from "../../simulation/types";
import {
  amount,
  has,
  message,
  need,
  record,
  selected,
  task,
  type Reducer,
} from "../runtime/core";
import { seedWorkData } from "../runtime/seed-data";
export function initialize(s: Scenario) {
  const g = seedWorkData(s);
  g.phase = "uninspected";
  g.records.forEach((row, i) => {
    row.status =
      i < 2 ? ["Value mismatch", "Missing reference"][i] : "Verified";
    if (i === 0) row.amount += 37;
  });
  g.brief =
    "Compare each record with its approved reference, correct defects and reinspect before release.";
  return g;
}
const actions = [
  "send-correction",
  "classify-defect",
  "inspect-row",
  "flag-defect",
  "mark-duplicate",
  "correct-value",
  "complete-field",
  "standardize-format",
  "reinspect",
  "release-batch",
];
export function available(s: Scenario): string[] {
  const g = s.gameplay || initialize(s);
  if (g.completed || s.result) return [];
  const allow = new Set(actions);
  const gate = (keys: string[], condition: unknown) => {
    if (!condition) keys.forEach((key) => allow.delete(key));
  };
  gate(["release-batch"], has(g, "reinspect"));
  return [...allow];
}
export function inspect(s: Scenario, _world: State) {
  const g = s.gameplay || initialize(s);
  const checks: { ok: boolean; label: string }[] = [];
  const check = (ok: unknown, label: string) =>
    checks.push({ ok: Boolean(ok), label });
  check(g.values.defects === 0, "Reinspection finds no unresolved defects");
  check(
    g.records.every((r) => r.amount === r.expected),
    "Record values match the approved reference",
  );
  check(has(g, "inspect-row"), "Source comparison performed");
  return checks;
}
export const act: Reducer = (c) => {
  const { g, a, s } = c;
  const row = record(c);
  switch (a.key) {
    case "send-correction":
      row.status = "rework";
      task(c, "Correct quality record " + row.id, "data-analysis");
      break;
    case "classify-defect":
      g.values["severity-" + row.id] = String(a.value);
      if (a.value === "Critical") {
        row.status = "flagged";
        task(c, "Critical quality hold: " + row.label, "incidents");
      }
      break;
    case "inspect-row":
      selected(c);
      g.values.reference = row.expected;
      break;
    case "flag-defect":
      row.status = "flagged";
      break;
    case "mark-duplicate":
      g.values.duplicate = row.id;
      message(c, "Duplicate trace checked; keep one canonical record.");
      break;
    case "correct-value":
      row.amount = amount(a.value);
      row.status = row.amount === row.expected ? "corrected" : "incorrect";
      break;
    case "complete-field":
      row.owner = String(a.value || c.world.company.manager);
      row.status = "corrected";
      break;
    case "standardize-format":
      g.values.format = "ISO dates, currency rounded to cents";
      break;
    case "reinspect":
      g.values.defects = g.records.filter(
        (r) =>
          r.amount !== r.expected ||
          ["Missing reference", "flagged", "incorrect"].includes(r.status),
      ).length;
      g.phase =
        Number(g.values.defects) === 0 ? "released-for-review" : "rework";
      break;
    case "release-batch":
      need(
        !inspect(s, c.world).some((check) => !check.ok),
        inspect(s, c.world)
          .filter((check) => !check.ok)
          .map((check) => check.label)
          .join("; "),
      );
      g.completed = true;
      g.phase = "released";
      break;
  }
};
