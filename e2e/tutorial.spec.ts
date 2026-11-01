import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Tutorial surface: the first-turns panel shows at the start of a run, can be dismissed, comes
 * back with a new run, and disappears once the third hero turn has started. No rules live here;
 * actions are clicked through the engine's legal set exposed by the client.
 */

interface Debug {
  state: { actionEpoch: number };
  legal: { type: string }[];
}

async function readDebug(page: Page): Promise<Debug> {
  const debug = (await page.evaluate(() => window.__EMBERWOLD__)) as unknown as Debug | undefined;
  if (debug === undefined) {
    throw new Error("window.__EMBERWOLD__ is not set");
  }
  return debug;
}

async function startRun(page: Page): Promise<void> {
  await page.getByTestId("seed").fill("9");
  await page.getByTestId("new-run").first().click();
  await page.waitForFunction(() => window.__EMBERWOLD__ !== undefined);
}

async function clickType(page: Page, type: string): Promise<void> {
  const debug = await readDebug(page);
  const index = debug.legal.findIndex((action) => action.type === type);
  expect(index, `${type} is offered`).toBeGreaterThanOrEqual(0);
  await page.locator(`[data-testid="action"][data-index="${index}"]`).first().click();
  await page.waitForFunction(
    (previous) => (window.__EMBERWOLD__?.state.actionEpoch ?? -1) > previous,
    debug.state.actionEpoch,
  );
}

test("tutorial shows for the first hero turns, dismisses and resets on a new run", async ({
  page,
}) => {
  await page.goto("/");
  await startRun(page);

  await expect(page.getByTestId("tutorial")).toBeVisible();
  await expect(page.getByTestId("tutorial").locator("h2")).toHaveText("First turns · 1 / 3");
  await page.getByTestId("tutorial-dismiss").click();
  await expect(page.getByTestId("tutorial")).toHaveCount(0);

  // A new run resets the dismissal state.
  await page.getByTestId("new-run").first().click();
  await page.waitForFunction(() => window.__EMBERWOLD__ !== undefined);
  await expect(page.getByTestId("tutorial")).toBeVisible();

  // Tactic choice starts turn 1; two ended hero turns start turns 2 and 3, after which the
  // panel stops showing.
  await clickType(page, "chooseTactic");
  await clickType(page, "endTurn");
  await expect(page.getByTestId("tutorial").locator("h2")).toHaveText("First turns · 3 / 3");
  await clickType(page, "endTurn");
  await expect(page.getByTestId("tutorial")).toHaveCount(0);
});
