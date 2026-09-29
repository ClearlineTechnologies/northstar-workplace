"use client";
import type { ReactNode } from "react";
import { availableActions } from "../runtime";
import type { GameProps } from "../runtime/types";
export function Action({
  p,
  id,
  children,
  target,
  value,
  option,
}: {
  p: GameProps;
  id: string;
  children: ReactNode;
  target?: string;
  value?: string | number;
  option?: string;
}) {
  const enabled = availableActions(p.scenario).includes(id);
  const required =
    p.scenario.gameplay!.required.includes(id) &&
    !p.scenario.gameplay!.flags.includes(id);
  return (
    <button
      data-action={id}
      data-target={target}
      className={`work-action ${required ? "required-control" : ""}`}
      disabled={p.busy || !enabled}
      onClick={() => p.act({ key: id, target, value, option })}
    >
      {children}
      {required && (
        <span className="required-dot" title="Required for this case" />
      )}
    </button>
  );
}
export function Pane({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`work-pane ${className}`}>
      <h3>{title}</h3>
      {children}
    </section>
  );
}
export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="work-stat">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}
export function Trace({ p }: { p: GameProps }) {
  const g = p.scenario.gameplay!;
  return (
    <div className="action-trace" aria-live="polite">
      <strong>{g.outcome || g.brief}</strong>
      {g.history.slice(-5).map((event, i) => (
        <p key={i}>
          <small>
            {Math.floor(event.at / 60)}:{String(event.at % 60).padStart(2, "0")}
          </small>
          {event.detail}
        </p>
      ))}
    </div>
  );
}
export function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="work-select">
      <span>{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
export function NumberControl({
  label,
  value,
  onChange,
  min = 0,
  max = 100000,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <label className="work-select">
      <span>{label}</span>
      <input
        aria-label={label}
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
export function Completion({
  p,
  id,
  label,
}: {
  p: GameProps;
  id: string;
  label: string;
}) {
  return (
    <div className="work-close">
      <Action p={p} id={id}>
        {label}
      </Action>
    </div>
  );
}
export function Money({ value }: { value: number }) {
  return (
    <>{value.toLocaleString("en-US", { style: "currency", currency: "USD" })}</>
  );
}
