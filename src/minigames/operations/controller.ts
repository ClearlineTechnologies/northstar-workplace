import type { Scenario, State } from "../../simulation/types";
import {
  amount,
  message,
  need,
  record,
  task,
  type Reducer,
} from "../runtime/core";
import { seedWorkData } from "../runtime/seed-data";
export function initialize(s: Scenario) {
  const g = seedWorkData(s);
  g.phase = "waiting";
  g.records = g.records
    .slice(0, 3)
    .map((row, i) => ({
      ...row,
      label: ["Customer support", "Order packing", "Invoice processing"][i],
      quantity: 20 + (Math.abs(s.seed + i * 7) % 35),
      capacity: 10,
      amount: 0,
      status: "queued",
    }));
  g.brief =
    "Allocate limited staff, observe changing queue demand and clear backlogs while controlling service capacity.";
  return g;
}
const actions = [
  "allocate-staff",
  "process-queues",
  "reroute-demand",
  "overtime",
  "triage-queue",
  "cross-train",
  "service-recovery",
  "close-operation",
];
export function available(s: Scenario): string[] {
  const g = s.gameplay || initialize(s);
  if (g.completed || s.result) return [];
  const allow = new Set(actions);
  const gate = (keys: string[], condition: unknown) => {
    if (!condition) keys.forEach((key) => allow.delete(key));
  };
  gate(["close-operation"], Number(g.values.tick) >= 2);
  return [...allow];
}
export function inspect(s: Scenario, _world: State) {
  const g = s.gameplay || initialize(s);
  const checks: { ok: boolean; label: string }[] = [];
  const check = (ok: unknown, label: string) =>
    checks.push({ ok: Boolean(ok), label });
  check(
    g.records.every((r) => r.quantity === 0),
    "All queues cleared after changing demand",
  );
  check(
    g.records.reduce((n, r) => n + r.amount, 0) <= Number(g.values.staff),
    "Staffing stays within capacity",
  );
  check(
    Number(g.values.tick) >= 2,
    "Service performance observed across intervals",
  );
  return checks;
}
export const act: Reducer = (c) => {
  const { g, a, s } = c;
  switch (a.key) {
    case "allocate-staff":
      {
        const row = record(c);
        const number = amount(a.value, 0, 12);
        need(Number.isInteger(number), "Allocate whole employees.");
        need(
          g.records.reduce(
            (sum, r) => sum + (r.id === row.id ? number : r.amount),
            0,
          ) <= Number(g.values.staff),
          "Allocation exceeds available employees.",
        );
        row.amount = number;
      }
      break;
    case "process-queues":
      {
        g.values.tick = Number(g.values.tick || 0) + 1;
        for (const row of g.records) {
          const processed = Math.min(row.quantity, row.amount * row.capacity);
          row.quantity -= processed;
          g.values.processed = Number(g.values.processed || 0) + processed;
        }
        if (Number(g.values.tick) === 1) {
          g.records[0].quantity += 12;
          message(
            c,
            "Live demand event: 12 priority cases arrived in Customer support. Rebalance and run another interval.",
          );
        } else
          message(
            c,
            "Interval processed. Review queue backlogs and service levels.",
          );
      }
      break;
    case "reroute-demand":
      {
        const from = g.records[0],
          to = g.records[1];
        const moved = Math.min(10, from.quantity);
        from.quantity -= moved;
        to.quantity += moved;
      }
      break;
    case "overtime":
      g.values.staff = Number(g.values.staff) + 2;
      c.world.company.cash -= 80;
      break;
    case "triage-queue":
      g.records[0].priority = 5;
      break;
    case "cross-train":
      g.records.forEach((row) => (row.capacity += 2));
      c.world.company.cash -= 50;
      break;
    case "service-recovery":
      task(c, "Notify customers of restored service", "customer-service");
      g.values.recovery = "Customers notified";
      break;
    case "close-operation":
      need(
        !inspect(s, c.world).some((check) => !check.ok),
        inspect(s, c.world)
          .filter((check) => !check.ok)
          .map((check) => check.label)
          .join("; "),
      );
      g.completed = true;
      g.phase = "reported";
      break;
  }
};
