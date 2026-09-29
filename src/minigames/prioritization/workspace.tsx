"use client";
import type { GameProps } from "../runtime/types";
import { Action, Completion, Pane, Stat, Trace } from "../ui/common";
export function PriorityQueue(p: GameProps) {
  const g = p.scenario.gameplay!;
  return (
    <div data-system="PriorityQueue" className="priority-dispatch">
      <header>
        <h2>Dispatch the work queue</h2>
        <p>
          Protect dependencies and dispatch the highest impact available work
          first.
        </p>
      </header>
      <div className="priority-columns">
        <section>
          <h3>Execution order</h3>
          {g.records.map((r, i) => (
            <article className={`priority-ticket ${r.status}`} key={r.id}>
              <b>{i + 1}</b>
              <div>
                <strong>{r.label}</strong>
                <small>
                  Impact {r.priority}/5 ·{" "}
                  {r.dependency ? "Requires " + r.dependency : "Ready"} ·{" "}
                  {r.status}
                </small>
              </div>
              <div className="ticket-actions">
                <Action p={p} id="move-priority" target={r.id} value={-1}>
                  ↑
                </Action>
                <Action p={p} id="move-priority" target={r.id} value={1}>
                  ↓
                </Action>
                <Action p={p} id="inspect-dependency" target={r.id}>
                  Check dependency
                </Action>
                <Action p={p} id="mark-urgent" target={r.id}>
                  Mark urgent
                </Action>
                <Action p={p} id="defer-task" target={r.id}>
                  Defer
                </Action>
                <Action
                  p={p}
                  id="delegate-task"
                  target={r.id}
                  value={p.company.employees[1].name}
                >
                  Delegate
                </Action>
              </div>
            </article>
          ))}
        </section>
        <Pane title="Capacity guardrail">
          <Stat
            label="Delegated"
            value={g.records.filter((r) => r.status === "delegated").length}
          />
          <Stat
            label="Deferred"
            value={g.records.filter((r) => r.status === "deferred").length}
          />
          <Action p={p} id="reserve-buffer" value={20}>
            Reserve 20 minutes for interruptions
          </Action>
          <p>Buffer: {g.values.buffer || 0} minutes</p>
          <p>Dependency inspection: {g.values.dependency || "Select a task"}</p>
          <Completion
            p={p}
            id="dispatch-queue"
            label="Dispatch prioritized queue"
          />
        </Pane>
      </div>
      <Trace p={p} />
    </div>
  );
}
