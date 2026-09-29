import type { Scenario, State } from "../../simulation/types";
import { has, need, task, type Reducer } from "../runtime/core";
import { seedWorkData } from "../runtime/seed-data";
export function initialize(s: Scenario) {
  const g = seedWorkData(s);
  g.phase = "off-duty";
  g.brief =
    "Complete the generated commitments in their actual work applications, then review the shift with your manager.";
  return g;
}
const actions = [
  "launch-shift",
  "open-work-app",
  "advance-shift",
  "triage-interruption",
  "lunch-break",
  "manager-checkin",
  "review-shift",
  "close-shift",
];
export function available(s: Scenario): string[] {
  const g = s.gameplay || initialize(s);
  if (g.completed || s.result) return [];
  const allow = new Set(actions);
  const gate = (keys: string[], condition: unknown) => {
    if (!condition) keys.forEach((key) => allow.delete(key));
  };
  if (g.phase === "off-duty") return ["launch-shift"];
  allow.delete("launch-shift");
  gate(["close-shift"], has(g, "review-shift"));
  return [...allow];
}
export function inspect(s: Scenario, world: State) {
  const g = s.gameplay || initialize(s);
  const checks: { ok: boolean; label: string }[] = [];
  const check = (ok: unknown, label: string) =>
    checks.push({ ok: Boolean(ok), label });
  {
    const tasks = world.tasks.filter((t) =>
      t.id.startsWith(`shift-${s.seed}-`),
    );
    check(
      tasks.length === s.data.tasks.length && tasks.every((t) => t.done),
      "Every generated shift assignment completed in its own work system",
    );
    check(world.minute >= 1020, "End-of-day review reached");
    check(g.values.checkin, "Manager status check completed");
  }
  return checks;
}
export const act: Reducer = (c) => {
  const { g, a, s } = c;
  switch (a.key) {
    case "launch-shift":
      g.phase = "on-duty";
      break;
    case "open-work-app":
      g.values.app = String(a.value);
      break;
    case "advance-shift":
      c.world.minute = Math.min(1020, c.world.minute + 30);
      break;
    case "triage-interruption":
      g.values.interruption = "Routed to the correct application";
      task(c, "Triage incoming shift request", "phone");
      break;
    case "lunch-break":
      c.world.minute = Math.min(1020, c.world.minute + 30);
      g.values.break = "Taken";
      break;
    case "manager-checkin":
      g.values.checkin = "Manager reviewed current commitments";
      break;
    case "review-shift":
      g.values.review = c.world.tasks.filter(
        (t) => t.id.startsWith(`shift-${c.s.seed}-`) && t.done,
      ).length;
      break;
    case "close-shift":
      need(
        !inspect(s, c.world).some((check) => !check.ok),
        inspect(s, c.world)
          .filter((check) => !check.ok)
          .map((check) => check.label)
          .join("; "),
      );
      g.completed = true;
      g.phase = "off-duty";
      break;
  }
};
