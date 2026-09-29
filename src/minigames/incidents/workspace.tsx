"use client";
import { useState } from "react";
import type { GameProps } from "../runtime/types";
import { Action, Completion, Pane, Select, Stat, Trace } from "../ui/common";
export function IncidentCommand(p: GameProps) {
  const g = p.scenario.gameplay!;
  const [severity, setSeverity] = useState("Critical"),
    [owner, setOwner] = useState(p.company.employees[5].name);
  return (
    <div data-system="IncidentCommand" className="incident-command">
      <header className="incident-banner">
        <strong>INCIDENT {String(p.scenario.data.facts.Reference)}</strong>
        <h2>{String(p.scenario.data.facts["Incident type"])}</h2>
        <span>{g.phase.toUpperCase()}</span>
      </header>
      <div className="incident-stages">
        {["reported", "assessed", "contained", "recovering", "verified"].map(
          (phase) => (
            <div className={g.phase === phase ? "current" : ""} key={phase}>
              {phase}
            </div>
          ),
        )}
      </div>
      <div className="incident-panels">
        <Pane title="Assess impact">
          <Stat
            label="Affected customers"
            value={
              g.values.affected ??
              String(p.scenario.data.facts["Affected customers"])
            }
          />
          <Select
            label="Incident severity"
            value={severity}
            options={["Critical", "High", "Standard"]}
            onChange={setSeverity}
          />
          <Action p={p} id="declare-severity" value={severity}>
            Declare severity
          </Action>
          <Select
            label="Incident commander"
            value={owner}
            options={p.company.employees.map((e) => e.name)}
            onChange={setOwner}
          />
          <Action p={p} id="assign-responder" value={owner}>
            Assign responder
          </Action>
        </Pane>
        <Pane title="Contain & restore">
          <Action p={p} id="contain-incident">
            Contain immediate impact
          </Action>
          <Action p={p} id="rollback-change">
            Roll back last change
          </Action>
          <Action p={p} id="restore-service">
            Restore service
          </Action>
          <Action p={p} id="verify-recovery">
            Run recovery verification
          </Action>
        </Pane>
        <Pane title="Stakeholder communications">
          <Action p={p} id="notify-stakeholders">
            Send initial incident notice
          </Action>
          <Action p={p} id="send-status">
            Broadcast current status
          </Action>
          <p>Owner: {g.values.owner || "Unassigned"}</p>
          <Completion
            p={p}
            id="close-incident"
            label="Close verified incident"
          />
        </Pane>
      </div>
      <Trace p={p} />
    </div>
  );
}
