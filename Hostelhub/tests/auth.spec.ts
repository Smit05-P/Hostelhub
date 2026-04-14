import { test, expect } from '@playwright/test';

// Define a unique suffix to avoid email clashes during repetitive tests
const uniqueSuffix = Date.now().toString();
const adminEmail = `admin_${uniqueSuffix}@example.com`;
const studentEmail = `student_${uniqueSuffix}@example.com`;
const password = 'Password@123';

test.describe('Authentication & Access Control', () => {

  test('Should redirect unauthenticated users away from protected routes', async ({ page }) => {
    // Try visiting an admin protected route
    await page.goto('/admin/dashboard');
    // Should be redirected to /login
    await expect(page).toHaveURL(/.*\/login/);

    // Try visiting a student protected route
    await page.goto('/student/dashboard');
    // Should be redirected to /login
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('Admin Signup and Login Flow', async ({ page }) => {
    await page.goto('/register');

    // Select Admin Role Toggle
    // Identifying the SaaSRoleToggle component: it likely has buttons containing 'Admin' and 'Student'
    await page.getByRole('button', { name: /admin/i }).click();

    // Fill in the registration form
    await page.fill('input[name="name"]', 'Test Admin');
    await page.fill('input[name="email"]', adminEmail);
    await page.fill('input[name="phone"]', '9876543210');
    await page.fill('input[name="hostelName"]', 'Playwright Test Hostel');
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    
    // Check 'agreeToTerms'
    await page.locator('input[name="agreeToTerms"]').check({ force: true });

    // Submit form
    await page.getByRole('button', { name: /create account/i }).click();

    // After Admin signup, they should be redirected to /admin/hostels or dashboard
    await expect(page).toHaveURL(/.*\/admin\/hostels/, { timeout: 15000 });

    // Now test logout
    await page.getByRole('button', { name: /logout|sign out/i }).click();
    await expect(page).toHaveURL(/.*\/login/);

    // Test Admin Login
    await page.fill('input[name="email"]', adminEmail);
    await page.fill('input[name="password"]', password);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect back to admin route
    await expect(page).toHaveURL(/.*\/admin/);
  });

  test('Student Signup and Login Flow', async ({ page }) => {
    await page.goto('/register');

    // Default role is Student, but let's click it to be sure
    await page.getByRole('button', { name: /student/i }).click();

    // Fill in the registration form
    await page.fill('input[name="name"]', 'Test Student');
    await page.fill('input[name="email"]', studentEmail);
    await page.fill('input[name="phone"]', '9876543211');
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    
    // Check 'agreeToTerms'
    await page.locator('input[name="agreeToTerms"]').check({ force: true });

    // Submit form
    await page.getByRole('button', { name: /create account/i }).click();

    // After Student signup, they should be redirected to /student/select-hostel or similar
    await expect(page).toHaveURL(/.*\/student\/select-hostel/, { timeout: 15000 });

    // Test logout
    await page.getByRole('button', { name: /logout|sign out/i }).click();
    await expect(page).toHaveURL(/.*\/login/);

    // Test Student Login
    await page.fill('input[name="email"]', studentEmail);
    await page.fill('input[name="password"]', password);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect back to student route
    await expect(page).toHaveURL(/.*\/student/);
  });
});
