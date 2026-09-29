"use client";
import { useState } from "react";
import { MiniChart } from "../../features/editors";
import type { GameProps } from "../runtime/types";
import { Action, Completion, Select, Stat, Trace } from "../ui/common";
export function ReportBuilder(p: GameProps) {
  const g = p.scenario.gameplay!;
  const [dataset, setDataset] = useState("Operational output"),
    [compare, setCompare] = useState("Actual vs target"),
    [recipient, setRecipient] = useState(p.company.manager);
  return (
    <div data-system="ReportBuilder" className="report-builder">
      <aside>
        <h3>Report configuration</h3>
        <Select
          label="Source dataset"
          value={dataset}
          options={[
            "Operational output",
            "Financial transactions",
            "Service performance",
          ]}
          onChange={setDataset}
        />
        <Action p={p} id="select-dataset" value={dataset}>
          Bind dataset
        </Action>
        <label>
          Reporting window
          <select
            aria-label="Reporting period"
            value={Number(g.values.period || p.scenario.data.rows.length)}
            onChange={(e) =>
              p.act({ key: "set-period", value: Number(e.target.value) })
            }
          >
            {p.scenario.data.rows.map((r, i) => (
              <option value={i + 1} key={r.id}>
                Days 1–{i + 1}
              </option>
            ))}
          </select>
        </label>
        <label>
          Display
          <select
            aria-label="Report visualization"
            value={String(g.values.visual || "Table")}
            onChange={(e) =>
              p.act({ key: "set-visual", value: e.target.value })
            }
          >
            <option>Table</option>
            <option>Bar chart</option>
          </select>
        </label>
        <h4>Metrics</h4>
        {["Actual", "Target", "Variance", "Quantity"].map((metric) => (
          <button
            className={
              g.evidence.includes(metric)
                ? "checked metric-toggle"
                : "metric-toggle"
            }
            key={metric}
            onClick={() => p.act({ key: "toggle-metric", value: metric })}
          >
            {g.evidence.includes(metric) ? "☑" : "☐"} {metric}
          </button>
        ))}
        <h4>Sections</h4>
        {["Executive summary", "Findings", "Recommendation", "Limitations"].map(
          (section) => (
            <button
              className={
                String(g.values.sections).includes(section)
                  ? "checked metric-toggle"
                  : "metric-toggle"
              }
              key={section}
              onClick={() => p.act({ key: "toggle-section", value: section })}
            >
              {String(g.values.sections).includes(section) ? "☑" : "☐"}{" "}
              {section}
            </button>
          ),
        )}
      </aside>
      <section>
        <div className="report-canvas">
          <span>REPORT PREVIEW</span>
          <h2>{g.familyName}</h2>
          {g.values.visual === "Bar chart" && (
            <MiniChart
              content={`Actual:${g.values.actual || 0}\nTarget:${g.values.target || 0}`}
            />
          )}
          <div className="record-strip">
            {g.evidence.map((metric) => (
              <Stat
                key={metric}
                label={metric}
                value={
                  metric === "Actual"
                    ? (g.values.actual ?? "Validate")
                    : metric === "Target"
                      ? (g.values.target ?? "Validate")
                      : metric === "Variance"
                        ? Number(g.values.actual || 0) -
                          Number(g.values.target || 0)
                        : p.scenario.data.rows.reduce(
                            (n, r) => n + r.quantity,
                            0,
                          )
                }
              />
            ))}
          </div>
          {String(g.values.sections || "")
            .split("|")
            .filter(Boolean)
            .map((section) => (
              <div key={section}>
                <h3>{section}</h3>
                <p>
                  {section === "Recommendation"
                    ? g.values.conclusion ||
                      "Choose an evidence-based conclusion below."
                    : `${g.values.dataset || "Choose dataset"} · ${g.values.comparison || "Set comparison"}`}
                </p>
              </div>
            ))}
        </div>
        <div className="report-tools">
          <Select
            label="Report comparison"
            value={compare}
            options={[
              "Actual vs target",
              "Department comparison",
              "Quantity vs revenue",
            ]}
            onChange={setCompare}
          />
          <Action p={p} id="choose-comparison" value={compare}>
            Apply comparison
          </Action>
          <Action
            p={p}
            id="add-conclusion"
            value="Investigate the largest variance and assign corrective action"
          >
            Add variance-driven recommendation
          </Action>
          <Action p={p} id="validate-report">
            Recalculate & validate report
          </Action>
          <Select
            label="Report recipient"
            value={recipient}
            options={p.company.employees.map((e) => e.name)}
            onChange={setRecipient}
          />
          <Action p={p} id="select-recipient" value={recipient}>
            Set distribution
          </Action>
        </div>
        <Completion
          p={p}
          id="distribute-report"
          label="Distribute validated report"
        />
        <Trace p={p} />
      </section>
    </div>
  );
}
