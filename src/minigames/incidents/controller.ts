import type { Scenario, State } from "../../simulation/types";
import { has, mail, need, type Reducer } from "../runtime/core";
import { seedWorkData } from "../runtime/seed-data";
export function initialize(s: Scenario) {
  const g = seedWorkData(s);
  g.phase = "reported";
  s.data.facts["Incident type"] = g.familyName;
  g.values.affected = s.data.facts["Affected customers"];
  g.brief =
    "Assess impact, assign a responder, communicate status, contain the disruption and verify recovery.";
  return g;
}
const actions = [
  "declare-severity",
  "contain-incident",
  "assign-responder",
  "notify-stakeholders",
  "restore-service",
  "verify-recovery",
  "rollback-change",
  "send-status",
  "close-incident",
];
export function available(s: Scenario): string[] {
  const g = s.gameplay || initialize(s);
  if (g.completed || s.result) return [];
  const allow = new Set(actions);
  const gate = (keys: string[], condition: unknown) => {
    if (!condition) keys.forEach((key) => allow.delete(key));
  };
  gate(["contain-incident"], g.values.severity);
  gate(["restore-service"], has(g, "contain-incident"));
  gate(
    ["verify-recovery"],
    has(g, "restore-service") || has(g, "rollback-change"),
  );
  gate(["close-incident"], ["verified", "closed"].includes(g.phase));
  return [...allow];
}
export function inspect(s: Scenario, _world: State) {
  const g = s.gameplay || initialize(s);
  const checks: { ok: boolean; label: string }[] = [];
  const check = (ok: unknown, label: string) =>
    checks.push({ ok: Boolean(ok), label });
  check(
    ["verified", "closed"].includes(g.phase),
    "Recovery independently checked",
  );
  check(
    g.values.owner && g.values.severity,
    "Severity and incident owner recorded",
  );
  check(
    has(g, "notify-stakeholders") && has(g, "contain-incident"),
    "Stakeholders informed and impact contained",
  );
  return checks;
}
export const act: Reducer = (c) => {
  const { g, a, s } = c;
  switch (a.key) {
    case "declare-severity":
      g.values.severity = String(a.value);
      g.phase = "assessed";
      break;
    case "contain-incident":
      need(g.values.severity, "Classify the impact before containment.");
      g.phase = "contained";
      g.values.affected = 0;
      break;
    case "assign-responder":
      g.values.owner = String(a.value);
      break;
    case "notify-stakeholders":
      mail(
        c,
        "Incident notice",
        `Incident ${c.s.data.facts.Reference}: ${g.values.severity}; owner ${g.values.owner || "being assigned"}.`,
      );
      break;
    case "restore-service":
      need(
        g.phase === "contained" || has(g, "contain-incident"),
        "Contain the issue first.",
      );
      g.phase = "recovering";
      break;
    case "rollback-change":
      g.phase = "contained";
      g.values.rollback = "Previous configuration restored";
      break;
    case "verify-recovery":
      need(
        has(g, "restore-service") || has(g, "rollback-change"),
        "Restore or roll back before verification.",
      );
      g.phase = "verified";
      break;
    case "send-status":
      mail(
        c,
        "Incident status",
        `Current state: ${g.phase}. Recovery check ${has(g, "verify-recovery") ? "passed" : "pending"}.`,
      );
      break;
    case "close-incident":
      need(
        !inspect(s, c.world).some((check) => !check.ok),
        inspect(s, c.world)
          .filter((check) => !check.ok)
          .map((check) => check.label)
          .join("; "),
      );
      g.completed = true;
      g.phase = "closed";
      break;
  }
};
