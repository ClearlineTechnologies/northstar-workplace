"use client";
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Row, Slide } from "../simulation/types";
import { calculateCell } from "./formulas";
export function DataTable({ rows }: { rows: Row[] }) {
  const [filter, setFilter] = useState(""),
    [sort, setSort] = useState<keyof Row>("id"),
    [desc, setDesc] = useState(false);
  const filtered = rows
    .filter((r) =>
      JSON.stringify(r).toLowerCase().includes(filter.toLowerCase()),
    )
    .sort(
      (a, b) =>
        (typeof a[sort] === "number"
          ? Number(a[sort]) - Number(b[sort])
          : String(a[sort]).localeCompare(String(b[sort]))) * (desc ? -1 : 1),
    );
  return (
    <div>
      <div className="table-toolbar">
        <label>
          Filter records{" "}
          <input
            aria-label="Filter records"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </label>
        <span>
          {filtered.length} records · Output total{" "}
          {filtered.reduce((a, r) => a + r.actual, 0)}
        </span>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {[
                "id",
                "name",
                "quantity",
                "price",
                "cost",
                "actual",
                "target",
                "department",
                "status",
              ].map((k) => (
                <th key={k}>
                  <button
                    onClick={() => {
                      if (sort === k) setDesc(!desc);
                      else setSort(k as keyof Row);
                    }}
                  >
                    {k}
                    {sort === k ? (desc ? " ↓" : " ↑") : ""}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                {Object.values(r).map((v, i) => (
                  <td key={i}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bar-chart" aria-label="Actual output by record">
        {filtered.map((r) => (
          <div className="bar-line" key={r.id}>
            <span>{r.id}</span>
            <i
              style={{
                width: `${(r.actual / Math.max(...rows.map((v) => v.actual))) * 70}%`,
              }}
            />
            <b>{r.actual}</b>
          </div>
        ))}
      </div>
    </div>
  );
}
export function SheetEditor({
  cells,
  onChange,
  positiveOnly = false,
}: {
  cells: string[][];
  positiveOnly?: boolean;
  onChange: (cells: string[][]) => void;
}) {
  const [selected, setSelected] = useState<[number, number]>([0, 0]),
    [filter, setFilter] = useState("");
  const [r, c] = selected;
  const width = Math.max(4, ...cells.map((row) => row.length));
  const set = (row: number, col: number, value: string) => {
    const next = cells.map((v) => [...v]);
    next[row][col] = value;
    onChange(next);
  };
  return (
    <div className="sheet-editor">
      <div className="sheet-toolbar">
        <button
          className="subtle small"
          onClick={() => onChange([...cells, Array(width).fill("")])}
        >
          <Plus size={14} />
          Row
        </button>
        <button
          className="subtle small"
          onClick={() => onChange(cells.map((row) => [...row, ""]))}
        >
          <Plus size={14} />
          Column
        </button>
        <button
          className="subtle small"
          onClick={() =>
            onChange([
              cells[0],
              ...cells.slice(1).sort((a, b) =>
                String(a[c]).localeCompare(String(b[c]), undefined, {
                  numeric: true,
                }),
              ),
            ])
          }
        >
          Sort column {String.fromCharCode(65 + c)}
        </button>
        <label>
          Filter{" "}
          <input
            aria-label="Filter sheet"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </label>
      </div>
      <div className="formula-bar">
        <b>
          {String.fromCharCode(65 + c)}
          {r + 1}
        </b>
        <span>ƒx</span>
        <input
          aria-label="Formula bar"
          value={cells[r]?.[c] || ""}
          onChange={(e) => set(r, c, e.target.value)}
        />
      </div>
      <div className="table-scroll">
        <table className="sheet">
          <thead>
            <tr>
              <th></th>
              {Array.from({ length: width }, (_, i) => (
                <th key={i}>{String.fromCharCode(65 + i)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cells.map(
              (row, ri) =>
                (!positiveOnly || ri === 0 || ri >= 7 || Number(row[1]) > 0) &&
                (!filter ||
                  ri === 0 ||
                  row
                    .join(" ")
                    .toLowerCase()
                    .includes(filter.toLowerCase())) && (
                  <tr key={ri}>
                    <th>{ri + 1}</th>
                    {Array.from({ length: width }, (_, ci) => (
                      <td
                        key={ci}
                        className={r === ri && c === ci ? "selected-cell" : ""}
                      >
                        <input
                          aria-label={`${String.fromCharCode(65 + ci)}${ri + 1}`}
                          value={
                            r === ri && c === ci
                              ? row[ci] || ""
                              : String(calculateCell(cells, ri, ci))
                          }
                          onFocus={() => setSelected([ri, ci])}
                          onChange={(e) => set(ri, ci, e.target.value)}
                        />
                      </td>
                    ))}
                  </tr>
                ),
            )}
          </tbody>
        </table>
      </div>
      <p className="hint">
        Use =SUM(B2:B7), =AVERAGE(B2:B7), =MIN(B2:B7), =MAX(B2:B7), =B2*C2, or
        =B2*10%. Select a cell to edit its formula.
      </p>
    </div>
  );
}
export function SlideEditor({
  slides,
  onChange,
}: {
  slides: Slide[];
  onChange: (slides: Slide[]) => void;
}) {
  const [active, setActive] = useState(0),
    [present, setPresent] = useState(false);
  const slide = slides[active];
  const update = (key: keyof Slide, value: string) =>
    onChange(slides.map((s, i) => (i === active ? { ...s, [key]: value } : s)));
  return (
    <div>
      <div className="sheet-toolbar">
        <button
          className="subtle"
          onClick={() => {
            onChange([
              ...slides,
              { title: "", text: "", chart: "", notes: "" },
            ]);
            setActive(slides.length);
          }}
        >
          <Plus size={15} />
          Add slide
        </button>
        <button
          className="subtle"
          onClick={() => setPresent(!present)}
          disabled={!slides.length}
        >
          {present ? "Edit deck" : "Present deck"}
        </button>
        {slide && (
          <button
            className="subtle"
            onClick={() => {
              onChange(slides.filter((_, i) => i !== active));
              setActive(Math.max(0, active - 1));
            }}
          >
            <Trash2 size={14} />
            Delete slide
          </button>
        )}
      </div>
      <div className="slide-tabs">
        {slides.map((sl, i) => (
          <button
            className={i === active ? "selected" : ""}
            key={i}
            onClick={() => setActive(i)}
          >
            {i + 1}. {sl.title || "Untitled slide"}
          </button>
        ))}
      </div>
      {slide &&
        (present ? (
          <div className="slide-preview">
            <div className="eyebrow">
              NORTHSTAR WORKS · {active + 1}/{slides.length}
            </div>
            <h2>{slide.title}</h2>
            <p>{slide.text}</p>
            {slide.chart && <MiniChart content={slide.chart} />}
            <small>Presenter notes: {slide.notes}</small>
          </div>
        ) : (
          <div className="form-grid">
            <Field
              label="Slide title"
              value={slide.title}
              onChange={(v) => update("title", v)}
            />
            <Field
              label="Chart values (label:value, one per line)"
              value={slide.chart}
              onChange={(v) => update("chart", v)}
              multiline
            />
            <Field
              label="Slide content"
              value={slide.text}
              onChange={(v) => update("text", v)}
              multiline
            />
            <Field
              label="Presenter notes"
              value={slide.notes}
              onChange={(v) => update("notes", v)}
              multiline
            />
          </div>
        ))}
    </div>
  );
}
export function MiniChart({ content }: { content: string }) {
  const values = content
    .split("\n")
    .map((v) => v.split(":"))
    .filter((v) => v.length === 2 && Number.isFinite(Number(v[1])));
  const max = Math.max(1, ...values.map((v) => Math.abs(Number(v[1]))));
  return (
    <div className="bar-chart">
      {values.map(([label, value], i) => (
        <div className="bar-line" key={i}>
          <span>{label}</span>
          <i style={{ width: `${(Math.abs(Number(value)) / max) * 65}%` }} />
          <b>{value}</b>
        </div>
      ))}
    </div>
  );
}
export function Field({
  label,
  value,
  onChange,
  multiline,
  type = "text",
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  type?: string;
  options?: { value: string; label: string }[];
}) {
  return (
    <label className={`field ${multiline ? "wide" : ""}`}>
      <span>{label}</span>
      {options ? (
        <select
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select an option</option>
          {options.map((v) => (
            <option value={v.value} key={v.value}>
              {v.label}
            </option>
          ))}
        </select>
      ) : multiline ? (
        <textarea
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
        />
      ) : (
        <input
          aria-label={label}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}
export function ReorderList({
  items,
  order,
  onChange,
}: {
  items: {
    id: string;
    title: string;
    due: number;
    dependency: string;
    impact: number;
  }[];
  order: string[];
  onChange: (order: string[]) => void;
}) {
  return (
    <div className="reorder-list">
      {order.map((id, i) => {
        const task = items.find((t) => t.id === id);
        if (!task) return null;
        const move = (step: number) => {
          const next = [...order];
          [next[i], next[i + step]] = [next[i + step], next[i]];
          onChange(next);
        };
        return (
          <div className="reorder-item" key={id}>
            <span className="rank">{i + 1}</span>
            <div>
              <strong>{task.title}</strong>
              <small>
                Deadline {Math.floor(task.due / 60)}:
                {String(task.due % 60).padStart(2, "0")} · Impact {task.impact}
                /5 {task.dependency && `· Depends on ${task.dependency}`}
              </small>
            </div>
            <button
              className="icon-button"
              aria-label={`Move ${id} up`}
              disabled={i === 0}
              onClick={() => move(-1)}
            >
              <ArrowUp size={15} />
            </button>
            <button
              className="icon-button"
              aria-label={`Move ${id} down`}
              disabled={i === order.length - 1}
              onClick={() => move(1)}
            >
              <ArrowDown size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
export function SaveButton({
  onClick,
  label = "Save work",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button className="button secondary" onClick={onClick}>
      <Save size={15} />
      {label}
    </button>
  );
}
