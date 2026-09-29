import { applyCommand } from "../simulation/engine";
import { initialState } from "../simulation/generators/company";
import type { Command, State } from "../simulation/types";
import { db } from "./client";
import { migrateState } from "./migrate";
export async function readState(id = "local") {
  const row = await db.workplace.upsert({
    where: { id },
    update: {},
    create: { id, state: JSON.stringify(initialState()) },
  });
  const state = migrateState(JSON.parse(row.state) as State);
  return { state, revision: row.revision };
}
export async function commit(command: Command, revision: number, id = "local") {
  return db.$transaction(
    async (tx) => {
      const row = await tx.workplace.findUniqueOrThrow({ where: { id } });
      if (row.revision !== revision)
        throw Error("Workspace changed in another tab. Reload and try again.");
      const state = applyCommand(
        migrateState(JSON.parse(row.state) as State),
        command,
      );
      const changed = await tx.workplace.updateMany({
        where: { id, revision },
        data: { state: JSON.stringify(state), revision: { increment: 1 } },
      });
      if (changed.count !== 1)
        throw Error("Concurrent update; reload and retry");
      await tx.actionLog.create({
        data: { workplaceId: id, command: JSON.stringify(command) },
      });
      return { state, revision: revision + 1 };
    },
    { timeout: 15000 },
  );
}
