import { expect, test } from "@playwright/test";

test.describe("FUZO Next.js MVP Smoke Tests", () => {
  test("homepage loads and shows FUZO title", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("FUZO (Next.js MVP)");
  });

  test("feed page renders without error", async ({ page }) => {
    await page.goto("/feed");
    await expect(page.locator("h2")).toContainText("Feed");
  });

  test("supabase connection is healthy", async ({ page }) => {
    const response = await page.request.get("/api/debug/supabase");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test("navigation links work", async ({ page }) => {
    await page.goto("/");

    // Test feed link
    await page.click("text=Feed");
    await expect(page).toHaveURL("/feed");

    // Test bites link
    await page.goto("/");
    await page.click("text=Bites");
    await expect(page).toHaveURL("/bites");

    // Test scout link
    await page.goto("/");
    await page.click("text=Scout");
    await expect(page).toHaveURL("/scout");
  });
});
