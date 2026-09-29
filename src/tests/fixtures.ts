import { performGameAction } from "../minigames/runtime";
import type { GameAction } from "../minigames/runtime/types";
import { initialState } from "../simulation/generators/company";
import { generateScenario } from "../simulation/generators/scenario";
import type { Category, Scenario, State } from "../simulation/types";
export function workSession(category: Category, seed = 88, difficulty = 1) {
  const world = initialState();
  const s = generateScenario(category, difficulty, seed, world.company);
  world.scenarios = [s];
  return { s, world };
}
/** Test work sessions execute domain operations and retain their audit trail. */
export function operate(s: Scenario, world: State) {
  const actions: GameAction[] = [];
  const run = (
    key: string,
    value?: string | number,
    target?: string,
    option?: string,
  ) => {
    const a = { key, value, target, option };
    performGameAction(s, world, a);
    actions.push(a);
  };
  const g = s.gameplay!,
    f = s.data.facts;
  switch (s.category) {
    case "phone":
      run("answer");
      run("ask-name");
      run("ask-account");
      run("verify-security");
      run("hold");
      run("resume");
      run("open-record");
      run("open-invoice");
      run("transfer", "Finance");
      run("ask-callback");
      run("callback");
      run("end-call");
      break;
    case "email":
      run("open-message");
      run("reply");
      run("clarify");
      run("attach", "Order record");
      run("add-task");
      run("follow-up");
      run("send-mail");
      run("archive-thread");
      break;
    case "meetings":
      run("join");
      run("ask-evidence");
      run("volunteer");
      run("suggest-deadline", 900);
      run("add-action");
      for (let i = 0; i < 3; i++) {
        run("agree");
        run("next-agenda");
      }
      run("raise-risk");
      run("adjourn");
      break;
    case "economics":
      run("compare-baseline");
      run("simulate-market");
      run("set-price", Number(f["Unit price"]) + 1);
      run("simulate-market");
      run("publish-price");
      break;
    case "finance":
      for (const r of g.records) {
        run("select-invoice", undefined, r.id);
        run("match-po");
        run("request-documents");
        run("cost-center", "Operations");
        run("hold-payment");
      }
      run("post-payment");
      break;
    case "accounting":
      for (const r of g.records) {
        run("select-transaction", undefined, r.id);
        const pairs: Record<string, string[]> = {
          "Credit sale": ["Accounts receivable", "Revenue"],
          "Supplier invoice": ["Inventory", "Accounts payable"],
          "Customer payment": ["Cash", "Accounts receivable"],
          "Office expense paid": ["Office expense", "Cash"],
        };
        run("set-debit", pairs[r.label][0]);
        run("set-credit", pairs[r.label][1]);
        run("set-amount", r.expected);
        run("post-journal");
        run("match-bank");
      }
      run("close-ledger");
      break;
    case "research":
      for (const id of ["source-1", "source-2"]) {
        run("inspect-source", undefined, id);
        run("collect-source");
      }
      run("compare-sources");
      run("select-finding", "Current records govern");
      run("publish-finding");
      break;
    case "data-analysis":
      run("select-metric", "actual");
      run("filter-department", "All");
      run("sort-column", "actual");
      run("build-chart", "Bar");
      run("flag-outlier", undefined, s.hiddenFacts.best);
      run("compare-target");
      run("publish-analysis");
      break;
    case "spreadsheet": {
      const cells = structuredClone(s.draft.cells);
      cells[7][1] = `=${f.Aggregation}(B2:B7)`;
      const a = { key: "edit-grid", cells };
      performGameAction(s, world, a);
      actions.push(a);
      run("audit-formula");
      run("recalculate-sheet");
      run("deliver-workbook");
      break;
    }
    case "documents":
      for (const section of ["Purpose", "Facts", "Action"])
        run("add-section", section);
      run("insert-reference");
      run("choose-audience", "Operations");
      run("set-classification", "Internal");
      run(
        "edit-section",
        "Confirm delivery and assign the owner.",
        g.records.at(-1)!.id,
      );
      run("save-version");
      run("review-document");
      run("issue-document");
      break;
    case "scheduling":
      run("select-attendee", world.company.manager);
      run("select-attendee", world.company.employees[1].name);
      run("book-room", "Cedar room");
      for (const r of g.records) run("cancel-event", undefined, r.id);
      for (let t = 510; t <= 990; t += 30) {
        run("select-slot", t);
        run("check-conflicts");
        if (g.values.conflicts === 0) break;
      }
      run("send-invites");
      break;
    case "customer-service":
      run("open-case");
      run("verify-customer");
      run("request-proof");
      run("replacement");
      run("confirm-remedy");
      run("close-case");
      break;
    case "procurement":
      for (const q of s.data.quotes) run("inspect-quote", undefined, q.id);
      run("compare-cost");
      run("compare-delivery");
      {
        const q = s.data.quotes.find(
          (q) =>
            q.quality >= 90 &&
            q.days <= Number(f["Required delivery days"]) &&
            q.unit * Number(f.Quantity) <= Number(f["Purchase budget"]),
        );
        if (q) {
          run("select-vendor", undefined, q.id);
          run("request-approval");
        } else run("cancel-purchase");
      }
      run("issue-order");
      break;
    case "inventory":
      run("receive-stock", 5);
      run("mark-damaged", 2);
      run("transfer-stock", 2, undefined, "Overflow");
      run("count-stock");
      run("investigate-stock");
      run("adjust-stock");
      run("reorder-stock", 10);
      run("close-count");
      break;
    case "hr":
      run("open-personnel");
      run("verify-identity");
      run("verify-form");
      run("check-balance");
      run("decline-leave");
      run("assign-training");
      run("manager-approval");
      run("file-hr-record");
      break;
    case "project-management":
      for (const r of g.records) {
        run("assign-task", world.company.manager, r.id);
        run("move-task", "active", r.id);
        run("complete-task", undefined, r.id);
      }
      run("release-milestone");
      break;
    case "prioritization":
      run("inspect-dependency", undefined, g.records[0].id);
      run("reserve-buffer", 20);
      run("mark-urgent", undefined, g.records[0].id);
      run("dispatch-queue");
      break;
    case "communication":
      run("select-channel", "Operations");
      run("add-fact", `Cash ${world.company.cash}`);
      run("add-fact", `Open tasks ${world.tasks.length}`);
      run("choose-tone", "Professional");
      run("choose-request", "Confirm delivery");
      run("tag-owner", world.company.manager);
      run("send-update");
      break;
    case "negotiation":
      run("set-delivery", Number(f["Maximum delivery days"]));
      run("set-offer", s.hiddenFacts.reserve);
      run("offer-package");
      if (Number(g.values.accepted) > Number(f["Maximum unit price"]))
        run("walk-away");
      run("sign-agreement");
      break;
    case "sales":
      run("qualify-lead");
      run("select-product", world.company.products[0].id);
      run("capture-volume", 5);
      run("check-stock");
      run("build-quote");
      run("send-quote");
      run("sales-followup");
      run("book-order");
      break;
    case "quality-control":
      for (const r of g.records) {
        run("inspect-row", undefined, r.id);
        run("correct-value", r.expected, r.id);
        run("complete-field", world.company.manager, r.id);
      }
      run("reinspect");
      run("release-batch");
      break;
    case "compliance":
      run("select-policy", String(g.values.requiredPolicy));
      run("verify-control", "Identity verified");
      run("verify-control", "Authority verified");
      run("collect-consent");
      run("redact-record");
      if (/exception/i.test(g.familyName)) {
        run("record-exception");
        run("approve-exception");
      }
      run("route-authority", String(g.values.requiredAuthority));
      run("authorize-request");
      break;
    case "incidents":
      run("declare-severity", "Critical");
      run("assign-responder", world.company.manager);
      run("notify-stakeholders");
      run("contain-incident");
      run("restore-service");
      run("verify-recovery");
      run("close-incident");
      break;
    case "administration":
      run("scan-record");
      run("set-reference", String(f.Reference));
      run("set-department", "Operations");
      run("set-retention", "7 years");
      run("route-record");
      run("file-record");
      break;
    case "reporting":
      run("select-dataset", "Operational output");
      run("toggle-metric", "Actual");
      run("toggle-metric", "Target");
      run("toggle-section", "Recommendation");
      run("add-conclusion", "Investigate the largest variance");
      run("validate-report");
      run("select-recipient", world.company.manager);
      run("distribute-report");
      break;
    case "presentations":
      for (const title of ["Situation", "Evidence", "Recommendation"]) {
        run("add-slide", title);
        run("choose-slide-content", title);
      }
      run("add-chart");
      run("add-speaker-note");
      run("start-presentation");
      run("next-slide");
      run("next-slide");
      run("answer-audience", "Cite data and owner");
      run("finish-presentation");
      break;
    case "operations":
      for (const r of g.records) run("allocate-staff", 4, r.id);
      run("process-queues");
      run("process-queues");
      run("close-operation");
      break;
    case "decisions":
      for (const option of ["A", "B", "C"]) run("inspect-option", option);
      run("compare-return");
      run("choose-investment", s.hiddenFacts.best);
      run("mitigate-risk", "Stage the investment");
      run("commit-decision");
      break;
    case "time-management":
      run("work-now", undefined, g.records[0].id);
      run("advance-focus");
      run("interrupt-work");
      run("advance-focus");
      run("take-break");
      run("advance-focus");
      run("finish-block");
      break;
    case "workday":
      throw Error(
        "Exercise the workday through the workplace engine and its child applications.",
      );
  }
  return actions;
}
