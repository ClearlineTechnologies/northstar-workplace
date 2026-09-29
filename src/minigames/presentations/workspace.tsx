"use client";
import { useState } from "react";
import { MiniChart } from "../../features/editors";
import type { GameProps } from "../runtime/types";
import { Action, Completion, Pane, Select, Trace } from "../ui/common";
export function PresentationStudio(p: GameProps) {
  const g = p.scenario.gameplay!,
    s = p.scenario;
  const [block, setBlock] = useState("Situation");
  const current = s.draft.slides[Number(g.values.slide || 0)];
  return (
    <div
      data-system="PresentationStudio"
      className={`presentation-studio ${g.phase === "presenting" ? "presenting" : ""}`}
    >
      <div className="deck-toolbar">
        <Action p={p} id="add-slide" value={block}>
          Add slide
        </Action>
        <Select
          label="Slide content block"
          value={block}
          options={["Situation", "Evidence", "Recommendation"]}
          onChange={setBlock}
        />
        <Action p={p} id="choose-slide-content" value={block}>
          Insert source-backed content
        </Action>
        <Action p={p} id="add-chart">
          Insert data chart
        </Action>
        <Action p={p} id="add-speaker-note">
          Add presenter cue
        </Action>
        <Action p={p} id="start-presentation">
          ▶ Present deck
        </Action>
      </div>
      <div className="deck-layout">
        <aside className="slide-thumbnails">
          {s.draft.slides.map((slide, i) => (
            <div
              className={Number(g.values.slide) === i ? "selected" : ""}
              key={i}
            >
              <span>{i + 1}</span>
              <button onClick={() => p.act({ key: "select-slide", value: i })}>
                {slide.title}
              </button>
              <Action p={p} id="remove-slide" target={String(i)}>
                Remove slide
              </Action>
              <small>{slide.text.slice(0, 50)}</small>
              <Action p={p} id="reorder-slide" target={String(i)}>
                Move to first
              </Action>
            </div>
          ))}
        </aside>
        <section>
          {current && g.phase !== "presenting" && (
            <div className="slide-edit-fields" key={String(g.values.slide)}>
              <label>
                Title
                <input
                  aria-label="Slide title"
                  defaultValue={current.title}
                  onBlur={(e) =>
                    p.act({
                      key: "edit-slide",
                      option: "title",
                      value: e.target.value,
                    })
                  }
                />
              </label>
              <label>
                Content
                <textarea
                  aria-label="Slide content"
                  defaultValue={current.text}
                  onBlur={(e) =>
                    p.act({
                      key: "edit-slide",
                      option: "text",
                      value: e.target.value,
                    })
                  }
                />
              </label>
              <label>
                Notes
                <textarea
                  aria-label="Presenter notes"
                  defaultValue={current.notes}
                  onBlur={(e) =>
                    p.act({
                      key: "edit-slide",
                      option: "notes",
                      value: e.target.value,
                    })
                  }
                />
              </label>
              <select
                aria-label="Slide layout"
                value={String(
                  g.values["layout-" + g.values.slide] || "Title and content",
                )}
                onChange={(e) =>
                  p.act({ key: "slide-layout", value: e.target.value })
                }
              >
                {["Title and content", "Two columns", "Data focus"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>
          )}
          <div
            className={`presentation-screen ${g.values["layout-" + g.values.slide] === "Two columns" ? "two-column-slide" : ""}`}
          >
            <span>
              NORTHSTAR · {Number(g.values.slide || 0) + 1} /{" "}
              {s.draft.slides.length}
            </span>
            <h1>{current?.title || "Build a workplace story"}</h1>
            <p>
              {current?.text ||
                "Use the slide controls to assemble a situation, evidence, and recommendation."}
            </p>
            {current?.chart && <MiniChart content={current.chart} />}
          </div>
          <div className="speaker-notes">
            Speaker cue: {current?.notes || "No cue added"}
          </div>
          <Action p={p} id="next-slide">
            Next slide →
          </Action>
          {g.phase === "presenting" && (
            <Pane title="Audience question">
              <p>
                {g.values.question ||
                  "Who owns the next action and what evidence supports it?"}
              </p>
              <Action p={p} id="answer-audience" value="Cite data and owner">
                Cite the data and accountable owner
              </Action>
              <Action
                p={p}
                id="answer-audience"
                value="Promise results without evidence"
              >
                Promise results without evidence
              </Action>
            </Pane>
          )}
          <Completion
            p={p}
            id="finish-presentation"
            label="Finish presentation & record audience response"
          />
        </section>
      </div>
      <Trace p={p} />
    </div>
  );
}
