import type { Scenario, State } from "../../simulation/types";
export type WorkRecord = {
  id: string;
  label: string;
  amount: number;
  expected: number;
  status: string;
  owner: string;
  dependency: string;
  priority: number;
  quantity: number;
  capacity: number;
};
export type GameState = {
  version: number;
  family: string;
  familyName: string;
  brief: string;
  complication: string;
  phase: string;
  flags: string[];
  values: Record<string, string | number>;
  records: WorkRecord[];
  evidence: string[];
  history: { action: string; detail: string; at: number }[];
  errors: string[];
  required: string[];
  outcome: string;
  completed: boolean;
};
export type GameAction = {
  key: string;
  target?: string;
  value?: string | number;
  option?: string;
  cells?: string[][];
  slides?: { title: string; text: string; chart: string; notes: string }[];
};
export type GameProps = {
  scenario: Scenario;
  company: State["company"];
  state: State;
  act: (action: GameAction) => void;
  busy: boolean;
};
export type Family = {
  id: string;
  name: string;
  requiredAction: string;
  objective: string;
};
export type GameDefinition = {
  id: Scenario["category"];
  uniqueInteractionType: string;
  primaryUIComponent: string;
  actionTypes: string[];
  stateMachineType: string;
  scenarioFamilies: Family[];
  evaluatorType: string;
  finishAction: string;
};
