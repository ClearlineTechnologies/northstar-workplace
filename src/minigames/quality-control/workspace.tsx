"use client";
import { useState } from "react";
import type { GameProps } from "../runtime/types";
import {
  Action,
  Completion,
  NumberControl,
  Pane,
  Stat,
  Trace,
} from "../ui/common";
export function QualityBench(p: GameProps) {
  const g = p.scenario.gameplay!,
    row = g.records.find((r) => r.id === g.values.selected) || g.records[0];
  const [value, setValue] = useState(row.expected);
  return (
    <div data-system="QualityBench" className="quality-bench">
      <header>
        <h2>Inspection & correction bench</h2>
        <Stat
          label="Reinspection defects"
          value={g.values.defects ?? "Not inspected"}
        />
      </header>
      <div className="quality-layout">
        <table>
          <thead>
            <tr>
              <th>Record</th>
              <th>Value</th>
              <th>Reference</th>
              <th>Status</th>
              <th>Select</th>
            </tr>
          </thead>
          <tbody>
            {g.records.map((r) => (
              <tr key={r.id} className={r.id === row.id ? "selected-row" : ""}>
                <td>{r.label}</td>
                <td>{r.amount}</td>
                <td>{r.expected}</td>
                <td>{r.status}</td>
                <td>
                  <button
                    className="work-action"
                    onClick={() => {
                      setValue(r.expected);
                      p.act({ key: "inspect-row", target: r.id });
                    }}
                  >
                    Inspect record
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pane title={`Correction tray · ${row.id}`}>
          <div className="diff-values">
            <div>
              <small>Observed</small>
              <strong>{row.amount}</strong>
            </div>
            <span>→</span>
            <div>
              <small>Reference</small>
              <strong>{row.expected}</strong>
            </div>
          </div>
          <select
            aria-label="Defect severity"
            value={String(g.values["severity-" + row.id] || "Minor")}
            onChange={(e) =>
              p.act({ key: "classify-defect", value: e.target.value })
            }
          >
            {["Minor", "Major", "Critical"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <Action p={p} id="send-correction">
            Send for correction
          </Action>
          <Action p={p} id="flag-defect">
            Flag inconsistency
          </Action>
          <NumberControl
            label="Corrected record value"
            value={value}
            onChange={setValue}
          />
          <Action p={p} id="correct-value" value={value}>
            Apply value correction
          </Action>
          <Action p={p} id="complete-field" value={p.company.manager}>
            Complete missing owner / reference
          </Action>
          <Action p={p} id="mark-duplicate">
            Check duplicate linkage
          </Action>
          <Action p={p} id="standardize-format">
            Normalize record formatting
          </Action>
          <Action p={p} id="reinspect">
            Reinspect entire batch
          </Action>
        </Pane>
      </div>
      <Completion p={p} id="release-batch" label="Release inspected batch" />
      <Trace p={p} />
    </div>
  );
}
