"use client";
import { useState } from "react";
import type { GameProps } from "../runtime/types";
import { Action, Completion, Select, Trace } from "../ui/common";
export function TeamMessenger(p: GameProps) {
  const g = p.scenario.gameplay!;
  const [channel, setChannel] = useState("# operations"),
    [fact, setFact] = useState("Order reference verified"),
    [request, setRequest] = useState("Please approve the next action"),
    [owner, setOwner] = useState(p.company.manager),
    [tone, setTone] = useState("Professional");
  return (
    <div data-system="TeamMessenger" className="team-messenger">
      <aside>
        <h3>Team channels</h3>
        {[
          "# operations",
          "# finance",
          "# project-team",
          "Private · Manager",
        ].map((v) => (
          <button
            key={v}
            onClick={() => {
              setChannel(v);
              p.act({ key: "select-channel", value: v });
            }}
            className={g.values.channel === v ? "selected" : ""}
          >
            {v}
          </button>
        ))}
        <Action p={p} id="private-thread">
          Move to private thread
        </Action>
      </aside>
      <div>
        <h2>{channel}</h2>
        <div className="message-bubbles">
          <p className="manager-bubble">
            <b>{p.company.manager}</b>
            <br />
            {g.brief} Please give me a factual update and a clear request.
          </p>
          {g.evidence.map((e, i) => (
            <p className="own-bubble" key={i}>
              {e}
            </p>
          ))}
        </div>
        <div className="message-composer">
          <Select
            label="Verified fact"
            value={fact}
            options={[
              "Order reference verified",
              `Cash balance $${p.company.cash}`,
              `${p.state.tasks.filter((t) => !t.done).length} open tasks`,
              "Delivery constraint confirmed",
            ]}
            onChange={setFact}
          />
          <Action p={p} id="add-fact" value={fact}>
            Add fact to update
          </Action>
          <Select
            label="Tone"
            value={tone}
            options={["Professional", "Defensive", "Dismissive"]}
            onChange={setTone}
          />
          <Action p={p} id="choose-tone" value={tone}>
            Set tone
          </Action>
          <Select
            label="Requested next action"
            value={request}
            options={[
              "Please approve the next action",
              "Please supply the missing record",
              "Please confirm the delivery deadline",
            ]}
            onChange={setRequest}
          />
          <Action p={p} id="choose-request" value={request}>
            Add request
          </Action>
          <Select
            label="Accountable coworker"
            value={owner}
            options={p.company.employees.map((e) => e.name)}
            onChange={setOwner}
          />
          <Action p={p} id="tag-owner" value={owner}>
            Tag owner
          </Action>
          <Action p={p} id="escalate-chat">
            Escalate blocker
          </Action>
        </div>
        <Completion
          p={p}
          id="send-update"
          label="Send structured team update"
        />
        <Trace p={p} />
      </div>
    </div>
  );
}
