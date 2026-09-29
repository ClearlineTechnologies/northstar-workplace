"use client";
import type { GameProps } from "../runtime/types";
import { Action, Completion, Stat, Trace } from "../ui/common";
export function SourcingDesk(p: GameProps) {
  const g = p.scenario.gameplay!,
    s = p.scenario;
  return (
    <div data-system="SourcingDesk" className="sourcing-desk">
      <header>
        <h2>Supplier sourcing & purchase order</h2>
        <div className="record-strip">
          <Stat label="Required units" value={String(s.data.facts.Quantity)} />
          <Stat label="Budget" value={`$${s.data.facts["Purchase budget"]}`} />
          <Stat
            label="Delivery limit"
            value={`${s.data.facts["Required delivery days"]} days`}
          />
        </div>
      </header>
      <div className="sourcing-toolbar">
        <Action p={p} id="compare-cost">
          Compare delivered cost
        </Action>
        <Action p={p} id="compare-delivery">
          Compare delivery & quality
        </Action>
        <Action p={p} id="split-order">
          Split across suppliers
        </Action>
        <Action p={p} id="cancel-purchase">
          Cancel withdrawn requisition
        </Action>
      </div>
      <table className="vendor-comparison">
        <thead>
          <tr>
            <th>Supplier</th>
            <th>Unit price</th>
            <th>Total</th>
            <th>Delivery</th>
            <th>Quality</th>
            <th>Shortlist actions</th>
          </tr>
        </thead>
        <tbody>
          {[...s.data.quotes]
            .sort((a, b) =>
              g.values.comparison === "Delivered cost"
                ? a.unit - b.unit
                : g.values.comparison === "Delivery and quality"
                  ? a.days - b.days || b.quality - a.quality
                  : 0,
            )
            .map((q) => (
              <tr
                key={q.id}
                className={g.values.vendor === q.id ? "selected-row" : ""}
              >
                <td>
                  <strong>{q.vendor}</strong>
                  {g.flags.includes("rejected-" + q.id) && (
                    <small>Rejected</small>
                  )}
                </td>
                <td>${q.unit}</td>
                <td>${(q.unit * Number(s.data.facts.Quantity)).toFixed(2)}</td>
                <td>{q.days} days</td>
                <td>{q.quality}/100</td>
                <td>
                  <Action p={p} id="inspect-quote" target={q.id}>
                    Inspect
                  </Action>
                  <Action p={p} id="revise-quote" target={q.id}>
                    Request revision
                  </Action>
                  <Action p={p} id="reject-quote" target={q.id}>
                    Reject
                  </Action>
                  <Action p={p} id="select-vendor" target={q.id}>
                    Select supplier
                  </Action>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      <div className="po-summary">
        <h3>Purchase authorization</h3>
        <p>Comparison: {g.values.comparison || "Inspect quotes to begin"}</p>
        {g.values.split && (
          <div>
            <label>
              Second supplier
              <select
                aria-label="Second supplier"
                value={String(g.values.secondary || "")}
                onChange={(e) =>
                  p.act({ key: "select-secondary", value: e.target.value })
                }
              >
                {s.data.quotes
                  .filter((q) => q.id !== g.values.vendor)
                  .map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.vendor}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Primary supplier units
              <input
                aria-label="Primary supplier units"
                type="number"
                min={1}
                max={Number(s.data.facts.Quantity) - 1}
                value={Number(g.values.primaryUnits || 0)}
                onChange={(e) =>
                  p.act({
                    key: "allocate-order",
                    value: Number(e.target.value),
                  })
                }
              />
            </label>
            <span>
              Secondary units:{" "}
              {Number(s.data.facts.Quantity) -
                Number(g.values.primaryUnits || 0)}
            </span>
          </div>
        )}
        <p>
          Selected supplier:{" "}
          {s.data.quotes.find((q) => q.id === g.values.vendor)?.vendor ||
            "None"}{" "}
          · {g.values.split || "Single supplier"}
        </p>
        <p>
          {g.values.cancelled ||
            g.values.approval ||
            "Finance approval required."}
        </p>
        <Action p={p} id="request-approval">
          Submit purchase for approval
        </Action>
        <Completion
          p={p}
          id="issue-order"
          label={
            g.values.cancelled
              ? "Close cancelled requisition"
              : "Issue purchase order"
          }
        />
      </div>
      <Trace p={p} />
    </div>
  );
}
