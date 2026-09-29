"use client";
import { useState } from "react";
import type { GameProps } from "../runtime/types";
import { Action, Completion, Pane, Select, Trace } from "../ui/common";
export function EmailClient(p: GameProps) {
  const g = p.scenario.gameplay!,
    s = p.scenario;
  const [folder, setFolder] = useState("Inbox"),
    [attachment, setAttachment] = useState("Order record"),
    [search, setSearch] = useState("");
  const messages = p.state.mail.filter(
    (m) =>
      (folder === "Archive"
        ? m.archived
        : m.folder === folder && !m.archived) &&
      (m.subject + m.body).toLowerCase().includes(search.toLowerCase()),
  );
  const opened = p.state.mail.find((m) => m.id === g.values.message);
  return (
    <div data-system="EmailClient" className="mail-simulator">
      <aside>
        <h3>Mail</h3>
        {["Inbox", "Draft", "Sent", "Archive"].map((f) => (
          <button
            className={f === folder ? "selected" : ""}
            key={f}
            onClick={() => setFolder(f)}
          >
            {f}
            <span>
              {f === "Inbox"
                ? 1
                : f === "Sent" && g.flags.includes("send-mail")
                  ? 1
                  : 0}
            </span>
          </button>
        ))}
      </aside>
      <div className="training-messages">
        <h4>{folder}</h4>
        <input
          aria-label="Search mail"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {messages.map((m) => (
          <button
            key={m.id}
            onClick={() => p.act({ key: "open-message", target: m.id })}
          >
            <small>
              {m.from} · {m.read ? "Read" : "Unread"}
            </small>
            <strong>{m.subject}</strong>
          </button>
        ))}
        {folder === "Inbox" && !messages.some((m) => m.scenarioId === s.id) && (
          <button
            onClick={() => p.act({ key: "open-message", target: "primary" })}
          >
            <small>{s.participants[0]}</small>
            <strong>{g.familyName}</strong>
            <p>{s.data.facts["Case type"]}</p>
          </button>
        )}
        <div className="mail-thread-events">
          {g.history
            .filter((h) =>
              ["clarify", "send-mail", "forward"].includes(h.action),
            )
            .map((h, i) => (
              <p key={i}>{h.detail}</p>
            ))}
        </div>
      </div>
      <section className="message-reader">
        <h2>{opened?.subject || g.familyName}</h2>
        <small>
          {s.participants[0]} → You · {String(s.data.facts.Reference)}
        </small>
        {g.flags.includes("open-message") ? (
          <>
            {opened && <p>{opened.body}</p>}
            <blockquote>
              Please review {String(s.data.facts.Quantity)}{" "}
              {String(s.data.facts.Product)} units. {g.brief} {g.complication}.
            </blockquote>
            <div className="mail-toolbar">
              <Action p={p} id="flag-mail">
                {g.values.flagged ? "Remove flag" : "Flag for follow-up"}
              </Action>
              <Action p={p} id="reply">
                Reply
              </Action>
              <Action p={p} id="reply-all">
                Reply all
              </Action>
              <Action p={p} id="forward">
                Forward to Finance
              </Action>
            </div>
            <Pane title="Processing actions">
              <div className="control-row">
                <Action p={p} id="clarify">
                  Ask for clarification
                </Action>
                <Action p={p} id="approve">
                  Approve request
                </Action>
                <Action p={p} id="reject">
                  Reject request
                </Action>
                <Action p={p} id="escalate-mail">
                  Escalate to manager
                </Action>
                <Action p={p} id="add-task">
                  Add task
                </Action>
                <Action p={p} id="follow-up">
                  Schedule follow-up
                </Action>
              </div>
            </Pane>
            {g.values.mode && (
              <Pane title={`${g.values.mode} · ${g.values.recipient}`}>
                <textarea
                  aria-label="Email reply body"
                  defaultValue={String(g.values.body || "")}
                  onBlur={(e) =>
                    p.act({ key: "write-mail", value: e.target.value })
                  }
                />
                <p className="structured-message">
                  {g.values.response ||
                    "Choose a processing action to create the reply."}{" "}
                  Reference {String(s.data.facts.Reference)}. Owner:{" "}
                  {p.company.manager}.
                </p>
                <Select
                  label="Attach workplace evidence"
                  value={attachment}
                  options={[
                    "Order record",
                    "Delivery receipt",
                    ...p.state.artifacts.map((a) => a.title),
                  ]}
                  onChange={setAttachment}
                />
                <Action p={p} id="attach" value={attachment}>
                  Attach selected record
                </Action>
                <ul>
                  {g.evidence.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
                <Action p={p} id="send-mail">
                  Send reply
                </Action>
              </Pane>
            )}
            <Completion
              p={p}
              id="archive-thread"
              label="Archive resolved thread"
            />
          </>
        ) : (
          <Action p={p} id="open-message" target="primary">
            Open message
          </Action>
        )}
        <Trace p={p} />
      </section>
    </div>
  );
}
