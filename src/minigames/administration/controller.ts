import type { Scenario, State } from "../../simulation/types";
import { has, mail, need, task, type Reducer } from "../runtime/core";
import { seedWorkData } from "../runtime/seed-data";
export function initialize(s: Scenario) {
  const g = seedWorkData(s);
  g.phase = "intake";
  g.brief =
    "Register the incoming document, verify its fields, assign retention and route it to the responsible department.";
  return g;
}
const actions = [
  "scan-record",
  "set-reference",
  "set-department",
  "set-retention",
  "verify-signature",
  "route-record",
  "return-record",
  "file-record",
];
export function available(s: Scenario): string[] {
  const g = s.gameplay || initialize(s);
  if (g.completed || s.result) return [];
  const allow = new Set(actions);
  const gate = (keys: string[], condition: unknown) => {
    if (!condition) keys.forEach((key) => allow.delete(key));
  };
  gate(["route-record"], g.values.department);
  gate(["file-record"], has(g, "scan-record") && g.values.reference);
  return [...allow];
}
export function inspect(s: Scenario, _world: State) {
  const g = s.gameplay || initialize(s),
    f = s.data.facts;
  const checks: { ok: boolean; label: string }[] = [];
  const check = (ok: unknown, label: string) =>
    checks.push({ ok: Boolean(ok), label });
  check(g.values.reference === f.Reference, "Correct record identifier");
  check(
    g.values.department && g.values.retention,
    "Department and retention rule assigned",
  );
  check(has(g, "route-record"), "Record delivered to its owner");
  return checks;
}
export const act: Reducer = (c) => {
  const { g, a, s } = c;
  switch (a.key) {
    case "scan-record":
      g.phase = "indexed";
      g.values.document = c.s.data.facts["Record type"];
      break;
    case "set-reference":
      g.values.reference = String(a.value);
      break;
    case "set-department":
      g.values.department = String(a.value);
      break;
    case "set-retention":
      g.values.retention = String(a.value);
      break;
    case "verify-signature":
      g.evidence.push("Verified signatory");
      break;
    case "route-record":
      need(g.values.department, "Choose a destination department.");
      task(c, `File routed to ${g.values.department}`, "documents");
      g.values.routed = "Yes";
      break;
    case "return-record":
      g.values.returned = "Returned to originator for duplicate check";
      mail(c, "Record correction required", String(g.values.returned));
      break;
    case "file-record":
      need(
        !inspect(s, c.world).some((check) => !check.ok),
        inspect(s, c.world)
          .filter((check) => !check.ok)
          .map((check) => check.label)
          .join("; "),
      );
      g.completed = true;
      g.phase = "filed";
      break;
  }
};
