import assert from "node:assert/strict";
import test from "node:test";
import { migrateState } from "../database/migrate";
import { calculateCell } from "../features/formulas";
import { categories } from "../minigames/catalog";
import { minigameManifest } from "../minigames/manifest";
import { controllers, performGameAction } from "../minigames/runtime";
import { applyCommand } from "../simulation/engine";
import { initialState } from "../simulation/generators/company";
import {
  generateScenario,
  validateScenario,
} from "../simulation/generators/scenario";
import { operate, workSession } from "./fixtures";
for (const category of categories) {
  test(`${category.name}: 300 reproducible procedural instances`, () => {
    const signatures = new Set<string>();
    for (let seed = 0; seed < 300; seed++) {
      const s = generateScenario(category.id, (seed % 6) + 1, seed);
      assert.ok(validateScenario(s), `${category.id}/${seed}`);
      assert.deepEqual(s, generateScenario(category.id, (seed % 6) + 1, seed));
      signatures.add(
        JSON.stringify({
          records: s.gameplay!.records,
          facts: s.data.facts,
          family: s.gameplay!.family,
        }),
      );
    }
    assert.equal(signatures.size, 300);
  });
  if (category.id !== "workday")
    test(`${category.name}: domain operations persist through engine`, () => {
      for (const seed of [0, 7, 23, 88, 299]) {
        const { s, world } = workSession(category.id, seed);
        const before = structuredClone(world);
        const actions = operate(s, world);
        let state = before;
        for (const gameAction of actions)
          state = applyCommand(state, {
            type: "game-action",
            id: s.id,
            gameAction,
          });
        const result = state.scenarios.find((item) => item.id === s.id)!;
        assert.ok(result.gameplay?.completed, category.id);
        assert.ok(result.result?.passed, result.result?.feedback.join("; "));
        assert.ok(actions.length >= 3);
      }
    });
}
test("anti-clone registry: 30 distinct controllers, interfaces, state machines and action sets", () => {
  assert.equal(minigameManifest.length, 30);
  for (const field of [
    "uniqueInteractionType",
    "primaryUIComponent",
    "stateMachineType",
    "evaluatorType",
  ] as const)
    assert.equal(
      new Set(minigameManifest.map((m) => m[field])).size,
      30,
      field,
    );
  assert.equal(
    new Set(minigameManifest.map((m) => [...m.actionTypes].sort().join(",")))
      .size,
    30,
  );
  assert.equal(new Set(Object.values(controllers).map((c) => c.act)).size, 30);
  assert.equal(
    new Set(Object.values(controllers).map((c) => c.inspect)).size,
    30,
  );
});
test("phone: answer, hold, resume, verify and transfer", () => {
  const { s, world } = workSession("phone");
  assert.deepEqual(controllers.phone.available(s), ["answer"]);
  const run = (key: string, value?: string) =>
    performGameAction(s, world, { key, value });
  assert.throws(() => run("transfer", "Finance"));
  run("answer");
  run("hold");
  assert.equal(s.gameplay!.phase, "holding");
  assert.throws(() => run("open-record"));
  run("resume");
  run("ask-name");
  run("ask-account");
  run("open-record");
  run("transfer", "Finance");
  assert.ok(world.tasks.some((t) => t.title.includes("Transferred call")));
});
test("inventory: receiving, damage and bin transfer conserve physical quantity", () => {
  const { s, world } = workSession("inventory");
  const g = s.gameplay!,
    before = Number(g.values.physical);
  performGameAction(s, world, { key: "receive-stock", value: 12 });
  performGameAction(s, world, { key: "mark-damaged", value: 3 });
  performGameAction(s, world, {
    key: "transfer-stock",
    value: 4,
    option: "Overflow",
  });
  assert.equal(g.values.physical, before + 9);
  assert.equal(
    Number(g.values.main) + Number(g.values.overflow),
    g.values.physical,
  );
  assert.equal(g.values.quarantined, 3);
});
test("calendar: detect conflict then move appointment", () => {
  const { s, world } = workSession("scheduling");
  performGameAction(s, world, { key: "select-slot", value: 540 });
  performGameAction(s, world, { key: "check-conflicts" });
  assert.ok(Number(s.gameplay!.values.conflicts) > 0);
  performGameAction(s, world, {
    key: "reschedule-event",
    target: s.gameplay!.records[0].id,
    value: 990,
  });
  assert.equal(s.gameplay!.records[0].amount, 990);
  assert.equal(s.gameplay!.values.conflicts, "Unchecked");
});
test("project: dependency prevents completion and cycles", () => {
  const { s, world } = workSession("project-management");
  const rows = s.gameplay!.records;
  performGameAction(s, world, {
    key: "add-dependency",
    target: rows[1].id,
    value: rows[0].id,
  });
  assert.throws(
    () =>
      performGameAction(s, world, {
        key: "add-dependency",
        target: rows[0].id,
        value: rows[1].id,
      }),
    /cycle/,
  );
  performGameAction(s, world, {
    key: "assign-task",
    target: rows[1].id,
    value: "Sarah Chen",
  });
  performGameAction(s, world, { key: "complete-task", target: rows[1].id });
  assert.notEqual(rows[1].status, "done");
});
test("finance: overbilling fails approval and hold preserves cash", () => {
  const { s, world } = workSession("finance", 1);
  const row = s.gameplay!.records[0],
    cash = world.company.cash;
  assert.notEqual(row.amount, row.expected);
  for (const a of [
    { key: "match-po" },
    { key: "cost-center", value: "Operations" },
    { key: "approve-payment" },
  ])
    performGameAction(s, world, a);
  assert.notEqual(row.status, "approved");
  performGameAction(s, world, { key: "hold-payment" });
  assert.equal(row.status, "held");
  assert.equal(world.company.cash, cash);
});
test("spreadsheet: execute formula, sort rows and calculate percentage formulas", () => {
  const { s, world } = workSession("spreadsheet");
  const cells = structuredClone(s.draft.cells);
  cells[7][1] = "=SUM(B2:B7)";
  performGameAction(s, world, { key: "edit-grid", cells });
  assert.equal(
    calculateCell(cells, 7, 1),
    cells.slice(1, 7).reduce((n, r) => n + Number(r[1]), 0),
  );
  performGameAction(s, world, { key: "sort-sheet" });
  assert.ok(Number(s.draft.cells[1][1]) >= Number(s.draft.cells[6][1]));
  performGameAction(s, world, { key: "format-percent" });
  assert.ok(s.draft.cells[1][3].startsWith("="));
});
test("full workday: child applications, linked tasks and manager review", () => {
  let state = applyCommand(initialState(), {
    type: "launch",
    category: "workday",
    seed: 88,
  });
  const day = state.scenarios[0];
  state = applyCommand(state, {
    type: "game-action",
    id: day.id,
    gameAction: { key: "launch-shift" },
  });
  const jobs = state.tasks.filter((t) => t.id.startsWith(`shift-${day.seed}-`));
  assert.ok(jobs.length >= 6);
  for (const job of jobs) {
    const child = state.scenarios.find((s) => s.id === job.scenarioId)!;
    const actions = operate(structuredClone(child), structuredClone(state));
    for (const gameAction of actions)
      state = applyCommand(state, {
        type: "game-action",
        id: child.id,
        gameAction,
      });
  }
  while (state.minute < 1020)
    state = applyCommand(state, {
      type: "game-action",
      id: day.id,
      gameAction: { key: "advance-shift" },
    });
  for (const key of ["manager-checkin", "review-shift", "close-shift"])
    state = applyCommand(state, {
      type: "game-action",
      id: day.id,
      gameAction: { key },
    });
  assert.ok(state.scenarios.find((s) => s.id === day.id)?.result?.passed);
  assert.ok(jobs.every((j) => state.tasks.find((t) => t.id === j.id)?.done));
});

