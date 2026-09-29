import type { Scenario, State } from "../../simulation/types";
import { has, need, type Reducer } from "../runtime/core";
import { seedWorkData } from "../runtime/seed-data";
export function initialize(s: Scenario) {
  const g = seedWorkData(s);
  g.phase = "raw";
  g.brief =
    "Investigate output against target, filter and chart the dataset, then identify the anomalous record.";
  return g;
}
const actions = [
  "filter-department",
  "sort-column",
  "select-metric",
  "build-chart",
  "flag-outlier",
  "compare-target",
  "exclude-duplicate",
  "segment-data",
  "publish-analysis",
];
export function available(s: Scenario): string[] {
  const g = s.gameplay || initialize(s);
  if (g.completed || s.result) return [];
  const allow = new Set(actions);
  const gate = (keys: string[], condition: unknown) => {
    if (!condition) keys.forEach((key) => allow.delete(key));
  };
  gate(["publish-analysis"], g.values.chart);
  return [...allow];
}
export function inspect(s: Scenario, _world: State) {
  const g = s.gameplay || initialize(s);
  const checks: { ok: boolean; label: string }[] = [];
  const check = (ok: unknown, label: string) =>
    checks.push({ ok: Boolean(ok), label });
  check(
    g.values.metric === "actual",
    "Metric matches the output investigation",
  );
  check(g.values.outlier === s.hiddenFacts.best, "Correct anomaly selected");
  check(
    has(g, "compare-target") && g.values.chart,
    "Target comparison and visual evidence recorded",
  );
  return checks;
}
export const act: Reducer = (c) => {
  const { g, a, s } = c;
  switch (a.key) {
    case "filter-department":
      g.values.department = String(a.value);
      break;
    case "sort-column":
      g.values.sort = String(a.value);
      break;
    case "select-metric":
      g.values.metric = String(a.value);
      break;
    case "build-chart":
      {
        const rows = s.data.rows
          .filter((row) => row.id !== g.values.excluded)
          .filter(
            (row) =>
              !g.values.department ||
              g.values.department === "All" ||
              row.department === g.values.department,
          );
        g.values.aggregate = rows.reduce(
          (sum, row) =>
            sum +
            Number(
              row[g.values.metric as "actual" | "target" | "quantity"] ||
                row.actual,
            ),
          0,
        );
        g.values.chart = String(a.value || "Bar");
      }
      break;
    case "flag-outlier":
      g.values.outlier = String(a.target);
      break;
    case "compare-target":
      g.values.variance = s.data.rows.reduce(
        (sum, row) => sum + row.actual - row.target,
        0,
      );
      break;
    case "exclude-duplicate":
      g.values.excluded = String(a.target || s.data.rows.at(-1)?.id);
      break;
    case "segment-data":
      g.values.segment = "Department";
      break;
    case "publish-analysis":
      need(
        !inspect(s, c.world).some((check) => !check.ok),
        inspect(s, c.world)
          .filter((check) => !check.ok)
          .map((check) => check.label)
          .join("; "),
      );
      g.completed = true;
      g.phase = "published";
      break;
  }
};
