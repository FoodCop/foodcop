import { expect, test } from "@playwright/test";

test.describe("Save to Plate Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app (adjust URL as needed)
    await page.goto("http://localhost:5173");

    // Wait for the app to load
    await page.waitForLoadState("networkidle");
  });

  test("should save a restaurant to plate with confirmation", async ({
    page,
  }) => {
    // Assume we're on a page with restaurant cards
    // This would need to be adjusted based on your actual app structure

    // Find a save button (this selector would need to be updated based on your actual implementation)
    const saveButton = page
      .locator('[data-testid="save-restaurant-button"]')
      .first();

    // Click save button
    await saveButton.click();

    // Should open confirmation dialog
    await expect(page.locator("text=Save to Plate?")).toBeVisible();

    // Click confirm
    await page.locator('button:has-text("Save")').click();

    // Should show success toast
    await expect(page.locator("text=Saved to your Plate")).toBeVisible();

    // Button should now show as saved
    await expect(saveButton.locator("text=Saved")).toBeVisible();
  });

  test("should cancel save operation", async ({ page }) => {
    const saveButton = page
      .locator('[data-testid="save-restaurant-button"]')
      .first();

    await saveButton.click();

    // Should open confirmation dialog
    await expect(page.locator("text=Save to Plate?")).toBeVisible();

    // Click cancel
    await page.locator('button:has-text("Cancel")').click();

    // Dialog should close
    await expect(page.locator("text=Save to Plate?")).not.toBeVisible();

    // Button should still show as not saved
    await expect(saveButton.locator("text=Save")).toBeVisible();
  });

  test("should close dialog with escape key", async ({ page }) => {
    const saveButton = page
      .locator('[data-testid="save-restaurant-button"]')
      .first();

    await saveButton.click();

    // Should open confirmation dialog
    await expect(page.locator("text=Save to Plate?")).toBeVisible();

    // Press escape
    await page.keyboard.press("Escape");

    // Dialog should close
    await expect(page.locator("text=Save to Plate?")).not.toBeVisible();
  });

  test("should show login prompt for unauthenticated users", async ({
    page,
  }) => {
    // This test would need to be run in a context where user is not logged in
    // You might need to clear localStorage/cookies or use a different test setup

    const saveButton = page
      .locator('[data-testid="save-restaurant-button"]')
      .first();

    await saveButton.click();

    // Should show login error instead of dialog
    await expect(
      page.locator("text=Please sign in to save items to your Plate")
    ).toBeVisible();
  });

  test("should save recipe to plate", async ({ page }) => {
    // Navigate to recipes page (adjust navigation as needed)
    await page.locator('a:has-text("Recipes")').click();
    await page.waitForLoadState("networkidle");

    const saveButton = page
      .locator('[data-testid="save-recipe-button"]')
      .first();

    await saveButton.click();

    await expect(page.locator("text=Save to Plate?")).toBeVisible();
    await page.locator('button:has-text("Save")').click();
    await expect(page.locator("text=Saved to your Plate")).toBeVisible();
  });

  test("should show saved items on Plate page", async ({ page }) => {
    // First save an item
    const saveButton = page
      .locator('[data-testid="save-restaurant-button"]')
      .first();
    await saveButton.click();
    await page.locator('button:has-text("Save")').click();
    await expect(page.locator("text=Saved to your Plate")).toBeVisible();

    // Navigate to Plate page
    await page.locator('a:has-text("Plate")').click();
    await page.waitForLoadState("networkidle");

    // Should see the saved item
    await expect(page.locator("text=Your Plate")).toBeVisible();
    await expect(
      page.locator('[data-testid="saved-item"]')
    ).toHaveCount.greaterThan(0);
  });

  test("should filter saved items by type", async ({ page }) => {
    // Navigate to Plate page
    await page.locator('a:has-text("Plate")').click();
    await page.waitForLoadState("networkidle");

    // Click restaurant filter
    await page.locator('button:has-text("Restaurant")').click();

    // Should only show restaurants
    const savedItems = page.locator('[data-testid="saved-item"]');
    const count = await savedItems.count();

    for (let i = 0; i < count; i++) {
      await expect(savedItems.nth(i).locator("text=Restaurant")).toBeVisible();
    }
  });

  test("should search saved items", async ({ page }) => {
    // Navigate to Plate page
    await page.locator('a:has-text("Plate")').click();
    await page.waitForLoadState("networkidle");

    // Search for specific item
    await page.fill('[placeholder*="Search your saved items"]', "Pizza");

    // Should filter results
    const savedItems = page.locator('[data-testid="saved-item"]');
    const count = await savedItems.count();

    for (let i = 0; i < count; i++) {
      await expect(savedItems.nth(i).locator("text=Pizza")).toBeVisible();
    }
  });

  test("should unsave items from Plate page", async ({ page }) => {
    // Navigate to Plate page
    await page.locator('a:has-text("Plate")').click();
    await page.waitForLoadState("networkidle");

    // Find a saved item
    const savedItem = page.locator('[data-testid="saved-item"]').first();
    const unsaveButton = savedItem.locator('[data-testid="unsave-button"]');

    // Click unsave
    await unsaveButton.click();

    // Item should be removed from list
    await expect(savedItem).not.toBeVisible();
  });

  test("should handle duplicate saves gracefully", async ({ page }) => {
    const saveButton = page
      .locator('[data-testid="save-restaurant-button"]')
      .first();

    // Save first time
    await saveButton.click();
    await page.locator('button:has-text("Save")').click();
    await expect(page.locator("text=Saved to your Plate")).toBeVisible();

    // Try to save again (should not show dialog if already saved)
    await saveButton.click();

    // Should not show dialog for already saved items
    await expect(page.locator("text=Save to Plate?")).not.toBeVisible();
  });

  test("should be idempotent under rapid clicking", async ({ page }) => {
    const saveButton = page
      .locator('[data-testid="save-restaurant-button"]')
      .first();

    // Rapidly click save button 5 times
    for (let i = 0; i < 5; i++) {
      await saveButton.click();
      // Only first click should show dialog
      if (i === 0) {
        await expect(page.locator("text=Save to Plate?")).toBeVisible();
        await page.locator('button:has-text("Save")').click();
        await expect(page.locator("text=Saved to your Plate")).toBeVisible();
      } else {
        // Subsequent clicks should not show dialog
        await expect(page.locator("text=Save to Plate?")).not.toBeVisible();
      }
    }

    // Button should show as saved
    await expect(saveButton.locator("text=Saved")).toBeVisible();
  });

  test("should handle retry after network timeout", async ({ page }) => {
    const saveButton = page
      .locator('[data-testid="save-restaurant-button"]')
      .first();

    // Simulate network timeout on first attempt
    await page.route("**/save-item", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.abort();
    });

    // First attempt should fail
    await saveButton.click();
    await page.locator('button:has-text("Save")').click();
    await expect(page.locator("text=Failed to save to Plate")).toBeVisible();

    // Remove timeout and retry
    await page.unroute("**/save-item");
    await saveButton.click();
    await page.locator('button:has-text("Save")').click();
    await expect(page.locator("text=Saved to your Plate")).toBeVisible();
  });

  test("should show loading state during save", async ({ page }) => {
    // Slow down network to see loading state
    await page.route("**/save-item", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.continue();
    });

    const saveButton = page
      .locator('[data-testid="save-restaurant-button"]')
      .first();

    await saveButton.click();
    await page.locator('button:has-text("Save")').click();

    // Should show loading state
    await expect(page.locator("text=Saving...")).toBeVisible();

    // Wait for completion
    await expect(page.locator("text=Saved to your Plate")).toBeVisible();
  });

  test("should handle save errors gracefully", async ({ page }) => {
    // Mock network error
    await page.route("**/save-item", (route) => route.abort());

    const saveButton = page
      .locator('[data-testid="save-restaurant-button"]')
      .first();

    await saveButton.click();
    await page.locator('button:has-text("Save")').click();

    // Should show error message
    await expect(
      page.locator("text=Couldn't save. Please try again.")
    ).toBeVisible();

    // Button should revert to unsaved state
    await expect(saveButton.locator("text=Save")).toBeVisible();
  });

  test("should be keyboard accessible", async ({ page }) => {
    const saveButton = page
      .locator('[data-testid="save-restaurant-button"]')
      .first();

    // Tab to save button
    await page.keyboard.press("Tab");
    await expect(saveButton).toBeFocused();

    // Enter to open dialog
    await page.keyboard.press("Enter");
    await expect(page.locator("text=Save to Plate?")).toBeVisible();

    // Tab to cancel button
    await page.keyboard.press("Tab");
    await expect(page.locator('button:has-text("Cancel")')).toBeFocused();

    // Enter to cancel
    await page.keyboard.press("Enter");
    await expect(page.locator("text=Save to Plate?")).not.toBeVisible();
  });
});

