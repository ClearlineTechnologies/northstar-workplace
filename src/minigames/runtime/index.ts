import type { Evaluation, Scenario, State } from "../../simulation/types";
import { definition } from "../catalog";
import { controllers } from "./controllers";
import { mark, need } from "./core";
import { initializeGame } from "./initialize";
import type { GameAction } from "./types";
export { controllers };
export function availableActions(s: Scenario) {
  return controllers[s.category].available(s);
}
export function workChecks(s: Scenario, world: State) {
  return controllers[s.category].inspect(s, world);
}
export function evaluateGame(s: Scenario, world: State): Evaluation {
  const g = s.gameplay || initializeGame(s),
    checks = workChecks(s, world);
  const score = Math.max(
    0,
    Math.round((checks.filter((c) => c.ok).length / checks.length) * 100) -
      g.errors.length * 8,
  );
  return {
    score,
    passed: score >= 80 && checks.every((c) => c.ok),
    feedback: checks
      .map((c) => `${c.ok ? "Recorded" : "Needs correction"}: ${c.label}.`)
      .concat(g.errors),
    metrics: {
      [definition(s.category)!.metric]: score,
      accuracy: score,
      "procedure adherence": Math.max(0, 100 - g.errors.length * 20),
    },
    cash: score >= 80 ? 25 : -25,
    reputation: score >= 80 ? 2 : -3,
    minutes: 2,
  };
}
export function performGameAction(
  s: Scenario,
  world: State,
  a: GameAction,
): boolean {
  const g = s.gameplay || initializeGame(s);
  need(
    controllers[s.category].available(s).includes(a.key),
    `Operation ${a.key} is unavailable while ${g.phase}.`,
  );
  g.outcome = "";
  controllers[s.category].act({ s, g, world, a });
  mark(g, a.key);
  if (!g.outcome)
    g.outcome = `${a.key.replaceAll("-", " ")}${a.target ? " · " + a.target : ""}${a.value !== undefined ? ": " + a.value : ""}`;
  g.history.push({
    action: a.key,
    detail:
      g.outcome ||
      `${a.key.replaceAll("-", " ")} recorded${a.value !== undefined ? ": " + a.value : ""}`,
    at: world.minute,
  });
  world.minute = Math.min(1020, world.minute + 1);
  s.draft.fields.owner = world.company.manager;
  s.draft.fields.due = String(s.deadline);
  s.draft.fields.notes = g.history.map((h) => h.detail).join("\n");
  return g.completed;
}
