"use client";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Mail,
  Phone,
  Search,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { categories, level, levels } from "../minigames/catalog";
import { clock } from "../simulation/generators/random";
import { useWorkplace } from "./provider";
import { SectionTitle } from "./shell";
export function Dashboard() {
  const { state: s, send } = useWorkplace();
  const [search, setSearch] = useState(""),
    [group, setGroup] = useState("All skills");
  if (!s) return null;
  const active = s.tasks.filter((t) => !t.done),
    done = s.scenarios.filter((v) => v.result),
    avg = done.length
      ? Math.round(
          done.reduce((a, b) => a + (b.result?.score || 0), 0) / done.length,
        )
      : 0;
  return (
    <>
      <SectionTitle
        eyebrow="LEARN BY DOING"
        title="Your workday starts here."
        description={`Welcome back. ${s.company.manager} and the team are counting on you.`}
        action={
          <Link className="button" href="/sim/workday">
            <PlayIcon />
            Start a full workday
            <ArrowRight size={16} />
          </Link>
        }
      />
      <div className="dashboard-grid">
        <section className="welcome-card">
          <div className="welcome-top">
            <span className="badge light">
              <span className="live-dot" /> YOUR APPRENTICESHIP
            </span>
            <Sparkles size={24} />
          </div>
          <h2>
            A little more capable.
            <br />
            Every single day.
          </h2>
          <p>
            Take the call. Find the discrepancy. Make the decision.
            <br />
            Build your confidence through real workplace practice.
          </p>
          <div className="welcome-bottom">
            <div>
              <small>CURRENT LEVEL</small>
              <strong>{levels[level(s.xp)]}</strong>
            </div>
            <div className="xp-track">
              <span>{s.xp % 350} / 350 XP</span>
              <div className="progress">
                <i style={{ width: `${(s.xp % 350) / 3.5}%` }} />
              </div>
            </div>
          </div>
        </section>
        <section className="panel today">
          <div className="panel-heading">
            <h3>On your desk</h3>
            <span className="badge">Day {s.day}</span>
          </div>
          {[
            {
              Icon: Mail,
              label: "Unread messages",
              value: s.mail.filter((m) => !m.read && !m.archived).length,
              href: "/app/inbox",
            },
            {
              Icon: Clock3,
              label: "Tasks awaiting you",
              value: active.length,
              href: "/app/tasks",
            },
            {
              Icon: Phone,
              label: "Active calls",
              value: s.scenarios.filter(
                (v) => v.category === "phone" && !v.result,
              ).length,
              href: "/app/phone",
            },
            {
              Icon: Target,
              label: "Urgent issues",
              value: active.filter((t) => t.due <= s.minute + 30).length,
              href: "/app/tasks",
            },
          ].map(({ Icon, label, value, href }) => (
            <Link className="desk-row" key={label} href={href}>
              <span>
                <Icon size={18} />
                {label}
              </span>
              <strong>
                {value}
                <ArrowUpRight size={14} />
              </strong>
            </Link>
          ))}
        </section>
      </div>
      <div className="stat-grid">
        <div className="stat">
          <span className="stat-icon">
            <CheckCircle2 />
          </span>
          <div>
            <small>Assignments completed</small>
            <strong>
              {done.length}
              <em>across 30 skill areas</em>
            </strong>
          </div>
        </div>
        <div className="stat">
          <span className="stat-icon gold">
            <TrendingUp />
          </span>
          <div>
            <small>Average performance</small>
            <strong>
              {avg}%<em>manager-reviewed work</em>
            </strong>
          </div>
        </div>
        <div className="stat">
          <span className="stat-icon violet">
            <BookOpen />
          </span>
          <div>
            <small>Company trust</small>
            <strong>
              {s.company.reputation}
              <em>of 100 points</em>
            </strong>
          </div>
        </div>
      </div>
      <div className="company-strip">
        <Link href="/app/projects">
          {s.company.projects.filter((p) => p.progress < 100).length} active
          projects
        </Link>
        <span>Company cash ${s.company.cash.toLocaleString()}</span>
        <Link href="/app/inbox">
          {s.mail.filter((m) => m.from === s.company.manager && !m.read).length}{" "}
          manager requests
        </Link>
      </div>
      <div className="content-heading">
        <div>
          <h2>Build your workplace skills</h2>
          <p>30 connected simulations. A new challenge every time.</p>
        </div>
        <label className="search">
          <Search size={16} />
          <input
            aria-label="Search simulations"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="search"
          />
        </label>
      </div>
      <div className="filter-tabs">
        {[
          "All skills",
          "Communication",
          "Business & numbers",
          "People & operations",
        ].map((t) => (
          <button
            key={t}
            onClick={() => setGroup(t)}
            className={group === t ? "selected" : ""}
          >
            {t}
            {t === "All skills" && <span>30</span>}
          </button>
        ))}
      </div>
      <div className="simulation-grid">
        {categories
          .filter((c) =>
            (c.name + " " + c.description)
              .toLowerCase()
              .includes(search.toLowerCase()),
          )
          .filter(
            (c) =>
              group === "All skills" ||
              (group === "Communication"
                ? [
                    "call",
                    "mail",
                    "meeting",
                    "chat",
                    "document",
                    "slides",
                  ].includes(c.kind)
                : group === "Business & numbers"
                  ? [
                      "numeric",
                      "ledger",
                      "analysis",
                      "sheet",
                      "report",
                      "decision",
                      "negotiate",
                      "sales",
                    ].includes(c.kind)
                  : ![
                      "call",
                      "mail",
                      "meeting",
                      "chat",
                      "document",
                      "slides",
                      "numeric",
                      "ledger",
                      "analysis",
                      "sheet",
                      "report",
                      "decision",
                      "negotiate",
                      "sales",
                    ].includes(c.kind)),
          )
          .map((c) => {
            const index = categories.indexOf(c),
              completed = s.scenarios.filter(
                (v) => v.category === c.id && v.result,
              ).length;
            return (
              <Link
                href={`/sim/${c.id}`}
                className="simulation-card"
                key={c.id}
              >
                <div className="sim-top">
                  <span className={`sim-number tone-${index % 5}`}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <ArrowUpRight size={18} />
                </div>
                <h3>{c.name}</h3>
                <p>{c.description}</p>
                <div className="sim-bottom">
                  <span>
                    {completed ? `${completed} completed` : "Ready to practice"}
                  </span>
                  <span className="tiny-dot" />
                  Seeded scenarios
                </div>
              </Link>
            );
          })}
      </div>
      <div className="dashboard-bottom">
        <section className="panel">
          <div className="panel-heading">
            <h3>Manager’s desk</h3>
            <Link href="/app/chat">
              Open chat <ArrowRight size={14} />
            </Link>
          </div>
          <div className="manager-message">
            <div className="avatar teal">SC</div>
            <div>
              <strong>
                {s.company.manager}
                <small>Apprenticeship Manager</small>
              </strong>
              <p>
                {
                  s.chat.filter((c) => c.from === s.company.manager).at(-1)
                    ?.text
                }
              </p>
            </div>
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h3>Coming up today</h3>
            <Link href="/app/calendar">
              Calendar <ArrowRight size={14} />
            </Link>
          </div>
          {s.calendar
            .filter(
              (e) => !e.cancelled && e.day === s.day && e.start >= s.minute,
            )
            .slice(0, 3)
            .map((e) => (
              <div className="agenda-item" key={e.id}>
                <b>{clock(e.start)}</b>
                <span>
                  {e.title}
                  <small>{e.attendees}</small>
                </span>
              </div>
            ))}
          {s.minute >= 1020 && (
            <button
              className="button secondary"
              onClick={() => void send({ type: "new-day" })}
            >
              Begin next workday
            </button>
          )}
        </section>
      </div>
      {s.events.length > 0 && (
        <section className="panel activity-panel">
          <h3>Workplace activity</h3>
          {s.events.slice(0, 5).map((e) => (
            <div className="list-row" key={e.id}>
              <small>{clock(e.at)}</small>
              <span>{e.text}</span>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
function PlayIcon() {
  return <span style={{ fontSize: 12 }}>▶</span>;
}
