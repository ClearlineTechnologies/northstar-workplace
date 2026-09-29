import type { Scenario, State } from "../../simulation/types";
import { amount, need, record, task, type Reducer } from "../runtime/core";
import { seedWorkData } from "../runtime/seed-data";
export function initialize(s: Scenario) {
  const g = seedWorkData(s);
  g.phase = "idle";
  g.records.forEach((row, i) => {
    const job = s.data.tasks[i % s.data.tasks.length];
    row.label = job.title;
    row.amount = job.due;
    row.quantity = job.minutes;
  });
  g.brief =
    "Protect a focus block while handling interruptions, workload and recovery breaks deliberately.";
  return g;
}
const actions = [
  "work-now",
  "advance-focus",
  "defer-work",
  "delegate-work",
  "interrupt-work",
  "ignore-interruption",
  "reschedule-work",
  "take-break",
  "escalate-load",
  "finish-block",
];
export function available(s: Scenario): string[] {
  const g = s.gameplay || initialize(s);
  if (g.completed || s.result) return [];
  const allow = new Set(actions);
  const gate = (keys: string[], condition: unknown) => {
    if (!condition) keys.forEach((key) => allow.delete(key));
  };
  gate(["advance-focus"], g.phase === "focused");
  gate(["finish-block"], ["finished", "closed"].includes(g.phase));
  return [...allow];
}
export function inspect(s: Scenario, _world: State) {
  const g = s.gameplay || initialize(s);
  const checks: { ok: boolean; label: string }[] = [];
  const check = (ok: unknown, label: string) =>
    checks.push({ ok: Boolean(ok), label });
  check(["finished", "closed"].includes(g.phase), "Focus task completed");
  check(g.values.interruptionHandled, "Interruption deliberately handled");
  check(Number(g.values.stress) < 60, "Sustainable work pace maintained");
  return checks;
}
export const act: Reducer = (c) => {
  const { g, a, s } = c;
  switch (a.key) {
    case "work-now":
      g.values.current = record(c).id;
      g.phase = "focused";
      break;
    case "advance-focus":
      need(g.phase === "focused", "Start a task first.");
      g.values.remaining = Math.max(0, Number(g.values.remaining) - 15);
      c.world.minute = Math.min(1020, c.world.minute + 15);
      g.values.stress = Number(g.values.stress) + 8;
      if (Number(g.values.remaining) === 30) {
        g.values.interruption = "A customer call is waiting";
        g.phase = "interrupted";
      }
      if (Number(g.values.remaining) === 0) {
        const row = g.records.find((r) => r.id === g.values.current);
        if (row) row.status = "done";
        g.phase = "finished";
      }
      break;
    case "interrupt-work":
      g.values.interruptionHandled = "Customer responded";
      g.phase = "focused";
      task(c, "Document interrupted customer call", "phone");
      break;
    case "ignore-interruption":
      g.values.interruptionHandled = "Deferred until focus ends";
      g.phase = "focused";
      break;
    case "defer-work":
      record(c).status = "deferred";
      break;
    case "delegate-work":
      record(c).status = "delegated";
      task(c, "Delegated task handoff", "communication");
      break;
    case "reschedule-work":
      record(c).amount = amount(a.value, 540, 1020);
      break;
    case "take-break":
      g.values.stress = Math.max(0, Number(g.values.stress) - 20);
      c.world.minute = Math.min(1020, c.world.minute + 10);
      break;
    case "escalate-load":
      g.values.capacity = "Manager approved a revised deadline";
      task(c, "Rebalance workload", "prioritization");
      break;
    case "finish-block":
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
