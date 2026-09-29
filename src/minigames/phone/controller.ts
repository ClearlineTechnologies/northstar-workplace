import type { Scenario, State } from "../../simulation/types";
import { event, has, message, need, task, type Reducer } from "../runtime/core";
import { seedWorkData } from "../runtime/seed-data";
export function initialize(s: Scenario) {
  const g = seedWorkData(s);
  g.phase = "ringing";
  g.brief =
    "Identify the caller, inspect the relevant record and leave an accountable resolution or handoff.";
  return g;
}
const actions = [
  "answer",
  "ask-name",
  "ask-account",
  "ask-order",
  "ask-callback",
  "hold",
  "resume",
  "open-record",
  "open-invoice",
  "transfer",
  "escalate",
  "callback",
  "take-message",
  "verify-security",
  "resolve",
  "end-call",
];
export function available(s: Scenario): string[] {
  const g = s.gameplay || initialize(s);
  if (g.completed || s.result) return [];
  const allow = new Set(actions);
  const gate = (keys: string[], condition: unknown) => {
    if (!condition) keys.forEach((key) => allow.delete(key));
  };
  if (g.phase === "ringing") return ["answer"];
  if (g.phase === "holding") return ["resume", "take-message", "ask-callback"];
  allow.delete("answer");
  allow.delete("resume");
  gate(
    ["open-record", "verify-security"],
    g.values.account && has(g, "ask-name"),
  );
  gate(["transfer", "resolve", "open-invoice"], has(g, "open-record"));
  gate(["callback"], g.values.callback);
  gate(["end-call"], g.values.disposition);
  return [...allow];
}
export function inspect(s: Scenario, _world: State) {
  const g = s.gameplay || initialize(s);
  const checks: { ok: boolean; label: string }[] = [];
  const check = (ok: unknown, label: string) =>
    checks.push({ ok: Boolean(ok), label });
  check(
    has(g, "ask-name") && g.values.account,
    "Caller identified before record disclosure",
  );
  check(has(g, "open-record"), "Customer record inspected");
  check(g.values.disposition, "Resolution or accountable handoff recorded");
  return checks;
}
export const act: Reducer = (c) => {
  const { g, a, s } = c;
  switch (a.key) {
    case "answer":
      need(g.phase === "ringing", "This line is already connected.");
      g.phase = "connected";
      message(
        c,
        `${s.participants[0]}: I need help; please establish my identity before opening the records.`,
      );
      break;
    case "ask-name":
      g.values.caller = s.participants[0];
      message(c, `Caller: ${s.participants[0]}, ${s.data.facts.Organization}.`);
      break;
    case "ask-account":
    case "ask-order":
      g.values.account = s.data.facts.Reference;
      message(
        c,
        `Account verified: ${s.data.facts.Reference}. The issue concerns ${s.data.facts["Case type"]}.`,
      );
      break;
    case "ask-callback":
      g.values.callback = String(s.data.facts["Contact number"]);
      message(c, `Callback number recorded: ${g.values.callback}.`);
      break;
    case "hold":
      g.phase = "holding";
      message(
        c,
        "Caller is on hold. A second line requests attention. Resume before resolving.",
      );
      break;
    case "resume":
      g.phase = "connected";
      break;
    case "open-record":
      if (/Confidential|Suspicious/.test(g.familyName))
        need(
          g.values.identity === "Verified",
          "Restricted caller: complete the security verification first.",
        );
      need(g.values.account, "Ask for the account or order reference first.");
      g.values.record = String(s.data.facts.Product);
      message(
        c,
        "Customer and order history opened. Choose the appropriate disposition.",
      );
      break;
    case "open-invoice":
      need(has(g, "open-record"), "Open the customer record first.");
      g.values.invoice =
        Number(s.data.facts.Quantity) * Number(s.data.facts["Unit price"]);
      break;
    case "verify-security":
      need(
        has(g, "ask-name") && g.values.account,
        "Verify the caller name and account.",
      );
      g.values.identity = "Verified";
      message(
        c,
        "Security check completed. Restricted information remains protected.",
      );
      break;
    case "transfer":
      need(
        has(g, "open-record"),
        "Verify and open the record before transferring.",
      );
      need(
        ["Finance", "Operations", "Technology", "Sales"].includes(
          String(a.value),
        ),
        "Select a receiving department.",
      );
      g.values.disposition = "Transferred";
      g.values.department = String(a.value);
      task(
        c,
        `Transferred call ${s.data.facts.Reference} to ${a.value}`,
        "email",
      );
      message(
        c,
        `${a.value} accepted the handoff. The caller can be disconnected safely.`,
      );
      break;
    case "escalate":
      task(
        c,
        `Manager call review: ${s.data.facts.Reference}`,
        "customer-service",
      );
      g.values.disposition = "Escalated";
      message(c, "Manager joined the case and accepted responsibility.");
      break;
    case "callback":
      need(g.values.callback, "Collect the callback number.");
      event(c, `Callback ${s.participants[0]}`);
      g.values.disposition = "Callback scheduled";
      break;
    case "take-message":
      task(c, `Call message: ${s.data.facts.Reference}`, "email");
      g.values.disposition = "Message taken";
      break;
    case "resolve":
      need(has(g, "open-record"), "Open the customer record before resolving.");
      g.values.disposition = "Resolved";
      message(c, "Caller confirms the information answers the request.");
      break;
    case "end-call":
      need(
        !inspect(s, c.world).some((check) => !check.ok),
        inspect(s, c.world)
          .filter((check) => !check.ok)
          .map((check) => check.label)
          .join("; "),
      );
      g.completed = true;
      g.phase = "disconnected";
      break;
  }
};
