import type { Scenario, State } from "../../simulation/types";
import {
  event,
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
  g.phase = "unread";
  g.brief =
    "Process the correspondence, gather required evidence and send a clear response with a follow-up when needed.";
  return g;
}
const actions = [
  "flag-mail",
  "write-mail",
  "open-message",
  "reply",
  "reply-all",
  "forward",
  "attach",
  "clarify",
  "approve",
  "reject",
  "escalate-mail",
  "add-task",
  "follow-up",
  "send-mail",
  "archive-thread",
];
export function available(s: Scenario): string[] {
  const g = s.gameplay || initialize(s);
  if (g.completed || s.result) return [];
  const allow = new Set(actions);
  const gate = (keys: string[], condition: unknown) => {
    if (!condition) keys.forEach((key) => allow.delete(key));
  };
  gate(
    actions.filter((v) => v !== "open-message"),
    has(g, "open-message"),
  );
  gate(["send-mail"], g.values.mode);
  gate(["archive-thread"], g.phase === "sent");
  return [...allow];
}
export function inspect(s: Scenario, _world: State) {
  const g = s.gameplay || initialize(s);
  const checks: { ok: boolean; label: string }[] = [];
  const check = (ok: unknown, label: string) =>
    checks.push({ ok: Boolean(ok), label });
  check(has(g, "open-message"), "Original correspondence read");
  check(has(g, "send-mail"), "Actionable response dispatched");
  check(
    g.values.response || g.evidence.length,
    "Reply includes a structured decision or evidence",
  );
  return checks;
}
export const act: Reducer = (c) => {
  const { g, a, s } = c;
  switch (a.key) {
    case "flag-mail":
      g.values.flagged = g.values.flagged ? "" : "Follow up";
      break;
    case "write-mail":
      g.values.body = String(a.value || "");
      g.phase = "composing";
      break;
    case "open-message":
      {
        const item = c.world.mail.find(
          (m) => m.id === a.target || (!a.target && m.scenarioId === s.id),
        );
        if (item) {
          item.read = true;
          g.values.message = item.id;
        }
      }
      g.phase = "reading";
      g.values.selected = a.target || "primary";
      break;
    case "reply":
    case "reply-all":
    case "forward":
      need(has(g, "open-message"), "Open a message first.");
      g.phase = "composing";
      g.values.mode = a.key;
      g.values.recipient = a.key === "forward" ? "Finance" : s.participants[0];
      break;
    case "attach":
      g.evidence.push(
        a.value ? String(a.value) : `Order record ${s.data.facts.Reference}`,
      );
      message(c, "The selected workplace record is attached to the draft.");
      break;
    case "clarify":
      mail(
        c,
        "Clarification received",
        `The order reference is ${s.data.facts.Reference}. The authorized quantity is ${s.data.facts.Quantity}.`,
      );
      g.values.response = "Clarification requested";
      break;
    case "approve":
    case "reject":
      g.values.response =
        a.key === "approve"
          ? "Approved with documented controls"
          : "Rejected pending correction";
      break;
    case "escalate-mail":
      task(
        c,
        `Escalated correspondence ${s.data.facts.Reference}`,
        "incidents",
      );
      g.values.response = "Manager escalation requested";
      break;
    case "add-task":
      task(c, `Email action ${s.data.facts.Reference}`, "administration");
      break;
    case "follow-up":
      event(c, `Email follow-up ${s.data.facts.Reference}`);
      break;
    case "send-mail":
      need(g.values.mode, "Choose reply, reply all, or forward.");
      need(
        g.values.response || g.evidence.length,
        "Choose a response action or attach evidence.",
      );
      mail(
        c,
        `Re: ${s.data.facts.Subject || s.title}`,
        `${g.values.body || g.values.response || "Attached the requested evidence."} Reference ${s.data.facts.Reference}. Owner: ${c.world.company.manager}.`,
        String(g.values.recipient),
      );
      c.world.mail[0].attachments = [...g.evidence];
      g.phase = "sent";
      break;
    case "archive-thread":
      for (const item of c.world.mail.filter((m) => m.scenarioId === s.id)) {
        item.archived = true;
        item.folder = "Archive";
      }
      need(
        !inspect(s, c.world).some((check) => !check.ok),
        inspect(s, c.world)
          .filter((check) => !check.ok)
          .map((check) => check.label)
          .join("; "),
      );
      g.completed = true;
      g.phase = "archived";
      break;
  }
};
