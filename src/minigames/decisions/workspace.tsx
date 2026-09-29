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
export function DecisionRoom(p: GameProps) {
  const g = p.scenario.gameplay!,
    f = p.scenario.data.facts;
  const [risk, setRisk] = useState(30);
  return (
    <div data-system="DecisionRoom" className="decision-room">
      <header>
        <h2>Capital allocation committee</h2>
        <Stat label="Investment ceiling" value={`$${f["Investment budget"]}`} />
      </header>
      <div className="investment-options">
        {["A", "B", "C"].map((option) => (
          <section
            key={option}
            className={g.values.investment === option ? "selected" : ""}
          >
            <span>OPTION {option}</span>
            <h3>${Number(f[`Option ${option} return`]).toLocaleString()}</h3>
            <small>Projected return</small>
            <p>Required capital: ${f[`Option ${option} cost`]}</p>
            {g.flags.includes("compare-return") && (
              <strong>
                Net: $
                {(
                  Number(f[`Option ${option} return`]) -
                  Number(f[`Option ${option} cost`])
                ).toFixed(2)}
              </strong>
            )}
            <Action p={p} id="inspect-option" value={option}>
              Inspect business case
            </Action>
            <Action p={p} id="choose-investment" value={option}>
              Select investment {option}
            </Action>
          </section>
        ))}
      </div>
      {g.values.selectedOption && (
        <Pane title={`Case documents · Option ${g.values.selectedOption}`}>
          <p>{p.scenario.data.sources[0].body}</p>
          <p>
            Funding requirement: ${f[`Option ${g.values.selectedOption} cost`]}.
            Expected return: ${f[`Option ${g.values.selectedOption} return`]}.
            Compare capital exposure and demand risk before making a commitment.
          </p>
          <div className="record-strip">
            {["A", "B", "C"].map((option) => (
              <Stat
                key={option}
                label={`Risk-adjusted net · ${option}`}
                value={g.values["adjusted-" + option] ?? "Apply risk weight"}
              />
            ))}
          </div>
        </Pane>
      )}
      <div className="decision-controls">
        <Pane title="Scenario & risk model">
          <NumberControl
            label="Risk weighting %"
            value={risk}
            onChange={setRisk}
            max={100}
          />
          <Action p={p} id="set-risk-weight" value={risk}>
            Apply risk weight
          </Action>
          <Action p={p} id="compare-return">
            Compare net returns
          </Action>
          <Action p={p} id="stress-test">
            Stress-test 20% demand decline
          </Action>
          <p>
            Stress return:{" "}
            {g.values.stressReturn
              ? `$${g.values.stressReturn}`
              : "Run the stress model"}
          </p>
        </Pane>
        <Pane title="Decision safeguards">
          <Action
            p={p}
            id="mitigate-risk"
            value="Release funding in controlled tranches"
          >
            Stage investment funding
          </Action>
          <Action p={p} id="request-board-review">
            Obtain board review
          </Action>
          <p>{g.values.mitigation || "Risk mitigation unrecorded"}</p>
          <Completion
            p={p}
            id="commit-decision"
            label="Commit investment decision"
          />
        </Pane>
      </div>
      <Trace p={p} />
    </div>
  );
}
