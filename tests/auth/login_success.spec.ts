import { expect, test } from "@playwright/test";

test.describe("OAuth Login Success Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto("http://localhost:5173");
  });

  test("should complete OAuth login flow successfully", async ({ page }) => {
    // Wait for the landing page to load
    await expect(page.locator("text=Build your food map")).toBeVisible();

    // Click on sign up/login button
    await page.click("text=Start pinning");

    // Wait for onboarding page
    await expect(page.locator("text=Cook it tonight")).toBeVisible();

    // Click on Google sign in button
    await page.click("text=Continue with Google");

    // Wait for Google OAuth popup
    const popup = await page.waitForEvent("popup");

    // Handle Google OAuth flow
    await popup.waitForLoadState("networkidle");

    // Fill in Google credentials (you'll need to replace with test credentials)
    await popup.fill('input[type="email"]', "test@example.com");
    await popup.click("text=Next");

    await popup.fill('input[type="password"]', "testpassword");
    await popup.click("text=Next");

    // Wait for OAuth to complete and popup to close
    await popup.waitForEvent("close");

    // Wait for redirect to auth callback
    await page.waitForURL("**/auth/callback**");

    // Wait for auth callback to process
    await page.waitForLoadState("networkidle");

    // Should redirect to onboarding or feed
    await expect(page.url()).toMatch(/\/(onboarding|feed)/);

    // Verify user is authenticated
    await expect(page.locator("text=Welcome")).toBeVisible();
  });

  test("should handle OAuth callback with valid session", async ({ page }) => {
    // Simulate OAuth callback with valid session
    await page.goto(
      "http://localhost:5173/auth/callback?code=valid_code&state=valid_state"
    );

    // Wait for auth callback processing
    await page.waitForLoadState("networkidle");

    // Should redirect to appropriate page
    await expect(page.url()).toMatch(/\/(onboarding|feed)/);
  });

  test("should clean up URL parameters after OAuth callback", async ({
    page,
  }) => {
    // Navigate to callback with parameters
    await page.goto(
      "http://localhost:5173/auth/callback?code=test&state=test&onboarding=auth"
    );

    // Wait for processing
    await page.waitForLoadState("networkidle");

    // URL should be cleaned up (no query parameters)
    const url = new URL(page.url());
    expect(url.searchParams.has("code")).toBeFalsy();
    expect(url.searchParams.has("state")).toBeFalsy();
    expect(url.searchParams.has("onboarding")).toBeFalsy();
  });
});
