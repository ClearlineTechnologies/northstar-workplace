"use client";
import { useState } from "react";
import type { GameProps } from "../runtime/types";
import {
  Action,
  Completion,
  Money,
  NumberControl,
  Pane,
  Stat,
  Trace,
} from "../ui/common";
export function ServiceCaseDesk(p: GameProps) {
  const g = p.scenario.gameplay!;
  const [refund, setRefund] = useState(50);
  return (
    <div data-system="ServiceCaseDesk" className="service-desk">
      <header className="case-header">
        <h2>Case {String(p.scenario.data.facts.Reference)}</h2>
        <span className="case-sentiment">
          {g.values.sentiment || "Customer waiting"}
        </span>
      </header>
      <div className="service-columns">
        <Pane title="Customer & case">
          <h3>{p.scenario.participants[0]}</h3>
          <p>{g.familyName}</p>
          <Stat
            label="Claim value"
            value={
              <Money value={Number(p.scenario.data.facts["Refund amount"])} />
            }
          />
          <p>
            Service authorization: up to $250. Higher refunds need escalation.
          </p>
          <Action p={p} id="open-case">
            Open support case
          </Action>
          <Action p={p} id="verify-customer">
            Verify customer
          </Action>
          <Action p={p} id="request-proof">
            Request proof of purchase
          </Action>
          <Action p={p} id="clarify-case">
            Clarify the issue
          </Action>
        </Pane>
        <Pane title="Remedy builder">
          <div className="remedy-grid">
            <Action p={p} id="refund">
              Full refund
            </Action>
            <Action p={p} id="replacement">
              Send replacement
            </Action>
            <Action p={p} id="escalate-case">
              Supervisor / Finance approval
            </Action>
            <Action p={p} id="schedule-callback">
              Schedule callback
            </Action>
          </div>
          <NumberControl
            label="Partial refund amount"
            value={refund}
            onChange={setRefund}
          />
          <Action p={p} id="partial-refund" value={refund}>
            Offer partial refund
          </Action>
          <div className="resolution-summary">
            Agreed remedy: {g.values.remedy || "No remedy agreed"}
          </div>
          <Action p={p} id="confirm-remedy">
            Confirm remedy with customer
          </Action>
          <Completion
            p={p}
            id="close-case"
            label="Close resolved support case"
          />
        </Pane>
      </div>
      <Trace p={p} />
    </div>
  );
}
