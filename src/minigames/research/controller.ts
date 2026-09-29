import type { Scenario, State } from "../../simulation/types";
import { need, type Reducer } from "../runtime/core";
import { seedWorkData } from "../runtime/seed-data";
export function initialize(s: Scenario) {
  const g = seedWorkData(s);
  g.phase = "unverified";
  g.brief =
    "Search the internal records, compare current sources and assemble a finding supported by the evidence board.";
  return g;
}
const actions = [
  "inspect-source",
  "collect-source",
  "exclude-source",
  "compare-sources",
  "check-date",
  "trace-origin",
  "select-finding",
  "publish-finding",
];
export function available(s: Scenario): string[] {
  const g = s.gameplay || initialize(s);
  if (g.completed || s.result) return [];
  const allow = new Set(actions);
  const gate = (keys: string[], condition: unknown) => {
    if (!condition) keys.forEach((key) => allow.delete(key));
  };
  gate(["collect-source", "check-date", "trace-origin"], g.values.source);
  gate(["compare-sources"], g.evidence.length >= 2);
  gate(["publish-finding"], g.values.finding);
  return [...allow];
}
export function inspect(s: Scenario, _world: State) {
  const g = s.gameplay || initialize(s);
  const checks: { ok: boolean; label: string }[] = [];
  const check = (ok: unknown, label: string) =>
    checks.push({ ok: Boolean(ok), label });
  check(
    g.evidence.includes("source-1") && g.evidence.includes("source-2"),
    "Two current primary sources collected",
  );
  check(!g.evidence.includes("source-3"), "Superseded proposal excluded");
  check(
    g.values.finding === "Current records govern",
    "Conclusion follows the current evidence",
  );
  return checks;
}
export const act: Reducer = (c) => {
  const { g, a, s } = c;
  switch (a.key) {
    case "inspect-source":
      need(
        s.data.sources.some((v) => v.id === a.target),
        "Select a source.",
      );
      g.values.source = String(a.target);
      g.phase = "reading";
      break;
    case "collect-source":
      need(g.values.source, "Inspect a source first.");
      if (!g.evidence.includes(String(g.values.source)))
        g.evidence.push(String(g.values.source));
      break;
    case "exclude-source":
      g.values.excluded = String(a.target || g.values.source);
      g.evidence = g.evidence.filter((v) => v !== g.values.excluded);
      break;
    case "compare-sources":
      need(g.evidence.length >= 2, "Collect two sources to compare.");
      g.values.comparison = g.evidence.includes("source-3")
        ? "Conflict: archived proposal disagrees with current approved figures"
        : "Current approved record agrees with customer requirements";
      break;
    case "check-date":
      g.values.freshness = "Archived proposal superseded by current records";
      break;
    case "trace-origin":
      g.values.provenance =
        "Confirmed operating record and customer requirements";
      break;
    case "select-finding":
      g.values.finding = String(a.value);
      break;
    case "publish-finding":
      need(
        !inspect(s, c.world).some((check) => !check.ok),
        inspect(s, c.world)
          .filter((check) => !check.ok)
          .map((check) => check.label)
          .join("; "),
      );
      g.completed = true;
      g.phase = "published";
      s.draft.fields.title = g.familyName;
      s.draft.fields.body = `Finding: ${g.values.finding}\n${g.evidence
        .map((id) => {
          const source = s.data.sources.find((item) => item.id === id);
          return source
            ? source.title + " (" + source.date + "): " + source.body
            : "";
        })
        .join("\n")}`;
      break;
  }
};
