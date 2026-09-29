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
  g.phase = "new";
  g.brief =
    "Verify the customer and evidence, apply an authorized remedy, and confirm the resolution.";
  return g;
}
const actions = [
  "open-case",
  "verify-customer",
  "request-proof",
  "clarify-case",
  "refund",
  "partial-refund",
  "replacement",
  "escalate-case",
  "schedule-callback",
  "confirm-remedy",
  "close-case",
];
export function available(s: Scenario): string[] {
  const g = s.gameplay || initialize(s);
  if (g.completed || s.result) return [];
  const allow = new Set(actions);
  const gate = (keys: string[], condition: unknown) => {
    if (!condition) keys.forEach((key) => allow.delete(key));
  };
  if (g.phase === "new") return ["open-case"];
  gate(["refund", "partial-refund", "replacement"], g.values.identity);
  gate(["confirm-remedy"], g.values.remedy);
  gate(["close-case"], ["confirmed", "closed"].includes(g.phase));
  return [...allow];
}
export function inspect(s: Scenario, _world: State) {
  const g = s.gameplay || initialize(s);
  const checks: { ok: boolean; label: string }[] = [];
  const check = (ok: unknown, label: string) =>
    checks.push({ ok: Boolean(ok), label });
  check(g.values.identity, "Customer verified");
  check(
    ["confirmed", "closed"].includes(g.phase),
    "Customer accepted the remedy",
  );
  check(
    g.evidence.length || has(g, "escalate-case"),
    "Proof collected or supervisor consulted",
  );
  return checks;
}
export const act: Reducer = (c) => {
  const { g, a, s } = c;
  switch (a.key) {
    case "open-case":
      g.phase = "investigating";
      break;
    case "verify-customer":
      g.values.identity = "Verified";
      break;
    case "request-proof":
      g.evidence.push("Purchase receipt and delivery photo");
      message(c, "Customer supplies the receipt and proof of the issue.");
      break;
    case "clarify-case":
      g.values.cause = s.data.facts["Case type"];
      break;
    case "refund":
    case "partial-refund":
      need(g.values.identity, "Verify the customer first.");
      {
        const value =
          a.key === "refund"
            ? Number(s.data.facts["Refund amount"])
            : amount(a.value, 1, Number(s.data.facts["Refund amount"]));
        if (value > 250 && !has(g, "escalate-case")) {
          fault(
            c,
            "Refund blocked: Finance authorization is required above $250.",
          );
          break;
        }
        g.values.remedy = a.key;
        g.values.refund = value;
        c.world.company.cash += Number(g.values.disbursed || 0) - value;
        g.values.disbursed = value;
        message(
          c,
          `Refund of $${value} recorded. Customer requests written confirmation.`,
        );
      }
      break;
    case "replacement":
      need(g.evidence.length, "Request proof before shipping a replacement.");
      if (g.values.disbursed) {
        c.world.company.cash += Number(g.values.disbursed);
        g.values.disbursed = 0;
      }
      g.values.remedy = "Replacement";
      task(c, "Dispatch replacement " + s.data.facts.Reference, "inventory");
      break;
    case "escalate-case":
      g.values.authorization = "Finance approved";
      g.values.remedy = "Escalated";
      task(c, "Supervisor case review " + s.data.facts.Reference, "phone");
      break;
    case "schedule-callback":
      event(c, "Service callback " + s.participants[0]);
      break;
    case "confirm-remedy":
      if (g.phase === "confirmed") break;
      need(g.values.remedy, "Agree a remedy first.");
      g.phase = "confirmed";
      g.values.sentiment = "Satisfied";
      const customer = c.world.company.customers.find(
        (v) => v.name === s.data.facts.Customer,
      );
      if (customer)
        customer.satisfaction = Math.min(100, customer.satisfaction + 5);
      break;
    case "close-case":
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
