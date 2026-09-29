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
export function SalesPipeline(p: GameProps) {
  const g = p.scenario.gameplay!;
  const [product, setProduct] = useState(p.company.products[0].id),
    [quantity, setQuantity] = useState(Number(g.values.volume)),
    [discount, setDiscount] = useState(0);
  return (
    <div data-system="SalesPipeline" className="sales-pipeline">
      <div className="sales-stages">
        {["lead", "qualified", "quoted", "customer-review", "won"].map(
          (stage) => (
            <span className={g.phase === stage ? "current" : ""} key={stage}>
              {stage.replaceAll("-", " ")}
            </span>
          ),
        )}
      </div>
      <div className="sales-columns">
        <Pane title="Opportunity record">
          <h2>{p.scenario.participants[0]}</h2>
          <p>
            {String(p.scenario.data.facts.Organization)} · {g.familyName}
          </p>
          <Action p={p} id="qualify-lead">
            Confirm buyer budget & authority
          </Action>
          <NumberControl
            label="Required order volume"
            value={quantity}
            onChange={setQuantity}
            min={1}
          />
          <Action p={p} id="capture-volume" value={quantity}>
            Capture customer requirement
          </Action>
          <label className="work-select">
            <span>Product</span>
            <select
              aria-label="Sales product"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
            >
              {p.company.products.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name} · ${item.price}
                </option>
              ))}
            </select>
          </label>
          <Action p={p} id="select-product" value={product}>
            Add product to opportunity
          </Action>
          <Action p={p} id="check-stock">
            Check fulfillment availability
          </Action>
        </Pane>
        <Pane title="Quotation workspace">
          <Stat
            label="Fulfillment"
            value={g.values.fulfillment || "Unchecked"}
          />
          <NumberControl
            label="Discount percentage"
            value={discount}
            onChange={setDiscount}
            max={10}
          />
          <Action p={p} id="set-discount" value={discount}>
            Apply authorized discount
          </Action>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Units</th>
                <th>Discount</th>
                <th>Quote total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  {p.company.products.find(
                    (item) => item.id === g.values.product,
                  )?.name || "No product"}
                </td>
                <td>{g.values.volume}</td>
                <td>{g.values.discount}%</td>
                <td>${g.values.quote || "—"}</td>
              </tr>
            </tbody>
          </table>
          <Action p={p} id="build-quote">
            Calculate quotation
          </Action>
          <Action p={p} id="send-quote">
            Send quotation to buyer
          </Action>
        </Pane>
        <Pane title="Buyer response">
          <p>{g.values.objection || "Buyer has not raised an objection."}</p>
          <Action p={p} id="log-objection">
            Capture delivery objection
          </Action>
          <Action p={p} id="sales-followup">
            Confirm buyer follow-up
          </Action>
          <p>{g.values.followup}</p>
          <Completion
            p={p}
            id="book-order"
            label="Book confirmed customer order"
          />
        </Pane>
      </div>
      <Trace p={p} />
    </div>
  );
}
