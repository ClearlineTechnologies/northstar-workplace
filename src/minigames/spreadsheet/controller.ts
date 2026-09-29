import { calculateCell } from "../../features/formulas";
import type { Scenario, State } from "../../simulation/types";
import { has, need, type Reducer } from "../runtime/core";
import { seedWorkData } from "../runtime/seed-data";
export function initialize(s: Scenario) {
  const g = seedWorkData(s);
  g.phase = "uncalculated";
  const aggregation = [
    "SUM",
    "AVERAGE",
    "MIN",
    "MAX",
    "SUM",
    "SUM",
    "AVERAGE",
    "MAX",
  ][Math.abs(s.seed) % 8];
  s.data.facts.Aggregation = aggregation;
  s.draft.cells[7][0] = aggregation;
  const grid = structuredClone(s.draft.cells);
  grid[7][1] = `=${aggregation}(B2:B7)`;
  s.hiddenFacts.expected = Number(calculateCell(grid, 7, 1));
  g.brief =
    "Calculate the requested metric with a live formula in B8, inspect its source range and deliver the workbook.";
  return g;
}
const actions = [
  "edit-grid",
  "insert-row",
  "sort-sheet",
  "filter-sheet",
  "format-percent",
  "audit-formula",
  "recalculate-sheet",
  "deliver-workbook",
];
export function available(s: Scenario): string[] {
  const g = s.gameplay || initialize(s);
  if (g.completed || s.result) return [];
  const allow = new Set(actions);
  const gate = (keys: string[], condition: unknown) => {
    if (!condition) keys.forEach((key) => allow.delete(key));
  };
  gate(["deliver-workbook"], has(g, "recalculate-sheet"));
  return [...allow];
}
export function inspect(s: Scenario, _world: State) {
  const g = s.gameplay || initialize(s);
  const checks: { ok: boolean; label: string }[] = [];
  const check = (ok: unknown, label: string) =>
    checks.push({ ok: Boolean(ok), label });
  {
    const value = calculateCell(s.draft.cells, 7, 1);
    check(s.draft.cells[7]?.[1]?.startsWith("="), "Live formula in B8");
    check(
      typeof value === "number" &&
        Math.abs(value - s.hiddenFacts.expected) < 0.02,
      "Formula result matches the source records",
    );
    check(has(g, "audit-formula"), "Formula audited before delivery");
  }
  return checks;
}
export const act: Reducer = (c) => {
  const { g, a, s } = c;
  switch (a.key) {
    case "edit-grid":
      need(
        a.cells && a.cells.length >= 8,
        "Keep the calculation grid and result row.",
      );
      s.draft.cells = a.cells;
      g.flags = g.flags.filter(
        (v) => !["audit-formula", "recalculate-sheet"].includes(v),
      );
      g.phase = "edited";
      break;
    case "insert-row":
      s.draft.cells.push(["Supporting check", "", "", ""]);
      break;
    case "sort-sheet":
      s.draft.cells = [
        s.draft.cells[0],
        ...s.draft.cells
          .slice(1, 7)
          .sort((a, b) => Number(b[1]) - Number(a[1])),
        ...s.draft.cells.slice(7),
      ];
      g.values.sorted = "Amount descending";
      break;
    case "filter-sheet":
      g.values.filter = String(a.value || "Amount > 0");
      break;
    case "format-percent":
      g.values.format = "Percent";
      s.draft.cells[0][3] = "Share of total";
      for (let i = 1; i < 7; i++)
        s.draft.cells[i][3] = `=B${i + 1}/SUM(B2:B7)*100`;
      break;
    case "audit-formula":
      g.values.formula = s.draft.cells[7]?.[1] || "";
      g.values.audit = String(calculateCell(s.draft.cells, 7, 1));
      break;
    case "recalculate-sheet":
      g.values.result = String(calculateCell(s.draft.cells, 7, 1));
      g.phase = "calculated";
      break;
    case "deliver-workbook":
      need(
        !inspect(s, c.world).some((check) => !check.ok),
        inspect(s, c.world)
          .filter((check) => !check.ok)
          .map((check) => check.label)
          .join("; "),
      );
      g.completed = true;
      g.phase = "delivered";
      break;
  }
};
