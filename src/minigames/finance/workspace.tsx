"use client";
import { useState } from "react";
import type { GameProps } from "../runtime/types";
import {
  Action,
  Completion,
  Money,
  Pane,
  Select,
  Stat,
  Trace,
} from "../ui/common";
export function FinanceDesk(p: GameProps) {
  const g = p.scenario.gameplay!,
    row = g.records.find((r) => r.id === g.values.selected) || g.records[0];
  const [center, setCenter] = useState("Operations");
  return (
    <div data-system="FinanceDesk" className="finance-desk">
      <div className="finance-ribbon">
        <h2>Payment control desk</h2>
        <Stat label="Cash available" value={<Money value={p.company.cash} />} />
        <Stat
          label="Awaiting disposition"
          value={
            g.records.filter((r) => !["approved", "held"].includes(r.status))
              .length
          }
        />
      </div>
      <div className="finance-columns">
        <section className="invoice-stack">
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Claim</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {g.records.map((r) => (
                <tr
                  className={r.id === row.id ? "selected-row" : ""}
                  key={r.id}
                  onClick={() => p.act({ key: "select-invoice", target: r.id })}
                >
                  <td>
                    <button>{r.label}</button>
                  </td>
                  <td>${r.amount}</td>
                  <td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <Pane title={`Invoice ${row.id}`}>
          <dl className="invoice-document">
            <div>
              <dt>Invoice claim</dt>
              <dd>${row.amount}</dd>
            </div>
            <div>
              <dt>Purchase order</dt>
              <dd>
                {g.evidence.includes(row.id)
                  ? `$${row.expected}`
                  : "Not matched"}
              </dd>
            </div>
            <div>
              <dt>Variance</dt>
              <dd>
                {g.evidence.includes(row.id)
                  ? `$${row.amount - row.expected}`
                  : "Unverified"}
              </dd>
            </div>
            <div>
              <dt>Cost center</dt>
              <dd>{row.owner}</dd>
            </div>
          </dl>
          <div className="control-row">
            <Action p={p} id="match-po">
              Match purchase order
            </Action>
            <Action p={p} id="request-documents">
              Request delivery receipt
            </Action>
            <Action p={p} id="recalculate">
              Recalculate line total
            </Action>
            <Action p={p} id="flag-variance">
              Flag discrepancy
            </Action>
          </div>
          <Select
            label="Cost center"
            value={center}
            options={p.company.departments}
            onChange={setCenter}
          />
          <Action p={p} id="cost-center" value={center}>
            Allocate invoice
          </Action>
          <div className="approval-workflow">
            <span>Match</span>→<span>Code</span>→<span>Authorize</span>→
            <span>Post</span>
          </div>
          <Action p={p} id="escalate-variance">
            Escalate for authorization
          </Action>
          <Action p={p} id="hold-payment">
            Hold payment
          </Action>
          <Action p={p} id="approve-payment">
            Approve selected invoice
          </Action>
        </Pane>
      </div>
      <Completion p={p} id="post-payment" label="Post approved payment batch" />
      <Trace p={p} />
    </div>
  );
}
