export type Category =
  | "phone"
  | "email"
  | "meetings"
  | "economics"
  | "finance"
  | "accounting"
  | "research"
  | "data-analysis"
  | "spreadsheet"
  | "documents"
  | "scheduling"
  | "customer-service"
  | "procurement"
  | "inventory"
  | "hr"
  | "project-management"
  | "prioritization"
  | "communication"
  | "negotiation"
  | "sales"
  | "quality-control"
  | "compliance"
  | "incidents"
  | "administration"
  | "reporting"
  | "presentations"
  | "operations"
  | "decisions"
  | "time-management"
  | "workday";
export type EditorKind =
  | "call"
  | "mail"
  | "meeting"
  | "numeric"
  | "ledger"
  | "research"
  | "analysis"
  | "sheet"
  | "document"
  | "calendar"
  | "case"
  | "purchase"
  | "stock"
  | "people"
  | "board"
  | "rank"
  | "chat"
  | "negotiate"
  | "sales"
  | "quality"
  | "policy"
  | "incident"
  | "filing"
  | "report"
  | "slides"
  | "capacity"
  | "decision"
  | "time"
  | "day";
export type Row = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  cost: number;
  actual: number;
  target: number;
  department: string;
  status: string;
};
export type Source = {
  id: string;
  title: string;
  body: string;
  date: string;
  reliable: boolean;
};
export type WorkTask = {
  id: string;
  title: string;
  category: Category;
  due: number;
  impact: number;
  minutes: number;
  dependency: string;
  done: boolean;
  scenarioId?: string;
  sourceScenarioId?: string;
};
export type CalendarEvent = {
  id: string;
  title: string;
  day: number;
  start: number;
  duration: number;
  attendees: string;
  cancelled: boolean;
};
export type Artifact = {
  id: string;
  title: string;
  kind: "document" | "sheet" | "report" | "slides";
  body: string;
  cells?: string[][];
  slides?: Slide[];
};
export type Slide = {
  title: string;
  text: string;
  chart: string;
  notes: string;
};
export type Draft = {
  fields: Record<string, string>;
  checked: string[];
  order: string[];
  cells: string[][];
  slides: Slide[];
  log: string[];
  stage: number;
};
export type Evaluation = {
  score: number;
  feedback: string[];
  metrics: Record<string, number>;
  passed: boolean;
  cash: number;
  reputation: number;
  minutes: number;
};
export type Scenario = {
  gameplay?: import("../minigames/runtime/types").GameState;
  id: string;
  category: Category;
  difficulty: number;
  seed: number;
  title: string;
  participants: string[];
  context: string;
  data: {
    rows: Row[];
    sources: Source[];
    tasks: WorkTask[];
    quotes: {
      id: string;
      vendor: string;
      unit: number;
      days: number;
      quality: number;
    }[];
    facts: Record<string, string | number>;
    agenda: string[];
    slots: number[];
    issues: string[];
  };
  objectives: string[];
  requiredActions: string[];
  optionalActions: string[];
  hiddenFacts: {
    expected: number;
    best: string;
    defects: string[];
    reserve: number;
  };
  deadline: number;
  evaluationRules: string[];
  consequences: string[];
  followUpEvents: Category[];
  completionState: "active" | "completed";
  draft: Draft;
  result?: Evaluation;
  submittedAt?: number;
  branch?: string;
};
export type Mail = {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  read: boolean;
  archived: boolean;
  folder: string;
  attachments: string[];
  at: number;
  scenarioId?: string;
};
export type Company = {
  name: string;
  manager: string;
  departments: string[];
  employees: {
    id: string;
    name: string;
    department: string;
    role: string;
    leave: number;
    training: boolean;
  }[];
  customers: {
    id: string;
    name: string;
    company: string;
    satisfaction: number;
  }[];
  vendors: { id: string; name: string; reliability: number }[];
  products: {
    id: string;
    name: string;
    stock: number;
    reorder: number;
    price: number;
    cost: number;
  }[];
  projects: {
    id: string;
    name: string;
    progress: number;
    budget: number;
    blocker: string;
  }[];
  policies: Source[];
  budget: number;
  cash: number;
  reputation: number;
};
export type State = {
  version: number;
  company: Company;
  day: number;
  minute: number;
  sequence: number;
  xp: number;
  running: boolean;
  scenarios: Scenario[];
  tasks: WorkTask[];
  mail: Mail[];
  calendar: CalendarEvent[];
  artifacts: Artifact[];
  chat: { id: string; from: string; text: string; at: number }[];
  events: { id: string; at: number; text: string }[];
  pending: {
    at: number;
    kind: "reply" | "call" | "manager";
    text: string;
    category: Category;
  }[];
  metrics: Record<string, { total: number; count: number }>;
  dayReviews: { day: number; completed: number; score: number }[];
};
export type Command = {
  gameAction?: import("../minigames/runtime/types").GameAction;
  type: string;
  id?: string;
  category?: Category;
  seed?: number;
  difficulty?: number;
  draft?: Draft;
  fields?: Record<string, string>;
  minutes?: number;
  artifact?: Artifact;
  event?: CalendarEvent;
  mail?: Mail;
};
