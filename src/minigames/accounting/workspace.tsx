"use client";
import { useState } from "react";
import type { GameProps } from "../runtime/types";
import { Action, Completion, NumberControl, Select, Trace } from "../ui/common";
export function LedgerWorkbench(p: GameProps) {
  const g = p.scenario.gameplay!,
    row = g.records.find((r) => r.id === g.values.selected) || g.records[0];
  const accounts = [
    "Cash",
    "Accounts receivable",
    "Inventory",
    "Office expense",
    "Revenue",
    "Accounts payable",
  ];
  const [debit, setDebit] = useState("Accounts receivable"),
    [credit, setCredit] = useState("Revenue"),
    [value, setValue] = useState(row.amount);
  return (
    <div data-system="LedgerWorkbench" className="ledger-workbench">
      <h2>General journal & bank reconciliation</h2>
      <div className="ledger-columns">
        <aside>
          <h3>Transaction feed</h3>
          {g.records.map((r) => (
            <button
              key={r.id}
              className={r.id === row.id ? "selected" : ""}
              onClick={() => {
                setValue(r.amount);
                p.act({ key: "select-transaction", target: r.id });
              }}
            >
              <strong>{r.label}</strong>
              <span>
                ${r.expected} · {r.status}
              </span>
            </button>
          ))}
        </aside>
        <section>
          <div className="journal-entry">
            <h3>
              {row.label} · {row.id}
            </h3>
            <div className="debit-credit">
              <div>
                <Select
                  label="Debit account"
                  value={debit}
                  options={accounts}
                  onChange={setDebit}
                />
                <Action p={p} id="set-debit" value={debit}>
                  Set debit
                </Action>
                <p>Dr {g.values.debit || "Unclassified"}</p>
              </div>
              <div>
                <Select
                  label="Credit account"
                  value={credit}
                  options={accounts}
                  onChange={setCredit}
                />
                <Action p={p} id="set-credit" value={credit}>
                  Set credit
                </Action>
                <p>Cr {g.values.credit || "Unclassified"}</p>
              </div>
            </div>
            <NumberControl
              label="Journal amount"
              value={value}
              onChange={setValue}
            />
            <Action p={p} id="set-amount" value={value}>
              Set equal debit / credit amount
            </Action>
            <Action p={p} id="post-journal">
              Post balanced journal
            </Action>
          </div>
          <div className="reconciliation-tools">
            <Action p={p} id="reclassify">
              Reclassify selected entry
            </Action>
            <Action p={p} id="mark-duplicate">
              Investigate duplicate
            </Action>
            <Action p={p} id="request-correction">
              Request remittance correction
            </Action>
            <Action p={p} id="investigate">
              Investigate unmatched deposit
            </Action>
            <Action p={p} id="match-bank">
              Match bank statement
            </Action>
          </div>
          <table>
            <thead>
              <tr>
                <th>Entry</th>
                <th>Classification</th>
                <th>Amount</th>
                <th>Bank status</th>
              </tr>
            </thead>
            <tbody>
              {g.records.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.owner}</td>
                  <td>${r.amount}</td>
                  <td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
      <Completion p={p} id="close-ledger" label="Close reconciled ledger" />
      <Trace p={p} />
    </div>
  );
}
