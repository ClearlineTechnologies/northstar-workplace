import { initializeGame } from "../minigames/runtime/initialize";
import type { State } from "../simulation/types";

/** Upgrade saved tool metadata without discarding company records or authored work. */
export function migrateState(state: State): State {
  for (const scenario of state.scenarios) {
    const previous = scenario.gameplay;
    if (!previous) {
      initializeGame(scenario);
      continue;
    }
    if (previous.version >= 3) continue;
    if (scenario.result) {
      previous.version = 3;
      continue;
    }
    const freshScenario = structuredClone(scenario);
    const fresh = initializeGame(freshScenario);
    const started = previous.history.length > 0;
    scenario.gameplay = {
      ...fresh,
      ...previous,
      version: 3,
      brief: fresh.brief,
      required: [],
      values: { ...fresh.values, ...previous.values },
      records: started ? previous.records : fresh.records,
    };
    if (!started) {
      scenario.data = freshScenario.data;
      scenario.hiddenFacts = freshScenario.hiddenFacts;
    }
    if (
      scenario.category === "inventory" &&
      previous.values.main === undefined
    ) {
      scenario.gameplay.values.main = previous.values.physical;
      scenario.gameplay.values.overflow = 0;
    }
  }
  return state;
}
