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
export function BargainingTable(p: GameProps) {
  const g = p.scenario.gameplay!,
    s = p.scenario;
  const [price, setPrice] = useState(Number(g.values.offer)),
    [days, setDays] = useState(Number(g.values.delivery));
  return (
    <div data-system="BargainingTable" className="bargaining-table">
      <div className="negotiation-sides">
        <Pane title="Your mandate">
          <Stat
            label="Maximum unit price"
            value={`$${s.data.facts["Maximum unit price"]}`}
          />
          <Stat
            label="Latest delivery"
            value={`${s.data.facts["Maximum delivery days"]} days`}
          />
          <NumberControl
            label="Proposed unit offer"
            value={price}
            onChange={setPrice}
            min={1}
          />
          <Action p={p} id="set-offer" value={price}>
            Set price term
          </Action>
          <NumberControl
            label="Proposed delivery days"
            value={days}
            onChange={setDays}
            min={1}
            max={30}
          />
          <Action p={p} id="set-delivery" value={days}>
            Set delivery term
          </Action>
        </Pane>
        <div className="deal-center">
          <span>⇄</span>
          <h2>Negotiation round {Number(g.values.round || 0) + 1}</h2>
          <Action p={p} id="offer-package">
            Present package to supplier
          </Action>
          <Action p={p} id="counter-price">
            Counter $3 lower
          </Action>
          <Action p={p} id="trade-volume">
            Trade volume for lower price
          </Action>
          <Action p={p} id="walk-away">
            Walk away from this deal
          </Action>
        </div>
        <Pane title="Supplier position">
          <Stat
            label="Current ask"
            value={`$${g.values.counter || s.data.facts["Opening offer"]}`}
          />
          <p>
            {g.outcome ||
              "Present an offer. The supplier will respond to price and delivery terms."}
          </p>
          <Action p={p} id="accept-counter">
            Accept supplier counteroffer
          </Action>
          <Stat
            label="Agreement"
            value={
              g.values.walked
                ? "Declined"
                : g.values.accepted
                  ? `$${g.values.accepted}/unit`
                  : "Not agreed"
            }
          />
        </Pane>
      </div>
      <Completion
        p={p}
        id="sign-agreement"
        label={
          g.values.walked
            ? "Record walk-away decision"
            : "Sign negotiated agreement"
        }
      />
      <Trace p={p} />
    </div>
  );
}
