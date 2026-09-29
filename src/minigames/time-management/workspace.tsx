"use client";
import type { GameProps } from "../runtime/types";
import { Action, Completion, Trace } from "../ui/common";
export function FocusClock(p: GameProps) {
  const g = p.scenario.gameplay!;
  return (
    <div data-system="FocusClock" className="focus-clock">
      <section className="focus-dial">
        <span>FOCUS SESSION</span>
        <div className="clock-ring">
          <strong>{g.values.remaining}</strong>
          <small>minutes to complete</small>
        </div>
        <p>{g.phase.toUpperCase()}</p>
        <div className="stress-meter">
          <span>Workload strain {g.values.stress}/100</span>
          <i style={{ width: `${g.values.stress}%` }} />
        </div>
        <Action p={p} id="advance-focus">
          Work for 15 minutes
        </Action>
        <Action p={p} id="take-break">
          Take a 10-minute break
        </Action>
      </section>
      <section>
        <h2>Protect your time</h2>
        {g.values.interruption && (
          <div className="interruption-card">
            <h3>Incoming interruption</h3>
            <p>{g.values.interruption}</p>
            <Action p={p} id="interrupt-work">
              Interrupt current work & respond
            </Action>
            <Action p={p} id="ignore-interruption">
              Defer interruption until focus ends
            </Action>
          </div>
        )}
        <div className="focus-tasks">
          {g.records.map((row) => (
            <div key={row.id}>
              <strong>{row.label}</strong>
              <span>{row.status}</span>
              <Action p={p} id="work-now" target={row.id}>
                Work now
              </Action>
              <Action p={p} id="defer-work" target={row.id}>
                Defer
              </Action>
              <Action p={p} id="delegate-work" target={row.id}>
                Delegate
              </Action>
              <Action p={p} id="reschedule-work" target={row.id} value={960}>
                Reschedule to 16:00
              </Action>
            </div>
          ))}
        </div>
        <Action p={p} id="escalate-load">
          Escalate unrealistic workload
        </Action>
        <Completion
          p={p}
          id="finish-block"
          label="Finish completed focus block"
        />
        <Trace p={p} />
      </section>
    </div>
  );
}
