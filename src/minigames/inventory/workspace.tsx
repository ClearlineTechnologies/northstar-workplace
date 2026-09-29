"use client";
import { useState } from "react";
import type { GameProps } from "../runtime/types";
import {
  Action,
  Completion,
  NumberControl,
  Pane,
  Select,
  Stat,
  Trace,
} from "../ui/common";
export function StockControl(p: GameProps) {
  const g = p.scenario.gameplay!;
  const [qty, setQty] = useState(5),
    [bin, setBin] = useState("Overflow");
  return (
    <div data-system="StockControl" className="stock-control">
      <header>
        <h2>Warehouse stock control</h2>
        <span>{String(p.scenario.data.facts.Product)}</span>
      </header>
      <div className="warehouse-stats">
        <Stat label="Usable ledger stock" value={g.values.stock} />
        <Stat
          label="Physical count"
          value={
            g.flags.includes("count-stock") ? g.values.physical : "Uncounted"
          }
        />
        <Stat label="Quarantined" value={g.values.quarantined || 0} />
        <Stat
          label="Reorder point"
          value={String(p.scenario.data.facts["Reorder point"])}
        />
      </div>
      <div className="warehouse-floor">
        {["Receiving", "Main rack", "Overflow", "Quarantine"].map((name) => (
          <div className={g.values.bin === name ? "selected" : ""} key={name}>
            <span>▦</span>
            <h3>{name}</h3>
            <small>
              {name === "Quarantine"
                ? g.values.quarantined || 0
                : name === "Main rack"
                  ? g.values.main
                  : name === "Overflow"
                    ? g.values.overflow
                    : g.values.receiving}{" "}
              units
            </small>
          </div>
        ))}
      </div>
      <div className="warehouse-controls">
        <Pane title="Record physical movement">
          <NumberControl
            label="Movement quantity"
            value={qty}
            onChange={setQty}
            min={1}
          />
          <Action p={p} id="receive-stock" value={qty}>
            Receive stock
          </Action>
          <Action p={p} id="use-stock" value={qty}>
            Issue to department
          </Action>
          <Action p={p} id="mark-damaged" value={qty}>
            Quarantine damaged items
          </Action>
          <Select
            label="Destination bin"
            value={bin}
            options={["Overflow", "Main rack", "Receiving"]}
            onChange={setBin}
          />
          <Action p={p} id="transfer-stock" value={qty} option={bin}>
            Transfer between bins
          </Action>
        </Pane>
        <Pane title="Count & reconciliation">
          <Action p={p} id="count-stock">
            Record physical count
          </Action>
          <Action p={p} id="investigate-stock">
            Investigate discrepancy
          </Action>
          <p>Count variance: {g.values.discrepancy ?? "Not investigated"}</p>
          <Action p={p} id="adjust-stock">
            Adjust ledger to verified count
          </Action>
          <Action p={p} id="reorder-stock" value={qty}>
            Create reorder request
          </Action>
          <Completion p={p} id="close-count" label="Close warehouse count" />
        </Pane>
      </div>
      <Trace p={p} />
    </div>
  );
}
