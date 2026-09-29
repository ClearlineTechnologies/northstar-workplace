import type { Scenario, State } from "../../simulation/types";
import { amount, message, need, type Reducer } from "../runtime/core";
import { seedWorkData } from "../runtime/seed-data";
export function initialize(s: Scenario) {
  const g = seedWorkData(s);
  g.phase = "storyboard";
  s.draft.slides = [];
  g.brief =
    "Build and edit a situation, evidence and recommendation deck; present the slides and respond to audience scrutiny.";
  return g;
}
const actions = [
  "slide-layout",
  "edit-slide",
  "remove-slide",
  "select-slide",
  "add-slide",
  "choose-slide-content",
  "reorder-slide",
  "add-chart",
  "add-speaker-note",
  "start-presentation",
  "next-slide",
  "answer-audience",
  "finish-presentation",
];
export function available(s: Scenario): string[] {
  const g = s.gameplay || initialize(s);
  if (g.completed || s.result) return [];
  const allow = new Set(actions);
  const gate = (keys: string[], condition: unknown) => {
    if (!condition) keys.forEach((key) => allow.delete(key));
  };
  gate(
    ["choose-slide-content", "reorder-slide", "add-chart", "add-speaker-note"],
    s.draft.slides.length,
  );
  gate(["start-presentation"], s.draft.slides.length >= 3);
  gate(["next-slide", "answer-audience"], g.phase === "presenting");
  gate(["finish-presentation"], g.values.answer);
  return [...allow];
}
export function inspect(s: Scenario, _world: State) {
  const g = s.gameplay || initialize(s);
  const checks: { ok: boolean; label: string }[] = [];
  const check = (ok: unknown, label: string) =>
    checks.push({ ok: Boolean(ok), label });
  check(s.draft.slides.length >= 3, "Three-slide narrative constructed");
  check(
    s.draft.slides.some((sl) => sl.chart),
    "Quantitative evidence included",
  );
  check(
    g.values.answer === "Cite data and owner",
    "Audience question answered with evidence and accountability",
  );
  return checks;
}
export const act: Reducer = (c) => {
  const { g, a, s } = c;
  switch (a.key) {
    case "slide-layout":
      g.values["layout-" + g.values.slide] = String(a.value);
      break;
    case "edit-slide":
      const slide = s.draft.slides[Number(g.values.slide || 0)];
      need(slide, "Select a slide.");
      need(
        ["title", "text", "notes", "chart"].includes(String(a.option)),
        "Select an editable slide field.",
      );
      slide[a.option as "title" | "text" | "notes" | "chart"] = String(
        a.value || "",
      );
      break;
    case "remove-slide":
      s.draft.slides.splice(Number(a.target || g.values.slide || 0), 1);
      g.values.slide = Math.max(
        0,
        Math.min(Number(g.values.slide), s.draft.slides.length - 1),
      );
      break;
    case "select-slide":
      g.values.slide = amount(a.value, 0, s.draft.slides.length - 1);
      break;
    case "add-slide":
      s.draft.slides.push({
        title: String(a.value || "Situation"),
        text: g.brief,
        chart: "",
        notes: "",
      });
      g.values.slide = s.draft.slides.length - 1;
      break;
    case "choose-slide-content":
      {
        const slide = s.draft.slides[Number(a.target || g.values.slide || 0)];
        need(slide, "Add a slide first.");
        slide.title = String(a.value);
        slide.text =
          a.value === "Evidence"
            ? `Approved quantity ${s.data.facts.Quantity}; unit price $${s.data.facts["Unit price"]}.`
            : a.value === "Recommendation"
              ? `Confirm ${s.data.facts.Product} delivery with ${c.world.company.manager}.`
              : g.brief;
      }
      break;
    case "reorder-slide":
      {
        const index = Number(a.target || 0);
        need(s.draft.slides[index], "Select a slide.");
        const [slide] = s.draft.slides.splice(index, 1);
        s.draft.slides.unshift(slide);
      }
      break;
    case "add-chart":
      need(s.draft.slides.length, "Add a slide first.");
      s.draft.slides[Number(g.values.slide || 0)].chart =
        `Actual:${s.data.rows.reduce((n, r) => n + r.actual, 0)}\nTarget:${s.data.rows.reduce((n, r) => n + r.target, 0)}`;
      break;
    case "add-speaker-note":
      need(s.draft.slides.length, "Add a slide first.");
      s.draft.slides[Number(g.values.slide || 0)].notes =
        "Explain the evidence, name the owner, and confirm the decision deadline.";
      break;
    case "start-presentation":
      need(
        s.draft.slides.length >= 3,
        "Create at least three slides before presenting.",
      );
      g.phase = "presenting";
      g.values.slide = 0;
      break;
    case "next-slide":
      need(g.phase === "presenting", "Start presenting first.");
      g.values.slide = Math.min(
        s.draft.slides.length - 1,
        Number(g.values.slide) + 1,
      );
      if (Number(g.values.slide) === s.draft.slides.length - 1) {
        g.values.question = "How is the recommendation supported?";
        message(
          c,
          "Audience asks for the evidence and owner of the next action.",
        );
      }
      break;
    case "answer-audience":
      g.values.answer = String(a.value);
      break;
    case "finish-presentation":
      need(
        !inspect(s, c.world).some((check) => !check.ok),
        inspect(s, c.world)
          .filter((check) => !check.ok)
          .map((check) => check.label)
          .join("; "),
      );
      g.completed = true;
      g.phase = "presented";
      break;
  }
};
