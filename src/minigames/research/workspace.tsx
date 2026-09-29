"use client";
import { useState } from "react";
import type { GameProps } from "../runtime/types";
import { Action, Completion, Pane, Trace } from "../ui/common";
export function EvidenceLibrary(p: GameProps) {
  const g = p.scenario.gameplay!,
    s = p.scenario;
  const [search, setSearch] = useState("");
  const source = s.data.sources.find((v) => v.id === g.values.source);
  return (
    <div data-system="EvidenceLibrary" className="evidence-library">
      <aside>
        <h3>Internal source library</h3>
        <input
          aria-label="Search source library"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {s.data.sources
          .filter((v) =>
            (v.title + v.body).toLowerCase().includes(search.toLowerCase()),
          )
          .map((v) => (
            <button
              key={v.id}
              className={g.values.source === v.id ? "selected" : ""}
              onClick={() => p.act({ key: "inspect-source", target: v.id })}
            >
              <strong>{v.title}</strong>
              <small>{v.date}</small>
            </button>
          ))}
      </aside>
      <section>
        <div className="source-document">
          <span>READING ROOM · {source?.date || "Select a source"}</span>
          <h2>{source?.title || "Investigate the evidence"}</h2>
          <p>{source?.body || g.brief}</p>
          <Action p={p} id="collect-source">
            Collect as evidence
          </Action>
          <Action p={p} id="check-date">
            Check currency
          </Action>
          <Action p={p} id="trace-origin">
            Trace source provenance
          </Action>
          <Action p={p} id="exclude-source" target={source?.id}>
            Exclude superseded source
          </Action>
        </div>
        <Pane title="Evidence board">
          <div className="evidence-cards">
            {g.evidence.map((id) => (
              <div key={id}>
                <strong>
                  {s.data.sources.find((v) => v.id === id)?.title}
                </strong>
                <small>{s.data.sources.find((v) => v.id === id)?.date}</small>
              </div>
            ))}
          </div>
          <Action p={p} id="compare-sources">
            Compare collected sources
          </Action>
          <p>{g.values.comparison}</p>
        </Pane>
        <div className="finding-choices">
          <Action p={p} id="select-finding" value="Current records govern">
            Use current verified records
          </Action>
          <Action p={p} id="select-finding" value="Archived proposal governs">
            Use archived pricing proposal
          </Action>
          <Action p={p} id="select-finding" value="Evidence is inconclusive">
            Mark evidence inconclusive
          </Action>
        </div>
        <Completion
          p={p}
          id="publish-finding"
          label="Publish evidenced finding"
        />
        <Trace p={p} />
      </section>
    </div>
  );
}
