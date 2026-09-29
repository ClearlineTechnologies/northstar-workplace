import type { Scenario, State } from "../../simulation/types";
import { need, task, type Reducer } from "../runtime/core";
import { seedWorkData } from "../runtime/seed-data";
export function initialize(s: Scenario) {
  const g = seedWorkData(s);
  g.phase = "draft";
  g.brief =
    "Select the appropriate audience, assemble verified facts and name an accountable owner and next action.";
  return g;
}
const actions = [
  "select-channel",
  "add-fact",
  "choose-tone",
  "choose-request",
  "tag-owner",
  "private-thread",
  "escalate-chat",
  "send-update",
];
export function available(s: Scenario): string[] {
  const g = s.gameplay || initialize(s);
  if (g.completed || s.result) return [];
  const allow = new Set(actions);
  const gate = (keys: string[], condition: unknown) => {
    if (!condition) keys.forEach((key) => allow.delete(key));
  };
  gate(["send-update"], g.values.channel && g.values.owner && g.values.request);
  return [...allow];
}
export function inspect(s: Scenario, _world: State) {
  const g = s.gameplay || initialize(s);
  const checks: { ok: boolean; label: string }[] = [];
  const check = (ok: unknown, label: string) =>
    checks.push({ ok: Boolean(ok), label });
  check(g.evidence.length >= 2, "Update contains two verified workplace facts");
  check(g.values.tone === "Professional", "Professional tone selected");
  check(
    g.values.channel && g.values.owner && g.values.request,
    "Audience, owner, and next action specified",
  );
  return checks;
}
export const act: Reducer = (c) => {
  const { g, a, s } = c;
  switch (a.key) {
    case "select-channel":
      g.values.channel = String(a.value);
      break;
    case "add-fact":
      g.evidence.push(String(a.value));
      break;
    case "choose-tone":
      g.values.tone = String(a.value);
      break;
    case "choose-request":
      g.values.request = String(a.value);
      break;
    case "tag-owner":
      g.values.owner = String(a.value);
      break;
    case "private-thread":
      g.values.channel = "Private · Manager";
      break;
    case "escalate-chat":
      g.values.urgency = "Escalated";
      task(c, "Review team blocker", "project-management");
      break;
    case "send-update":
      need(
        !inspect(s, c.world).some((check) => !check.ok),
        inspect(s, c.world)
          .filter((check) => !check.ok)
          .map((check) => check.label)
          .join("; "),
      );
      g.completed = true;
      g.phase = "delivered";
      {
        const text = `${g.values.tone}: ${g.evidence.join("; ")}. ${g.values.request}. Owner: ${g.values.owner}.`;
        c.world.chat.push(
          { id: `structured-${c.s.id}`, from: "You", text, at: c.world.minute },
          {
            id: `response-${c.s.id}`,
            from: c.world.company.manager,
            text: `Received in ${g.values.channel}. I have ${c.world.tasks.filter((t) => !t.done).length} open tasks on the board; your request is recorded.`,
            at: c.world.minute,
          },
        );
        g.outcome = "Team acknowledged the structured update.";
      }
      break;
  }
};
