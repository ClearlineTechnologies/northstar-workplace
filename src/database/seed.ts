import { db } from "./client";
import { readState } from "./store";
readState()
  .then((v) =>
    console.log(
      `Initialized ${v.state.company.name}; manager ${v.state.company.manager}.`,
    ),
  )
  .finally(() => db.$disconnect());
