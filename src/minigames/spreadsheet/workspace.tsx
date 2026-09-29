"use client";
import { useEffect, useState } from "react";
import { SheetEditor } from "../../features/editors";
import type { GameProps } from "../runtime/types";
import { Action, Completion, Stat, Trace } from "../ui/common";
export function SpreadsheetLab(p: GameProps) {
  const g = p.scenario.gameplay!,
    s = p.scenario;
  const [cells, setCells] = useState(s.draft.cells);
  useEffect(() => setCells(s.draft.cells), [s.draft.cells]);
  return (
    <div data-system="SpreadsheetLab" className="spreadsheet-lab">
      <div className="workbook-ribbon">
        <strong>Workbook · {String(s.data.facts.Reference)}</strong>
        <span>
          Required calculation: {String(s.data.facts.Aggregation)} of B2:B7 in
          B8
        </span>
      </div>
      <div className="sheet-commandbar">
        <button
          className="work-action"
          onClick={() => p.act({ key: "edit-grid", cells })}
        >
          Save cell edits
        </button>
        <Action p={p} id="insert-row">
          Insert supporting row
        </Action>
        <Action p={p} id="sort-sheet">
          Sort amounts descending
        </Action>
        <Action p={p} id="filter-sheet" value="Amount > 0">
          Show positive amounts
        </Action>
        <Action p={p} id="format-percent">
          Set percentage format
        </Action>
        <Action p={p} id="audit-formula">
          Audit B8 formula
        </Action>
        <Action p={p} id="recalculate-sheet">
          Recalculate workbook
        </Action>
      </div>
      <SheetEditor
        cells={cells}
        onChange={setCells}
        positiveOnly={Boolean(g.values.filter)}
      />
      <div className="sheet-audit-strip">
        <Stat label="Saved formula" value={g.values.formula || "Not audited"} />
        <Stat
          label="Calculated result"
          value={g.values.result ?? "Not calculated"}
        />
        <Stat label="Validation range" value="B2:B7 → B8" />
      </div>
      <Completion
        p={p}
        id="deliver-workbook"
        label="Deliver calculated workbook"
      />
      <Trace p={p} />
    </div>
  );
}
