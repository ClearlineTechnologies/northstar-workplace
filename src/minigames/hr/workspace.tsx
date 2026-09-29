"use client";
import type { GameProps } from "../runtime/types";
import { Action, Completion, Pane, Stat, Trace } from "../ui/common";
export function PeopleDesk(p: GameProps) {
  const g = p.scenario.gameplay!;
  return (
    <div data-system="PeopleDesk" className="people-desk">
      <header>
        <div className="avatar">
          {String(p.scenario.data.facts.Employee).slice(0, 2)}
        </div>
        <div>
          <h2>{String(p.scenario.data.facts.Employee)}</h2>
          <span>Restricted personnel record · {g.familyName}</span>
        </div>
        <Action p={p} id="open-personnel">
          Open personnel file
        </Action>
      </header>
      <div className="hr-panels">
        <Pane title="Identity & onboarding">
          <Action p={p} id="verify-identity">
            Verify employee identity
          </Action>
          <Action p={p} id="verify-form">
            Check signed forms
          </Action>
          <Action p={p} id="schedule-training" value={900}>
            Schedule training at 15:00
          </Action>
          <Action p={p} id="assign-training">
            Assign required training
          </Action>
          <Action p={p} id="approve-access">
            Authorize system access
          </Action>
          <p>
            Identity: {g.values.identity || "Unchecked"}
            <br />
            Training: {g.values.training || "Not assigned"}
            <br />
            Access: {g.values.access || "Restricted"}
          </p>
        </Pane>
        <Pane title="Leave ledger">
          <Stat
            label="Entitlement balance"
            value={`${p.scenario.data.facts["Leave balance"]} days`}
          />
          <Stat
            label="Requested leave"
            value={`${p.scenario.data.facts["Requested days"]} days`}
          />
          <Action p={p} id="check-balance">
            Check leave balance
          </Action>
          <div className="control-row">
            <Action p={p} id="approve-leave">
              Approve within entitlement
            </Action>
            <Action p={p} id="decline-leave">
              Decline request
            </Action>
          </div>
        </Pane>
        <Pane title="Authorization trail">
          <p>
            {g.values.approval || "Manager signature required before filing."}
          </p>
          <Action p={p} id="manager-approval">
            Obtain manager approval
          </Action>
          <Completion
            p={p}
            id="file-hr-record"
            label="File authorized HR record"
          />
        </Pane>
      </div>
      <Trace p={p} />
    </div>
  );
}
