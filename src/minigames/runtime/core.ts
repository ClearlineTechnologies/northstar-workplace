import type { Scenario, State } from "../../simulation/types";
import type { GameAction, GameState, WorkRecord } from "./types";
export type Context = {
  s: Scenario;
  g: GameState;
  world: State;
  a: GameAction;
};
export type Reducer = (ctx: Context) => void;
export function mark(g: GameState, key: string) {
  if (!g.flags.includes(key)) g.flags.push(key);
}
export function has(g: GameState, key: string) {
  return g.flags.includes(key);
}
export function need(ok: unknown, message: string): asserts ok {
  if (!ok) throw Error(message);
}
export function amount(value: unknown, min = 0, max = 10000000) {
  const n = Number(value);
  need(
    value !== undefined && Number.isFinite(n) && n >= min && n <= max,
    `Enter a number between ${min} and ${max}.`,
  );
  return n;
}
export function record(c: Context): WorkRecord {
  const row = c.g.records.find(
    (v) => v.id === (c.a.target || c.g.values.selected),
  );
  need(row, "Select an existing record.");
  return row;
}
export function fault(c: Context, message: string) {
  c.g.errors.push(message);
  c.g.outcome = message;
  c.world.company.reputation = Math.max(0, c.world.company.reputation - 1);
}
export function message(c: Context, text: string) {
  c.g.outcome = text;
}
export function task(
  c: Context,
  title: string,
  category: Scenario["category"],
) {
  const id = `game-task-${c.s.id}-${c.g.history.length}`;
  c.world.tasks.push({
    id,
    title,
    category,
    due: Math.min(1020, c.world.minute + 60),
    impact: 3,
    minutes: 15,
    dependency: "",
    done: false,
    sourceScenarioId: c.s.id,
  });
}
export function mail(c: Context, subject: string, body: string, to = "You") {
  c.world.mail.unshift({
    id: `game-mail-${c.s.id}-${c.g.history.length}`,
    from: to === "You" ? c.s.participants[1] : "You",
    to,
    subject,
    body,
    read: to !== "You",
    archived: false,
    folder: to === "You" ? "Inbox" : "Sent",
    attachments: [],
    at: c.world.minute,
    scenarioId: c.s.id,
  });
}
export function event(c: Context, title: string, start = c.world.minute + 45) {
  c.world.calendar.push({
    id: `game-event-${c.s.id}-${c.g.history.length}`,
    title,
    day: c.world.day,
    start: Math.min(990, start),
    duration: 15,
    attendees: c.s.participants.join(", "),
    cancelled: false,
  });
}
export function selected(c: Context, key = "selected") {
  c.g.values[key] = c.a.target || String(c.a.value || "");
}
