import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { renderToStaticMarkup } from "react-dom/server";
import { generateStaticParams } from "../src/app/sim/[category]/page";
import { WorkplaceProvider } from "../src/components/provider";
import { db } from "../src/database/client";
import { commit, readState } from "../src/database/store";
import { minigameManifest } from "../src/minigames/manifest";
import { controllers } from "../src/minigames/runtime";
import type { GameAction } from "../src/minigames/runtime/types";
import { gameComponents } from "../src/minigames/ui/registry";
import { initialState } from "../src/simulation/generators/company";
import {
  generateScenario,
  validateScenario,
} from "../src/simulation/generators/scenario";
import { operate } from "../src/tests/fixtures";

async function audit() {
  const registry = [];
  assert.equal(minigameManifest.length, 30);
  for (const field of [
    "primaryUIComponent",
    "uniqueInteractionType",
    "stateMachineType",
    "evaluatorType",
  ] as const)
    assert.equal(
      new Set(minigameManifest.map((m) => m[field])).size,
      30,
      field,
    );
  assert.equal(new Set(Object.values(controllers).map((c) => c.act)).size, 30);
  assert.equal(
    new Set(minigameManifest.map((m) => [...m.actionTypes].sort().join(",")))
      .size,
    30,
  );
  for (const entry of minigameManifest) {
    const world = initialState(),
      s = generateScenario(entry.id, 1, 88, world.company);
    world.scenarios = [s];
    const Component = gameComponents[entry.id];
    const html = renderToStaticMarkup(
      <WorkplaceProvider initial={world}>
        <Component
          scenario={s}
          state={world}
          company={world.company}
          act={() => {}}
          busy={false}
        />
      </WorkplaceProvider>,
    );
    const source = await readFile(
        `src/minigames/${entry.id}/workspace.tsx`,
        "utf8",
      ),
      controller = await readFile(
        `src/minigames/${entry.id}/controller.ts`,
        "utf8",
      );
    const variants = new Set<string>();
    for (let seed = 0; seed < 300; seed++) {
      const generated = generateScenario(entry.id, (seed % 6) + 1, seed);
      assert.ok(validateScenario(generated), `${entry.id}/${seed}`);
      variants.add(JSON.stringify(generated.data));
    }
    const key = `audit-${process.pid}-${entry.id}`;
    let persistence = false,
      evaluator = false;
    const exercisedActions: string[] = [];
    try {
      let saved = await readState(key);
      saved = await commit(
        { type: "launch", category: entry.id, seed: 88 },
        saved.revision,
        key,
      );
      const workId = saved.state.scenarios[0].id;
      const run = async (id: string, gameAction: GameAction) => {
        saved = await commit(
          { type: "game-action", id, gameAction },
          saved.revision,
          key,
        );
        exercisedActions.push(gameAction.key);
      };
      const work = saved.state.scenarios.find((v) => v.id === workId)!;
      const initiallyIncomplete = controllers[entry.id]
        .inspect(work, saved.state)
        .some((c) => !c.ok);
      if (entry.id === "workday") {
        await run(workId, { key: "launch-shift" });
        const jobs = saved.state.tasks.filter((t) =>
          t.id.startsWith(`shift-${work.seed}-`),
        );
        for (const job of jobs) {
          const child = saved.state.scenarios.find(
            (v) => v.id === job.scenarioId,
          )!;
          for (const action of operate(
            structuredClone(child),
            structuredClone(saved.state),
          ))
            await run(child.id, action);
        }
        while (saved.state.minute < 1020)
          await run(workId, { key: "advance-shift" });
        for (const action of ["manager-checkin", "review-shift", "close-shift"])
          await run(workId, { key: action });
      } else
        for (const action of operate(
          structuredClone(work),
          structuredClone(saved.state),
        ))
          await run(workId, action);
      const result = saved.state.scenarios.find((v) => v.id === workId)!;
      evaluator =
        initiallyIncomplete &&
        Boolean(result.result?.passed) &&
        controllers[entry.id].inspect(result, saved.state).every((c) => c.ok);
      persistence =
        JSON.stringify(await readState(key)) === JSON.stringify(saved);
    } finally {
      await db.workplace.deleteMany({ where: { id: key } });
    }
    const row = {
      ...entry,
      route: generateStaticParams().some((v) => v.category === entry.id),
      UI:
        html.includes(`data-system="${entry.primaryUIComponent}"`) &&
        source.includes(`function ${entry.primaryUIComponent}`),
      scenarioGenerator: variants.size === 300,
      interactionHandler:
        /switch\s*\(a.key\)/.test(controller) && exercisedActions.length >= 3,
      evaluator,
      persistence,
      tests: evaluator && persistence && exercisedActions.length >= 3,
      exercisedActions: [...new Set(exercisedActions)],
      validatedScenarios: 300,
    };
    assert.ok(
      !source.includes("GenericScenario") && !source.includes("SubmitAnswer"),
    );
    for (const [field, value] of Object.entries(row))
      if (typeof value === "boolean") assert.ok(value, `${entry.id}/${field}`);
    registry.push(row);
  }
  await mkdir("audit", { recursive: true });
  await writeFile(
    "audit/feature-registry.json",
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        totalMinigames: 30,
        totalScenarios: 9000,
        features: registry,
      },
      null,
      2,
    ),
  );
  console.log(
    "30 distinct controllers and interfaces; 9,000 valid seeded scenarios; 30 completed workflows verified through SQLite.",
  );
}
audit()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
