"use client";
import { useState } from "react";
import { clock } from "../../simulation/generators/random";
import type { GameProps } from "../runtime/types";
import {
  Action,
  Completion,
  NumberControl,
  Pane,
  Select,
  Stat,
  Trace,
} from "../ui/common";
export function CalendarPlanner(p: GameProps) {
  const g = p.scenario.gameplay!;
  const [room, setRoom] = useState("Cedar room"),
    [attendee, setAttendee] = useState(p.company.manager),
    [move, setMove] = useState(750);
  const selected = Number(g.values.slot || 0);
  return (
    <div data-system="CalendarPlanner" className="calendar-planner">
      <header>
        <h2>Day planner · Workday {p.state.day}</h2>
        <span>
          Click an open slot or drag a case appointment to reschedule.
        </span>
      </header>
      <div className="planner-layout">
        <div className="planner-grid">
          <div className="planner-head">
            <span>Time</span>
            <b>Your calendar</b>
            <b>Case appointments</b>
          </div>
          {Array.from({ length: 17 }, (_, i) => 510 + i * 30).map((time) => (
            <div
              className={`planner-slot ${selected === time ? "selected" : ""}`}
              key={time}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const id = e.dataTransfer.getData("text/plain");
                if (id)
                  p.act({ key: "reschedule-event", target: id, value: time });
              }}
            >
              <time>{clock(time)}</time>
              <button
                onClick={() => p.act({ key: "select-slot", value: time })}
              >
                {p.state.calendar
                  .filter(
                    (e) =>
                      !e.cancelled && e.day === p.state.day && e.start === time,
                  )
                  .map((e) => (
                    <span className="busy-appointment" key={e.id}>
                      {e.title}
                    </span>
                  ))}
                {selected === time ? "Selected reservation" : "Reserve slot"}
              </button>
              <div>
                {g.records
                  .filter((r) => r.amount === time && r.status !== "cancelled")
                  .map((r) => (
                    <div
                      className="draggable-appointment"
                      draggable
                      onDragStart={(e) =>
                        e.dataTransfer.setData("text/plain", r.id)
                      }
                      key={r.id}
                    >
                      {r.label}
                      <Action p={p} id="cancel-event" target={r.id}>
                        Cancel
                      </Action>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
        <Pane title="Booking details">
          <Stat
            label="Selected time"
            value={selected ? clock(selected) : "No time selected"}
          />
          <Select
            label="Required attendee"
            value={attendee}
            options={p.company.employees.map((e) => e.name)}
            onChange={setAttendee}
          />
          <Action p={p} id="select-attendee" value={attendee}>
            Add attendee
          </Action>
          <p>{g.evidence.join(", ")}</p>
          <Select
            label="Meeting room"
            value={room}
            options={["Cedar room", "Atlas room", "Video conference"]}
            onChange={setRoom}
          />
          <Action p={p} id="book-room" value={room}>
            Book room
          </Action>
          <Action p={p} id="hold-slot">
            Place temporary hold
          </Action>
          <Action p={p} id="check-conflicts">
            Check all conflicts
          </Action>
          <NumberControl
            label="Move first case appointment to minute"
            value={move}
            onChange={setMove}
            min={480}
            max={990}
          />
          <Action
            p={p}
            id="reschedule-event"
            target={g.records[0].id}
            value={move}
          >
            Reschedule case appointment
          </Action>
          <p
            className={Number(g.values.conflicts) > 0 ? "conflict-warning" : ""}
          >
            Conflicts: {g.values.conflicts ?? "Unchecked"}
          </p>
          <Completion
            p={p}
            id="send-invites"
            label="Send meeting invitations"
          />
          <Trace p={p} />
        </Pane>
      </div>
    </div>
  );
}
