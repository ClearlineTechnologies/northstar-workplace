import type { Scenario, State } from "../../simulation/types";
import {
  amount,
  fault,
  has,
  mail,
  message,
  need,
  record,
  selected,
  type Reducer,
} from "../runtime/core";
import { seedWorkData } from "../runtime/seed-data";
const accounts: Record<string, [string, string]> = {
  "Credit sale": ["Accounts receivable", "Revenue"],
  "Supplier invoice": ["Inventory", "Accounts payable"],
  "Customer payment": ["Cash", "Accounts receivable"],
  "Office expense paid": ["Office expense", "Cash"],
};
export function initialize(s: Scenario) {
  const g = seedWorkData(s);
  g.phase = "unposted";
  g.records.forEach((row, i) => {
    row.label = [
      "Credit sale",
      "Supplier invoice",
      "Customer payment",
      "Office expense paid",
    ][(i + (Math.abs(s.seed) % 4)) % 4];
  });
  g.brief =
    "Classify each transaction with equal debits and credits, then reconcile the journal against bank evidence.";
  return g;
}
const actions = [
  "select-transaction",
  "set-debit",
  "set-credit",
  "set-amount",
  "post-journal",
  "mark-duplicate",
  "reclassify",
  "request-correction",
  "investigate",
  "match-bank",
  "close-ledger",
];
export function available(s: Scenario): string[] {
  const g = s.gameplay || initialize(s);
  if (g.completed || s.result) return [];
  const allow = new Set(actions);
  const gate = (keys: string[], condition: unknown) => {
    if (!condition) keys.forEach((key) => allow.delete(key));
  };
  gate(["match-bank"], g.evidence.includes(String(g.values.selected)));
  gate(
    ["close-ledger"],
    g.records.every((r) => r.status === "reconciled"),
  );
  return [...allow];
}
export function inspect(s: Scenario, _world: State) {
  const g = s.gameplay || initialize(s);
  const checks: { ok: boolean; label: string }[] = [];
  const check = (ok: unknown, label: string) =>
    checks.push({ ok: Boolean(ok), label });
  check(
    g.records.every((r) => r.status === "reconciled"),
    "All ledger entries reconciled",
  );
  check(
    g.records.every((r) => g.evidence.includes(r.id)),
    "Balanced and correctly classified journal for each transaction",
  );
  check(has(g, "match-bank"), "Bank matching performed");
  return checks;
}
export const act: Reducer = (c) => {
  const { g, a, s } = c;
  const row = record(c);
  switch (a.key) {
    case "select-transaction":
      selected(c);
      g.values.debit = "";
      g.values.credit = "";
      g.values.amount = row.amount;
      break;
    case "set-debit":
      g.values.debit = String(a.value);
      break;
    case "set-credit":
      g.values.credit = String(a.value);
      break;
    case "set-amount":
      g.values.amount = amount(a.value);
      break;
    case "post-journal":
      {
        const [debit, credit] = accounts[row.label];
        if (
          g.values.debit !== debit ||
          g.values.credit !== credit ||
          Number(g.values.amount) !== row.expected
        ) {
          fault(
            c,
            "Journal rejected: debit/credit classification or posted amount does not match this transaction.",
          );
          return;
        }
        row.status = "posted";
        row.owner = `${debit} → ${credit}`;
        g.evidence.push(row.id);
        message(c, "Balanced debit and credit posted to the ledger.");
      }
      break;
    case "mark-duplicate":
      g.values.duplicateReviewed = row.id;
      row.status = "duplicate investigated";
      break;
    case "reclassify":
      g.values.reclassification = row.id;
      row.status = "pending";
      break;
    case "request-correction":
      mail(
        c,
        "Journal evidence requested",
        `${row.label}: confirm the remittance reference.`,
      );
      break;
    case "investigate":
      g.values.bankEvidence = row.id;
      break;
    case "match-bank":
      need(
        g.evidence.includes(row.id),
        "Post a balanced entry before bank matching.",
      );
      row.status = "reconciled";
      break;
    case "close-ledger":
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
