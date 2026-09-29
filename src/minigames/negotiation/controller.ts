import type { Scenario, State } from "../../simulation/types";
import { amount, message, need, task, type Reducer } from "../runtime/core";
import { seedWorkData } from "../runtime/seed-data";
export function initialize(s: Scenario) {
  const g = seedWorkData(s);
  g.phase = "opening";
  g.values.delivery = Number(s.data.facts["Maximum delivery days"]);
  g.brief =
    "Exchange offers and concessions to reach an authorized price and delivery agreement, or decline an unsafe deal.";
  return g;
}
const actions = [
  "set-offer",
  "set-delivery",
  "offer-package",
  "counter-price",
  "trade-volume",
  "walk-away",
  "accept-counter",
  "sign-agreement",
];
export function available(s: Scenario): string[] {
  const g = s.gameplay || initialize(s);
  if (g.completed || s.result) return [];
  const allow = new Set(actions);
  const gate = (keys: string[], condition: unknown) => {
    if (!condition) keys.forEach((key) => allow.delete(key));
  };
  gate(["accept-counter"], g.values.counter);
  gate(["sign-agreement"], g.values.accepted || g.values.walked);
  return [...allow];
}
export function inspect(s: Scenario, _world: State) {
  const g = s.gameplay || initialize(s),
    f = s.data.facts;
  const checks: { ok: boolean; label: string }[] = [];
  const check = (ok: unknown, label: string) =>
    checks.push({ ok: Boolean(ok), label });
  check(
    g.values.walked ||
      Number(g.values.accepted) <= Number(f["Maximum unit price"]),
    "Agreement respects price mandate or unsafe deal declined",
  );
  check(
    g.values.walked ||
      Number(g.values.delivery) <= Number(f["Maximum delivery days"]),
    "Delivery requirement respected",
  );
  check(
    g.values.walked || ["agreed", "signed"].includes(g.phase),
    "Counterparty consent obtained",
  );
  return checks;
}
export const act: Reducer = (c) => {
  const { g, a, s } = c;
  switch (a.key) {
    case "set-offer":
      g.values.offer = amount(a.value, 1, 1000);
      break;
    case "set-delivery":
      g.values.delivery = amount(a.value, 1, 30);
      break;
    case "trade-volume":
      g.values.volumeConcession = Number(s.data.facts.Quantity) + 10;
      g.values.reserve = s.hiddenFacts.reserve - 2;
      message(
        c,
        "Supplier accepts an increased volume in exchange for a $2 unit-price concession.",
      );
      break;
    case "counter-price":
      g.values.offer = Math.max(1, Number(g.values.offer) - 3);
      break;
    case "walk-away":
      g.values.walked = "Alternative supplier requested";
      g.phase = "closed-without-deal";
      task(c, "Find an alternative supplier", "procurement");
      break;
    case "offer-package":
      {
        const reserve = Number(g.values.reserve || s.hiddenFacts.reserve);
        const offer = Number(g.values.offer);
        g.values.round = Number(g.values.round || 0) + 1;
        if (
          offer >= reserve &&
          Number(g.values.delivery) <=
            Number(s.data.facts["Maximum delivery days"])
        ) {
          g.values.accepted = offer;
          g.phase = "agreed";
          message(
            c,
            `Supplier accepts $${offer}/unit in ${g.values.delivery} days.`,
          );
        } else {
          g.values.counter = Math.max(
            reserve,
            Number(s.data.facts["Opening offer"]) - Number(g.values.round) * 4,
          );
          g.phase = "counteroffer";
          message(
            c,
            `Supplier counteroffer: $${g.values.counter}; minimum delivery ${s.data.facts["Maximum delivery days"]} days.`,
          );
        }
      }
      break;
    case "accept-counter":
      need(g.values.counter, "Request a supplier offer first.");
      g.values.offer = Number(g.values.counter);
      g.values.accepted = Number(g.values.counter);
      g.phase = "agreed";
      break;
    case "sign-agreement":
      need(
        !inspect(s, c.world).some((check) => !check.ok),
        inspect(s, c.world)
          .filter((check) => !check.ok)
          .map((check) => check.label)
          .join("; "),
      );
      g.completed = true;
      g.phase = "signed";
      break;
  }
};
