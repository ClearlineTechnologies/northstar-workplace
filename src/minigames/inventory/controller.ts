import type { Scenario, State } from "../../simulation/types";
import {
  amount,
  has,
  message,
  need,
  task,
  type Reducer,
} from "../runtime/core";
import { seedWorkData } from "../runtime/seed-data";
export function initialize(s: Scenario) {
  const g = seedWorkData(s);
  g.phase = "uncounted";
  g.values.main = g.values.physical;
  g.values.overflow = 0;
  g.values.receiving = 0;
  g.brief =
    "Receive and inspect stock, track bin movements, count physical units and reconcile the inventory ledger.";
  return g;
}
const actions = [
  "count-stock",
  "receive-stock",
  "use-stock",
  "mark-damaged",
  "transfer-stock",
  "investigate-stock",
  "adjust-stock",
  "reorder-stock",
  "close-count",
];
export function available(s: Scenario): string[] {
  const g = s.gameplay || initialize(s);
  if (g.completed || s.result) return [];
  const allow = new Set(actions);
  const gate = (keys: string[], condition: unknown) => {
    if (!condition) keys.forEach((key) => allow.delete(key));
  };
  gate(["adjust-stock"], has(g, "count-stock") && has(g, "investigate-stock"));
  gate(["close-count"], has(g, "count-stock"));
  return [...allow];
}
export function inspect(s: Scenario, _world: State) {
  const g = s.gameplay || initialize(s);
  const checks: { ok: boolean; label: string }[] = [];
  const check = (ok: unknown, label: string) =>
    checks.push({ ok: Boolean(ok), label });
  check(
    Number(g.values.stock) === Number(g.values.physical),
    "Stock ledger agrees to physical stock",
  );
  check(
    has(g, "investigate-stock"),
    "Discrepancy investigated before adjustment",
  );
  check(has(g, "count-stock"), "Physical count recorded");
  return checks;
}
export const act: Reducer = (c) => {
  const { g, a, s } = c;
  const product =
    c.world.company.products.find(
      (p) => p.id === c.s.data.facts["Product ID"],
    ) || c.world.company.products[0];
  const delta = (n: number) => {
    g.values.stock = Number(g.values.stock) + n;
    product.stock = Math.max(0, Number(g.values.stock));
  };
  switch (a.key) {
    case "count-stock":
      g.values.count = Number(g.values.physical);
      g.phase = "counted";
      break;
    case "receive-stock":
      {
        const n = amount(a.value, 1, 500);
        delta(n);
        g.values.physical = Number(g.values.physical) + n;
        g.values.main = Number(g.values.main) + n;
        message(c, `Received ${n} usable units.`);
      }
      break;
    case "use-stock":
      {
        const n = amount(
          a.value,
          1,
          Math.min(Number(g.values.main), Number(g.values.stock)),
        );
        delta(-n);
        g.values.physical = Number(g.values.physical) - n;
        g.values.main = Number(g.values.main) - n;
      }
      break;
    case "mark-damaged":
      {
        const n = amount(
          a.value,
          1,
          Math.min(Number(g.values.main), Number(g.values.stock)),
        );
        delta(-n);
        g.values.physical = Number(g.values.physical) - n;
        g.values.main = Number(g.values.main) - n;
        g.values.quarantined = Number(g.values.quarantined || 0) + n;
      }
      break;
    case "transfer-stock":
      {
        const destination = String(a.option || "Overflow");
        const from = destination === "Main rack" ? "overflow" : "main";
        const to =
          destination === "Main rack"
            ? "main"
            : destination === "Receiving"
              ? "receiving"
              : "overflow";
        const n = amount(a.value, 1, Number(g.values[from]));
        g.values[from] = Number(g.values[from]) - n;
        g.values[to] = Number(g.values[to]) + n;
        g.values.bin = destination;
        g.values.transferred = n;
        message(
          c,
          `${n} units moved from ${from} to ${to}; total stock unchanged.`,
        );
      }
      break;
    case "investigate-stock":
      g.evidence.push("Receiving and usage records checked");
      g.values.discrepancy = Number(g.values.physical) - Number(g.values.stock);
      break;
    case "adjust-stock":
      need(
        has(g, "count-stock") && has(g, "investigate-stock"),
        "Count and investigate before adjusting the ledger.",
      );
      g.values.stock = Number(g.values.physical);
      product.stock = Number(g.values.stock);
      break;
    case "reorder-stock":
      {
        const quantity = amount(a.value, 1, 500);
        g.values.reorder = quantity;
        task(c, `Reorder ${quantity} ${product.name}`, "procurement");
      }
      break;
    case "close-count":
      need(
        !inspect(s, c.world).some((check) => !check.ok),
        inspect(s, c.world)
          .filter((check) => !check.ok)
          .map((check) => check.label)
          .join("; "),
      );
      g.completed = true;
      g.phase = "reconciled";
      break;
  }
};
