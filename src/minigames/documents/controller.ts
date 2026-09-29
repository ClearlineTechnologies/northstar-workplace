import type { Scenario, State } from "../../simulation/types";
import { has, need, type Reducer } from "../runtime/core";
import { seedWorkData } from "../runtime/seed-data";
export function initialize(s: Scenario) {
  const g = seedWorkData(s);
  g.phase = "assembling";
  g.brief =
    "Assemble purpose, facts and action sections, edit their contents, apply handling rules and issue the reviewed document.";
  return g;
}
const actions = [
  "save-version",
  "format-section",
  "edit-section",
  "add-section",
  "move-section",
  "insert-reference",
  "choose-audience",
  "set-classification",
  "review-document",
  "sign-document",
  "issue-document",
];
export function available(s: Scenario): string[] {
  const g = s.gameplay || initialize(s);
  if (g.completed || s.result) return [];
  const allow = new Set(actions);
  const gate = (keys: string[], condition: unknown) => {
    if (!condition) keys.forEach((key) => allow.delete(key));
  };
  gate(["issue-document"], has(g, "review-document"));
  return [...allow];
}
export function inspect(s: Scenario, _world: State) {
  const g = s.gameplay || initialize(s),
    f = s.data.facts;
  const checks: { ok: boolean; label: string }[] = [];
  const check = (ok: unknown, label: string) =>
    checks.push({ ok: Boolean(ok), label });
  check(
    ["Purpose", "Facts", "Action"].every((label) =>
      g.records.some((r) => r.status === "section" && r.label === label),
    ),
    "Purpose, facts, and action sections assembled",
  );
  check(g.values.reference === f.Reference, "Source reference inserted");
  check(
    g.values.audience && g.values.classification,
    "Audience and handling classification selected",
  );
  return checks;
}
export const act: Reducer = (c) => {
  const { g, a, s } = c;
  switch (a.key) {
    case "save-version":
      s.draft.fields.body = g.records
        .filter((r) => r.status === "section")
        .map(
          (r) => r.label + "\n" + String(g.values["text-" + r.id] || g.brief),
        )
        .join("\n\n");
      g.values.version = Number(g.values.version || 0) + 1;
      c.world.artifacts.unshift({
        id: `version-${s.id}-${g.values.version}`,
        title: g.familyName + " · Version " + g.values.version,
        kind: "document",
        body: s.draft.fields.body,
      });
      break;
    case "format-section":
      g.values["format-" + a.target] = String(a.value);
      break;
    case "edit-section":
      need(
        g.records.some((r) => r.id === a.target && r.status === "section"),
        "Select a document section.",
      );
      g.values["text-" + a.target] = String(a.value || "");
      g.values.revision = Number(g.values.revision || 0) + 1;
      break;
    case "add-section":
      g.records.push({
        id: `section-${g.records.length}`,
        label: String(a.value),
        amount: 0,
        expected: 0,
        status: "section",
        owner: "You",
        dependency: "",
        priority: 1,
        quantity: 1,
        capacity: 0,
      });
      break;
    case "move-section":
      {
        const index = g.records.findIndex((row) => row.id === a.target);
        need(index >= 0, "Select a section.");
        const next = Math.max(0, index - 1);
        [g.records[index], g.records[next]] = [
          g.records[next],
          g.records[index],
        ];
      }
      break;
    case "insert-reference":
      g.values.reference = s.data.facts.Reference;
      break;
    case "choose-audience":
      g.values.audience = String(a.value);
      break;
    case "set-classification":
      g.values.classification = String(a.value);
      break;
    case "review-document":
      g.values.review = "Checked against source record";
      break;
    case "sign-document":
      g.values.signature = c.world.company.manager;
      break;
    case "issue-document":
      need(
        !inspect(s, c.world).some((check) => !check.ok),
        inspect(s, c.world)
          .filter((check) => !check.ok)
          .map((check) => check.label)
          .join("; "),
      );
      g.completed = true;
      g.phase = "issued";
      s.draft.fields.title = g.familyName;
      s.draft.fields.body = g.records
        .filter((r) => r.status === "section")
        .map(
          (r) =>
            `${r.label}\n${g.values["text-" + r.id] || (r.label === "Facts" ? `Reference ${s.data.facts.Reference}; ${s.data.facts.Quantity} ${s.data.facts.Product}.` : r.label === "Action" ? `Owner: ${c.world.company.manager}. Follow up by ${s.deadline}.` : g.brief)}`,
        )
        .join("\n\n");
      break;
  }
};
