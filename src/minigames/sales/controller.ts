import { round } from "../../simulation/generators/random";
import type { Scenario, State } from "../../simulation/types";
import {
  amount,
  has,
  mail,
  message,
  need,
  task,
  type Reducer,
} from "../runtime/core";
import { seedWorkData } from "../runtime/seed-data";
export function initialize(s: Scenario) {
  const g = seedWorkData(s);
  g.phase = "lead";
  g.brief =
    "Qualify the buyer, capture requirements, verify fulfillment, build a quotation and coordinate the confirmed order.";
  return g;
}
const actions = [
  "qualify-lead",
  "capture-volume",
  "select-product",
  "check-stock",
  "set-discount",
  "build-quote",
  "send-quote",
  "log-objection",
  "sales-followup",
  "book-order",
];
export function available(s: Scenario): string[] {
  const g = s.gameplay || initialize(s);
  if (g.completed || s.result) return [];
  const allow = new Set(actions);
  const gate = (keys: string[], condition: unknown) => {
    if (!condition) keys.forEach((key) => allow.delete(key));
  };
  gate(["build-quote"], g.values.qualified && g.values.product);
  gate(["send-quote"], g.values.quote);
  gate(["book-order"], has(g, "send-quote") && has(g, "sales-followup"));
  return [...allow];
}
export function inspect(s: Scenario, _world: State) {
  const g = s.gameplay || initialize(s);
  const checks: { ok: boolean; label: string }[] = [];
  const check = (ok: unknown, label: string) =>
    checks.push({ ok: Boolean(ok), label });
  check(g.values.qualified && g.values.product, "Lead and product qualified");
  check(has(g, "check-stock"), "Fulfillment availability verified");
  check(
    g.values.quote && has(g, "send-quote") && has(g, "sales-followup"),
    "Priced quotation and customer confirmation recorded",
  );
  return checks;
}
export const act: Reducer = (c) => {
  const { g, a, s } = c;
  switch (a.key) {
    case "qualify-lead":
      g.values.qualified = "Budget and authority confirmed";
      g.phase = "qualified";
      break;
    case "capture-volume":
      g.values.quote = 0;
      g.values.volume = amount(a.value, 1, 10000);
      break;
    case "select-product":
      need(
        c.world.company.products.some((p) => p.id === a.value),
        "Select a company product.",
      );
      g.values.product = String(a.value);
      break;
    case "check-stock":
      {
        const p =
          c.world.company.products.find((p) => p.id === g.values.product) ||
          c.world.company.products[0];
        g.values.stock = p.stock;
        g.evidence.push("Availability checked");
        if (Number(g.values.volume) > p.stock) {
          g.values.fulfillment = "Backorder";
          message(
            c,
            "Stock is insufficient. The quote will include a procurement handoff.",
          );
        } else g.values.fulfillment = "From stock";
      }
      break;
    case "set-discount":
      g.values.quote = 0;
      g.flags = g.flags.filter((v) => v !== "send-quote");
      g.values.discount = amount(a.value, 0, 10);
      break;
    case "build-quote":
      need(
        g.values.product && g.values.qualified,
        "Qualify the lead and choose the product.",
      );
      {
        const p = c.world.company.products.find(
          (p) => p.id === g.values.product,
        )!;
        g.values.quote = round(
          p.price *
            Number(g.values.volume) *
            (1 - Number(g.values.discount) / 100),
        );
        g.phase = "quoted";
      }
      break;
    case "send-quote":
      need(g.values.quote, "Build a quotation first.");
      mail(
        c,
        "Quotation " + s.data.facts.Reference,
        `Total $${g.values.quote}; fulfillment: ${g.values.fulfillment}.`,
        s.participants[0],
      );
      g.phase = "customer-review";
      break;
    case "log-objection":
      g.values.objection = "Customer requests a delivery assurance";
      message(
        c,
        "Customer wants an availability check and follow-up before signing.",
      );
      break;
    case "sales-followup":
      g.values.followup = "Customer confirmation recorded";
      task(c, "Customer order coordination", "scheduling");
      break;
    case "book-order":
      need(
        !inspect(s, c.world).some((check) => !check.ok),
        inspect(s, c.world)
          .filter((check) => !check.ok)
          .map((check) => check.label)
          .join("; "),
      );
      g.completed = true;
      {
        const product = c.world.company.products.find(
          (p) => p.id === g.values.product,
        );
        if (product && g.values.fulfillment === "From stock")
          product.stock = Math.max(0, product.stock - Number(g.values.volume));
      }
      g.phase = "won";
      c.world.company.cash += Number(g.values.quote);
      if (g.values.fulfillment === "Backorder")
        task(c, "Procure backordered sales units", "procurement");
      g.outcome = "Opportunity won and order recorded.";
      break;
  }
};
