import type { Company, State } from "../types";
import { random } from "./random";
export function createCompany(seed = 20260929): Company {
  const r = random(seed);
  const departments = [
    "Operations",
    "Finance",
    "People",
    "Customer Success",
    "Sales",
    "Technology",
  ];
  const first = [
    "Sarah",
    "Amir",
    "Maya",
    "Leo",
    "Priya",
    "Daniel",
    "Sofia",
    "Noah",
    "Elena",
    "Marcus",
    "Ava",
    "Theo",
  ];
  const last = [
    "Chen",
    "Patel",
    "Morgan",
    "Reed",
    "Okafor",
    "Santos",
    "Kim",
    "Rivera",
    "Brooks",
    "Hughes",
    "Park",
    "Bennett",
  ];
  return {
    name: "Northstar Works",
    manager: "Sarah Chen",
    departments,
    employees: first.map((n, i) => ({
      id: `emp-${i}`,
      name: i === 0 ? "Sarah Chen" : `${n} ${last[i]}`,
      department: departments[i % 6],
      role:
        i === 0 ? "Apprenticeship Manager" : i < 6 ? "Team Lead" : "Specialist",
      leave: r.int(8, 24),
      training: i % 3 !== 0,
    })),
    customers: first.slice(2, 10).map((n, i) => ({
      id: `cus-${i}`,
      name: `${n} ${r.pick(last)}`,
      company:
        r.pick([
          "Alder",
          "Meridian",
          "Lighthouse",
          "Pinecrest",
          "Westbridge",
          "Harbor",
        ]) +
        " " +
        r.pick(["Studios", "Logistics", "Group", "Labs"]),
      satisfaction: 80,
    })),
    vendors: [
      "Cedar Supply",
      "Atlas Components",
      "Harbor Distribution",
      "Summit Services",
      "Beacon Office",
    ].map((name, i) => ({ id: `ven-${i}`, name, reliability: r.int(80, 99) })),
    products: [
      "Field Kit",
      "Desk Station",
      "Service Plan",
      "Sensor Pack",
      "Access Card",
      "Packaging Set",
    ].map((name, i) => ({
      id: `prod-${i}`,
      name,
      stock: r.int(35, 150),
      reorder: r.int(20, 40),
      price: r.int(80, 220),
      cost: r.int(20, 60),
    })),
    projects: [
      "Customer onboarding refresh",
      "Quarterly stock review",
      "Service reliability upgrade",
    ].map((name, i) => ({
      id: `proj-${i}`,
      name,
      progress: r.int(10, 45),
      budget: r.int(12, 30) * 1000,
      blocker: i === 0 ? "Awaiting requirements confirmation" : "",
    })),
    policies: [
      {
        id: "p-purchase",
        title: "Purchasing and payment controls",
        body: "Compare total delivered cost and supplier reliability. Purchases over $2,000 require Finance approval before issuing an order. Match purchase order, delivery receipt, and invoice. Record quantity, owner, and delivery date.",
        date: "2026-09-01",
        reliable: true,
      },
      {
        id: "p-privacy",
        title: "Information handling",
        body: "Verify identity before discussing customer or employee records. Share the minimum necessary data only with the owning department. Record consent and route sensitive requests to People. Never share passwords.",
        date: "2026-09-01",
        reliable: true,
      },
      {
        id: "p-service",
        title: "Customer resolution procedure",
        body: "Verify the order and customer identity. Acknowledge impact. Refunds up to $250 may be processed by the service team; higher values require Finance approval. Record the remedy, owner, and callback time.",
        date: "2026-09-01",
        reliable: true,
      },
      {
        id: "p-incident",
        title: "Incident response",
        body: "Assess impact, contain the problem, notify Technology for outages or Operations for shipment issues, and assign an owner. Critical incidents require immediate manager escalation. Send updates every 30 minutes and verify recovery.",
        date: "2026-09-01",
        reliable: true,
      },
      {
        id: "p-people",
        title: "Leave and onboarding",
        body: "Leave must not exceed the employee balance and needs manager approval. Onboarding requires identity verification, signed forms, training, and access approval. Keep employee records within People.",
        date: "2026-09-01",
        reliable: true,
      },
      {
        id: "p-records",
        title: "Records and meetings",
        body: "Every filed record needs a reference, date, owning department, and summary. Meetings require purpose, attendees, and a conflict-free time. Action items must have one owner and deadline.",
        date: "2026-09-01",
        reliable: true,
      },
    ],
    budget: 65000,
    cash: 128000,
    reputation: 85,
  };
}
export function initialState(seed = 20260929): State {
  const company = createCompany(seed);
  return {
    version: 1,
    company,
    day: 1,
    minute: 510,
    sequence: 0,
    xp: 0,
    running: false,
    scenarios: [],
    tasks: [],
    mail: [
      {
        id: "welcome",
        from: company.manager,
        to: "You",
        subject: "Your first day at Northstar",
        body: "Welcome to the team. Start with a phone or inbox assignment, keep a clear record, and use our policies when making decisions. Your work changes our shared company. I will review each submission and send follow-up assignments.",
        read: false,
        archived: false,
        folder: "Inbox",
        attachments: [],
        at: 510,
      },
    ],
    calendar: [
      {
        id: "check-in",
        title: "Manager check-in",
        day: 1,
        start: 660,
        duration: 30,
        attendees: "You, Sarah Chen",
        cancelled: false,
      },
    ],
    artifacts: [],
    chat: [
      {
        id: "welcome-chat",
        from: company.manager,
        text: "Good morning. Choose a work assignment from the dashboard. I am here for status updates and reviews.",
        at: 510,
      },
    ],
    events: [],
    pending: [
      {
        at: 540,
        kind: "call",
        text: "A customer needs an order update.",
        category: "phone",
      },
    ],
    metrics: {},
    dayReviews: [],
  };
}
