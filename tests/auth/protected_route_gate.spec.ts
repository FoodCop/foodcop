import { test, expect } from '@playwright/test';

test.describe('Protected Route Access Control', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('should redirect unauthenticated users to landing page', async ({ page }) => {
    // Try to access protected route directly
    await page.goto('http://localhost:5173/feed');
    
    // Should redirect to landing page
    await expect(page.locator('text=Build your food map')).toBeVisible();
    expect(page.url()).toContain('/');
  });

  test('should allow authenticated users to access protected routes', async ({ page }) => {
    // Mock authentication by setting session in localStorage
    await page.evaluate(() => {
      localStorage.setItem('fuzo-auth-token', JSON.stringify({
        access_token: 'mock_token',
        refresh_token: 'mock_refresh',
        expires_at: Date.now() + 3600000,
        user: {
          id: 'test-user',
          email: 'test@example.com'
        }
      }));
    });
    
    // Navigate to protected route
    await page.goto('http://localhost:5173/feed');
    
    // Should allow access to feed
    await expect(page.locator('text=Feed')).toBeVisible();
  });

  test('should handle session expiration gracefully', async ({ page }) => {
    // Mock expired session
    await page.evaluate(() => {
      localStorage.setItem('fuzo-auth-token', JSON.stringify({
        access_token: 'expired_token',
        refresh_token: 'expired_refresh',
        expires_at: Date.now() - 3600000, // Expired
        user: {
          id: 'test-user',
          email: 'test@example.com'
        }
      }));
    });
    
    // Navigate to protected route
    await page.goto('http://localhost:5173/feed');
    
    // Should redirect to landing page due to expired session
    await expect(page.locator('text=Build your food map')).toBeVisible();
  });

  test('should prevent redirect loops', async ({ page }) => {
    // Mock invalid session that might cause loops
    await page.evaluate(() => {
      localStorage.setItem('fuzo-auth-token', JSON.stringify({
        access_token: 'invalid_token',
        refresh_token: 'invalid_refresh',
        expires_at: Date.now() + 3600000,
        user: null
      }));
    });
    
    // Navigate to protected route
    await page.goto('http://localhost:5173/feed');
    
    // Should redirect to landing page without loops
    await expect(page.locator('text=Build your food map')).toBeVisible();
    
    // Wait a bit to ensure no redirect loops
    await page.waitForTimeout(2000);
    
    // Should still be on landing page
    expect(page.url()).toContain('/');
  });
});
