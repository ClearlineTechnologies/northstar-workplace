import assert from "node:assert/strict";
import test from "node:test";
import { db } from "../database/client";
import { commit, readState } from "../database/store";
import { categories } from "../minigames/catalog";
import { operate } from "./fixtures";
test("SQLite round trips domain work and artifacts across all 30 systems", async () => {
  const id = "persistence-" + Date.now();
  try {
    let snapshot = await readState(id);
    for (const c of categories) {
      snapshot = await commit(
        { type: "launch", category: c.id, seed: 88 },
        snapshot.revision,
        id,
      );
      const s = snapshot.state.scenarios[0];
      const actions =
        c.id === "workday"
          ? [{ key: "launch-shift" }]
          : operate(structuredClone(s), structuredClone(snapshot.state));
      for (const gameAction of actions)
        snapshot = await commit(
          { type: "game-action", id: s.id, gameAction },
          snapshot.revision,
          id,
        );
      assert.deepEqual(await readState(id), snapshot, c.id);
    }
    assert.equal(snapshot.state.company.manager, "Sarah Chen");
    await assert.rejects(
      () => commit({ type: "tick", minutes: 5 }, 0, id),
      /another tab/,
    );
  } finally {
    await db.workplace.deleteMany({ where: { id } });
    await db.$disconnect();
  }
});
