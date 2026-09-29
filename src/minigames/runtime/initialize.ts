import type { Scenario } from "../../simulation/types";
import { controllers } from "./controllers";
export function initializeGame(s: Scenario) {
  return controllers[s.category].initialize(s);
}
