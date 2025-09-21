import { expect, test } from "@playwright/test";

test.describe("Expired Session Redirect Handling", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173");
  });

  test("should redirect to landing when session expires during app usage", async ({
    page,
  }) => {
    // Mock valid session first
    await page.evaluate(() => {
      localStorage.setItem(
        "fuzo-auth-token",
        JSON.stringify({
          access_token: "valid_token",
          refresh_token: "valid_refresh",
          expires_at: Date.now() + 3600000,
          user: {
            id: "test-user",
            email: "test@example.com",
          },
        })
      );
    });

    // Navigate to protected route
    await page.goto("http://localhost:5173/feed");
    await expect(page.locator("text=Feed")).toBeVisible();

    // Simulate session expiration by updating localStorage
    await page.evaluate(() => {
      localStorage.setItem(
        "fuzo-auth-token",
        JSON.stringify({
          access_token: "expired_token",
          refresh_token: "expired_refresh",
          expires_at: Date.now() - 3600000, // Expired
          user: {
            id: "test-user",
            email: "test@example.com",
          },
        })
      );
    });

    // Trigger a navigation that would check auth
    await page.reload();

    // Should redirect to landing page
    await expect(page.locator("text=Build your food map")).toBeVisible();
  });

  test("should handle token refresh failure gracefully", async ({ page }) => {
    // Mock session with invalid refresh token
    await page.evaluate(() => {
      localStorage.setItem(
        "fuzo-auth-token",
        JSON.stringify({
          access_token: "expired_token",
          refresh_token: "invalid_refresh",
          expires_at: Date.now() - 3600000,
          user: {
            id: "test-user",
            email: "test@example.com",
          },
        })
      );
    });

    // Navigate to protected route
    await page.goto("http://localhost:5173/feed");

    // Should redirect to landing page
    await expect(page.locator("text=Build your food map")).toBeVisible();
  });

  test("should clear invalid session data on redirect", async ({ page }) => {
    // Mock invalid session
    await page.evaluate(() => {
      localStorage.setItem(
        "fuzo-auth-token",
        JSON.stringify({
          access_token: "invalid_token",
          refresh_token: "invalid_refresh",
          expires_at: Date.now() - 3600000,
          user: null,
        })
      );
    });

    // Navigate to protected route
    await page.goto("http://localhost:5173/feed");

    // Should redirect to landing page
    await expect(page.locator("text=Build your food map")).toBeVisible();

    // Check that invalid session data is cleared
    const sessionData = await page.evaluate(() => {
      return localStorage.getItem("fuzo-auth-token");
    });

    // Should either be cleared or contain valid data
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      expect(parsed.user).toBeTruthy();
    }
  });

  test("should not cause infinite redirect loops", async ({ page }) => {
    // Mock session that might cause loops
    await page.evaluate(() => {
      localStorage.setItem(
        "fuzo-auth-token",
        JSON.stringify({
          access_token: "loop_token",
          refresh_token: "loop_refresh",
          expires_at: Date.now() + 3600000,
          user: {
            id: "test-user",
            email: "test@example.com",
          },
        })
      );
    });

    // Navigate to protected route
    await page.goto("http://localhost:5173/feed");

    // Wait for initial load
    await page.waitForLoadState("networkidle");

    // Count redirects by monitoring URL changes
    let redirectCount = 0;
    const originalUrl = page.url();

    page.on("response", (response) => {
      if (response.status() === 302 || response.status() === 301) {
        redirectCount++;
      }
    });

    // Wait a bit to see if there are excessive redirects
    await page.waitForTimeout(3000);

    // Should not have excessive redirects (more than 3 is suspicious)
    expect(redirectCount).toBeLessThan(3);

    // Should end up on a valid page
    const finalUrl = page.url();
    expect(finalUrl).toMatch(/\/(feed|landing)/);
  });
});