test("compliance: privacy release requires the correct policy, owner, consent and redaction", () => {
  const { s, world } = workSession("compliance", 0);
  const run = (key: string, value?: string) =>
    performGameAction(s, world, { key, value });
  run("select-policy", "p-purchase");
  run("verify-control", "Identity verified");
  run("verify-control", "Authority verified");
  run("route-authority", "People");
  assert.throws(
    () => run("authorize-request"),
    /Applicable internal procedure/,
  );
  run("select-policy", "p-privacy");
  assert.throws(() => run("authorize-request"), /Consent recorded/);
  run("collect-consent");
  run("redact-record");
  run("authorize-request");
  assert.equal(s.gameplay!.phase, "authorized");
});

test("procurement: split order preserves total quantities and charges weighted supplier prices", () => {
  const { s, world } = workSession("procurement", 88);
  const [first, second] = s.data.quotes;
  const quantity = Number(s.data.facts.Quantity),
    cash = world.company.cash;
  for (const quote of [first, second]) {
    quote.quality = 98;
    quote.days = 1;
  }
  first.unit = 10;
  second.unit = 12;
  s.data.facts["Purchase budget"] = quantity * 20;
  const run = (key: string, value?: string | number, target?: string) =>
    performGameAction(s, world, { key, value, target });
  run("select-vendor", undefined, first.id);
  run("split-order");
  run("select-secondary", second.id);
  run("allocate-order", 1);
  run("request-approval");
  run("issue-order");
  assert.equal(world.company.cash, cash - 10 - 12 * (quantity - 1));
  assert.ok(
    world.tasks.some((t) => t.title === `Receive 1 units from ${first.vendor}`),
  );
  assert.ok(
    world.tasks.some(
      (t) => t.title === `Receive ${quantity - 1} units from ${second.vendor}`,
    ),
  );
});

test("saved workplace migration supplies current controls and preserves work history", () => {
  const { s, world } = workSession("compliance", 0);
  const g = s.gameplay!;
  g.version = 2;
  delete g.values.requiredPolicy;
  delete g.values.requiredAuthority;
  g.history.push({
    action: "verify-control",
    detail: "Identity verified",
    at: 510,
  });
  g.evidence.push("Identity verified");
  s.draft.fields.notes = "Retain this employee note";
  const company = structuredClone(world.company);
  migrateState(world);
  assert.equal(s.gameplay!.values.requiredPolicy, "p-privacy");
  assert.equal(s.gameplay!.history.length, 1);
  assert.deepEqual(s.gameplay!.evidence, ["Identity verified"]);
  assert.equal(s.draft.fields.notes, "Retain this employee note");
  assert.deepEqual(world.company, company);
  const migrated = structuredClone(world);
  migrateState(world);
  assert.deepEqual(world, migrated);
});
