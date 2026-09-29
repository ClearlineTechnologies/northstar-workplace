"use client";
import {
  Activity,
  Archive,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCheck,
  ChevronRight,
  Clock3,
  FileText,
  FolderKanban,
  Headphones,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Package,
  Pause,
  Phone,
  Play,
  Presentation,
  Search,
  ShieldCheck,
  SquareFunction,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { applications, level, levels } from "../minigames/catalog";
import { clock, workDate } from "../simulation/generators/random";
import { useWorkplace } from "./provider";
export const appSlug = (name: string) => name.toLowerCase();
const icons = [
  LayoutDashboard,
  Mail,
  Phone,
  MessageSquare,
  CalendarDays,
  CheckCheck,
  FolderKanban,
  Wallet,
  Archive,
  Search,
  SquareFunction,
  FileText,
  BarChart3,
  Presentation,
  Headphones,
  Building2,
  Package,
  Users,
  ShieldCheck,
  Activity,
];
export function Shell({ children }: { children: ReactNode }) {
  const { state, busy, error, send, reload } = useWorkplace(),
    path = usePathname();
  return (
    <div className="workstation">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <span className="brand-mark">N</span>
          <span>
            northstar<span className="brand-sub">WORKPLACE</span>
          </span>
        </Link>
        <div className="workspace-label">YOUR WORKSTATION</div>
        <nav>
          {applications.map((app, i) => {
            const Icon = icons[i],
              href = i === 0 ? "/" : `/app/${appSlug(app)}`;
            return (
              <Link
                key={app}
                href={href}
                className={`nav-item ${path === href ? "active" : ""}`}
              >
                <Icon size={17} />
                <span>{app}</span>
                {app === "Inbox" &&
                  Boolean(
                    state?.mail.filter((m) => !m.read && !m.archived).length,
                  ) && (
                    <b>
                      {state?.mail.filter((m) => !m.read && !m.archived).length}
                    </b>
                  )}
              </Link>
            );
          })}
        </nav>
        <div className="profile">
          <div className="avatar">YO</div>
          <div>
            <strong>Your apprenticeship</strong>
            <small>{levels[level(state?.xp || 0)]}</small>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <BriefcaseBusiness size={17} /> Northstar Works{" "}
            <ChevronRight size={14} />
            <span>Apprentice workspace</span>
          </div>
          <div className="clock-controls">
            <span className="live-dot" />
            <span title={`Workday ${state?.day || 1}`}>
              {workDate(state?.day || 1)}
            </span>
            <strong>{clock(state?.minute || 510)}</strong>
            <button
              className="icon-button"
              title={
                state?.running
                  ? "Pause workday clock"
                  : "Run workday clock: one minute per five seconds"
              }
              onClick={() =>
                void send({
                  type: "running",
                  fields: { value: String(!state?.running) },
                })
              }
            >
              {state?.running ? <Pause size={15} /> : <Play size={15} />}
            </button>
            <button
              className="subtle small"
              onClick={() => void send({ type: "tick", minutes: 15 })}
            >
              +15 min
            </button>
            <span className="save-status">
              {busy ? "Saving…" : "● Saved locally"}
            </span>
          </div>
        </header>
        {error && (
          <div role="alert" className="error-banner">
            {error}
            <button onClick={() => void reload()}>Reload workplace</button>
          </div>
        )}
        {!state ? (
          <div className="loading">
            <Activity /> Loading your workplace…
          </div>
        ) : (
          <main>{children}</main>
        )}
        <footer>
          <ShieldCheck size={13} /> Local simulation · No external services
          required{" "}
          <span>
            <Clock3 size={13} /> Work that builds real skills
          </span>
        </footer>
      </div>
    </div>
  );
}
export function SectionTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-title">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function EmptyState({
  text,
  href,
  label,
}: {
  text: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="empty-state">
      <BriefcaseBusiness size={28} />
      <p>{text}</p>
      {href && (
        <Link className="button secondary" href={href}>
          {label || "Start an assignment"}
          <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}
