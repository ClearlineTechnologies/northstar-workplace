"use client";
import { useState } from "react";
import type { GameProps } from "../runtime/types";
import { Action, Completion, Select, Trace } from "../ui/common";
export function RecordsOffice(p: GameProps) {
  const g = p.scenario.gameplay!;
  const [department, setDepartment] = useState("Operations"),
    [retention, setRetention] = useState("7 years");
  return (
    <div data-system="RecordsOffice" className="records-office">
      <section className="intake-document">
        <span>INCOMING DOCUMENT</span>
        <h2>{String(p.scenario.data.facts["Record type"])}</h2>
        <dl>
          <dt>Reference printed on record</dt>
          <dd>{String(p.scenario.data.facts.Reference)}</dd>
          <dt>Source</dt>
          <dd>{p.scenario.participants[1]}</dd>
          <dt>Processing requirement</dt>
          <dd>{g.familyName}</dd>
        </dl>
        <Action p={p} id="scan-record">
          Scan & register document
        </Action>
        <Action p={p} id="verify-signature">
          Verify source signature
        </Action>
        <Action p={p} id="return-record">
          Return for duplicate verification
        </Action>
      </section>
      <section className="filing-index">
        <h3>Index fields</h3>
        <div className="index-field">
          <span>Reference</span>
          <strong>{g.values.reference || "Unindexed"}</strong>
          <Action
            p={p}
            id="set-reference"
            value={String(p.scenario.data.facts.Reference)}
          >
            Capture printed reference
          </Action>
        </div>
        <Select
          label="Routing department"
          value={department}
          options={p.company.departments}
          onChange={setDepartment}
        />
        <Action p={p} id="set-department" value={department}>
          Assign department
        </Action>
        <Select
          label="Retention schedule"
          value={retention}
          options={["1 year", "3 years", "7 years", "Permanent"]}
          onChange={setRetention}
        />
        <Action p={p} id="set-retention" value={retention}>
          Apply retention rule
        </Action>
        <div className="filing-drawers">
          {p.company.departments.map((d) => (
            <div
              className={g.values.department === d ? "selected" : ""}
              key={d}
            >
              ▤ {d}
            </div>
          ))}
        </div>
        <Action p={p} id="route-record">
          Route to department owner
        </Action>
        <Completion p={p} id="file-record" label="File indexed record" />
        <Trace p={p} />
      </section>
    </div>
  );
}
