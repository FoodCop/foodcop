import { expect, test } from "@playwright/test";

test.describe("User Profile and Plates Functionality", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto("http://localhost:5173");

    // Wait for the app to load
    await page.waitForLoadState("networkidle");
  });

  test("should create user profile and save restaurant to plate", async ({
    page,
  }) => {
    // Step 1: Navigate to onboarding to create profile
    await page.goto("http://localhost:5173/onboarding");
    await page.waitForLoadState("networkidle");

    // Fill out profile information
    await page.fill('input[placeholder*="Display Name"]', "Test User");
    await page.fill(
      'textarea[placeholder*="Bio"]',
      "Food lover and restaurant explorer"
    );

    // Select dietary preferences
    await page.click("text=Vegetarian");
    await page.click("text=Gluten-Free");

    // Select cuisine preferences
    await page.click("text=Italian");
    await page.click("text=Japanese");

    // Complete onboarding
    await page.click('button:has-text("Complete Profile")');

    // Wait for redirect to feed
    await page.waitForURL("**/feed");

    // Step 2: Navigate to Scout page to find restaurants
    await page.click('a[href="#scout"]');
    await page.waitForLoadState("networkidle");

    // Wait for restaurants to load
    await page.waitForSelector('[data-testid="restaurant-card"]', {
      timeout: 10000,
    });

    // Step 3: Save a restaurant to plate
    const firstRestaurant = page
      .locator('[data-testid="restaurant-card"]')
      .first();
    await firstRestaurant.click();

    // Wait for restaurant detail sheet
    await page.waitForSelector('[data-testid="restaurant-detail-sheet"]');

    // Click save button
    await page.click('button:has-text("Save to Plate")');

    // Verify success message
    await expect(
      page.locator("text=Restaurant saved to your plate")
    ).toBeVisible();

    // Step 4: Navigate to profile to verify saved restaurant
    await page.click('a[href="#profile"]');
    await page.waitForLoadState("networkidle");

    // Click on Plates tab
    await page.click('button:has-text("Plates")');

    // Verify saved restaurant appears in plates
    await expect(
      page.locator('[data-testid="saved-restaurant"]')
    ).toBeVisible();

    // Verify restaurant details
    const savedRestaurant = page
      .locator('[data-testid="saved-restaurant"]')
      .first();
    await expect(savedRestaurant.locator("h3")).toBeVisible();
    await expect(savedRestaurant.locator("text=Saved")).toBeVisible();
  });

  test("should save photo to user profile", async ({ page }) => {
    // Step 1: Complete onboarding if not already done
    await page.goto("http://localhost:5173/onboarding");
    await page.waitForLoadState("networkidle");

    if (await page.locator('input[placeholder*="Display Name"]').isVisible()) {
      await page.fill('input[placeholder*="Display Name"]', "Photo Test User");
      await page.fill('textarea[placeholder*="Bio"]', "Food photographer");
      await page.click('button:has-text("Complete Profile")');
      await page.waitForURL("**/feed");
    }

    // Step 2: Navigate to Snap page
    await page.click('a[href="#snap"]');
    await page.waitForLoadState("networkidle");

    // Step 3: Take a photo (simulate with file upload)
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test-food-photo.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("fake-image-data"),
    });

    // Wait for photo preview
    await page.waitForSelector('[data-testid="photo-preview"]');

    // Add caption and tags
    await page.fill('input[placeholder*="Caption"]', "Amazing pasta dish!");
    await page.fill('input[placeholder*="Tags"]', "pasta, italian, dinner");

    // Save photo
    await page.click('button:has-text("Save Photo")');

    // Verify success message
    await expect(page.locator("text=Photo saved successfully")).toBeVisible();

    // Step 4: Navigate to profile to verify saved photo
    await page.click('a[href="#profile"]');
    await page.waitForLoadState("networkidle");

    // Click on Photos tab
    await page.click('button:has-text("Photos")');

    // Verify saved photo appears
    await expect(page.locator('[data-testid="saved-photo"]')).toBeVisible();

    // Verify photo details
    const savedPhoto = page.locator('[data-testid="saved-photo"]').first();
    await expect(savedPhoto.locator("text=Amazing pasta dish!")).toBeVisible();
    await expect(
      savedPhoto.locator("text=pasta, italian, dinner")
    ).toBeVisible();
  });

  test("should update user profile information", async ({ page }) => {
    // Step 1: Navigate to profile
    await page.goto("http://localhost:5173/profile");
    await page.waitForLoadState("networkidle");

    // Step 2: Click edit profile button
    await page.click('button:has-text("Edit Profile")');

    // Step 3: Update profile information
    await page.fill('input[placeholder*="Display Name"]', "Updated Test User");
    await page.fill(
      'textarea[placeholder*="Bio"]',
      "Updated bio - food enthusiast"
    );

    // Update dietary preferences
    await page.click("text=Vegetarian"); // Toggle off
    await page.click("text=Vegan"); // Toggle on

    // Save changes
    await page.click('button:has-text("Save Changes")');

    // Step 4: Verify changes are saved
    await expect(page.locator("text=Updated Test User")).toBeVisible();
    await expect(
      page.locator("text=Updated bio - food enthusiast")
    ).toBeVisible();
    await expect(page.locator("text=Vegan")).toBeVisible();

    // Verify old preferences are removed
    await expect(page.locator("text=Vegetarian")).not.toBeVisible();
  });

  test("should handle plate management (save/unsave restaurants)", async ({
    page,
  }) => {
    // Step 1: Complete onboarding
    await page.goto("http://localhost:5173/onboarding");
    await page.waitForLoadState("networkidle");

    if (await page.locator('input[placeholder*="Display Name"]').isVisible()) {
      await page.fill('input[placeholder*="Display Name"]', "Plate Test User");
      await page.click('button:has-text("Complete Profile")');
      await page.waitForURL("**/feed");
    }

    // Step 2: Save multiple restaurants
    await page.click('a[href="#scout"]');
    await page.waitForLoadState("networkidle");

    // Save first restaurant
    await page.waitForSelector('[data-testid="restaurant-card"]', {
      timeout: 10000,
    });
    const firstRestaurant = page
      .locator('[data-testid="restaurant-card"]')
      .first();
    await firstRestaurant.click();
    await page.waitForSelector('[data-testid="restaurant-detail-sheet"]');
    await page.click('button:has-text("Save to Plate")');
    await page.click('button[aria-label="Close"]'); // Close detail sheet

    // Save second restaurant
    const secondRestaurant = page
      .locator('[data-testid="restaurant-card"]')
      .nth(1);
    await secondRestaurant.click();
    await page.waitForSelector('[data-testid="restaurant-detail-sheet"]');
    await page.click('button:has-text("Save to Plate")');
    await page.click('button[aria-label="Close"]');

    // Step 3: Navigate to profile plates tab
    await page.click('a[href="#profile"]');
    await page.waitForLoadState("networkidle");
    await page.click('button:has-text("Plates")');

    // Verify both restaurants are saved
    await expect(page.locator('[data-testid="saved-restaurant"]')).toHaveCount(
      2
    );

    // Step 4: Unsave one restaurant
    const firstSavedRestaurant = page
      .locator('[data-testid="saved-restaurant"]')
      .first();
    await firstSavedRestaurant.hover();
    await page.click('button[aria-label="Remove from Plate"]');

    // Confirm unsave
    await page.click('button:has-text("Remove")');

    // Verify only one restaurant remains
    await expect(page.locator('[data-testid="saved-restaurant"]')).toHaveCount(
      1
    );
  });

  test("should persist user data across sessions", async ({
    page,
    context,
  }) => {
    // Step 1: Create profile and save data
    await page.goto("http://localhost:5173/onboarding");
    await page.waitForLoadState("networkidle");

    if (await page.locator('input[placeholder*="Display Name"]').isVisible()) {
      await page.fill(
        'input[placeholder*="Display Name"]',
        "Persistence Test User"
      );
      await page.fill(
        'textarea[placeholder*="Bio"]',
        "Testing data persistence"
      );
      await page.click('button:has-text("Complete Profile")');
      await page.waitForURL("**/feed");
    }

    // Save a restaurant
    await page.click('a[href="#scout"]');
    await page.waitForLoadState("networkidle");
    await page.waitForSelector('[data-testid="restaurant-card"]', {
      timeout: 10000,
    });
    const restaurant = page.locator('[data-testid="restaurant-card"]').first();
    await restaurant.click();
    await page.waitForSelector('[data-testid="restaurant-detail-sheet"]');
    await page.click('button:has-text("Save to Plate")');
    await page.click('button[aria-label="Close"]');

    // Step 2: Close browser and reopen
    await context.close();

    // Step 3: Open new browser session
    const newPage = await context.newPage();
    await newPage.goto("http://localhost:5173");
    await newPage.waitForLoadState("networkidle");

    // Step 4: Navigate to profile and verify data persists
    await newPage.click('a[href="#profile"]');
    await newPage.waitForLoadState("networkidle");

    // Verify profile data
    await expect(newPage.locator("text=Persistence Test User")).toBeVisible();
    await expect(
      newPage.locator("text=Testing data persistence")
    ).toBeVisible();

    // Verify saved restaurant
    await newPage.click('button:has-text("Plates")');
    await expect(
      newPage.locator('[data-testid="saved-restaurant"]')
    ).toBeVisible();
  });

  test("should handle profile loading states and errors gracefully", async ({
    page,
  }) => {
    // Test loading state
    await page.goto("http://localhost:5173/profile");

    // Should show loading spinner initially
    await expect(page.locator('[data-testid="profile-loading"]')).toBeVisible();

    // Wait for profile to load
    await page.waitForLoadState("networkidle");
    await expect(
      page.locator('[data-testid="profile-loading"]')
    ).not.toBeVisible();

    // Test error handling by simulating network failure
    await page.route("**/profile/**", (route) => route.abort());

    // Try to save a restaurant (should handle error gracefully)
    await page.click('a[href="#scout"]');
    await page.waitForLoadState("networkidle");

    if (await page.locator('[data-testid="restaurant-card"]').isVisible()) {
      const restaurant = page
        .locator('[data-testid="restaurant-card"]')
        .first();
      await restaurant.click();
      await page.waitForSelector('[data-testid="restaurant-detail-sheet"]');
      await page.click('button:has-text("Save to Plate")');

      // Should show error message
      await expect(
        page.locator("text=Failed to save restaurant")
      ).toBeVisible();
    }
  });
});
