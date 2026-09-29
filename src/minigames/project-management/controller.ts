import type { Scenario, State } from "../../simulation/types";
import {
  amount,
  fault,
  need,
  record,
  task,
  type Reducer,
} from "../runtime/core";
import { seedWorkData } from "../runtime/seed-data";
export function initialize(s: Scenario) {
  const g = seedWorkData(s);
  g.phase = "backlog";
  g.records.forEach((row, i) => {
    const job = s.data.tasks[i % s.data.tasks.length];
    row.label = job.title;
    row.amount = job.due;
    row.quantity = job.minutes;
  });
  g.brief =
    "Assign accountable owners, sequence dependencies, clear blockers and deliver the project milestone.";
  return g;
}
const actions = [
  "set-task-priority",
  "assign-task",
  "move-task",
  "change-deadline",
  "add-dependency",
  "escalate-blocker",
  "reallocate-resource",
  "complete-task",
  "release-milestone",
];
export function available(s: Scenario): string[] {
  const g = s.gameplay || initialize(s);
  if (g.completed || s.result) return [];
  const allow = new Set(actions);
  const gate = (keys: string[], condition: unknown) => {
    if (!condition) keys.forEach((key) => allow.delete(key));
  };
  gate(
    ["release-milestone"],
    g.records.every((r) => r.status === "done"),
  );
  return [...allow];
}
export function inspect(s: Scenario, _world: State) {
  const g = s.gameplay || initialize(s);
  const checks: { ok: boolean; label: string }[] = [];
  const check = (ok: unknown, label: string) =>
    checks.push({ ok: Boolean(ok), label });
  check(
    g.records.every((r) => r.status === "done"),
    "Milestone work completed",
  );
  check(
    g.records.every((r) => r.owner !== "Unassigned"),
    "All tasks have accountable owners",
  );
  check(
    g.records.every(
      (r) =>
        !r.dependency ||
        g.records.find((v) => v.id === r.dependency)?.status === "done",
    ),
    "Dependencies satisfied",
  );
  return checks;
}
export const act: Reducer = (c) => {
  const { g, a, s } = c;
  const row = record(c);
  switch (a.key) {
    case "set-task-priority":
      record(c).priority = amount(a.value, 1, 5);
      break;
    case "assign-task":
      row.owner = String(a.value);
      break;
    case "move-task":
      need(
        ["backlog", "active", "blocked"].includes(String(a.value)),
        "Choose a board column.",
      );
      row.status = String(a.value);
      break;
    case "change-deadline":
      row.amount = amount(a.value, 540, 1020);
      break;
    case "add-dependency":
      need(a.value !== row.id, "A task cannot depend on itself.");
      need(
        g.records.some((r) => r.id === a.value),
        "Choose an existing prerequisite.",
      );
      {
        let ancestor = g.records.find((r) => r.id === a.value);
        for (let i = 0; ancestor && i < g.records.length; i++) {
          need(
            ancestor.dependency !== row.id,
            "That dependency would create a cycle.",
          );
          ancestor = g.records.find((r) => r.id === ancestor?.dependency);
        }
      }
      row.dependency = String(a.value);
      break;
    case "escalate-blocker":
      row.status = "active";
      g.values.blocker = "Manager secured the missing approval";
      task(c, "Resolve project blocker", "communication");
      break;
    case "reallocate-resource":
      row.owner = String(a.value || c.world.company.employees[1].name);
      g.values.resource = "Reallocated";
      break;
    case "complete-task":
      if (
        row.owner === "Unassigned" ||
        (row.dependency &&
          g.records.find((r) => r.id === row.dependency)?.status !== "done")
      ) {
        fault(
          c,
          "Task cannot close without an owner and completed prerequisites.",
        );
        break;
      }
      row.status = "done";
      break;
    case "release-milestone":
      need(
        !inspect(s, c.world).some((check) => !check.ok),
        inspect(s, c.world)
          .filter((check) => !check.ok)
          .map((check) => check.label)
          .join("; "),
      );
      g.completed = true;
      g.phase = "released";
      {
        const project =
          c.world.company.projects.find(
            (p) => p.id === c.s.data.facts["Project ID"],
          ) || c.world.company.projects[0];
        project.progress = Math.min(100, project.progress + 20);
        project.blocker = "";
      }
      break;
  }
};
