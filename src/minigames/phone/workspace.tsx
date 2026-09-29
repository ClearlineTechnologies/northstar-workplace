"use client";
import { useState } from "react";
import type { GameProps } from "../runtime/types";
import { Action, Completion, Pane, Select, Stat, Trace } from "../ui/common";
export function CallConsole(p: GameProps) {
  const g = p.scenario.gameplay!;
  const [department, setDepartment] = useState("Finance");
  return (
    <div data-system="CallConsole" className="call-console">
      <div className="phone-top">
        <span>● NORTHSTAR SWITCHBOARD</span>
        <b>LINE 01 · {g.phase.toUpperCase()}</b>
      </div>
      <div className="phone-layout">
        <section className="handset">
          <div className="handset-symbol">☎</div>
          <h2>{g.values.caller || "Incoming caller"}</h2>
          <p>
            {g.values.account
              ? "Identity established"
              : "Identity not yet established"}
          </p>
          <div className="phone-keypad">
            {"123456789*0#".split("").map((v) => (
              <span key={v}>{v}</span>
            ))}
          </div>
          <div className="call-buttons">
            <Action p={p} id="answer">
              Answer
            </Action>
            <Action p={p} id="hold">
              Hold line
            </Action>
            <Action p={p} id="resume">
              Resume
            </Action>
          </div>
          <Completion p={p} id="end-call" label="End call & file disposition" />
        </section>
        <div>
          <Pane title="Caller identification">
            <div className="control-row">
              <Action p={p} id="ask-name">
                Ask name & company
              </Action>
              <Action p={p} id="ask-account">
                Ask account number
              </Action>
              <Action p={p} id="ask-order">
                Ask order ID
              </Action>
              <Action p={p} id="ask-callback">
                Ask callback number
              </Action>
              <Action p={p} id="verify-security">
                Verify security
              </Action>
            </div>
          </Pane>
          <Pane title="Customer lookup">
            <div className="record-strip">
              <Stat label="Account" value={g.values.account || "Locked"} />
              <Stat
                label="Callback"
                value={g.values.callback || "Not collected"}
              />
              <Stat label="Order" value={g.values.record || "Locked"} />
            </div>
            <Action p={p} id="open-record">
              Open customer record
            </Action>
            <Action p={p} id="open-invoice">
              Open disputed invoice
            </Action>
            {g.values.invoice && <p>Invoice balance: ${g.values.invoice}</p>}
          </Pane>
          <Pane title="Handoff & resolution">
            <Select
              label="Transfer destination"
              value={department}
              options={["Finance", "Operations", "Technology", "Sales"]}
              onChange={setDepartment}
            />
            <div className="control-row">
              <Action p={p} id="transfer" value={department}>
                Transfer call
              </Action>
              <Action p={p} id="take-message">
                Take message
              </Action>
              <Action p={p} id="escalate">
                Bring in manager
              </Action>
              <Action p={p} id="callback">
                Schedule callback
              </Action>
              <Action p={p} id="resolve">
                Confirm resolution
              </Action>
            </div>
          </Pane>
          <Trace p={p} />
        </div>
      </div>
    </div>
  );
}