test.describe("Plate Page Functionality", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("networkidle");

    // Navigate to Plate page
    await page.locator('a:has-text("Plate")').click();
    await page.waitForLoadState("networkidle");
  });

  test("should display empty state when no items saved", async ({ page }) => {
    // Clear any existing saved items (this would need to be implemented based on your setup)
    await page.evaluate(() => {
      localStorage.removeItem("saved-items");
    });

    await page.reload();
    await page.waitForLoadState("networkidle");

    await expect(page.locator("text=Your Plate is empty")).toBeVisible();
    await expect(
      page.locator("text=Start exploring and save items you love!")
    ).toBeVisible();
  });

  test("should display stats correctly", async ({ page }) => {
    // Should show counts for different item types
    await expect(page.locator("text=Restaurants")).toBeVisible();
    await expect(page.locator("text=Recipes")).toBeVisible();
    await expect(page.locator("text=Photos")).toBeVisible();
  });

  test("should sort items correctly", async ({ page }) => {
    // Click sort by name
    await page.locator('button:has-text("Name")').click();

    // Items should be sorted alphabetically
    const itemTitles = await page
      .locator('[data-testid="saved-item-title"]')
      .allTextContents();
    const sortedTitles = [...itemTitles].sort();

    expect(itemTitles).toEqual(sortedTitles);
  });

  test("should toggle between grid and list view", async ({ page }) => {
    // Default should be grid view
    const gridContainer = page.locator('[data-testid="saved-items-grid"]');
    await expect(gridContainer).toBeVisible();

    // Switch to list view
    await page.locator('button[aria-label="List view"]').click();

    const listContainer = page.locator('[data-testid="saved-items-list"]');
    await expect(listContainer).toBeVisible();
    await expect(gridContainer).not.toBeVisible();
  });
});
