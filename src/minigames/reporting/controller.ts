import type { Scenario, State } from "../../simulation/types";
import { amount, need, task, type Reducer } from "../runtime/core";
import { seedWorkData } from "../runtime/seed-data";
export function initialize(s: Scenario) {
  const g = seedWorkData(s);
  g.phase = "unselected";
  g.brief =
    "Select a source and reporting period, assemble relevant metrics and sections, validate totals and distribute the report.";
  return g;
}
const actions = [
  "set-visual",
  "set-period",
  "select-dataset",
  "toggle-metric",
  "toggle-section",
  "choose-comparison",
  "add-conclusion",
  "validate-report",
  "select-recipient",
  "distribute-report",
];
export function available(s: Scenario): string[] {
  const g = s.gameplay || initialize(s);
  if (g.completed || s.result) return [];
  const allow = new Set(actions);
  const gate = (keys: string[], condition: unknown) => {
    if (!condition) keys.forEach((key) => allow.delete(key));
  };
  gate(["validate-report"], g.values.dataset && g.evidence.length);
  gate(["distribute-report"], g.values.validated && g.values.recipient);
  return [...allow];
}
export function inspect(s: Scenario, _world: State) {
  const g = s.gameplay || initialize(s);
  const checks: { ok: boolean; label: string }[] = [];
  const check = (ok: unknown, label: string) =>
    checks.push({ ok: Boolean(ok), label });
  check(
    g.evidence.includes("Actual") && g.evidence.includes("Target"),
    "Report includes result and benchmark",
  );
  check(
    String(g.values.sections).includes("Recommendation"),
    "Actionable recommendation section included",
  );
  check(
    g.values.conclusion && g.values.validated,
    "Conclusion and source calculations verified",
  );
  return checks;
}
export const act: Reducer = (c) => {
  const { g, a, s } = c;
  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  switch (a.key) {
    case "set-visual":
      g.values.visual = String(a.value);
      break;
    case "set-period":
      g.values.period = amount(a.value, 1, s.data.rows.length);
      g.values.validated = "";
      break;
    case "select-dataset":
      g.values.validated = "";
      g.values.dataset = String(a.value);
      break;
    case "toggle-metric":
      g.evidence = toggle(g.evidence, String(a.value));
      break;
    case "toggle-section":
      {
        const section = String(a.value);
        g.values.sections = toggle(
          String(g.values.sections || "")
            .split("|")
            .filter(Boolean),
          section,
        ).join("|");
      }
      break;
    case "choose-comparison":
      g.values.comparison = String(a.value);
      break;
    case "add-conclusion":
      g.values.conclusion = String(a.value);
      break;
    case "validate-report":
      {
        const rows = s.data.rows.slice(
          0,
          Number(g.values.period || s.data.rows.length),
        );
        g.values.actual = rows.reduce(
          (n, r) =>
            n +
            (g.values.dataset === "Financial transactions"
              ? r.quantity * r.price
              : r.actual),
          0,
        );
        g.values.target = rows.reduce(
          (n, r) =>
            n +
            (g.values.dataset === "Financial transactions"
              ? r.quantity * r.cost
              : r.target),
          0,
        );
      }
      g.values.validated = "Source totals recalculated";
      break;
    case "select-recipient":
      g.values.recipient = String(a.value);
      break;
    case "distribute-report":
      need(
        !inspect(s, c.world).some((check) => !check.ok),
        inspect(s, c.world)
          .filter((check) => !check.ok)
          .map((check) => check.label)
          .join("; "),
      );
      g.completed = true;
      g.phase = "distributed";
      s.draft.fields.title = g.familyName;
      s.draft.fields.body = `${g.values.sections}\nActual: ${g.values.actual}; target: ${g.values.target}.\n${g.values.conclusion}\nComparison: ${g.values.comparison}`;
      task(c, `Review report sent to ${g.values.recipient}`, "meetings");
      break;
  }
};
