import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { applications, categories } from "../../minigames/catalog";
import { gameDefinition } from "../../minigames/manifest";
import type { Command, State } from "../../simulation/types";
async function command(
  request: APIRequestContext,
  command: Command,
): Promise<State> {
  const current = await (await request.get("/api/workplace")).json();
  const response = await request.post("/api/workplace", {
    data: { revision: current.revision, command },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return (await response.json()).state;
}
async function operation(page: Page, key: string) {
  const button = page.locator(`[data-action="${key}"]`).first();
  await expect(button).toBeEnabled();
  const response = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/workplace") && r.request().method() === "POST",
  );
  await button.click();
  const result = await response;
  expect(result.ok(), await result.text()).toBeTruthy();
}
for (const category of categories)
  test(`${category.name}: workplace controls and reload`, async ({
    page,
    request,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const state = await command(request, {
      type: "launch",
      category: category.id,
      seed: 41088,
      difficulty: 1,
    });
    const scenario = state.scenarios[0];
    await page.goto(`/sim/${category.id}?assignment=${scenario.id}`);
    const surface = page.locator(
      `[data-system="${gameDefinition(category.id).primaryUIComponent}"]`,
    );
    await expect(surface).toBeVisible();
    const run = (key: string) => operation(page, key);
    switch (category.id) {
      case "phone":
        await run("answer");
        await run("ask-name");
        await run("ask-account");
        await run("hold");
        await run("resume");
        await run("open-record");
        await page.getByLabel("Transfer destination").selectOption("Finance");
        await run("transfer");
        break;
      case "email":
        await run("open-message");
        await run("reply");
        await run("clarify");
        await run("attach");
        await run("send-mail");
        break;
      case "meetings":
        await run("join");
        await run("ask-evidence");
        await run("agree");
        await run("volunteer");
        await run("suggest-deadline");
        await run("add-action");
        await run("next-agenda");
        break;
      case "economics":
        await page.getByLabel("Proposed unit price").fill("70");
        await run("set-price");
        await run("simulate-market");
        await page.getByLabel("Proposed unit price").fill("80");
        await run("set-price");
        await run("simulate-market");
        break;
      case "finance":
        await run("match-po");
        await run("flag-variance");
        await run("cost-center");
        await run("hold-payment");
        break;
      case "accounting":
        await page
          .getByLabel("Debit account", { exact: true })
          .selectOption("Accounts receivable");
        await run("set-debit");
        await page
          .getByLabel("Credit account", { exact: true })
          .selectOption("Revenue");
        await run("set-credit");
        await run("set-amount");
        await run("post-journal");
        await run("match-bank");
        break;
      case "research":
        await page.getByLabel("Search source library").fill("");
        await surface.locator("aside button").first().click();
        await run("collect-source");
        await surface.locator("aside button").nth(1).click();
        await run("collect-source");
        await run("compare-sources");
        break;
      case "data-analysis":
        await run("select-metric");
        await run("sort-column");
        await run("build-chart");
        await run("segment-data");
        await run("flag-outlier");
        break;
      case "spreadsheet":
        await page
          .getByLabel("B8", { exact: true })
          .fill(`=${scenario.data.facts.Aggregation}(B2:B7)`);
        await page
          .getByRole("button", { name: "Save cell edits", exact: true })
          .click();
        await run("audit-formula");
        await run("recalculate-sheet");
        break;
      case "documents":
        for (const label of ["Purpose", "Facts", "Action"]) {
          await page.getByLabel("Section block").selectOption(label);
          await run("add-section");
        }
        await page
          .getByLabel("Action section text")
          .fill("Confirm the owner and delivery date.");
        await page.getByLabel("Action section text").blur();
        await run("insert-reference");
        await run("save-version");
        break;
      case "scheduling":
        await surface
          .getByRole("button", { name: "Reserve slot", exact: true })
          .first()
          .click();
        await run("select-attendee");
        await run("book-room");
        await run("check-conflicts");
        await run("reschedule-event");
        break;
      case "customer-service":
        await run("open-case");
        await run("verify-customer");
        await run("request-proof");
        await run("replacement");
        await run("confirm-remedy");
        break;
      case "procurement":
        await run("inspect-quote");
        await run("compare-cost");
        await run("compare-delivery");
        await run("select-vendor");
        await run("request-approval");
        break;
      case "inventory":
        await page.getByLabel("Movement quantity").fill("4");
        await run("receive-stock");
        await run("mark-damaged");
        await run("transfer-stock");
        await run("count-stock");
        await run("investigate-stock");
        await run("adjust-stock");
        break;
      case "hr":
        await run("open-personnel");
        await run("verify-identity");
        await run("verify-form");
        await run("check-balance");
        await run("assign-training");
        break;
      case "project-management":
        await run("assign-task");
        await run("move-task");
        await run("change-deadline");
        await page.getByLabel("Project priority").selectOption("5");
        break;
      case "prioritization":
        await run("move-priority");
        await run("delegate-task");
        await run("reserve-buffer");
        break;
      case "communication":
        await surface
          .getByRole("button", { name: "# operations", exact: true })
          .click();
        await run("add-fact");
        await page.getByLabel("Verified fact").selectOption({ index: 1 });
        await run("add-fact");
        await run("choose-tone");
        await run("choose-request");
        await run("tag-owner");
        break;
      case "negotiation":
        await page.getByLabel("Proposed unit offer").fill("1");
        await run("set-offer");
        await run("set-delivery");
        await run("offer-package");
        await run("counter-price");
        break;
      case "sales":
        await run("qualify-lead");
        await run("select-product");
        await run("capture-volume");
        await run("check-stock");
        await run("build-quote");
        break;
      case "quality-control":
        await surface
          .getByRole("button", { name: "Inspect record", exact: true })
          .first()
          .click();
        await run("flag-defect");
        await run("correct-value");
        await run("complete-field");
        await run("reinspect");
        break;
      case "compliance":
        await run("select-policy");
        await run("verify-control");
        await run("collect-consent");
        await run("redact-record");
        await run("route-authority");
        break;
      case "incidents":
        await run("declare-severity");
        await run("assign-responder");
        await run("notify-stakeholders");
        await run("contain-incident");
        await run("restore-service");
        await run("verify-recovery");
        break;
      case "administration":
        await run("scan-record");
        await run("set-reference");
        await run("set-department");
        await run("set-retention");
        await run("route-record");
        break;
      case "reporting":
        await run("select-dataset");
        await surface
          .getByRole("button", { name: "☐ Actual", exact: true })
          .click();
        await surface
          .getByRole("button", { name: "☐ Target", exact: true })
          .click();
        await page.getByLabel("Report visualization").selectOption("Bar chart");
        await run("validate-report");
        break;
      case "presentations":
        await run("add-slide");
        await run("choose-slide-content");
        await page.getByLabel("Slide content block").selectOption("Evidence");
        await run("add-slide");
        await run("add-chart");
        await run("add-speaker-note");
        await page.getByLabel("Slide layout").selectOption("Two columns");
        break;
      case "operations":
        for (const label of [
          "Customer support",
          "Order packing",
          "Invoice processing",
        ]) {
          await page.getByLabel(`Staff for ${label}`).fill("4");
          await surface
            .locator(".live-queues section")
            .filter({
              has: page.getByRole("heading", { name: label, exact: true }),
            })
            .locator('[data-action="allocate-staff"]')
            .click();
        }
        await run("process-queues");
        await run("process-queues");
        break;
      case "decisions":
        await run("inspect-option");
        await run("compare-return");
        await run("stress-test");
        await run("mitigate-risk");
        break;
      case "time-management":
        await run("work-now");
        await run("advance-focus");
        await run("interrupt-work");
        await run("advance-focus");
        await run("take-break");
        break;
      case "workday":
        await run("launch-shift");
        await surface.locator(".shift-layout aside>button").first().click();
        await expect(surface.locator("[data-system]")).toHaveCount(1);
        await run("manager-checkin");
        break;
    }
    const saved = (await (await request.get("/api/workplace")).json())
      .state as State;
    const work = saved.scenarios.find((s) => s.id === scenario.id)!;
    expect(work.gameplay!.history.length).toBeGreaterThanOrEqual(3);
    await page.reload();
    await expect(surface).toBeVisible();
    await mkdir("audit/screenshots", { recursive: true });
    await page.screenshot({
      path: `audit/screenshots/${category.id}.png`,
      fullPage: true,
    });
    expect(errors).toEqual([]);
  });
test("all desktop applications load", async ({ page }) => {
  for (const app of applications) {
    const response = await page.goto(
      app === "Dashboard" ? "/" : `/app/${app.toLowerCase()}`,
    );
    expect(response?.ok(), app).toBeTruthy();
    await expect(page.locator("main")).toBeVisible();
  }
});
