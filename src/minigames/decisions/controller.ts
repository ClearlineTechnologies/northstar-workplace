import { round } from "../../simulation/generators/random";
import type { Scenario, State } from "../../simulation/types";
import { amount, has, need, task, type Reducer } from "../runtime/core";
import { seedWorkData } from "../runtime/seed-data";
export function initialize(s: Scenario) {
  const g = seedWorkData(s);
  g.phase = "uncompared";
  g.brief =
    "Inspect competing investment cases, model the risks and commit an affordable strategy with mitigation.";
  return g;
}
const actions = [
  "inspect-option",
  "set-risk-weight",
  "compare-return",
  "stress-test",
  "choose-investment",
  "mitigate-risk",
  "request-board-review",
  "commit-decision",
];
export function available(s: Scenario): string[] {
  const g = s.gameplay || initialize(s);
  if (g.completed || s.result) return [];
  const allow = new Set(actions);
  const gate = (keys: string[], condition: unknown) => {
    if (!condition) keys.forEach((key) => allow.delete(key));
  };
  gate(["commit-decision"], g.values.investment && has(g, "compare-return"));
  return [...allow];
}
export function inspect(s: Scenario, _world: State) {
  const g = s.gameplay || initialize(s);
  const checks: { ok: boolean; label: string }[] = [];
  const check = (ok: unknown, label: string) =>
    checks.push({ ok: Boolean(ok), label });
  check(
    g.values.investment === s.hiddenFacts.best,
    "Highest affordable net return selected",
  );
  check(g.evidence.length >= 2, "Multiple alternatives inspected");
  check(g.values.mitigation, "Decision includes risk mitigation");
  return checks;
}
export const act: Reducer = (c) => {
  const { g, a, s } = c;
  switch (a.key) {
    case "inspect-option":
      need(
        ["A", "B", "C"].includes(String(a.value)),
        "Choose an investment option.",
      );
      g.evidence.push(String(a.value));
      g.values.selectedOption = String(a.value);
      break;
    case "set-risk-weight":
      g.values.riskWeight = amount(a.value, 0, 100);
      for (const option of ["A", "B", "C"])
        g.values["adjusted-" + option] = round(
          Number(s.data.facts[`Option ${option} return`]) *
            (1 -
              (Number(g.values.riskWeight) / 100) *
                ((option.charCodeAt(0) - 64) / 4)) -
            Number(s.data.facts[`Option ${option} cost`]),
        );
      break;
    case "compare-return":
      g.values.compared = "Net return calculated";
      break;
    case "stress-test":
      g.values.stress = "Demand falls 20%";
      g.values.stressReturn = round(
        Number(
          s.data.facts[`Option ${g.values.selectedOption || "A"} return`],
        ) * 0.8,
      );
      break;
    case "choose-investment":
      g.values.investment = String(a.value);
      break;
    case "mitigate-risk":
      g.values.mitigation = String(a.value || "Stage the investment");
      break;
    case "request-board-review":
      g.values.authorized = "Board reviewed";
      break;
    case "commit-decision":
      need(
        g.evidence.length >= 2 && g.values.mitigation,
        "Inspect competing cases and record mitigation before committing.",
      );
      need(
        Number(s.data.facts[`Option ${g.values.investment} cost`]) <=
          Number(s.data.facts["Investment budget"]),
        "Investment exceeds the capital ceiling.",
      );
      g.completed = true;
      g.phase = "committed";
      {
        const option = String(g.values.investment);
        const cost = Number(s.data.facts[`Option ${option} cost`]);
        c.world.company.cash -= cost;
        g.values.net = Number(s.data.facts[`Option ${option} return`]) - cost;
        task(c, `Execute investment ${option}`, "project-management");
      }
      break;
  }
};
