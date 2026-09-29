import type { Scenario, State } from "../../simulation/types";
import { amount, need, record, type Reducer } from "../runtime/core";
import { seedWorkData } from "../runtime/seed-data";
export function initialize(s: Scenario) {
  const g = seedWorkData(s);
  g.phase = "unsorted";
  g.records.forEach((row, i) => {
    const job = s.data.tasks[i % s.data.tasks.length];
    row.label = job.title;
    row.amount = job.due;
    row.quantity = job.minutes;
  });
  g.brief =
    "Arrange the work queue around impact and prerequisites, delegate or defer work and preserve interruption capacity.";
  return g;
}
const actions = [
  "move-priority",
  "defer-task",
  "delegate-task",
  "inspect-dependency",
  "mark-urgent",
  "reserve-buffer",
  "dispatch-queue",
];
export function available(s: Scenario): string[] {
  const g = s.gameplay || initialize(s);
  if (g.completed || s.result) return [];
  const allow = new Set(actions);
  const gate = (keys: string[], condition: unknown) => {
    if (!condition) keys.forEach((key) => allow.delete(key));
  };
  gate(["dispatch-queue"], g.history.length >= 3);
  return [...allow];
}
export function inspect(s: Scenario, _world: State) {
  const g = s.gameplay || initialize(s);
  const checks: { ok: boolean; label: string }[] = [];
  const check = (ok: unknown, label: string) =>
    checks.push({ ok: Boolean(ok), label });
  {
    const active = g.records.filter(
      (r) => !["deferred", "delegated"].includes(r.status),
    );
    check(
      active.length > 0 &&
        active[0].priority === Math.max(...active.map((r) => r.priority)),
      "Highest impact work dispatched first",
    );
    check(
      active.every(
        (r) =>
          !r.dependency ||
          g.records.findIndex((v) => v.id === r.dependency) <
            g.records.findIndex((v) => v.id === r.id),
      ),
      "Prerequisites precede dependent work",
    );
    check(g.values.buffer, "Capacity buffer reserved");
  }
  return checks;
}
export const act: Reducer = (c) => {
  const { g, a, s } = c;
  const row = record(c);
  switch (a.key) {
    case "move-priority":
      {
        const index = g.records.indexOf(row);
        const to = Math.max(
          0,
          Math.min(g.records.length - 1, index + Number(a.value)),
        );
        g.records.splice(index, 1);
        g.records.splice(to, 0, row);
      }
      break;
    case "defer-task":
      row.status = "deferred";
      break;
    case "delegate-task":
      row.status = "delegated";
      row.owner = String(a.value || c.world.company.employees[1].name);
      break;
    case "inspect-dependency":
      g.values.dependency = row.dependency || "No prerequisite";
      break;
    case "mark-urgent":
      row.priority = 5;
      break;
    case "reserve-buffer":
      g.values.buffer = amount(a.value, 10, 60);
      break;
    case "dispatch-queue":
      need(
        !inspect(s, c.world).some((check) => !check.ok),
        inspect(s, c.world)
          .filter((check) => !check.ok)
          .map((check) => check.label)
          .join("; "),
      );
      g.completed = true;
      g.phase = "dispatched";
      for (const [i, row] of g.records.entries()) {
        c.world.tasks.push({
          id: `dispatch-${s.id}-${row.id}`,
          title: `${row.label} · ${row.owner}`,
          category: s.data.tasks[i % s.data.tasks.length].category,
          due:
            row.status === "deferred"
              ? 1020
              : Math.min(1020, c.world.minute + 20 * (i + 1)),
          impact: row.priority,
          minutes: row.quantity,
          dependency: row.dependency
            ? `dispatch-${s.id}-${row.dependency}`
            : "",
          done: false,
          sourceScenarioId: s.id,
        });
      }
      break;
  }
};
