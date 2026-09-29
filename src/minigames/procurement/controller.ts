import { round } from "../../simulation/generators/random";
import type { Scenario, State } from "../../simulation/types";
import {
  amount,
  has,
  mark,
  message,
  need,
  selected,
  task,
  type Reducer,
} from "../runtime/core";
import { seedWorkData } from "../runtime/seed-data";
export function initialize(s: Scenario) {
  const g = seedWorkData(s);
  g.phase = "sourcing";
  g.brief =
    "Compare supplier cost, quality and delivery. Obtain approval for a compliant order or cancel an unsuitable requisition.";
  return g;
}
const actions = [
  "allocate-order",
  "select-secondary",
  "inspect-quote",
  "compare-cost",
  "compare-delivery",
  "reject-quote",
  "revise-quote",
  "select-vendor",
  "split-order",
  "request-approval",
  "cancel-purchase",
  "issue-order",
];
export function available(s: Scenario): string[] {
  const g = s.gameplay || initialize(s);
  if (g.completed || s.result) return [];
  const allow = new Set(actions);
  const gate = (keys: string[], condition: unknown) => {
    if (!condition) keys.forEach((key) => allow.delete(key));
  };
  gate(["issue-order"], g.values.vendor || g.values.cancelled);
  return [...allow];
}
export function inspect(s: Scenario, _world: State) {
  const g = s.gameplay || initialize(s),
    f = s.data.facts;
  const checks: { ok: boolean; label: string }[] = [];
  const check = (ok: unknown, label: string) =>
    checks.push({ ok: Boolean(ok), label });
  {
    const q = s.data.quotes.find((v) => v.id === g.values.vendor);
    check(
      g.values.cancelled || q,
      "Supplier chosen or requisition properly cancelled",
    );
    check(
      g.values.cancelled ||
        (q &&
          q.quality >= 90 &&
          q.days <= Number(f["Required delivery days"]) &&
          (g.values.split ||
            q.unit * Number(f.Quantity) <= Number(f["Purchase budget"]))),
      "Quote satisfies cost, quality, and delivery constraints",
    );
    if (g.values.split && !g.values.cancelled) {
      const secondary = s.data.quotes.find((v) => v.id === g.values.secondary);
      const units = Number(
        g.values.primaryUnits || Math.ceil(Number(f.Quantity) / 2),
      );
      check(
        secondary &&
          secondary.quality >= 90 &&
          secondary.days <= Number(f["Required delivery days"]) &&
          secondary.id !== q?.id,
        "Secondary supplier meets quality and delivery controls",
      );
      check(
        q &&
          secondary &&
          q.unit * units + secondary.unit * (Number(f.Quantity) - units) <=
            Number(f["Purchase budget"]),
        "Split purchase remains within the total budget",
      );
    }
    check(
      g.values.cancelled || g.values.approval,
      "Finance authorization recorded",
    );
  }
  return checks;
}
export const act: Reducer = (c) => {
  const { g, a, s } = c;
  switch (a.key) {
    case "allocate-order":
      {
        g.values.primaryUnits = amount(
          a.value,
          1,
          Number(s.data.facts.Quantity) - 1,
        );
        g.values.approval = "";
      }
      break;
    case "select-secondary":
      {
        need(
          s.data.quotes.some((q) => q.id === a.value) &&
            a.value !== g.values.vendor,
          "Choose a different supplier for the split.",
        );
        g.values.secondary = String(a.value);
        g.values.split = "Two suppliers";
        g.values.approval = "";
      }
      break;
    case "inspect-quote":
      selected(c, "vendor");
      g.evidence.push(String(a.target));
      break;
    case "compare-cost":
      g.values.comparison = "Delivered cost";
      break;
    case "compare-delivery":
      g.values.comparison = "Delivery and quality";
      break;
    case "reject-quote":
      mark(g, "rejected-" + a.target);
      message(
        c,
        "Quote removed from the shortlist. Another supplier must be selected.",
      );
      if (g.values.vendor === a.target) g.values.vendor = "";
      break;
    case "revise-quote":
      {
        const quote =
          s.data.quotes.find((q) => q.id === a.target) || s.data.quotes[0];
        quote.unit = round(quote.unit * 0.95);
        quote.days = Math.max(1, quote.days - 1);
        message(
          c,
          `${quote.vendor} returned a revised price of $${quote.unit} and ${quote.days}-day delivery.`,
        );
      }
      break;
    case "select-vendor":
      need(
        s.data.quotes.some((q) => q.id === a.target) &&
          !has(g, "rejected-" + a.target),
        "Choose an eligible supplier.",
      );
      g.values.vendor = String(a.target);
      break;
    case "split-order":
      need(g.values.vendor, "Select a primary supplier first.");
      g.values.primaryUnits = Math.ceil(Number(s.data.facts.Quantity) / 2);
      g.values.split = "Two suppliers";
      g.values.secondary =
        s.data.quotes.find((q) => q.id !== g.values.vendor)?.id || "";
      break;
    case "request-approval":
      g.values.approval = "Finance authorized";
      break;
    case "cancel-purchase":
      g.values.cancelled = "Requisition cancelled";
      message(
        c,
        "Purchase is cancelled; close the requisition without issuing stock or payment.",
      );
      break;
    case "issue-order":
      need(
        !inspect(s, c.world).some((check) => !check.ok),
        inspect(s, c.world)
          .filter((check) => !check.ok)
          .map((check) => check.label)
          .join("; "),
      );
      g.completed = true;
      g.phase = "order-tracked";
      {
        if (g.values.cancelled) {
          g.outcome = "Requisition cancelled with an audit trail.";
          break;
        }
        const quote = s.data.quotes.find((q) => q.id === g.values.vendor);
        need(quote, "Select a supplier.");
        const second = g.values.split
          ? s.data.quotes.find((q) => q.id === g.values.secondary)
          : undefined;
        const primary = second
          ? Number(
              g.values.primaryUnits ||
                Math.ceil(Number(s.data.facts.Quantity) / 2),
            )
          : Number(s.data.facts.Quantity);
        const secondary = Number(s.data.facts.Quantity) - primary;
        const total =
          quote.unit * primary + (second ? second.unit * secondary : 0);
        g.values.total = total;
        c.world.company.cash -= total;
        c.world.company.budget -= total;
        task(c, `Receive ${primary} units from ${quote.vendor}`, "inventory");
        if (second)
          task(
            c,
            `Receive ${secondary} units from ${second.vendor}`,
            "inventory",
          );
        g.outcome = "Purchase order issued; receiving task created.";
      }
      break;
  }
};
