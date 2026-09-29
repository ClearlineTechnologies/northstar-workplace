import { round } from "../../simulation/generators/random";
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
  g.phase = "baseline";
  if (/Inflation|cost rise/.test(g.familyName))
    g.values.cost = round(Number(s.data.facts["Unit cost"]) * 1.12);
  if (/Elastic|contraction/.test(g.familyName)) g.values.elasticity = 1.6;
  if (/Capacity|Productivity/.test(g.familyName))
    g.values.limit = Number(s.data.facts.Quantity) * 0.8;
  g.brief =
    "Compare price experiments using demand, costs and capacity; publish a financially sustainable price.";
  return g;
}
const actions = [
  "set-price",
  "set-volume",
  "simulate-market",
  "compare-baseline",
  "apply-inflation",
  "test-elasticity",
  "capacity-limit",
  "competitor-check",
  "publish-price",
];
export function available(s: Scenario): string[] {
  const g = s.gameplay || initialize(s);
  if (g.completed || s.result) return [];
  const allow = new Set(actions);
  const gate = (keys: string[], condition: unknown) => {
    if (!condition) keys.forEach((key) => allow.delete(key));
  };
  gate(
    ["publish-price"],
    g.records.filter((r) => r.status === "experiment").length >= 2,
  );
  return [...allow];
}
export function inspect(s: Scenario, _world: State) {
  const g = s.gameplay || initialize(s);
  const checks: { ok: boolean; label: string }[] = [];
  const check = (ok: unknown, label: string) =>
    checks.push({ ok: Boolean(ok), label });
  check(
    g.records.filter((r) => r.status === "experiment").length >= 2,
    "At least two price experiments compared",
  );
  check(
    Number(g.values.profit) > 0,
    "Selected policy yields positive contribution",
  );
  check(has(g, "compare-baseline"), "Comparison against current performance");
  return checks;
}
export const act: Reducer = (c) => {
  const { g, a, s } = c;
  switch (a.key) {
    case "set-price":
      g.values.price = amount(a.value, 1, 1000);
      break;
    case "set-volume":
      g.values.volume = amount(a.value, 1, 10000);
      break;
    case "apply-inflation":
      g.values.cost = round(Number(s.data.facts["Unit cost"]) * 1.12);
      message(c, "Supplier cost increased by 12%; rerun the market model.");
      break;
    case "test-elasticity":
      g.values.elasticity = 1.6;
      break;
    case "capacity-limit":
      g.values.limit = Number(s.data.facts.Quantity) * 0.8;
      break;
    case "competitor-check":
      g.evidence.push(
        `Competitor price: $${Number(s.data.facts["Unit price"]) - 5}`,
      );
      break;
    case "compare-baseline":
      g.values.baseline =
        Number(s.data.facts.Quantity) *
        (Number(s.data.facts["Unit price"]) -
          Number(s.data.facts["Unit cost"]));
      break;
    case "simulate-market":
      {
        const price = Number(g.values.price),
          baseline = Number(s.data.facts["Unit price"]);
        const demand = Math.max(
          1,
          Math.round(
            Number(g.values.volume) *
              (1 -
                (Number(g.values.elasticity || 1.2) * (price - baseline)) /
                  baseline),
          ),
        );
        const sold = Math.min(demand, Number(g.values.limit || 100000));
        const profit = round(
          sold * (price - Number(g.values.cost || s.data.facts["Unit cost"])),
        );
        g.records.push({
          id: `run-${g.records.length}`,
          label: `Price $${price}`,
          amount: profit,
          expected: price * sold,
          status: "experiment",
          owner: "You",
          dependency: "",
          priority: 1,
          quantity: sold,
          capacity: demand,
        });
        g.values.profit = profit;
        g.values.demand = sold;
        g.phase = "modeled";
        message(
          c,
          `${sold} units sold; projected contribution $${profit}. Compare another price before publishing.`,
        );
      }
      break;
    case "publish-price":
      need(
        !inspect(s, c.world).some((check) => !check.ok),
        inspect(s, c.world)
          .filter((check) => !check.ok)
          .map((check) => check.label)
          .join("; "),
      );
      g.completed = true;
      g.phase = "published";
      {
        const product = c.world.company.products.find(
          (p) => p.id === s.data.facts["Product ID"],
        );
        if (product) product.price = Number(g.values.price);
      }
      task(c, "Review applied pricing policy", "sales");
      break;
  }
};
