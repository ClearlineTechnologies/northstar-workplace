import type { Scenario, State } from "../../simulation/types";
import { amount, need, record, type Reducer } from "../runtime/core";
import { seedWorkData } from "../runtime/seed-data";
export function initialize(s: Scenario) {
  const g = seedWorkData(s);
  g.phase = "unreserved";
  g.records.forEach((row, i) => {
    row.label = ["Client review", "Design workshop", "Supplier check"][i % 3];
    row.amount = 540 + i * 90;
    row.quantity = 30;
    row.status = "booked";
  });
  g.brief =
    "Choose two attendees and a room, resolve all overlapping appointments, then send meeting invitations.";
  return g;
}
const actions = [
  "select-slot",
  "select-attendee",
  "book-room",
  "check-conflicts",
  "reschedule-event",
  "cancel-event",
  "hold-slot",
  "send-invites",
];
export function available(s: Scenario): string[] {
  const g = s.gameplay || initialize(s);
  if (g.completed || s.result) return [];
  const allow = new Set(actions);
  const gate = (keys: string[], condition: unknown) => {
    if (!condition) keys.forEach((key) => allow.delete(key));
  };
  gate(["send-invites"], g.values.conflicts === 0 && g.evidence.length > 0);
  return [...allow];
}
export function inspect(s: Scenario, _world: State) {
  const g = s.gameplay || initialize(s);
  const checks: { ok: boolean; label: string }[] = [];
  const check = (ok: unknown, label: string) =>
    checks.push({ ok: Boolean(ok), label });
  check(g.values.conflicts === 0, "Conflict check passed");
  check(g.evidence.length >= 2, "Required attendees selected");
  check(g.values.room, "Meeting room booked");
  return checks;
}
export const act: Reducer = (c) => {
  const { g, a, s } = c;
  switch (a.key) {
    case "select-slot":
      g.values.slot = amount(a.value, 480, 990);
      g.values.conflicts = "Unchecked";
      break;
    case "select-attendee":
      if (!g.evidence.includes(String(a.value)))
        g.evidence.push(String(a.value));
      break;
    case "book-room":
      g.values.conflicts = "Unchecked";
      g.values.room = String(a.value);
      break;
    case "check-conflicts":
      {
        const start = Number(g.values.slot);
        const conflicts = c.world.calendar.filter(
          (e) =>
            e.day === c.world.day &&
            !e.cancelled &&
            start < e.start + e.duration &&
            start + 30 > e.start,
        );
        const local = g.records.filter(
          (r) =>
            r.status !== "cancelled" &&
            start < r.amount + r.quantity &&
            start + 30 > r.amount,
        );
        g.values.conflicts = conflicts.length + local.length;
        g.outcome = Number(g.values.conflicts)
          ? `Conflict with ${[...conflicts.map((e) => e.title), ...local.map((e) => e.label)].join(", ")}`
          : "All attendees and room are available.";
      }
      break;
    case "reschedule-event":
      {
        const row = record(c);
        row.amount = amount(a.value, 480, 990);
        row.status = "rescheduled";
        g.values.conflicts = "Unchecked";
        g.values.rescheduled = row.id;
      }
      break;
    case "cancel-event":
      record(c).status = "cancelled";
      g.values.conflicts = "Unchecked";
      break;
    case "hold-slot":
      g.values.hold = Number(g.values.slot || 570);
      break;
    case "send-invites":
      need(
        !inspect(s, c.world).some((check) => !check.ok),
        inspect(s, c.world)
          .filter((check) => !check.ok)
          .map((check) => check.label)
          .join("; "),
      );
      g.completed = true;
      g.phase = "booked";
      need(
        g.values.slot !== undefined && g.values.conflicts === 0,
        "Select a time and resolve conflicts.",
      );
      c.world.calendar.push({
        id: `booked-${c.s.id}`,
        title: g.familyName,
        day: c.world.day,
        start: Number(g.values.slot),
        duration: 30,
        attendees: g.evidence.join(", "),
        cancelled: false,
      });
      g.outcome = "Invitations sent and calendar appointment saved.";
      break;
  }
};
