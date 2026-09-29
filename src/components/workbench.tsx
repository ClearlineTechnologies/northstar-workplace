"use client";
import Link from "next/link";
import { useState } from "react";
import { definition, level, levels } from "../minigames/catalog";
import { gameDefinition } from "../minigames/manifest";
import { GameSurface } from "../minigames/ui/registry";
import type { Category } from "../simulation/types";
import { useWorkplace } from "./provider";
import { SectionTitle } from "./shell";
export function Workbench({
  category,
  assignmentId,
}: {
  category: Category;
  assignmentId?: string;
}) {
  const { state, send, busy } = useWorkplace();
  const [seed, setSeed] = useState(""),
    [difficulty, setDifficulty] = useState(""),
    [override, setOverride] = useState(false);
  if (!state) return null;
  const def = definition(category)!,
    manifest = gameDefinition(category);
  const current =
    (!override && assignmentId
      ? state.scenarios.find(
          (s) => s.id === assignmentId && s.category === category,
        )
      : undefined) || state.scenarios.find((s) => s.category === category);
  const start = () => {
    setOverride(true);
    void send({
      type: "launch",
      category,
      seed: seed ? Number(seed) : undefined,
      difficulty: difficulty ? Number(difficulty) : level(state.xp) + 1,
    });
  };
  return (
    <>
      <Link className="back-link" href="/">
        ← Workplace systems
      </Link>
      <SectionTitle
        eyebrow={manifest.uniqueInteractionType.replaceAll("-", " ")}
        title={def.name}
        description={def.description}
      />
      <div className="system-launchbar">
        <label>
          Difficulty
          <select
            aria-label="Difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="">Your level</option>
            {levels.map((l, i) => (
              <option value={i + 1} key={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label>
          Scenario seed
          <input
            type="number"
            aria-label="Scenario seed"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
          />
        </label>
        <button className="button" disabled={busy} onClick={start}>
          {current ? "New case" : "Open work system"}
        </button>
        <small>
          {manifest.scenarioFamilies.length} process families · Every action
          saves immediately
        </small>
      </div>
      {current?.gameplay ? (
        <>
          <div className="case-brief">
            <div>
              <span className="eyebrow">{current.gameplay.familyName}</span>
              <p>{current.gameplay.brief}</p>
            </div>
            <div className="case-requirements">
              {current.gameplay.required.map((key) => (
                <span
                  className={
                    current.gameplay!.flags.includes(key) ? "done" : ""
                  }
                  key={key}
                >
                  {current.gameplay!.flags.includes(key) ? "✓" : "○"}{" "}
                  {key.replaceAll("-", " ")}
                </span>
              ))}
            </div>
            <span className="case-constraint">
              {current.gameplay.complication}
            </span>
          </div>
          {current.result ? (
            <section className="review-panel">
              <div className="review-score">
                {current.result.score}
                <span>/100</span>
              </div>
              <div>
                <h2>
                  {current.result.passed
                    ? "Work recorded successfully"
                    : "Work recorded with control failures"}
                </h2>
                <p>{current.gameplay.outcome}</p>
                <ul>
                  {current.result.feedback.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
                <Link href="/app/tasks" className="button secondary">
                  Continue linked work
                </Link>
              </div>
            </section>
          ) : (
            <GameSurface
              scenario={current}
              company={state.company}
              state={state}
              busy={busy}
              act={(gameAction) =>
                void send({ type: "game-action", id: current.id, gameAction })
              }
            />
          )}
        </>
      ) : (
        <div className="system-entry">
          <h2>
            {manifest.primaryUIComponent.replace(/([A-Z])/g, " $1").trim()}
          </h2>
          <p>
            Open a generated case to work with the {def.app.toLowerCase()}{" "}
            tools.
          </p>
          <button className="button" onClick={start}>
            Open work system
          </button>
          <div className="family-library">
            {manifest.scenarioFamilies.map((family) => (
              <span key={family.id}>{family.name}</span>
            ))}
          </div>
        </div>
      )}
      <details className="history panel">
        <summary>Saved cases</summary>
        {state.scenarios
          .filter((s) => s.category === category)
          .map((s) => (
            <Link
              className="list-row"
              href={`/sim/${category}?assignment=${s.id}`}
              key={s.id}
              onClick={() => setOverride(false)}
            >
              <span>
                {s.gameplay?.familyName || s.title} · Seed {s.seed}
              </span>
              <strong>{s.result ? `${s.result.score}%` : "In progress"}</strong>
            </Link>
          ))}
      </details>
    </>
  );
}
