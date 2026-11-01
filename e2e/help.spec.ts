import { expect, test } from "@playwright/test";

/**
 * The UI must explain what its buttons and card keywords mean. These are the player-facing
 * explanations for the tactic picker and the hand cards (web-annotation feedback).
 */
test("explains tactic metadata and card keywords", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(String(error));
  });

  await page.addInitScript(() => {
    window.localStorage.clear();
  });
  await page.goto("/");
  await page.getByTestId("seed").fill("1");
  await page.getByTestId("new-run").first().click();
  await page.waitForFunction(() => window.__EMBERWOLD__ !== undefined);

  // Tactics: every choice lists its turn-order seat and day/night row, plus the honest notice
  // that tactic abilities are still content debt.
  const tacticPanel = page.locator(".tactic-panel");
  await expect(tacticPanel).toBeVisible();
  await expect(page.getByTestId("tactic-note")).toBeVisible();
  const tacticChoices = tacticPanel.locator(".tactic-choice");
  await expect(tacticChoices.first()).toBeVisible();
  await expect(tacticChoices.first().locator(".tactic-order")).toHaveText(
    /order \d+ · (day|night)/,
  );
  await expect(tacticChoices.first().locator(".tactic-effect")).not.toBeEmpty();

  // Hand cards: card-shaped tiles carry kind, effective labels and per-card keyword help.
  const hand = page.getByTestId("hand");
  await expect(hand.getByTestId("hand-card").first()).toBeVisible();
  await expect(hand.locator(".card-kind").first()).toHaveText("basic action");
  await expect(hand.getByTestId("hand-card").first().locator(".effect-tag").first()).toHaveText(
    "Basic",
  );
  await hand.getByTestId("hand-card").first().locator(".card-help-toggle").click();
  const keywordHelp = hand.getByTestId("hand-card").first().locator(".keyword-help");
  await expect(keywordHelp).toBeVisible();
  await expect(keywordHelp).toContainText("sideways");

  // Legend exposes the shared keyword glossary.
  await page.getByTestId("legend").locator("summary").click();
  await expect(page.getByTestId("legend")).toContainText("powered");
  await expect(page.getByTestId("legend")).toContainText("round cap");

  expect(consoleErrors).toEqual([]);
});
