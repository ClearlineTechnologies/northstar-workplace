"use client";
import { useState } from "react";
import type { GameProps } from "../runtime/types";
import { Action, Completion, NumberControl, Pane, Trace } from "../ui/common";
export function MeetingRoom(p: GameProps) {
  const g = p.scenario.gameplay!,
    s = p.scenario;
  const [due, setDue] = useState(900);
  return (
    <div data-system="MeetingRoom" className="meeting-room">
      <aside className="meeting-roster">
        <h3>Participants</h3>
        {s.participants.map((person, i) => (
          <div
            className={i === Number(g.values.speaker) ? "speaking" : ""}
            key={person}
          >
            <div className="avatar">{person.slice(0, 2)}</div>
            <span>
              {person}
              <small>
                {i === Number(g.values.speaker) ? "Speaking" : "Listening"}
              </small>
            </span>
          </div>
        ))}
        <Action p={p} id="join">
          Join meeting
        </Action>
      </aside>
      <section className="meeting-stage">
        <div className="agenda-track">
          {s.data.agenda.map((a, i) => (
            <div
              className={
                i === Number(g.values.turn)
                  ? "current"
                  : i < Number(g.values.turn)
                    ? "done"
                    : ""
              }
              key={a}
            >
              <b>{i + 1}</b>
              {a}
            </div>
          ))}
        </div>
        <div className="speaker-card">
          <span>FLOOR · {s.participants[Number(g.values.speaker)]}</span>
          <h2>
            {s.data.agenda[Number(g.values.turn)] || "Review the minutes"}
          </h2>
          <p>{g.outcome || g.brief}</p>
        </div>
        <div className="meeting-motions">
          <Action p={p} id="agree">
            Agree with motion
          </Action>
          <Action p={p} id="disagree">
            Disagree / amend
          </Action>
          <Action p={p} id="ask-evidence">
            Ask for evidence
          </Action>
          <Action p={p} id="clarify-motion">
            Request clarification
          </Action>
          <Action p={p} id="raise-risk">
            Raise delivery risk
          </Action>
          <Action p={p} id="defer">
            Defer pending evidence
          </Action>
        </div>
        <Pane title="Accountable action items">
          <Action p={p} id="volunteer">
            Volunteer for task
          </Action>
          <NumberControl
            label="Action deadline (minutes after midnight)"
            value={due}
            onChange={setDue}
            min={540}
            max={1020}
          />
          <Action p={p} id="suggest-deadline" value={due}>
            Suggest deadline
          </Action>
          <Action p={p} id="add-action">
            Add action to minutes
          </Action>
          <label>
            Assign action owner
            <select
              aria-label="Meeting action owner"
              value={String(g.values.owner || "You")}
              onChange={(e) =>
                p.act({ key: "assign-action-owner", value: e.target.value })
              }
            >
              <option>You</option>
              {p.company.employees.map((e) => (
                <option key={e.id}>{e.name}</option>
              ))}
            </select>
          </label>
          <textarea
            aria-label="Meeting minutes"
            defaultValue={String(g.values.minutes || "")}
            onBlur={(e) =>
              p.act({ key: "write-minutes", value: e.target.value })
            }
          />
          <p>
            Owner: {g.values.owner || "Unassigned"} · {g.values.actions || 0}{" "}
            actions saved
          </p>
        </Pane>
        <div className="meeting-next">
          <Action p={p} id="next-agenda">
            Move to next agenda item →
          </Action>
          <Completion p={p} id="adjourn" label="Adjourn & distribute minutes" />
        </div>
        <Trace p={p} />
      </section>
    </div>
  );
}
