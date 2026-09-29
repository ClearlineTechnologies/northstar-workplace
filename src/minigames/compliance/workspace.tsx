"use client";
import { useState } from "react";
import type { GameProps } from "../runtime/types";
import { Action, Completion, Select, Trace } from "../ui/common";
export function ProcedureRunner(p: GameProps) {
  const g = p.scenario.gameplay!;
  const [policy, setPolicy] = useState(p.company.policies[0].id),
    [authority, setAuthority] = useState("Finance");
  const source = p.company.policies.find((v) => v.id === policy)!;
  return (
    <div data-system="ProcedureRunner" className="procedure-runner">
      <aside className="policy-reference">
        <h3>Controlled policy library</h3>
        <select
          aria-label="Current policy"
          value={policy}
          onChange={(e) => setPolicy(e.target.value)}
        >
          {p.company.policies.map((v) => (
            <option value={v.id} key={v.id}>
              {v.title}
            </option>
          ))}
        </select>
        <p>{source.body}</p>
        <Action p={p} id="select-policy" value={policy}>
          Apply this procedure
        </Action>
      </aside>
      <section>
        <h2>Procedure execution record</h2>
        <p className="notice">{g.values.request}</p>
        <div className="procedure-flow">
          <div>
            <b>1</b>
            <h3>Verify</h3>
            <Action p={p} id="verify-control" value="Identity verified">
              Verify requester identity
            </Action>
            <Action p={p} id="verify-control" value="Authority verified">
              Verify authorization threshold
            </Action>
          </div>
          <div>
            <b>2</b>
            <h3>Protect</h3>
            <Action p={p} id="collect-consent">
              Collect informed consent
            </Action>
            <Action p={p} id="redact-record">
              Redact personal identifiers
            </Action>
          </div>
          <div>
            <b>3</b>
            <h3>Exception path</h3>
            <Action p={p} id="record-exception">
              Record policy exception
            </Action>
            <Action p={p} id="approve-exception">
              Request exception approval
            </Action>
          </div>
          <div>
            <b>4</b>
            <h3>Authorize</h3>
            <Select
              label="Authorizing department"
              value={authority}
              options={p.company.departments}
              onChange={setAuthority}
            />
            <Action p={p} id="route-authority" value={authority}>
              Route to authorized owner
            </Action>
          </div>
        </div>
        <div className="evidence-strip">
          {g.evidence.map((v, i) => (
            <span key={i}>✓ {v}</span>
          ))}
        </div>
        <Completion
          p={p}
          id="authorize-request"
          label="Authorize documented procedure"
        />
        <Trace p={p} />
      </section>
    </div>
  );
}
