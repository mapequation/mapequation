import { expect, test } from "@playwright/test";

test("home renders without errors", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /map equation framework/i }),
  ).toBeVisible();
  await expect(page.getByText("Something went wrong.")).toHaveCount(0);
});

test("infomap product page renders and links to workbench", async ({
  page,
}) => {
  await page.goto("/infomap/");
  await expect(
    page.getByRole("heading", {
      name: /network community detection using the map equation framework/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /try infomap/i }).first(),
  ).toBeVisible();
  await expect(page.getByText("Something went wrong.")).toHaveCount(0);
});

test("workbench loads and runs an example network", async ({ page }) => {
  test.setTimeout(90_000);

  await page.goto("/infomap/workbench/");

  await expect(
    page.getByRole("heading", { name: "Network input" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Run" })).toBeVisible();
  await expect(page.getByLabel("Interactive network preview")).toBeVisible();
  await expect(page.getByText(/previewing network structure/i)).toBeVisible();
  await expect(page.getByText("Something went wrong.")).toHaveCount(0);

  await page.getByRole("button", { name: "Two triangles" }).click();
  await page.getByRole("button", { name: "Run" }).click();

  const cluTab = page.getByRole("button", { name: "Clu", exact: true });
  await expect(cluTab).toBeVisible({ timeout: 60_000 });
  await cluTab.click();

  await expect(
    page.getByRole("button", { name: "Download", exact: true }),
  ).toBeEnabled({ timeout: 10_000 });
  await expect(
    page.getByRole("button", { name: "Download All" }),
  ).toBeEnabled();
  await expect(page.getByText("Something went wrong.")).toHaveCount(0);
});

test("section pages render without errors", async ({ page }) => {
  for (const path of ["/about/", "/apps/", "/publications/"]) {
    await page.goto(path);
    await expect(page.getByText("Something went wrong.")).toHaveCount(0);
  }
});
