"use client";
import { useState } from "react";
import type { GameProps } from "../runtime/types";
import { Action, Completion, NumberControl, Stat, Trace } from "../ui/common";
export function OperationsControl(p: GameProps) {
  const g = p.scenario.gameplay!;
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  return (
    <div data-system="OperationsControl" className="operations-control">
      <header>
        <h2>Live service operations</h2>
        <div className="record-strip">
          <Stat label="Employees available" value={g.values.staff} />
          <Stat label="Units processed" value={g.values.processed || 0} />
          <Stat label="Intervals observed" value={g.values.tick || 0} />
        </div>
      </header>
      <div className="live-queues">
        {g.records.map((row) => (
          <section key={row.id}>
            <div className="queue-title">
              <h3>{row.label}</h3>
              <span>Priority {row.priority}</span>
            </div>
            <div className="queue-depth">
              <strong>{row.quantity}</strong>
              <span>waiting</span>
              <div className="queue-units">
                {Array.from({ length: Math.min(20, row.quantity) }, (_, i) => (
                  <i key={i} />
                ))}
              </div>
            </div>
            <Stat
              label="Throughput per interval"
              value={`${row.amount * row.capacity} units`}
            />
            <NumberControl
              label={`Staff for ${row.label}`}
              value={allocations[row.id] ?? row.amount}
              onChange={(value) =>
                setAllocations({ ...allocations, [row.id]: value })
              }
              max={12}
            />
            <Action
              p={p}
              id="allocate-staff"
              target={row.id}
              value={allocations[row.id] ?? row.amount}
            >
              Allocate employees
            </Action>
          </section>
        ))}
      </div>
      <div className="ops-controlbar">
        <Action p={p} id="process-queues">
          ▶ Process next service interval
        </Action>
        <Action p={p} id="reroute-demand">
          Reroute ten cases
        </Action>
        <Action p={p} id="triage-queue">
          Prioritize customer queue
        </Action>
        <Action p={p} id="cross-train">
          Cross-train staff ($50)
        </Action>
        <Action p={p} id="overtime">
          Authorize overtime ($80)
        </Action>
        <Action p={p} id="service-recovery">
          Contact affected customers
        </Action>
      </div>
      <Completion
        p={p}
        id="close-operation"
        label="Close operations interval report"
      />
      <Trace p={p} />
    </div>
  );
}
