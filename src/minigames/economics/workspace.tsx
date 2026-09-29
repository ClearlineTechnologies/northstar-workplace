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
export function MarketLab(p: GameProps) {
  const g = p.scenario.gameplay!;
  const [price, setPrice] = useState(Number(g.values.price)),
    [volume, setVolume] = useState(Number(g.values.volume));
  const experiments = g.records.filter((r) => r.status === "experiment");
  return (
    <div data-system="MarketLab" className="market-lab">
      <header>
        <h2>Pricing & demand laboratory</h2>
        <span>Demand responds to price, elasticity, costs, and capacity.</span>
      </header>
      <div className="market-layout">
        <Pane title="Market levers">
          <NumberControl
            label="Proposed unit price"
            value={price}
            onChange={setPrice}
            min={1}
          />
          <Action p={p} id="set-price" value={price}>
            Apply price
          </Action>
          <NumberControl
            label="Base demand volume"
            value={volume}
            onChange={setVolume}
            min={1}
          />
          <Action p={p} id="set-volume" value={volume}>
            Apply demand forecast
          </Action>
          <div className="scenario-levers">
            <Action p={p} id="apply-inflation">
              Apply 12% cost inflation
            </Action>
            <Action p={p} id="test-elasticity">
              Test high elasticity
            </Action>
            <Action p={p} id="capacity-limit">
              Constrain capacity to 80%
            </Action>
            <Action p={p} id="competitor-check">
              Check competitor pricing
            </Action>
            <Action p={p} id="compare-baseline">
              Pin current baseline
            </Action>
          </div>
          <Action p={p} id="simulate-market">
            ▶ Run market experiment
          </Action>
        </Pane>
        <section>
          <div className="record-strip">
            <Stat label="Current price" value={`$${g.values.price}`} />
            <Stat label="Units sold" value={g.values.demand || 0} />
            <Stat label="Contribution" value={`$${g.values.profit || 0}`} />
          </div>
          <div className="experiment-chart">
            {experiments.map((r) => (
              <div key={r.id}>
                <span>{r.label}</span>
                <i
                  style={{
                    width: `${Math.max(1, Math.min(90, (Math.abs(r.amount) / Math.max(1, ...experiments.map((e) => Math.abs(e.amount)))) * 90))}%`,
                  }}
                />
                <b>${r.amount}</b>
              </div>
            ))}
          </div>
          <table>
            <thead>
              <tr>
                <th>Experiment</th>
                <th>Demand</th>
                <th>Contribution</th>
              </tr>
            </thead>
            <tbody>
              {experiments.map((r) => (
                <tr key={r.id}>
                  <td>{r.label}</td>
                  <td>{r.quantity}</td>
                  <td>${r.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Completion
            p={p}
            id="publish-price"
            label="Publish chosen pricing policy"
          />
          <Trace p={p} />
        </section>
      </div>
    </div>
  );
}
