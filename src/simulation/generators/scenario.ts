import { categories, definition } from "../../minigames/catalog";
import { initializeGame } from "../../minigames/runtime/initialize";
import type { Category, Company, Draft, Scenario } from "../types";
import { createCompany } from "./company";
import { random, round } from "./random";
export const emptyDraft = (): Draft => ({
  fields: {},
  checked: [],
  order: [],
  cells: [],
  slides: [],
  log: [],
  stage: 0,
});
export function generateScenario(
  category: Category,
  difficulty: number,
  seed: number,
  company: Company = createCompany(),
): Scenario {
  const def = definition(category);
  if (!def) throw new Error("Unknown simulation category");
  const d = Math.max(1, Math.min(6, Math.trunc(difficulty)));
  const r = random(seed);
  const customer = r.pick(company.customers),
    employee = r.pick(company.employees),
    product = r.pick(company.products),
    project = r.pick(company.projects);
  const qty = r.int(8, 80) * d,
    unit = r.int(35, 140),
    cost = r.int(12, 32),
    days = r.int(2, 9),
    ref = `NS-${r.int(10000, 99999)}`;
  const issue = r.pick([
    "delivery delay",
    "billing discrepancy",
    "capacity shortage",
    "missing approval",
    "revised requirements",
    "incorrect quantity",
    "missing documentation",
    "urgent deadline",
    "quality concern",
    "new order",
  ]);
  const rows = Array.from({ length: 5 + d }, (_, i) => ({
    id: `row-${i + 1}`,
    name: `${r.pick(company.products).name} / ${i + 1}`,
    quantity: r.int(5, 45),
    price: r.int(60, 180),
    cost: r.int(15, 55),
    actual: r.int(25, 120),
    target: r.int(45, 90),
    department: r.pick(company.departments),
    status: "Verified",
  }));
  const sum = round(rows.reduce((a, b) => a + b.quantity * b.price, 0));
  const tasks = Array.from({ length: 3 + d }, (_, i) => ({
    id: `work-${i + 1}`,
    title: `${r.pick(["Reconcile", "Review", "Confirm", "Prepare", "Approve", "Check"])} ${r.pick(["order", "budget", "client response", "stock delivery", "project brief", "invoice"])} ${ref}-${i + 1}`,
    category: r.pick(categories).id,
    due: 540 + i * 35 + r.int(0, 20),
    impact: Math.max(1, 5 - Math.floor(i / 2)),
    minutes: r.int(10, 30),
    dependency: i === 2 ? "work-1" : "",
    done: false,
  }));
  const quotes = [...company.vendors]
    .map((v) => ({ v, rank: r.next() }))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 3)
    .map(({ v }) => ({
      id: v.id,
      vendor: v.name,
      unit: unit + r.int(-10, 14),
      days: r.int(1, days + 3),
      quality: r.int(80, 99),
    }));
  const feasible = r.pick(quotes);
  feasible.unit = unit + r.int(-3, 6);
  feasible.days = r.int(1, days);
  feasible.quality = r.int(90, 99);
  const facts: Record<string, string | number> = {
    Reference: ref,
    Customer: customer.name,
    Organization: customer.company,
    Employee: employee.name,
    Department: employee.department,
    Product: product.name,
    Project: project.name,
    Quantity: qty,
    "Unit price": unit,
    "Unit cost": cost,
    "Required delivery days": days,
    "Case type": issue,
    "Response owner": company.manager,
  };
  const sources = [
    {
      id: "source-1",
      title: `${product.name}: verified operating record`,
      body: `Reference ${ref}. Current approved unit price is $${unit}; unit cost is $${cost}. Requested volume is ${qty} units. Delivery is needed within ${days} days. ${employee.name} verified this record.`,
      date: "2026-09-28",
      reliable: true,
    },
    {
      id: "source-2",
      title: `${customer.company}: customer requirements`,
      body: `${customer.name} confirms ${qty} units and a maximum ${days}-day delivery window. The reported issue is ${issue}. Coordinate with ${company.manager} and confirm the outcome in writing.`,
      date: "2026-09-29",
      reliable: true,
    },
    {
      id: "source-3",
      title: "Archived pricing discussion",
      body: `An earlier unapproved discussion proposed $${unit + 25} per unit and ${days + 4}-day delivery. This record predates the current agreement.`,
      date: "2025-05-03",
      reliable: false,
    },
    ...company.policies,
  ];
  const s: Scenario = {
    id: `${category}-${seed}-${d}`,
    category,
    difficulty: d,
    seed,
    title: `${def.name}: ${product.name}`,
    participants: [customer.name, employee.name, company.manager],
    context: `${customer.company} needs help with ${issue} for ${product.name}. Work reference ${ref}. ${company.manager} has asked you to own the response.`,
    data: {
      rows,
      sources,
      tasks,
      quotes,
      facts,
      agenda: [
        "Confirm the evidence",
        "Discuss constraints and options",
        "Agree an owner and due date",
      ],
      slots: [540, 570, 600, 630, 690, 720, 780, 810, 840, 900],
      issues: [],
    },
    objectives: [...def.verbs],
    requiredActions: [...def.verbs],
    optionalActions: [
      "Consult company policy",
      "Save supporting evidence",
      "Send a status update",
    ],
    hiddenFacts: { expected: sum, best: "", defects: [], reserve: unit - 5 },
    deadline: 960 - d * 30 + r.int(0, 20),
    evaluationRules: [
      "Work is evaluated against the generated records.",
      "Specific evidence, ownership, and a deadline improve written work.",
      "Actions consume simulated time; late submissions reduce the time-management score.",
    ],
    consequences: [
      "Work affects cash, customer trust, and company records.",
      "Your manager reviews the submission and may request corrections.",
    ],
    followUpEvents: ["email", "meetings", "spreadsheet"],
    completionState: "active",
    draft: emptyDraft(),
  };
  const ask = (text: string, expected: number) => {
    s.objectives.unshift(text);
    s.hiddenFacts.expected = round(expected);
  };
  switch (category) {
    case "phone":
      facts["Caller type"] = r.pick([
        "Customer",
        "Vendor",
        "Employee",
        "Manager",
        "Prospective client",
        "Finance colleague",
        "Delivery company",
        "Contractor",
        "Unknown caller",
      ]);
      facts["Contact number"] = `555-01${r.int(10, 99)}`;
      facts["Urgency"] = d >= 4 ? "Critical" : "Standard";
      s.hiddenFacts.best =
        d >= 4
          ? "Escalate"
          : issue === "billing discrepancy"
            ? "Transfer to Finance"
            : issue === "delivery delay"
              ? "Schedule callback"
              : "Resolve";
      s.objectives.unshift(
        `Handle the ${facts["Urgency"]} ${issue} call. Verify identity before discussing the order.`,
      );
      break;
    case "email":
      facts.Subject = `Action required: ${issue} / ${ref}`;
      facts.Message = `Please confirm ${qty} ${product.name} units at $${unit} each by ${days} days from today. ${issue} is affecting our team. Provide the total and responsible owner.`;
      ask(
        "Calculate the order total and include it in your reply.",
        qty * unit,
      );
      break;
    case "meetings":
      facts.Question = `Can we commit to ${qty} units in ${days} days with the current ${issue}?`;
      s.objectives.unshift(
        "Advance all three agenda stages and record a feasible decision.",
      );
      break;
    case "economics": {
      const mode = r.pick(["margin", "inflation", "productivity", "demand"]);
      facts.Model = mode;
      facts["Inflation %"] = r.int(2, 12);
      facts["Demand change %"] = r.int(-20, 30);
      facts["Labor hours"] = r.int(10, 40);
      if (mode === "margin")
        ask(
          "Calculate gross margin percentage: (price − cost) / price × 100.",
          ((unit - cost) / unit) * 100,
        );
      if (mode === "inflation")
        ask(
          "Calculate total cost after the stated inflation percentage.",
          qty * cost * (1 + Number(facts["Inflation %"]) / 100),
        );
      if (mode === "productivity")
        ask(
          "Calculate units produced per labor hour.",
          qty / Number(facts["Labor hours"]),
        );
      if (mode === "demand")
        ask(
          "Calculate forecast revenue after the stated demand change.",
          qty * unit * (1 + Number(facts["Demand change %"]) / 100),
        );
      break;
    }
    case "finance": {
      const mode = r.pick([
        "budget variance",
        "net cash flow",
        "receivables",
        "revenue forecast",
      ]);
      facts["Finance assignment"] = mode;
      facts["Opening cash"] = company.cash;
      facts["Approved budget"] = sum + r.int(-30, 40) * 100;
      facts["Cash expenses"] = qty * cost;
      facts["Revenue growth %"] = r.int(2, 15);
      ask(
        mode === "budget variance"
          ? "Calculate approved budget minus actual cost (quantity × price for each row)."
          : mode === "net cash flow"
            ? "Calculate closing cash: opening cash + all row revenue − cash expenses."
            : mode === "receivables"
              ? "Calculate total outstanding invoices (quantity × price)."
              : "Calculate total row revenue including the stated growth percentage.",
        mode === "budget variance"
          ? Number(facts["Approved budget"]) - sum
          : mode === "net cash flow"
            ? company.cash + sum - qty * cost
            : mode === "receivables"
              ? sum
              : sum * (1 + Number(facts["Revenue growth %"]) / 100),
      );
      break;
    }
    case "accounting":
      facts.Transaction = r.pick([
        "Credit sale",
        "Supplier invoice",
        "Customer payment",
        "Office expense paid",
      ]);
      facts["Invoice total"] = qty * unit;
      facts["Bank statement total"] = qty * unit + r.pick([0, 15, -20]);
      ask(
        "Post the invoice amount to both debit and credit, and calculate bank statement minus invoice discrepancy.",
        Number(facts["Bank statement total"]) - qty * unit,
      );
      s.hiddenFacts.best = String(facts.Transaction);
      break;
    case "research":
      ask(
        "Use the current sources to establish the order value, delivery constraint, and a supported recommendation.",
        qty * unit,
      );
      break;
    case "data-analysis": {
      const idx = r.int(0, rows.length - 1);
      rows[idx].actual = rows[idx].target * 3;
      ask(
        "Calculate total actual output across all records and identify the largest actual-to-target ratio.",
        rows.reduce((a, b) => a + b.actual, 0),
      );
      s.hiddenFacts.best = rows[idx].id;
      break;
    }
    case "spreadsheet": {
      const aggregation = r.pick(["SUM", "AVERAGE", "MIN", "MAX"]);
      facts.Aggregation = aggregation;
      const values = rows.slice(0, 6).map((row) => row.quantity * row.price);
      s.draft.cells = [
        ["Item", "Amount", "Units", "Unit price"],
        ...rows
          .slice(0, 6)
          .map((v) => [
            v.name,
            String(v.quantity * v.price),
            String(v.quantity),
            String(v.price),
          ]),
        [aggregation, "", "", ""],
      ];
      ask(
        `Use a ${aggregation} formula in B8 to summarize B2:B7.`,
        aggregation === "SUM"
          ? values.reduce((a, b) => a + b, 0)
          : aggregation === "AVERAGE"
            ? values.reduce((a, b) => a + b, 0) / values.length
            : aggregation === "MIN"
              ? Math.min(...values)
              : Math.max(...values),
      );
      break;
    }
    case "documents":
      facts["Document type"] = r.pick([
        "Memo",
        "Procedure",
        "Notice",
        "Internal report",
        "Executive summary",
      ]);
      s.objectives.unshift(
        `Write a ${facts["Document type"]} for ${employee.department} about ${issue}, citing ${ref}.`,
      );
      break;
    case "scheduling":
      facts["Meeting duration"] = 30;
      facts["Unavailable starts"] = "540, 600, 660, 780";
      facts["Meeting purpose"] = `${issue}: ${ref}`;
      s.objectives.unshift(
        "Schedule 30 minutes at an offered start time outside the unavailable starts and your existing calendar.",
      );
      break;
    case "customer-service":
      facts["Refund amount"] = Math.min(qty * unit, r.int(25, 650) * d);
      facts["Service policy limit"] = 250;
      s.hiddenFacts.best =
        Number(facts["Refund amount"]) > 250
          ? "Request Finance approval"
          : "Refund";
      s.objectives.unshift(
        "Resolve the case while respecting the refund authorization limit.",
      );
      break;
    case "procurement": {
      facts["Purchase budget"] = qty * (unit + 7);
      const selected = quotes
        .filter(
          (q) =>
            q.days <= days &&
            q.quality >= 90 &&
            q.unit * qty <= Number(facts["Purchase budget"]),
        )
        .sort((a, b) => a.unit - b.unit || a.days - b.days)[0];
      s.hiddenFacts.best = selected.id;
      ask(
        "Choose the least expensive quote meeting the delivery window and quality ≥ 90. Calculate its total.",
        qty * selected.unit,
      );
      break;
    }
    case "inventory":
      facts["Opening stock"] = product.stock;
      facts.Received = r.int(10, 60);
      facts.Used = r.int(5, 25);
      facts.Damaged = r.int(1, 7);
      facts["Reorder point"] = product.reorder;
      facts["Target stock"] = product.reorder * 3;
      facts["Product ID"] = product.id;
      ask(
        "Calculate closing usable stock: opening + received − used − damaged.",
        product.stock +
          Number(facts.Received) -
          Number(facts.Used) -
          Number(facts.Damaged),
      );
      break;
    case "hr":
      facts["Employee ID"] = employee.id;
      facts["Leave balance"] = employee.leave;
      facts["Requested days"] = r.int(2, 27);
      facts["HR request"] = r.pick([
        "Leave application",
        "Onboarding",
        "Training update",
      ]);
      s.hiddenFacts.best =
        Number(facts["Requested days"]) <= employee.leave
          ? "Approve"
          : "Decline";
      s.objectives.unshift(
        "Check the balance for leave, or complete all identity, forms, training, and access controls for onboarding.",
      );
      break;
    case "project-management":
      facts["Project ID"] = project.id;
      s.objectives.unshift(
        "Place prerequisite work before dependent work and document the project risk.",
      );
      break;
    case "prioritization":
    case "time-management":
      s.hiddenFacts.best = tasks[0].id;
      s.objectives.unshift(
        "Order work by earliest deadline, placing dependencies first.",
      );
      facts.Interruption = `${company.manager} requests a brief status update while a customer waits.`;
      break;
    case "communication":
      facts.Message = `Please give me an update on ${project.name}. Our cash balance is $${company.cash} and customer trust is ${company.reputation}/100. Explain how you are handling ${issue}.`;
      break;
    case "negotiation":
      facts["Opening offer"] = unit + 15;
      facts["Maximum unit price"] = unit + 2;
      facts["Maximum delivery days"] = days;
      facts["Negotiation focus"] = r.pick([
        "Vendor pricing",
        "Delivery date",
        "Internal resources",
        "Workload",
        "Customer terms",
      ]);
      s.hiddenFacts.reserve = unit - r.int(0, 8);
      ask(
        "Negotiate a unit price within the budget and agree a delivery commitment.",
        unit + 2,
      );
      s.draft.fields.offer = String(unit - 10);
      break;
    case "sales":
      facts["Discount ceiling %"] = 10;
      facts["Customer budget"] = qty * unit;
      ask(
        "Prepare an accurate quote at the listed unit price less your chosen discount (0–10%).",
        qty * unit,
      );
      break;
    case "quality-control": {
      const a = r.int(0, rows.length - 1),
        b = (a + 2) % rows.length;
      rows[a].status = r.pick([
        "Missing reference",
        "Duplicate entry",
        "Format mismatch",
      ]);
      rows[b].actual = rows[b].target + 9;
      rows[b].status = "Mismatched total";
      s.hiddenFacts.defects = [rows[a].id, rows[b].id];
      s.objectives.unshift(
        "The reference requires unique IDs, all fields present, standard formatting, and reconciled totals. Flag records whose status contradicts this.",
      );
      break;
    }
    case "compliance": {
      const policy = r.pick(company.policies);
      facts["Applicable situation"] = policy.title;
      s.hiddenFacts.best = policy.id;
      s.objectives.unshift(
        `Apply ${policy.title}. Include each required control in your processing record.`,
      );
      break;
    }
    case "incidents":
      facts["Incident type"] = r.pick([
        "Service outage",
        "Unavailable employee",
        "Incorrect shipment",
        "Invoice problem",
        "Customer escalation",
        "Scheduling breakdown",
        "Missing document",
        "Urgent request",
      ]);
      facts["Affected customers"] = r.int(1, 100) * d;
      facts["Severity"] = d >= 4 ? "Critical" : "Standard";
      s.hiddenFacts.best =
        d >= 4 ? "Immediate manager escalation" : "Assign department owner";
      break;
    case "administration":
      facts["Record type"] = r.pick([
        "Delivery receipt",
        "Employee form",
        "Purchase approval",
        "Customer letter",
        "Meeting record",
      ]);
      s.hiddenFacts.best = employee.department;
      s.objectives.unshift(
        `File ${ref} with ${employee.department}, a date, and a named owner.`,
      );
      break;
    case "reporting":
      ask(
        "Report total actual output, compare it to total target, and explain the operational variance.",
        rows.reduce((a, b) => a + b.actual, 0),
      );
      facts["Total target"] = rows.reduce((a, b) => a + b.target, 0);
      break;
    case "presentations":
      ask(
        "Build at least three slides: situation, quantified evidence, and recommendation. Calculate total row revenue.",
        sum,
      );
      facts["Audience question"] =
        `How does your recommendation address ${issue}, and who owns the next action?`;
      break;
    case "operations":
      facts["Available employees"] = r.int(6, 12);
      facts["Units per employee"] = r.int(8, 15);
      facts["Queue A demand"] = r.int(20, 40);
      facts["Queue B demand"] = r.int(15, 35);
      facts["Queue C demand"] = r.int(10, 25);
      ask(
        "Calculate minimum employees needed across three queues (round each queue up separately).",
        ["A", "B", "C"].reduce(
          (a, k) =>
            a +
            Math.ceil(
              Number(facts[`Queue ${k} demand`]) /
                Number(facts["Units per employee"]),
            ),
          0,
        ),
      );
      facts["Available employees"] = s.hiddenFacts.expected + r.int(0, 2);
      break;
    case "decisions": {
      facts["Investment budget"] = qty * unit;
      const options = ["A", "B", "C"];
      const affordable = r.pick(options);
      for (const option of options) {
        facts[`Option ${option} cost`] = round(
          (qty * unit * r.int(25, option === affordable ? 90 : 125)) / 100,
        );
        facts[`Option ${option} return`] = round(
          (qty * unit * r.int(80, 210)) / 100,
        );
      }
      const best = options
        .filter(
          (option) => Number(facts[`Option ${option} cost`]) <= qty * unit,
        )
        .sort(
          (a, b) =>
            Number(facts[`Option ${b} return`]) -
            Number(facts[`Option ${b} cost`]) -
            (Number(facts[`Option ${a} return`]) -
              Number(facts[`Option ${a} cost`])),
        )[0];
      s.hiddenFacts.best = best;
      ask(
        "Choose the affordable option with the highest net return, and calculate that return.",
        Number(facts[`Option ${best} return`]) -
          Number(facts[`Option ${best} cost`]),
      );
      break;
    }
    case "workday":
      facts["Shift start"] = "08:30";
      facts["Shift end"] = "17:00";
      s.data.tasks = Array.from({ length: 8 + d }, (_, i) => {
        const work = categories[(i * 3 + r.int(0, 2)) % 29];
        return {
          id: `shift-${seed}-${i}`,
          title: `${work.name} assignment`,
          category: work.id,
          due: Math.min(1000, 560 + i * 40),
          impact: r.int(2, 5),
          minutes: r.int(15, 30),
          dependency: "",
          done: false,
        };
      });
      s.objectives.unshift(
        "Launch the shift queue, complete its assignments in their work tools, then write your handover.",
      );
      break;
  }
  s.draft.order = s.data.tasks.map((t) => t.id).reverse();
  const game = initializeGame(s);
  s.objectives = [
    game.brief,
    ...game.required.map((key) => "Complete " + key.replaceAll("-", " ")),
  ];
  s.context = game.familyName + ": " + s.context;
  return s;
}
export function validateScenario(s: Scenario): boolean {
  return Boolean(
    definition(s.category) &&
    s.id &&
    s.title &&
    s.context &&
    s.participants.length >= 2 &&
    s.objectives.length >= 1 &&
    s.requiredActions.length >= 3 &&
    s.evaluationRules.length &&
    s.consequences.length &&
    s.followUpEvents.length &&
    s.data.rows.length >= 6 &&
    s.data.sources.length >= 3 &&
    s.data.rows.every((row) =>
      [row.quantity, row.price, row.cost, row.actual, row.target].every(
        (value) => Number.isFinite(value) && value >= 0,
      ),
    ) &&
    new Set(s.data.rows.map((row) => row.id)).size === s.data.rows.length &&
    s.data.tasks.every(
      (task) =>
        definition(task.category) &&
        task.due > 0 &&
        task.minutes > 0 &&
        (!task.dependency ||
          s.data.tasks.some((other) => other.id === task.dependency)),
    ) &&
    s.data.quotes.every(
      (quote) =>
        quote.unit > 0 &&
        quote.days > 0 &&
        quote.quality >= 0 &&
        quote.quality <= 100,
    ) &&
    s.data.sources.every(
      (source) => source.id && source.title && source.body && source.date,
    ) &&
    Number.isFinite(s.hiddenFacts.expected) &&
    s.deadline > 0 &&
    s.difficulty >= 1 &&
    s.difficulty <= 6 &&
    s.completionState === "active" &&
    s.draft,
  );
}
