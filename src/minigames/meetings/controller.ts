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
  g.phase = "waiting";
  g.brief =
    "Hear the agenda, inspect the evidence, address the interruption and assign an owner and deadline to the decision.";
  return g;
}
const actions = [
  "assign-action-owner",
  "write-minutes",
  "join",
  "ask-evidence",
  "clarify-motion",
  "agree",
  "disagree",
  "raise-risk",
  "volunteer",
  "suggest-deadline",
  "defer",
  "add-action",
  "next-agenda",
  "adjourn",
];
export function available(s: Scenario): string[] {
  const g = s.gameplay || initialize(s);
  if (g.completed || s.result) return [];
  const allow = new Set(actions);
  const gate = (keys: string[], condition: unknown) => {
    if (!condition) keys.forEach((key) => allow.delete(key));
  };
  if (g.phase === "waiting") return ["join"];
  allow.delete("join");
  gate(["add-action"], g.values.owner);
  gate(
    ["next-agenda"],
    g.values.vote || g.values.motion === "Deferred pending evidence",
  );
  gate(["adjourn"], Number(g.values.turn) >= 3);
  return [...allow];
}
export function inspect(s: Scenario, _world: State) {
  const g = s.gameplay || initialize(s);
  const checks: { ok: boolean; label: string }[] = [];
  const check = (ok: unknown, label: string) =>
    checks.push({ ok: Boolean(ok), label });
  check(
    g.values.interruption !== "Unaddressed delivery interruption",
    "Delivery interruption addressed",
  );
  check(Number(g.values.turn) >= 3, "All agenda items processed");
  check(Number(g.values.actions) > 0, "Meeting action assigned");
  check(
    has(g, "ask-evidence") || has(g, "raise-risk"),
    "Evidence or risk discussed",
  );
  return checks;
}
export const act: Reducer = (c) => {
  const { g, a, s } = c;
  switch (a.key) {
    case "assign-action-owner":
      need(
        c.world.company.employees.some((e) => e.name === a.value),
        "Select a meeting participant.",
      );
      g.values.owner = String(a.value);
      break;
    case "write-minutes":
      g.values.minutes = String(a.value || "");
      break;
    case "join":
      g.phase = "discussion";
      g.values.speaker = 0;
      break;
    case "ask-evidence":
      g.evidence.push(`Agenda ${g.values.turn}: confirmed source record`);
      message(
        c,
        `${s.participants[1]} shares the current order and delivery constraints.`,
      );
      break;
    case "clarify-motion":
      message(
        c,
        "Motion clarified: agree scope, name an owner, and set a deadline.",
      );
      g.values.motion = "Clarified";
      break;
    case "agree":
    case "disagree":
      g.values.vote = a.key;
      message(
        c,
        a.key === "agree"
          ? "The motion has support. Record an accountable action."
          : "The chair asks for evidence; a revised motion will follow.",
      );
      if (a.key === "disagree") g.values.motion = "Revised";
      break;
    case "raise-risk":
      g.values.interruption = "Addressed in risk register";
      g.values.risk = "Delivery commitment at risk";
      message(c, "Risk added to the minutes; the chair requests mitigation.");
      break;
    case "volunteer":
      g.values.owner = "You";
      break;
    case "suggest-deadline":
      g.values.due = amount(a.value, 540, 1020);
      break;
    case "defer":
      g.values.motion = "Deferred pending evidence";
      task(c, `Evidence for ${s.title}`, "research");
      break;
    case "add-action":
      need(g.values.owner, "Volunteer or choose an action owner first.");
      task(
        c,
        `Meeting action ${Number(g.values.turn) + 1}: ${s.data.agenda[Number(g.values.turn)]} · ${g.values.owner}`,
        "project-management",
      );
      c.world.tasks.at(-1)!.due = Number(g.values.due || s.deadline);
      g.values.actions = Number(g.values.actions || 0) + 1;
      break;
    case "next-agenda":
      need(
        g.values.vote || g.values.motion === "Deferred pending evidence",
        "Record a vote or defer the motion.",
      );
      g.values.turn = Math.min(3, Number(g.values.turn) + 1);
      g.values.speaker = (Number(g.values.speaker) + 1) % s.participants.length;
      g.values.vote = "";
      if (Number(g.values.turn) === 2) {
        g.values.interruption = "Unaddressed delivery interruption";
        message(
          c,
          "Interruption: Operations reports a delay. Raise the risk before adjourning.",
        );
      }
      if (Number(g.values.turn) >= 3) g.phase = "minutes";
      break;
    case "adjourn":
      need(
        !inspect(s, c.world).some((check) => !check.ok),
        inspect(s, c.world)
          .filter((check) => !check.ok)
          .map((check) => check.label)
          .join("; "),
      );
      g.completed = true;
      g.phase = "adjourned";
      break;
  }
};
