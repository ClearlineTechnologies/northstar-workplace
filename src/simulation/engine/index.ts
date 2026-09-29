import { level } from "../../minigames/catalog";
import { performGameAction } from "../../minigames/runtime";
import { evaluateScenario } from "../evaluation/evaluate";
import { round } from "../generators/random";
import { generateScenario } from "../generators/scenario";
import type { Artifact, Category, Command, Scenario, State } from "../types";
const uid = (s: State, prefix: string) => `${prefix}-${s.day}-${++s.sequence}`;
const log = (s: State, text: string) => {
  s.events.unshift({ id: uid(s, "evt"), at: s.minute, text });
  s.events = s.events.slice(0, 300);
};
export function launch(
  s: State,
  category: Category,
  seed?: number,
  difficulty?: number,
): Scenario {
  const n = seed ?? s.day * 100003 + ++s.sequence * 7919;
  const scenario = generateScenario(
    category,
    difficulty ?? level(s.xp) + 1,
    n,
    s.company,
  );
  const prior = s.scenarios.find(
    (v) =>
      v.category === category &&
      v.seed === n &&
      v.difficulty === scenario.difficulty &&
      v.completionState === "active",
  );
  if (prior) return prior;
  if (s.scenarios.some((v) => v.id === scenario.id))
    scenario.id += "-attempt-" + ++s.sequence;
  scenario.deadline = Math.min(
    1020,
    s.minute + Math.max(35, 120 - scenario.difficulty * 10),
  );
  s.scenarios.unshift(scenario);
  s.tasks.push({
    id: uid(s, "assignment"),
    title: scenario.title,
    category,
    due: scenario.deadline,
    impact: scenario.difficulty,
    minutes: 20,
    dependency: "",
    done: false,
    scenarioId: scenario.id,
  });
  if (category === "email")
    s.mail.unshift({
      id: uid(s, "email"),
      from: scenario.participants[0],
      to: "You",
      subject: String(scenario.data.facts.Subject),
      body: String(scenario.data.facts.Message),
      read: false,
      archived: false,
      folder: "Inbox",
      attachments: [],
      at: s.minute,
      scenarioId: scenario.id,
    });
  log(s, `${s.company.manager} assigned ${scenario.title}.`);
  return scenario;
}
export function advance(s: State, minutes: number) {
  const count = Math.min(510, Math.max(0, Math.trunc(minutes)));
  s.minute = Math.min(1020, s.minute + count);
  const ready = s.pending.filter((e) => e.at <= s.minute);
  s.pending = s.pending.filter((e) => e.at > s.minute);
  for (const event of ready) {
    if (event.kind === "call") {
      const task = launch(s, event.category);
      log(s, "Incoming call: " + task.context);
    } else {
      s.mail.unshift({
        id: uid(s, "mail"),
        from:
          event.kind === "manager" ? s.company.manager : "Finance · Amir Patel",
        to: "You",
        subject:
          event.kind === "manager"
            ? "Priority and status check"
            : "Re: workplace request",
        body: event.text,
        read: false,
        archived: false,
        folder: "Inbox",
        attachments: [],
        at: s.minute,
      });
      if (event.kind === "manager")
        s.chat.push({
          id: uid(s, "chat"),
          from: s.company.manager,
          text: event.text,
          at: s.minute,
        });
    }
  }
  const overdue = s.tasks.filter((t) => !t.done && t.due < s.minute);
  if (overdue.length && count >= 15)
    log(
      s,
      `${overdue.length} assignments are past their deadline. Review the queue with your manager.`,
    );
}
function saveWork(s: State, scenario: Scenario) {
  const f = scenario.draft.fields;
  let kind: Artifact["kind"] | undefined;
  if (scenario.category === "spreadsheet") kind = "sheet";
  if (["documents", "administration", "research"].includes(scenario.category))
    kind = "document";
  if (scenario.category === "reporting") kind = "report";
  if (scenario.category === "presentations") kind = "slides";
  if (kind) {
    const artifact: Artifact = {
      id: `artifact-${scenario.id}`,
      title: f.title || scenario.title,
      kind,
      body: f.body || f.notes || "",
      cells: scenario.draft.cells,
      slides: scenario.draft.slides,
    };
    s.artifacts = s.artifacts.filter((a) => a.id !== artifact.id);
    s.artifacts.unshift(artifact);
  }
}
function complete(s: State, scenario: Scenario) {
  if (scenario.completionState === "completed")
    throw Error(
      "This assignment has already been submitted. Start a new variation to practice again.",
    );
  scenario.result = evaluateScenario(scenario, s);
  scenario.completionState = "completed";
  scenario.submittedAt = s.minute;
  const result = scenario.result,
    f = scenario.draft.fields,
    facts = scenario.data.facts;
  s.xp += Math.round((result.score * scenario.difficulty) / 2);
  s.company.cash = round(s.company.cash + result.cash);
  s.company.reputation = Math.max(
    0,
    Math.min(100, s.company.reputation + result.reputation),
  );
  for (const [k, v] of Object.entries(result.metrics)) {
    const m = s.metrics[k] ?? { total: 0, count: 0 };
    m.total += v;
    m.count++;
    s.metrics[k] = m;
  }
  for (const task of s.tasks.filter((t) => t.scenarioId === scenario.id))
    task.done = true;
  saveWork(s, scenario);
  const follow: Record<string, Category> = {
    phone: "email",
    email: "meetings",
    meetings: "spreadsheet",
    spreadsheet: "reporting",
    procurement: "inventory",
    sales: "scheduling",
    incidents: "communication",
    research: "documents",
    reporting: "presentations",
  };
  const next = follow[scenario.category] || "email";
  s.tasks.push({
    id: uid(s, "followup"),
    title: result.passed
      ? `Follow up ${facts.Reference}: ${next}`
      : `Correct ${scenario.title}`,
    category: result.passed ? next : scenario.category,
    sourceScenarioId: scenario.id,
    due: Math.min(1020, s.minute + 90),
    impact: 3,
    minutes: 15,
    dependency: "",
    done: false,
  });
  s.mail.unshift({
    id: uid(s, "review"),
    from: s.company.manager,
    to: "You",
    subject: `Review: ${scenario.title} · ${result.score}%`,
    body:
      result.feedback.join("\n") +
      `\n${result.passed ? "Please complete the linked follow-up task." : "Review these corrections and retry from your task queue."}`,
    read: false,
    archived: false,
    folder: "Reviews",
    attachments: s.artifacts.some((a) => a.id === `artifact-${scenario.id}`)
      ? [`artifact-${scenario.id}`]
      : [],
    at: s.minute,
    scenarioId: scenario.id,
  });
  s.pending.push({
    at: s.minute + 30,
    kind: "reply",
    text: `We reviewed ${facts.Reference}. ${result.passed ? "Your information is complete; coordinate the next action with " + f.owner + "." : "We need corrected figures and a clearer action record before proceeding."}`,
    category: next,
  });
  advance(s, result.minutes);
  log(
    s,
    `${scenario.title} submitted: ${result.score}%. ${result.passed ? "Accepted" : "Corrections requested"}.`,
  );
}
export function applyCommand(previous: State, command: Command): State {
  const s = structuredClone(previous),
    f = command.fields || {};
  const scenario = s.scenarios.find((v) => v.id === command.id);
  switch (command.type) {
    case "launch":
      if (!command.category) throw Error("Choose a simulation");
      launch(s, command.category, command.seed, command.difficulty);
      break;
    case "draft":
      if (!scenario || !command.draft) throw Error("Assignment not found");
      if (scenario.completionState === "completed")
        throw Error("Assignment already submitted");
      scenario.draft = command.draft;
      saveWork(s, scenario);
      break;
    case "game-action": {
      if (!scenario || !command.gameAction)
        throw Error("Open a work system before taking an action.");
      if (command.gameAction.key === "launch-shift") launchShift(s, scenario);
      const finished = performGameAction(scenario, s, command.gameAction);
      saveWork(s, scenario);
      if (finished) complete(s, scenario);
      advance(s, 0);
      break;
    }
    case "tick":
      advance(s, command.minutes ?? 1);
      break;
    case "running":
      s.running = f.value === "true";
      break;
    case "new-day": {
      const completed = s.scenarios.filter(
        (v) =>
          v.submittedAt !== undefined &&
          s.tasks.some(
            (t) => t.scenarioId === v.id && t.id.includes(`-${s.day}-`),
          ),
      );
      s.dayReviews.push({
        day: s.day,
        completed: completed.length,
        score: completed.length
          ? Math.round(
              completed.reduce((a, v) => a + (v.result?.score || 0), 0) /
                completed.length,
            )
          : 0,
      });
      s.day++;
      s.minute = 510;
      s.running = false;
      s.calendar.push({
        id: uid(s, "manager-meeting"),
        title: "Manager priorities and progress review",
        day: s.day,
        start: 660,
        duration: 30,
        attendees: `You, ${s.company.manager}`,
        cancelled: false,
      });
      s.pending = [
        {
          at: 540,
          kind: "call",
          text: "New customer request",
          category: "phone",
        },
        {
          at: 600,
          kind: "manager",
          text: "Please prioritize overdue work and send me a status update.",
          category: "communication",
        },
      ];
      s.mail.unshift({
        id: uid(s, "daily"),
        from: s.company.manager,
        to: "You",
        subject: `Day ${s.day} priorities`,
        body: `Our cash is $${s.company.cash.toFixed(2)} and reputation is ${s.company.reputation}/100. Start with the oldest customer requests and send a documented update.`,
        read: false,
        archived: false,
        folder: "Inbox",
        attachments: [],
        at: 510,
      });
      break;
    }
    case "task-open": {
      const t = s.tasks.find((v) => v.id === command.id);
      if (!t) throw Error("Task not found");
      if (!t.scenarioId) {
        const parent = s.scenarios.find((v) => v.id === t.sourceScenarioId);
        const created = launch(s, t.category, parent?.seed, parent?.difficulty);
        if (parent)
          created.context += ` Linked from ${parent.title}: ${parent.draft.fields.notes || parent.draft.fields.body || "Review the linked assignment record."}`;
        s.tasks = s.tasks.filter(
          (v) => v.id === t.id || v.scenarioId !== created.id,
        );
        t.scenarioId = created.id;
      }
      break;
    }
    case "task-create":
      if (!f.title?.trim()) throw Error("Enter a task title");
      s.tasks.push({
        id: uid(s, "task"),
        title: f.title,
        category: command.category || "administration",
        due: Number(f.due) || s.minute + 60,
        impact: 3,
        minutes: 15,
        dependency: "",
        done: false,
      });
      break;
    case "mail-read": {
      const m = s.mail.find((m) => m.id === command.id);
      if (m) m.read = true;
      break;
    }
    case "mail-organize": {
      const m = s.mail.find((m) => m.id === command.id);
      if (m) {
        m.archived = f.archive === "true";
        m.folder = f.folder || m.folder;
      }
      break;
    }
    case "mail-send": {
      if (!command.mail?.to.trim() || !command.mail.body.trim())
        throw Error("Recipient and message are required");
      s.mail.unshift({
        ...command.mail,
        id: uid(s, "sent"),
        from: "You",
        read: true,
        folder: "Sent",
        at: s.minute,
      });
      s.pending.push({
        at: s.minute + 15,
        kind: "reply",
        text: `Thank you for your message about ${command.mail.subject}. ${command.mail.body.length > 80 ? "We have enough context to review the request. Please coordinate an owner and deadline." : "Please send the order reference, evidence, and requested next step."}`,
        category: "email",
      });
      advance(s, 4);
      break;
    }
    case "chat-send":
      if (!f.text?.trim()) throw Error("Write a message");
      s.chat.push(
        { id: uid(s, "chat"), from: "You", text: f.text, at: s.minute },
        {
          id: uid(s, "chat"),
          from: s.company.manager,
          text: `${f.text.length > 60 ? "Thanks for the detailed update." : "Please include a reference and deadline in your update."} There are ${s.tasks.filter((t) => !t.done).length} active tasks. ${s.company.reputation < 70 ? "Prioritize customer recovery." : "Keep the earliest deadline in focus."}`,
          at: s.minute,
        },
      );
      advance(s, 2);
      break;
    case "calendar-save": {
      const e = command.event;
      if (
        !e ||
        !e.title.trim() ||
        !Number.isFinite(e.start) ||
        !Number.isFinite(e.duration) ||
        e.duration <= 0 ||
        e.start < 480 ||
        e.start + e.duration > 1080
      )
        throw Error(
          "Enter an appointment between 08:00 and 18:00 with a positive duration",
        );
      if (
        s.calendar.some(
          (v) =>
            v.id !== e.id &&
            !v.cancelled &&
            !e.cancelled &&
            v.day === e.day &&
            e.start < v.start + v.duration &&
            e.start + e.duration > v.start,
        )
      )
        throw Error("Calendar conflict: choose a different time");
      s.calendar = s.calendar.filter((v) => v.id !== e.id);
      s.calendar.push({ ...e, id: e.id || uid(s, "calendar") });
      break;
    }
    case "artifact-save": {
      const a = command.artifact;
      if (!a || !a.title.trim()) throw Error("Name the artifact");
      s.artifacts = s.artifacts.filter((v) => v.id !== a.id);
      s.artifacts.unshift({ ...a, id: a.id || uid(s, "artifact") });
      break;
    }
    default:
      throw Error("Unsupported workplace action");
  }
  return s;
}

function launchShift(s: State, scenario: Scenario) {
  for (const task of scenario.data.tasks) {
    if (s.tasks.some((t) => t.id === task.id)) continue;
    const work = launch(
      s,
      task.category,
      scenario.seed + s.tasks.length * 101,
      scenario.difficulty,
    );
    s.tasks = s.tasks.filter((t) => t.scenarioId !== work.id);
    s.tasks.push({ ...task, scenarioId: work.id });
    work.deadline = task.due;
  }
  s.pending.push(
    {
      at: 615,
      kind: "manager",
      text: "An urgent vendor request arrived. Recheck deadlines and update the project owner.",
      category: "procurement",
    },
    {
      at: 845,
      kind: "call",
      text: "Customer escalation",
      category: "phone",
    },
  );
  log(s, "Workday assignments and interruptions scheduled.");
}
