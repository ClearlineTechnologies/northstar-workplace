import type { Scenario, State } from "../../simulation/types";
import {
  fault,
  has,
  mail,
  mark,
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
  g.phase = "unmatched";
  if (/Overbilled|mismatch/.test(g.familyName))
    g.records[0].amount += 25 + (s.seed % 50);
  if (g.familyName === "Missing receipt")
    g.values.missingReceipt = g.records[0].id;
  g.brief =
    "Match each invoice to its purchase order, allocate a cost center, then approve supported amounts or hold disputed payments.";
  return g;
}
const actions = [
  "select-invoice",
  "match-po",
  "recalculate",
  "request-documents",
  "cost-center",
  "flag-variance",
  "hold-payment",
  "approve-payment",
  "escalate-variance",
  "post-payment",
];
export function available(s: Scenario): string[] {
  const g = s.gameplay || initialize(s);
  if (g.completed || s.result) return [];
  const allow = new Set(actions);
  const gate = (keys: string[], condition: unknown) => {
    if (!condition) keys.forEach((key) => allow.delete(key));
  };
  gate(
    ["post-payment"],
    g.records.every((r) => ["approved", "held"].includes(r.status)),
  );
  return [...allow];
}
export function inspect(s: Scenario, _world: State) {
  const g = s.gameplay || initialize(s);
  const checks: { ok: boolean; label: string }[] = [];
  const check = (ok: unknown, label: string) =>
    checks.push({ ok: Boolean(ok), label });
  check(
    g.records.every((r) => ["approved", "held"].includes(r.status)),
    "Every invoice approved or held",
  );
  check(
    g.records
      .filter((r) => r.status === "approved")
      .every(
        (r) =>
          r.amount === r.expected &&
          r.owner !== "Unassigned" &&
          g.evidence.includes(r.id),
      ),
    "Released payments match PO and cost center",
  );
  check(
    g.records.every((r) => g.evidence.includes(r.id)),
    "Source matching completed for each invoice",
  );
  return checks;
}
export const act: Reducer = (c) => {
  const { g, a, s } = c;
  const row = record(c);
  switch (a.key) {
    case "select-invoice":
      selected(c);
      break;
    case "match-po":
      row.status = "matched";
      g.evidence.push(row.id);
      message(c, `PO expects $${row.expected}; invoice claims $${row.amount}.`);
      break;
    case "recalculate":
      row.amount = row.expected;
      row.status = "recalculated";
      break;
    case "request-documents":
      mark(g, "documents-" + row.id);
      mail(
        c,
        "Receipt supplied",
        `Delivery receipt confirms ${row.quantity} units for ${row.label}.`,
      );
      break;
    case "cost-center":
      row.owner = String(a.value);
      break;
    case "flag-variance":
      mark(g, "variance-" + row.id);
      row.status = "disputed";
      message(
        c,
        "Variance logged; payment remains locked pending reconciliation.",
      );
      break;
    case "hold-payment":
      row.status = "held";
      g.values.holdReason = "Control review";
      break;
    case "escalate-variance":
      mark(g, "approval-" + row.id);
      task(c, `Finance approval for ${row.label}`, "finance");
      break;
    case "approve-payment":
      if (
        g.values.missingReceipt === row.id &&
        !has(g, "documents-" + row.id)
      ) {
        fault(
          c,
          "Receipt is missing: request supporting documentation or hold payment.",
        );
        return;
      }
      if (
        !g.evidence.includes(row.id) ||
        row.amount !== row.expected ||
        row.owner === "Unassigned"
      ) {
        fault(
          c,
          "Payment blocked: match the PO, correct the amount, and allocate a cost center.",
        );
        return;
      }
      row.status = "approved";
      break;
    case "post-payment":
      need(
        !inspect(s, c.world).some((check) => !check.ok),
        inspect(s, c.world)
          .filter((check) => !check.ok)
          .map((check) => check.label)
          .join("; "),
      );
      g.completed = true;
      for (const item of g.records.filter((v) => v.status === "approved"))
        c.world.company.cash -= item.amount;
      g.phase = "posted";
      break;
  }
};
