"use client";
import {
  Archive,
  ArrowRight,
  CalendarPlus,
  Download,
  Edit3,
  Mail as MailIcon,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Field, SheetEditor, SlideEditor } from "../features/editors";
import { categories, level, levels } from "../minigames/catalog";
import { clock } from "../simulation/generators/random";
import type {
  Artifact,
  CalendarEvent,
  Category,
  Mail,
} from "../simulation/types";
import { useWorkplace } from "./provider";
import { EmptyState, SectionTitle } from "./shell";
export function Application({ name }: { name: string }) {
  const { state: s } = useWorkplace();
  if (!s) return null;
  return (
    <>
      <SectionTitle
        eyebrow="NORTHSTAR WORKSTATION"
        title={name}
        description={
          descriptions[name] ||
          "Manage the records, people, and work that keep the company moving."
        }
      />
      {name === "Inbox" ? (
        <Inbox />
      ) : name === "Calendar" ? (
        <Calendar />
      ) : name === "Chat" ? (
        <Chat />
      ) : name === "Tasks" ? (
        <Tasks />
      ) : ["Documents", "Spreadsheet", "Reports", "Presentations"].includes(
          name,
        ) ? (
        <Artifacts name={name} />
      ) : name === "Performance" ? (
        <Performance />
      ) : (
        <Records name={name} />
      )}
      <section className="app-assignments">
        <div className="content-heading">
          <div>
            <h2>Practice in {name}</h2>
            <p>Work with generated assignments that update your company.</p>
          </div>
        </div>
        <div className="simulation-grid compact-grid">
          {categories
            .filter(
              (c) => c.app === name || (name === "Phone" && c.id === "phone"),
            )
            .map((c) => (
              <Link
                className="simulation-card"
                href={`/sim/${c.id}`}
                key={c.id}
              >
                <h3>
                  {c.name}
                  <ArrowRight size={16} />
                </h3>
                <p>{c.description}</p>
                <span className="text-link">Open assignment</span>
              </Link>
            ))}
        </div>
      </section>
    </>
  );
}
const descriptions: Record<string, string> = {
  Inbox: "The conversations that move your work forward.",
  Calendar: "Make time for the people and work that matter.",
  Tasks: "Every commitment, organized in one place.",
  Chat: "Keep your coworkers informed and your work connected.",
  Documents: "Create, edit, and share clear workplace documents.",
  Spreadsheet: "Turn raw records into useful calculations.",
  Reports: "Make the evidence useful to your team.",
  Presentations: "Tell a clear story with your workplace data.",
  Performance: "See the skills you are building through real practice.",
};
function Inbox() {
  const { state: s, send } = useWorkplace();
  const [selected, setSelected] = useState(""),
    [search, setSearch] = useState(""),
    [folder, setFolder] = useState("Inbox"),
    [compose, setCompose] = useState(false),
    [draft, setDraft] = useState({
      to: "",
      subject: "",
      body: "",
      attachment: "",
    });
  if (!s) return null;
  const message = s.mail.find((m) => m.id === selected);
  const list = s.mail.filter(
    (m) =>
      (folder === "All" || folder === "Archive"
        ? folder === "All" || m.archived
        : !m.archived &&
          (folder === "Inbox" ? m.folder !== "Sent" : m.folder === folder)) &&
      (m.subject + m.from + m.body)
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const reply = (forward = false) => {
    if (!message) return;
    setDraft({
      to: forward ? "" : message.from,
      subject: (forward ? "Fwd: " : "Re: ") + message.subject,
      body: forward ? `Forwarded from ${message.from}:\n${message.body}` : "",
      attachment: message.attachments[0] || "",
    });
    setCompose(true);
  };
  const sendMail = async () => {
    const mail: Mail = {
      id: "",
      from: "You",
      to: draft.to,
      subject: draft.subject,
      body: draft.body,
      read: true,
      archived: false,
      folder: "Sent",
      attachments: draft.attachment ? [draft.attachment] : [],
      at: s.minute,
    };
    if (await send({ type: "mail-send", mail })) {
      setCompose(false);
      setDraft({ to: "", subject: "", body: "", attachment: "" });
      setFolder("Sent");
    }
  };
  return (
    <section className="panel">
      <div className="app-toolbar">
        <div className="filter-tabs compact">
          {["Inbox", "Sent", "Reviews", "Archive", "All"].map((v) => (
            <button
              key={v}
              className={folder === v ? "selected" : ""}
              onClick={() => setFolder(v)}
            >
              {v}
            </button>
          ))}
        </div>
        <button
          className="button"
          onClick={() => {
            setCompose(true);
            setDraft({ to: "", subject: "", body: "", attachment: "" });
          }}
        >
          <Plus size={16} />
          Compose
        </button>
      </div>
      <Field label="Search mail" value={search} onChange={setSearch} />
      <div className="mail-layout">
        <div className="mail-list">
          {list.map((m) => (
            <button
              className={`mail-item ${m.id === selected ? "selected" : ""} ${m.read ? "" : "unread"}`}
              key={m.id}
              onClick={() => {
                setSelected(m.id);
                setCompose(false);
                void send({ type: "mail-read", id: m.id });
              }}
            >
              <span>
                {m.from}
                <small>{clock(m.at)}</small>
              </span>
              <strong>{m.subject}</strong>
              <p>{m.body.slice(0, 85)}</p>
            </button>
          ))}
          {!list.length && <p className="muted">No messages in this view.</p>}
        </div>
        <div className="mail-content">
          {compose ? (
            <>
              <h3>New message</h3>
              <div className="form-grid">
                <Field
                  label="To"
                  value={draft.to}
                  onChange={(to) => setDraft({ ...draft, to })}
                />
                <Field
                  label="Subject"
                  value={draft.subject}
                  onChange={(subject) => setDraft({ ...draft, subject })}
                />
                <Field
                  label="Message"
                  value={draft.body}
                  onChange={(body) => setDraft({ ...draft, body })}
                  multiline
                />
                <Field
                  label="Attachment"
                  value={draft.attachment}
                  onChange={(attachment) => setDraft({ ...draft, attachment })}
                  options={s.artifacts.map((a) => ({
                    value: a.id,
                    label: a.title,
                  }))}
                />
              </div>
              <button className="button" onClick={() => void sendMail()}>
                <Send size={15} />
                Send message
              </button>
            </>
          ) : message ? (
            <>
              <span className="eyebrow">
                {message.folder} · {clock(message.at)}
              </span>
              <h2>{message.subject}</h2>
              <p className="muted">
                From {message.from} · To {message.to}
              </p>
              <div className="mail-body">{message.body}</div>
              {message.attachments.map((id) => {
                const a = s.artifacts.find((v) => v.id === id);
                return a ? (
                  <details key={id}>
                    <summary>Attachment: {a.title}</summary>
                    <pre>
                      {a.body || JSON.stringify(a.cells || a.slides, null, 2)}
                    </pre>
                  </details>
                ) : null;
              })}
              <div className="sheet-toolbar">
                <button className="subtle" onClick={() => reply()}>
                  <MailIcon size={15} />
                  Reply
                </button>
                <button className="subtle" onClick={() => reply(true)}>
                  Forward
                </button>
                <button
                  className="subtle"
                  onClick={() =>
                    void send({
                      type: "mail-organize",
                      id: message.id,
                      fields: { archive: String(!message.archived) },
                    })
                  }
                >
                  <Archive size={15} />
                  {message.archived ? "Restore" : "Archive"}
                </button>
                <button
                  className="subtle"
                  onClick={() =>
                    void send({
                      type: "task-create",
                      category: "email",
                      fields: { title: message.subject },
                    })
                  }
                >
                  Create task
                </button>
                <Link className="button secondary small" href="/app/calendar">
                  <CalendarPlus size={15} />
                  Schedule meeting
                </Link>
              </div>
              <Field
                label="Organize message"
                value={message.folder}
                onChange={(v) =>
                  void send({
                    type: "mail-organize",
                    id: message.id,
                    fields: { folder: v },
                  })
                }
                options={[
                  "Inbox",
                  "Finance",
                  "Projects",
                  "Customer requests",
                  "Reviews",
                ].map((v) => ({ value: v, label: v }))}
              />
              {message.scenarioId && (
                <Link
                  href={`/sim/${s.scenarios.find((v) => v.id === message.scenarioId)?.category || "email"}?assignment=${message.scenarioId}`}
                  className="text-link"
                >
                  Open linked assignment <ArrowRight size={14} />
                </Link>
              )}
            </>
          ) : (
            <EmptyState text="Select a message to read, reply, forward, or create a task." />
          )}
        </div>
      </div>
    </section>
  );
}
function Calendar() {
  const { state: s, send } = useWorkplace();
  const [edit, setEdit] = useState<CalendarEvent | null>(null),
    [day, setDay] = useState<number | null>(null);
  if (!s) return null;
  const shown = day ?? s.day;
  const events = s.calendar
    .filter((e) => e.day === shown && !e.cancelled)
    .sort((a, b) => a.start - b.start);
  const create = () =>
    setEdit({
      id: "",
      title: "",
      day: shown,
      start: 540,
      duration: 30,
      attendees: "You, Sarah Chen",
      cancelled: false,
    });
  return (
    <section className="panel">
      <div className="app-toolbar">
        <div className="sheet-toolbar">
          <button
            className="subtle"
            disabled={shown <= 1}
            onClick={() => setDay(shown - 1)}
          >
            Previous
          </button>
          <strong>Workday {shown}</strong>
          <button className="subtle" onClick={() => setDay(shown + 1)}>
            Next
          </button>
        </div>
        <button className="button" onClick={create}>
          <Plus size={16} />
          New appointment
        </button>
      </div>
      {edit && (
        <div className="calendar-form">
          <div className="form-grid">
            <Field
              label="Appointment title"
              value={edit.title}
              onChange={(title) => setEdit({ ...edit, title })}
            />
            <Field
              label="Attendees"
              value={edit.attendees}
              onChange={(attendees) => setEdit({ ...edit, attendees })}
            />
            <Field
              label="Start"
              type="time"
              value={clock(edit.start)}
              onChange={(v) => {
                const [h, m] = v.split(":").map(Number);
                setEdit({ ...edit, start: h * 60 + m });
              }}
            />
            <Field
              label="Duration (minutes)"
              type="number"
              value={String(edit.duration)}
              onChange={(v) => setEdit({ ...edit, duration: Number(v) })}
            />
            <Field
              label="Workday"
              type="number"
              value={String(edit.day)}
              onChange={(v) => setEdit({ ...edit, day: Number(v) })}
            />
          </div>
          <div className="sheet-toolbar">
            <button
              className="button"
              onClick={async () => {
                if (await send({ type: "calendar-save", event: edit }))
                  setEdit(null);
              }}
            >
              Save appointment
            </button>
            <button className="subtle" onClick={() => setEdit(null)}>
              Close editor
            </button>
          </div>
        </div>
      )}
      <div className="calendar-day">
        {Array.from({ length: 10 }, (_, i) => i + 8).map((h) => (
          <div className="calendar-hour" key={h}>
            <time>{h}:00</time>
            <div>
              {events
                .filter((e) => Math.floor(e.start / 60) === h)
                .map((e) => (
                  <div className="calendar-event" key={e.id}>
                    <div>
                      <strong>{e.title}</strong>
                      <small>
                        {clock(e.start)}–{clock(e.start + e.duration)} ·{" "}
                        {e.attendees}
                      </small>
                    </div>
                    <button
                      className="icon-button"
                      aria-label={`Edit ${e.title}`}
                      onClick={() => setEdit(e)}
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Cancel ${e.title}`}
                      onClick={() =>
                        void send({
                          type: "calendar-save",
                          event: { ...e, cancelled: true },
                        })
                      }
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
function Chat() {
  const { state: s, send } = useWorkplace();
  const [text, setText] = useState("");
  if (!s) return null;
  return (
    <section className="panel chat-panel">
      <div className="panel-heading">
        <h3># apprenticeship-team</h3>
        <span className="badge">{s.company.employees.length} coworkers</span>
      </div>
      <div className="chat-history">
        {s.chat.map((m) => (
          <div
            className={`chat-message ${m.from === "You" ? "mine" : ""}`}
            key={m.id}
          >
            <div className="avatar">{m.from.slice(0, 2).toUpperCase()}</div>
            <div>
              <strong>
                {m.from}
                <small>{clock(m.at)}</small>
              </strong>
              <p>{m.text}</p>
            </div>
          </div>
        ))}
      </div>
      <Field
        label="Message your team"
        value={text}
        onChange={setText}
        multiline
      />
      <button
        className="button"
        onClick={async () => {
          if (await send({ type: "chat-send", fields: { text } })) setText("");
        }}
      >
        <Send size={15} />
        Send message
      </button>
    </section>
  );
}
function Tasks() {
  const { state: s, send } = useWorkplace();
  const [title, setTitle] = useState(""),
    [category, setCategory] = useState<Category>("administration"),
    [filter, setFilter] = useState("Open");
  if (!s) return null;
  return (
    <section className="panel">
      <div className="app-toolbar">
        <div className="filter-tabs compact">
          {["Open", "Completed", "All"].map((v) => (
            <button
              className={filter === v ? "selected" : ""}
              onClick={() => setFilter(v)}
              key={v}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      <div className="task-compose">
        <Field label="New task" value={title} onChange={setTitle} />
        <Field
          label="Work type"
          value={category}
          onChange={(v) => setCategory(v as Category)}
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
        />
        <button
          className="button"
          onClick={async () => {
            if (
              await send({ type: "task-create", category, fields: { title } })
            )
              setTitle("");
          }}
        >
          <Plus size={15} />
          Add task
        </button>
      </div>
      {s.tasks
        .filter(
          (t) => filter === "All" || (filter === "Open" ? !t.done : t.done),
        )
        .sort((a, b) => a.due - b.due)
        .map((t) => (
          <div className="task-row" key={t.id}>
            <span
              className={`task-status ${t.done ? "done" : t.due < s.minute ? "late" : ""}`}
            >
              {t.done ? "✓" : "○"}
            </span>
            <div>
              <strong>{t.title}</strong>
              <small>
                {clock(t.due)} · {t.minutes} min · Impact {t.impact}/5
                {t.dependency && " · Depends on " + t.dependency}
              </small>
            </div>
            {t.scenarioId ? (
              <Link
                className="text-link"
                href={`/sim/${t.category}?assignment=${t.scenarioId}`}
              >
                {t.done ? "Review" : "Open"}
                <ArrowRight size={15} />
              </Link>
            ) : (
              <button
                className="subtle"
                onClick={() => void send({ type: "task-open", id: t.id })}
              >
                Start work
              </button>
            )}
          </div>
        ))}
      {!s.tasks.length && (
        <EmptyState
          text="Choose an assignment to receive your first task."
          href="/"
          label="Explore simulations"
        />
      )}
    </section>
  );
}
function Artifacts({ name }: { name: string }) {
  const { state: s, send } = useWorkplace();
  const kind: Artifact["kind"] =
    name === "Spreadsheet"
      ? "sheet"
      : name === "Presentations"
        ? "slides"
        : name === "Reports"
          ? "report"
          : "document";
  const [editing, setEditing] = useState<Artifact | null>(null);
  if (!s) return null;
  const list = s.artifacts.filter((a) => a.kind === kind);
  const create = () =>
    setEditing({
      id: "",
      title: "",
      kind,
      body: "",
      cells: Array.from({ length: 10 }, () => Array(5).fill("")),
      slides: [],
    });
  const download = (a: Artifact) => {
    const blob = new Blob(
      [
        a.kind === "sheet"
          ? (a.cells || [])
              .map((r) =>
                r.map((c) => '"' + c.replaceAll('"', '""') + '"').join(","),
              )
              .join("\n")
          : a.kind === "slides"
            ? JSON.stringify(a.slides, null, 2)
            : a.title + "\n\n" + a.body,
      ],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download =
      a.title +
      (a.kind === "sheet" ? ".csv" : a.kind === "slides" ? ".json" : ".txt");
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <section className="panel">
      <div className="panel-heading">
        <h3>Saved {name.toLowerCase()}</h3>
        <button className="button" onClick={create}>
          <Plus size={15} />
          Create{" "}
          {kind === "sheet"
            ? "spreadsheet"
            : kind === "slides"
              ? "presentation"
              : kind}
        </button>
      </div>
      {list.map((a) => (
        <div className="list-row" key={a.id}>
          <div>
            <strong>{a.title}</strong>
            <small>{a.kind} · Available to attach in Inbox</small>
          </div>
          <div className="sheet-toolbar">
            <button
              className="subtle small"
              onClick={() => setEditing(structuredClone(a))}
            >
              <Edit3 size={14} />
              Edit
            </button>
            <button className="subtle small" onClick={() => download(a)}>
              <Download size={14} />
              Export
            </button>
          </div>
        </div>
      ))}
      {!list.length && !editing && (
        <EmptyState
          text={`Create your first ${kind === "sheet" ? "spreadsheet" : kind === "slides" ? "presentation" : kind}, or complete a practice assignment below.`}
        />
      )}{" "}
      {editing && (
        <div className="artifact-editor">
          <Field
            label="Artifact title"
            value={editing.title}
            onChange={(title) => setEditing({ ...editing, title })}
          />
          {kind === "sheet" ? (
            <SheetEditor
              cells={editing.cells || []}
              onChange={(cells) => setEditing({ ...editing, cells })}
            />
          ) : kind === "slides" ? (
            <SlideEditor
              slides={editing.slides || []}
              onChange={(slides) => setEditing({ ...editing, slides })}
            />
          ) : (
            <>
              <Field
                label="Content"
                value={editing.body}
                onChange={(body) => setEditing({ ...editing, body })}
                multiline
              />
              <div className="document-preview">
                <h2>{editing.title}</h2>
                <p>{editing.body}</p>
              </div>
            </>
          )}
          <div className="sheet-toolbar">
            <button
              className="button"
              onClick={async () => {
                if (await send({ type: "artifact-save", artifact: editing }))
                  setEditing(null);
              }}
            >
              Save artifact
            </button>
            <button className="subtle" onClick={() => setEditing(null)}>
              Close editor
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
function Records({ name }: { name: string }) {
  const { state: s } = useWorkplace();
  const [search, setSearch] = useState("");
  if (!s) return null;
  if (name === "Policies" || name === "Research")
    return (
      <section className="panel">
        <Field
          label="Search company library"
          value={search}
          onChange={setSearch}
        />
        {[
          ...s.company.policies,
          ...(name === "Research"
            ? s.scenarios.flatMap((v) => v.data.sources.slice(0, 3))
            : []),
        ]
          .filter((p) =>
            (p.title + p.body).toLowerCase().includes(search.toLowerCase()),
          )
          .map((p, i) => (
            <details className="source" key={p.id + i}>
              <summary>
                {p.title}
                <small>{p.date}</small>
              </summary>
              <p>{p.body}</p>
            </details>
          ))}
      </section>
    );
  if (name === "Phone")
    return (
      <section className="panel">
        <div className="panel-heading">
          <h3>Call queue</h3>
          <Link href="/sim/phone" className="button">
            Open phone console
          </Link>
        </div>
        {s.scenarios
          .filter((v) => v.category === "phone")
          .map((v) => (
            <div className="list-row" key={v.id}>
              <div>
                <strong>{v.participants[0]}</strong>
                <small>
                  {v.data.facts["Case type"]} ·{" "}
                  {v.result ? "Resolved" : "Incoming"}
                </small>
              </div>
              <Link
                className="text-link"
                href={`/sim/phone?assignment=${v.id}`}
              >
                {v.result ? "Review call" : "Answer call"}
                <ArrowRight size={15} />
              </Link>
            </div>
          ))}
        {!s.scenarios.some((v) => v.category === "phone") && (
          <EmptyState
            text="The line is clear. Start a call assignment or advance the clock to receive a call."
            href="/sim/phone"
          />
        )}
      </section>
    );
  if (name === "Projects")
    return (
      <div className="project-board">
        {s.company.projects.map((p) => (
          <section className="panel" key={p.id}>
            <span className="eyebrow">ACTIVE PROJECT</span>
            <h3>{p.name}</h3>
            <div className="progress">
              <i style={{ width: p.progress + "%" }} />
            </div>
            <p>
              {p.progress}% complete · ${p.budget.toLocaleString()} budget
            </p>
            <p>{p.blocker || "No active blockers recorded."}</p>
            <Link className="text-link" href="/sim/project-management">
              Manage delivery <ArrowRight size={14} />
            </Link>
          </section>
        ))}
      </div>
    );
  const rows =
    name === "Customers"
      ? s.company.customers
      : name === "Vendors"
        ? s.company.vendors
        : name === "Inventory"
          ? s.company.products
          : name === "HR"
            ? s.company.employees
            : [];
  if (rows.length)
    return (
      <section className="panel">
        <Field
          label={`Search ${name.toLowerCase()}`}
          value={search}
          onChange={setSearch}
        />
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {Object.keys(rows[0]).map((k) => (
                  <th key={k}>{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows
                .filter((r) =>
                  JSON.stringify(r)
                    .toLowerCase()
                    .includes(search.toLowerCase()),
                )
                .map((r) => (
                  <tr key={r.id}>
                    {Object.entries(r).map(([k, v]) => (
                      <td key={k}>
                        {typeof v === "boolean"
                          ? v
                            ? "Complete"
                            : "Required"
                          : v}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  return (
    <>
      <div className="stat-grid">
        <div className="stat">
          <div>
            <small>Company cash</small>
            <strong>${s.company.cash.toLocaleString()}</strong>
          </div>
        </div>
        <div className="stat">
          <div>
            <small>Available budget</small>
            <strong>${s.company.budget.toLocaleString()}</strong>
          </div>
        </div>
        <div className="stat">
          <div>
            <small>Posted assignments</small>
            <strong>
              {
                s.scenarios.filter(
                  (v) =>
                    v.result &&
                    [
                      "finance",
                      "accounting",
                      "economics",
                      "procurement",
                      "sales",
                    ].includes(v.category),
                ).length
              }
            </strong>
          </div>
        </div>
      </div>
      <section className="panel">
        <h3>Financial activity</h3>
        {s.scenarios
          .filter(
            (v) =>
              v.result &&
              ["finance", "accounting", "procurement", "sales"].includes(
                v.category,
              ),
          )
          .map((v) => (
            <div className="list-row" key={v.id}>
              <span>
                {v.title} · {v.data.facts.Reference}
              </span>
              <Link href={`/sim/${v.category}?assignment=${v.id}`}>
                {v.result?.score}% · Review
              </Link>
            </div>
          ))}
        <p className="hint">
          Financial assignments use the company’s current balances. Accepted
          orders, stock purchases, and customer refunds change cash.
        </p>
      </section>
    </>
  );
}
function Performance() {
  const { state: s } = useWorkplace();
  if (!s) return null;
  const metrics = [
    "accuracy",
    "communication",
    "organization",
    "finance",
    "analysis",
    "research",
    "professionalism",
    "prioritization",
    "time management",
    "documentation",
    "customer handling",
    "procedure adherence",
  ];
  return (
    <>
      <section className="panel progression">
        <h2>{levels[level(s.xp)]}</h2>
        <p>{s.xp} experience points earned</p>
        <div className="level-track">
          {levels.map((l, i) => (
            <div className={i <= level(s.xp) ? "achieved" : ""} key={l}>
              <b>{i + 1}</b>
              <span>{l}</span>
            </div>
          ))}
        </div>
      </section>
      <div className="metric-grid">
        {metrics.map((m) => {
          const value = s.metrics[m],
            score = value ? Math.round(value.total / value.count) : 0;
          return (
            <section className="panel" key={m}>
              <span className="eyebrow">{m}</span>
              <h2>
                {score}
                <small>/100</small>
              </h2>
              <div className="progress">
                <i style={{ width: score + "%" }} />
              </div>
              <p>{value?.count || 0} reviewed assignments</p>
            </section>
          );
        })}
      </div>
      <section className="panel">
        <h3>Manager reviews</h3>
        {s.scenarios
          .filter((v) => v.result)
          .map((v) => (
            <details className="source" key={v.id}>
              <summary>
                {v.title} · {v.result?.score}%
              </summary>
              <ul>
                {v.result?.feedback.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </details>
          ))}
        {!s.scenarios.some((v) => v.result) && (
          <p>Complete an assignment to receive your first skill review.</p>
        )}
      </section>
    </>
  );
}
