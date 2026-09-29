import type { Scenario, State } from "../../simulation/types";
import { has, need, task, type Reducer } from "../runtime/core";
import { seedWorkData } from "../runtime/seed-data";
export function initialize(s: Scenario) {
  const g = seedWorkData(s);
  g.phase = "uncontrolled";
  const index = Math.abs(s.seed) % 8;
  g.values.request = [
    "A customer has requested a copy of a record containing another person's contact details.",
    "People received a request to share an employee record without documented consent.",
    "A supplier requires a purchase authorization above the apprentice's approval threshold.",
    "An urgent purchase needs an exception to the usual supplier comparison process.",
    "A service outage requires an emergency exception and Technology authorization.",
    "An unverified caller is requesting information from a customer account.",
    "An onboarding file was routed using the purchasing policy instead of an employee procedure.",
    "Operations needs to file meeting records with an owner, reference and retention period.",
  ][index];
  g.values.requiredPolicy = [
    "p-privacy",
    "p-privacy",
    "p-purchase",
    "p-purchase",
    "p-incident",
    "p-privacy",
    "p-people",
    "p-records",
  ][index];
  g.values.requiredAuthority = [
    "People",
    "People",
    "Finance",
    "Finance",
    "Technology",
    "People",
    "People",
    "Operations",
  ][index];
  g.brief =
    "Identify the governing company procedure, collect control evidence and obtain the appropriate authorization.";
  return g;
}
const actions = [
  "select-policy",
  "verify-control",
  "collect-consent",
  "redact-record",
  "route-authority",
  "record-exception",
  "approve-exception",
  "authorize-request",
];
export function available(s: Scenario): string[] {
  const g = s.gameplay || initialize(s);
  if (g.completed || s.result) return [];
  const allow = new Set(actions);
  const gate = (keys: string[], condition: unknown) => {
    if (!condition) keys.forEach((key) => allow.delete(key));
  };
  gate(["approve-exception"], g.values.exception);
  gate(["authorize-request"], g.values.policy && g.values.authority);
  return [...allow];
}
export function inspect(s: Scenario, _world: State) {
  const g = s.gameplay || initialize(s);
  const checks: { ok: boolean; label: string }[] = [];
  const check = (ok: unknown, label: string) =>
    checks.push({ ok: Boolean(ok), label });
  check(
    g.values.policy === g.values.requiredPolicy,
    "Applicable internal procedure selected",
  );
  check(g.evidence.length >= 2, "Required control evidence collected");
  check(
    g.values.authority === g.values.requiredAuthority,
    "Request routed to the policy owner",
  );
  if (g.values.requiredPolicy === "p-privacy") {
    check(g.values.consent, "Consent recorded before disclosure");
    check(
      g.values.redacted,
      "Personal identifiers removed from the released record",
    );
  }
  if (/exception/i.test(g.familyName))
    check(
      g.values.exception === "Manager approved",
      "Exception explicitly approved before authorization",
    );
  return checks;
}
export const act: Reducer = (c) => {
  const { g, a, s } = c;
  switch (a.key) {
    case "select-policy":
      need(
        c.world.company.policies.some((p) => p.id === a.value),
        "Select a current policy.",
      );
      g.values.policy = String(a.value);
      break;
    case "verify-control":
      if (!g.evidence.includes(String(a.value)))
        g.evidence.push(String(a.value));
      break;
    case "collect-consent":
      g.values.consent = "Recorded";
      break;
    case "redact-record":
      g.values.redacted = "Personal identifiers removed";
      break;
    case "route-authority":
      g.values.authority = String(a.value || "Manager");
      task(c, "Compliance authorization", "administration");
      break;
    case "record-exception":
      g.values.exception = "Exception logged";
      break;
    case "approve-exception":
      need(
        has(g, "record-exception"),
        "Record the exception before seeking approval.",
      );
      g.values.exception = "Manager approved";
      break;
    case "authorize-request":
      need(
        !inspect(s, c.world).some((check) => !check.ok),
        inspect(s, c.world)
          .filter((check) => !check.ok)
          .map((check) => check.label)
          .join("; "),
      );
      g.completed = true;
      g.phase = "authorized";
      break;
  }
};
