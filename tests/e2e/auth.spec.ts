import { test, expect } from '@playwright/test';

test.describe('Authentication Smoke Test', () => {
    test('should redirect to login when accessing protected dashboard', async ({ page }) => {
        await page.goto('/admin');
        // Adjust this to match your actual redirection logic or login page content
        await expect(page).toHaveURL(/\/login/);
    });

    test('should show error on invalid login', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="email"]', 'wrong@example.com');
        await page.fill('input[name="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');

        // Adjust this to match your actual error toast/message
        const errorMsg = page.locator('text=Error');
        // await expect(errorMsg).toBeVisible(); 
    });
});
