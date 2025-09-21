import { test, expect } from '@playwright/test';

test.describe('OAuth Login Cancelled Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('should handle OAuth cancellation gracefully', async ({ page }) => {
    // Click on sign up/login button
    await page.click('text=Start pinning');
    
    // Wait for onboarding page
    await expect(page.locator('text=Cook it tonight')).toBeVisible();
    
    // Click on Google sign in button
    await page.click('text=Continue with Google');
    
    // Wait for Google OAuth popup
    const popup = await page.waitForEvent('popup');
    
    // Close the popup without completing OAuth (simulating cancellation)
    await popup.close();
    
    // Should remain on the onboarding page
    await expect(page.locator('text=Cook it tonight')).toBeVisible();
    
    // Should not redirect to auth callback
    expect(page.url()).not.toContain('/auth/callback');
  });

  test('should handle OAuth error callback', async ({ page }) => {
    // Simulate OAuth error callback
    await page.goto('http://localhost:5173/auth/callback?error=access_denied&error_description=User%20denied%20access');
    
    // Wait for error handling
    await page.waitForLoadState('networkidle');
    
    // Should show error message or redirect to landing
    await expect(page.locator('text=Sign in failed')).toBeVisible();
    
    // Should have option to return to home
    await expect(page.locator('text=Return to home')).toBeVisible();
  });

  test('should handle invalid OAuth callback parameters', async ({ page }) => {
    // Simulate invalid callback
    await page.goto('http://localhost:5173/auth/callback?code=invalid&state=mismatch');
    
    // Wait for processing
    await page.waitForLoadState('networkidle');
    
    // Should handle error gracefully
    await expect(page.locator('text=Sign in failed')).toBeVisible();
  });
});
