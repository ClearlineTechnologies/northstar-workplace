"use client";
import { useWorkplace } from "../../components/provider";
import { clock } from "../../simulation/generators/random";
import type { GameProps } from "../runtime/types";
import { Action, Completion, Stat, Trace } from "../ui/common";
import { GameSurface } from "../ui/registry";
export function WorkdayDesktop(p: GameProps) {
  const g = p.scenario.gameplay!;
  const { send } = useWorkplace();
  const linked = p.state.tasks.filter((task) =>
    task.id.startsWith(`shift-${p.scenario.seed}-`),
  );
  const selected = p.state.scenarios.find((s) => s.id === g.values.app);
  return (
    <div data-system="WorkdayDesktop" className="workday-desktop">
      <div className="shift-top">
        <h2>Company shift console</h2>
        <Stat label="Clock" value={clock(p.state.minute)} />
        <Stat
          label="Commitments complete"
          value={`${linked.filter((t) => t.done).length}/${linked.length}`}
        />
        <Action p={p} id="launch-shift">
          Log in & launch generated shift
        </Action>
      </div>
      <div className="shift-layout">
        <aside>
          <h3>Today’s work applications</h3>
          {linked.map((t) => (
            <button
              className={selected?.id === t.scenarioId ? "selected" : ""}
              key={t.id}
              onClick={() =>
                p.act({ key: "open-work-app", value: t.scenarioId })
              }
            >
              <time>{clock(t.due)}</time>
              <strong>{t.title}</strong>
              <small>{t.done ? "✓ Completed" : "Open work system →"}</small>
            </button>
          ))}
          <Action p={p} id="triage-interruption">
            Triage incoming interruption
          </Action>
          <Action p={p} id="manager-checkin">
            Send manager status check
          </Action>
          <Action p={p} id="lunch-break">
            Take lunch break
          </Action>
          <Action p={p} id="advance-shift">
            Advance shift 30 minutes
          </Action>
          <Action p={p} id="review-shift">
            Review day’s commitments
          </Action>
          <Completion p={p} id="close-shift" label="Close completed workday" />
        </aside>
        <section className="embedded-work-app">
          {selected ? (
            <>
              <div className="embedded-app-title">
                ACTIVE APPLICATION · {selected.category}
              </div>
              {selected.result ? (
                <div className="completed-embedded">
                  <h2>Work recorded · {selected.result.score}%</h2>
                  <p>{selected.gameplay?.outcome}</p>
                </div>
              ) : (
                <GameSurface
                  {...p}
                  scenario={selected}
                  act={(gameAction) =>
                    void send({
                      type: "game-action",
                      id: selected.id,
                      gameAction,
                    })
                  }
                />
              )}
            </>
          ) : (
            <div className="shift-welcome">
              <h2>Your workday is a connected workplace.</h2>
              <p>
                Launch the shift, then open each task. Calls open the phone
                console, invoices open the payment desk, and meetings open the
                meeting room here.
              </p>
              <div className="shift-app-symbols">☎ ▤ ▦ ▥ ◷</div>
            </div>
          )}
        </section>
      </div>
      <Trace p={p} />
    </div>
  );
}
