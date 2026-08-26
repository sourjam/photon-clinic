import { expect, test } from "@playwright/test";

const liveSmoke = process.env.LIVE_SMOKE === "1";

function smokeSuffix(): string {
  return `${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
}

test("new visit UI completes live Photon sync and OpenAI instruction generation", async ({ page }) => {
  test.skip(!liveSmoke, "Set LIVE_SMOKE=1 to run the deployed UI flow and create a Photon sandbox patient.");

  const suffix = smokeSuffix();

  await page.goto("/");
  await expect(page.getByRole("button", { name: "New visit" })).toBeVisible();

  await page.getByRole("button", { name: "New visit" }).click();
  await expect(page.getByText("No patient")).toBeVisible();

  await page.getByLabel("First name").fill("UiSmoke");
  await page.getByLabel("Last name").fill(`Patient${suffix}`);
  await page.getByLabel("Date of birth").fill("1993-05-17");
  await page.getByRole("button", { name: "Female" }).click();
  await page.getByLabel("Phone").fill("(718) 555-0199");
  await page.getByLabel("External ID").fill(`phoclinic2-ui-smoke-${suffix}`);
  await page.getByRole("textbox", { name: "Visit reason" }).fill("Eczema flare");
  await page.getByRole("textbox", { name: "Allergies" }).fill("No known drug allergies");
  await page.getByRole("textbox", { name: "Current medications" }).fill("Prenatal vitamin");
  await page.getByRole("textbox", { name: "Raised in visit" }).fill("Breastfeeding question");
  await page.getByRole("button", { name: "Save patient" }).click();

  await expect(page.getByText("Local edits not yet synced").first()).toBeVisible();

  await page.getByLabel("Search Photon treatment catalog").fill("mupirocin");
  await page.getByRole("button", { name: "Search catalog" }).click();
  await expect(page.getByText(/Mupirocin/i).first()).toBeVisible({ timeout: 15_000 });

  await page.getByLabel("Search Photon treatment catalog").fill("hydrocortisone");
  await page.getByRole("button", { name: "Search catalog" }).click();
  await expect(page.getByText(/Hydrocortisone/i).first()).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: /^Select / }).first().click();
  await expect(page.getByText("Treatment selected")).toBeVisible();

  await page.getByRole("button", { name: "Sync Photon" }).click();
  await expect(page.getByText(/Synced to Photon|Updated in Photon/).first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/^pat_/).first()).toBeVisible();

  await page.getByLabel("Clinician note, English").fill(
    "Suspected eczema flare on forearms. Discussed moisturizer and short course topical steroid.",
  );
  await page.getByRole("button", { name: "Generate instructions" }).click();

  await expect(page.getByText("Not generated")).toHaveCount(0, { timeout: 30_000 });
  await expect(page.getByText(/Instrucciones|hidrocortisona|eczema/i).first()).toBeVisible();
});
