"use client";
import { useState } from "react";
import type { GameProps } from "../runtime/types";
import {
  Action,
  Completion,
  NumberControl,
  Select,
  Stat,
  Trace,
} from "../ui/common";
export function DeliveryBoard(p: GameProps) {
  const g = p.scenario.gameplay!;
  const [selected, setSelected] = useState(g.records[0].id),
    [owner, setOwner] = useState(p.company.manager),
    [dependency, setDependency] = useState(g.records[0].id),
    [due, setDue] = useState(900);
  const row = g.records.find((r) => r.id === selected)!;
  return (
    <div data-system="DeliveryBoard" className="delivery-board">
      <header>
        <h2>{String(p.scenario.data.facts.Project)}</h2>
        <Stat
          label="Milestone progress"
          value={`${g.records.filter((r) => r.status === "done").length}/${g.records.length}`}
        />
      </header>
      <div className="kanban-board">
        {["backlog", "active", "blocked", "done"].map((column) => (
          <section
            key={column}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const target = e.dataTransfer.getData("text/plain");
              if (target)
                p.act({
                  key: column === "done" ? "complete-task" : "move-task",
                  target,
                  value: column,
                });
            }}
          >
            <h3>{column}</h3>
            {g.records
              .filter(
                (r) =>
                  (r.status === "pending" ? "backlog" : r.status) === column,
              )
              .map((r) => (
                <article
                  key={r.id}
                  draggable
                  onDragStart={(e) =>
                    e.dataTransfer.setData("text/plain", r.id)
                  }
                  className={selected === r.id ? "selected" : ""}
                  onClick={() => setSelected(r.id)}
                >
                  <strong>{r.label}</strong>
                  <small>{r.owner}</small>
                  <span>
                    {r.dependency
                      ? `Depends on ${r.dependency}`
                      : "No prerequisite"}
                  </span>
                  <Action p={p} id="move-task" target={r.id} value="active">
                    Start
                  </Action>
                  <Action p={p} id="complete-task" target={r.id}>
                    Complete
                  </Action>
                </article>
              ))}
          </section>
        ))}
      </div>
      <div className="task-inspector">
        <h3>Task inspector · {row.id}</h3>
        <label>
          Priority
          <select
            aria-label="Project priority"
            value={row.priority}
            onChange={(e) =>
              p.act({
                key: "set-task-priority",
                target: row.id,
                value: Number(e.target.value),
              })
            }
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <Select
          label="Task owner"
          value={owner}
          options={p.company.employees.map((e) => e.name)}
          onChange={setOwner}
        />
        <Action p={p} id="assign-task" target={row.id} value={owner}>
          Assign owner
        </Action>
        <Action p={p} id="reallocate-resource" target={row.id} value={owner}>
          Reallocate resource
        </Action>
        <Select
          label="Prerequisite"
          value={dependency}
          options={g.records.map((r) => r.id)}
          onChange={setDependency}
        />
        <Action p={p} id="add-dependency" target={row.id} value={dependency}>
          Add dependency
        </Action>
        <NumberControl
          label="Task deadline"
          value={due}
          onChange={setDue}
          min={540}
          max={1020}
        />
        <Action p={p} id="change-deadline" target={row.id} value={due}>
          Change deadline
        </Action>
        <Action p={p} id="escalate-blocker" target={row.id}>
          Escalate blocker
        </Action>
      </div>
      <Completion
        p={p}
        id="release-milestone"
        label="Release completed milestone"
      />
      <Trace p={p} />
    </div>
  );
}
