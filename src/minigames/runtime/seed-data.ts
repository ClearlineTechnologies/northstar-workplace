import { random } from "../../simulation/generators/random";
import type { Scenario } from "../../simulation/types";
import { gameDefinition } from "../manifest";
import type { GameState } from "./types";
export function seedWorkData(s: Scenario): GameState {
  const def = gameDefinition(s.category),
    r = random(s.seed + 817);
  const family =
    def.scenarioFamilies[Math.abs(s.seed) % def.scenarioFamilies.length];
  const complications = [
    "Standard controls",
    "Urgent stakeholder deadline",
    "Missing supporting evidence",
    "Restricted resource capacity",
    "Additional authorization required",
  ];
  const variation =
    Math.floor(Math.abs(s.seed) / def.scenarioFamilies.length) % 5;
  const records = s.data.rows
    .slice(0, 3 + Math.floor(s.difficulty / 2))
    .map((row, i) => ({
      id: row.id,
      label: row.name,
      amount:
        row.quantity * row.price +
        (s.category === "finance" && i === 0 && variation % 2 ? 25 : 0),
      expected: row.quantity * row.price,
      status: "pending",
      owner: "Unassigned",
      dependency: i === 2 ? "row-1" : "",
      priority: i === 0 ? 5 : r.int(1, 4),
      quantity: row.quantity,
      capacity: r.int(6, 15),
    }));
  const g: GameState = {
    version: 3,
    family: family.id,
    familyName: family.name,
    brief: family.objective,
    complication: complications[variation],
    phase: "",
    flags: [],
    values: {
      variation,
      selected: records[0].id,
      price: Number(s.data.facts["Unit price"]),
      volume: Number(s.data.facts.Quantity),
      stock: Number(s.data.facts["Opening stock"] || 70),
      physical: Number(s.data.facts["Opening stock"] || 70) + r.int(-6, 6),
      receipt: Number(s.data.facts.Received || 12),
      damaged: Number(s.data.facts.Damaged || 3),
      staff: 12,
      turn: 0,
      speaker: 0,
      offer: Number(s.data.facts["Opening offer"] || 100),
      delivery: Number(s.data.facts["Required delivery days"]),
      discount: 0,
      remaining: 45,
      minute: 510,
      stress: 10,
    },
    records,
    evidence: [],
    history: [],
    errors: [],
    required: [],
    outcome: "",
    completed: false,
  };
  s.gameplay = g;
  return g;
}
