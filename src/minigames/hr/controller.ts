import type { Scenario, State } from "../../simulation/types";
import {
  amount,
  event,
  fault,
  has,
  message,
  need,
  task,
  type Reducer,
} from "../runtime/core";
import { seedWorkData } from "../runtime/seed-data";
export function initialize(s: Scenario) {
  const g = seedWorkData(s);
  g.phase = "locked";
  if (g.familyName === "Leave within balance")
    s.data.facts["Requested days"] = Math.max(
      1,
      Math.min(
        Number(s.data.facts["Leave balance"]),
        1 + (Math.abs(s.seed) % 5),
      ),
    );
  if (g.familyName === "Insufficient leave")
    s.data.facts["Requested days"] =
      Number(s.data.facts["Leave balance"]) + 1 + (Math.abs(s.seed) % 4);
  g.brief =
    "Verify the employee file, process leave within entitlement, check documents and obtain manager authorization.";
  return g;
}
const actions = [
  "schedule-training",
  "open-personnel",
  "verify-identity",
  "check-balance",
  "approve-leave",
  "decline-leave",
  "verify-form",
  "assign-training",
  "approve-access",
  "manager-approval",
  "file-hr-record",
];
export function available(s: Scenario): string[] {
  const g = s.gameplay || initialize(s);
  if (g.completed || s.result) return [];
  const allow = new Set(actions);
  const gate = (keys: string[], condition: unknown) => {
    if (!condition) keys.forEach((key) => allow.delete(key));
  };
  if (g.phase === "locked") return ["open-personnel"];
  gate(["approve-access"], g.values.identity);
  gate(["approve-leave", "decline-leave"], has(g, "check-balance"));
  gate(["file-hr-record"], g.values.approval);
  return [...allow];
}
export function inspect(s: Scenario, _world: State) {
  const g = s.gameplay || initialize(s);
  const checks: { ok: boolean; label: string }[] = [];
  const check = (ok: unknown, label: string) =>
    checks.push({ ok: Boolean(ok), label });
  check(g.values.identity, "Identity and confidentiality controlled");
  check(g.values.approval, "Manager authorized the record");
  check(
    g.evidence.length || g.values.leaveDecision || g.values.training,
    "Personnel request processed",
  );
  return checks;
}
export const act: Reducer = (c) => {
  const { g, a, s } = c;
  switch (a.key) {
    case "schedule-training":
      event(c, "Training: " + s.data.facts.Employee, amount(a.value, 540, 990));
      g.values.trainingSlot = Number(a.value);
      break;
    case "open-personnel":
      g.phase = "restricted-review";
      break;
    case "verify-identity":
      g.values.identity = "Verified";
      break;
    case "check-balance":
      g.values.balance = s.data.facts["Leave balance"];
      break;
    case "approve-leave":
    case "decline-leave":
      need(has(g, "check-balance"), "Check the leave balance.");
      g.values.leaveDecision = a.key;
      g.values.requested = Number(s.data.facts["Requested days"]);
      if (
        a.key === "approve-leave" &&
        Number(g.values.requested) > Number(s.data.facts["Leave balance"])
      ) {
        g.values.leaveDecision = "decline-leave";
        fault(
          c,
          "Leave request exceeds the recorded entitlement; approval rejected.",
        );
      }
      if (a.key === "approve-leave" && g.familyName === "Insufficient leave")
        fault(c, "Leave approval exceeds the entitlement in this request.");
      break;
    case "verify-form":
      g.evidence.push("Signed employee form");
      break;
    case "assign-training":
      g.values.training = "Assigned";
      task(c, `Training for ${s.data.facts.Employee}`, "hr");
      break;
    case "approve-access":
      need(
        g.values.identity,
        "Verify employee identity before granting access.",
      );
      g.values.access = "Approved";
      break;
    case "manager-approval":
      g.values.approval = "Sarah Chen";
      message(
        c,
        "Manager authorization recorded in the restricted personnel file.",
      );
      break;
    case "file-hr-record":
      need(
        !inspect(s, c.world).some((check) => !check.ok),
        inspect(s, c.world)
          .filter((check) => !check.ok)
          .map((check) => check.label)
          .join("; "),
      );
      g.completed = true;
      g.phase = "filed";
      {
        const employee = c.world.company.employees.find(
          (e) => e.id === s.data.facts["Employee ID"],
        );
        if (employee) {
          if (
            g.values.leaveDecision === "approve-leave" &&
            g.familyName !== "Insufficient leave"
          )
            employee.leave -= Number(g.values.requested || 0);
          if (g.values.training) employee.training = true;
        }
      }
      break;
  }
};
