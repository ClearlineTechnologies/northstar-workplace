"use client";
import { useState } from "react";
import type { GameProps } from "../runtime/types";
import { Action, Completion, Select, Trace } from "../ui/common";
export function DocumentComposer(p: GameProps) {
  const g = p.scenario.gameplay!;
  const [section, setSection] = useState("Purpose"),
    [audience, setAudience] = useState("Operations"),
    [classification, setClassification] = useState("Internal");
  const sections = g.records.filter((r) => r.status === "section");
  return (
    <div data-system="DocumentComposer" className="document-composer">
      <aside>
        <h3>Document building blocks</h3>
        <Select
          label="Section block"
          value={section}
          options={["Purpose", "Facts", "Action", "Approval", "Distribution"]}
          onChange={setSection}
        />
        <Action p={p} id="add-section" value={section}>
          Insert section
        </Action>
        <Action p={p} id="insert-reference">
          Insert verified source reference
        </Action>
        <Select
          label="Document audience"
          value={audience}
          options={p.company.departments}
          onChange={setAudience}
        />
        <Action p={p} id="choose-audience" value={audience}>
          Set audience
        </Action>
        <Select
          label="Handling classification"
          value={classification}
          options={["Internal", "Confidential", "Public"]}
          onChange={setClassification}
        />
        <Action p={p} id="set-classification" value={classification}>
          Apply classification
        </Action>
      </aside>
      <div className="document-paper">
        <header>
          <span>
            NORTHSTAR WORKS · {g.values.classification || "UNCLASSIFIED"}
          </span>
          <h1>{g.familyName}</h1>
          <p>
            For {g.values.audience || "Audience not selected"} ·{" "}
            {g.values.reference || "Reference not inserted"}
          </p>
        </header>
        {sections.map((r) => (
          <section key={r.id}>
            <h3>{r.label}</h3>
            <textarea
              aria-label={`${r.label} section text`}
              defaultValue={String(
                g.values["text-" + r.id] ||
                  (r.label === "Facts"
                    ? `${p.scenario.data.facts.Quantity} units of ${p.scenario.data.facts.Product}; reference ${p.scenario.data.facts.Reference}.`
                    : r.label === "Action"
                      ? `Owner: ${p.company.manager}. Confirm the next action by ${p.scenario.deadline} minutes after midnight.`
                      : g.brief),
              )}
              onBlur={(e) =>
                p.act({
                  key: "edit-section",
                  target: r.id,
                  value: e.target.value,
                })
              }
            />
            <select
              aria-label={`${r.label} formatting`}
              value={String(g.values["format-" + r.id] || "Paragraph")}
              onChange={(e) =>
                p.act({
                  key: "format-section",
                  target: r.id,
                  value: e.target.value,
                })
              }
            >
              {["Paragraph", "Bullet list", "Bold callout"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
            <div
              className={
                String(g.values["format-" + r.id] || "").includes("Bold")
                  ? "font-bold"
                  : ""
              }
            >
              {g.values["text-" + r.id]}
            </div>
            <Action p={p} id="move-section" target={r.id}>
              Move section upward
            </Action>
          </section>
        ))}
        {!sections.length && (
          <p>Select document sections from the assembly panel.</p>
        )}
        <div className="document-signoff">
          <Action p={p} id="save-version">
            Save document version
          </Action>
          <span>Version {g.values.version || 0}</span>
          <Action p={p} id="review-document">
            Validate document against source
          </Action>
          <Action p={p} id="sign-document">
            Record manager signature
          </Action>
          <Completion
            p={p}
            id="issue-document"
            label="Issue controlled document"
          />
        </div>
      </div>
      <Trace p={p} />
    </div>
  );
}
