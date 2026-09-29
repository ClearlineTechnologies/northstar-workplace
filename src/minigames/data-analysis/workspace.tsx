"use client";
import { useState } from "react";
import { MiniChart } from "../../features/editors";
import type { GameProps } from "../runtime/types";
import { Action, Completion, Pane, Select, Stat, Trace } from "../ui/common";
export function AnalyticsStudio(p: GameProps) {
  const g = p.scenario.gameplay!,
    s = p.scenario;
  const [department, setDepartment] = useState("All"),
    [metric, setMetric] = useState("actual"),
    [sort, setSort] = useState("actual");
  const rows = s.data.rows
    .filter((r) => r.id !== g.values.excluded)
    .filter(
      (r) =>
        !g.values.department ||
        g.values.department === "All" ||
        r.department === g.values.department,
    )
    .sort(
      (a, b) =>
        Number(b[g.values.sort as "actual"] || b.actual) -
        Number(a[g.values.sort as "actual"] || a.actual),
    );
  return (
    <div data-system="AnalyticsStudio" className="analytics-studio">
      <header>
        <h2>Dataset exploration</h2>
        <span>{s.data.rows.length} source records</span>
      </header>
      <div className="analysis-toolbar">
        <Select
          label="Department filter"
          value={department}
          options={["All", ...p.company.departments]}
          onChange={setDepartment}
        />
        <Action p={p} id="filter-department" value={department}>
          Apply filter
        </Action>
        <Select
          label="Metric"
          value={metric}
          options={["actual", "target", "quantity"]}
          onChange={setMetric}
        />
        <Action p={p} id="select-metric" value={metric}>
          Set metric
        </Action>
        <Select
          label="Sort field"
          value={sort}
          options={["actual", "target", "quantity"]}
          onChange={setSort}
        />
        <Action p={p} id="sort-column" value={sort}>
          Sort descending
        </Action>
      </div>
      <div className="analytics-grid">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Record</th>
                <th>Department</th>
                <th>Actual</th>
                <th>Target</th>
                <th>Investigation</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className={g.values.outlier === r.id ? "anomaly-row" : ""}
                >
                  <td>{r.id}</td>
                  <td>{r.department}</td>
                  <td>{r.actual}</td>
                  <td>{r.target}</td>
                  <td>
                    <Action p={p} id="flag-outlier" target={r.id}>
                      Flag anomaly
                    </Action>
                    <Action p={p} id="exclude-duplicate" target={r.id}>
                      Exclude duplicate
                    </Action>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pane title="Metric & visualization">
          <Stat
            label="Aggregate"
            value={g.values.aggregate ?? "Select and chart a metric"}
          />
          <Action p={p} id="build-chart" value="Bar">
            Build bar chart
          </Action>
          <Action p={p} id="compare-target">
            Calculate target variance
          </Action>
          <Action p={p} id="segment-data">
            Segment by department
          </Action>
          {g.values.chart && (
            <MiniChart
              content={
                g.values.segment
                  ? Object.entries(
                      rows.reduce<Record<string, number>>((totals, r) => {
                        totals[r.department] =
                          (totals[r.department] || 0) +
                          Number(r[g.values.metric as "actual"] || r.actual);
                        return totals;
                      }, {}),
                    )
                      .map(([name, value]) => `${name}:${value}`)
                      .join("\n")
                  : rows
                      .map(
                        (r) =>
                          `${r.id}:${r[g.values.metric as "actual"] || r.actual}`,
                      )
                      .join("\n")
              }
            />
          )}
          <p>Variance: {g.values.variance ?? "Uncalculated"}</p>
        </Pane>
      </div>
      <Completion
        p={p}
        id="publish-analysis"
        label="Publish data investigation"
      />
      <Trace p={p} />
    </div>
  );
}
