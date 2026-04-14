import { test, expect } from '@playwright/test';

// Define unique credentials for this test
const uniqueSuffix = Date.now().toString();
const adminEmail = `admin_hostel_${uniqueSuffix}@example.com`;
const studentEmail = `student_hostel_${uniqueSuffix}@example.com`;
const password = 'Password@123';
let joinCode = '';

test.describe('Hostel Creation & Join Flow', () => {

  test.beforeAll(async ({ browser }) => {
    // We run tests sequentially in this describe block, but usually playwright does tests in parallel in different workers.
    // To share state (like join code), we can do it in a single test, or use setup.
    // For simplicity, we will do the whole flow in a single test block.
  });

  test('E2E: Admin creates hostel, generates code, and Student joins', async ({ page }) => {
    // 1. Admin Signup
    await page.goto('/register');
    await page.getByRole('button', { name: /admin/i }).click();

    await page.fill('input[name="name"]', 'Hostel Admin');
    await page.fill('input[name="email"]', adminEmail);
    await page.fill('input[name="phone"]', '9876543210');
    await page.fill('input[name="hostelName"]', 'E2E Testing Hostel');
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.locator('input[name="agreeToTerms"]').check({ force: true });
    await page.getByRole('button', { name: /create account/i }).click();

    // Verify redirect
    await expect(page).toHaveURL(/.*\/admin\/hostels/, { timeout: 15000 });

    // 2. Wait for hostels to load or show empty state
    // Click "Add Property" or "Initialize Unit 01"
    const addBtn = page.getByRole('button', { name: /add property|initialize unit 01/i });
    await addBtn.waitFor({ state: 'visible' });
    await addBtn.first().click();

    // 3. Fill Add Hostel Modal
    await page.fill('input[placeholder="e.g. Royal Heritage Residency"]', 'E2E Secondary Property');
    await page.fill('input[placeholder="e.g. Samuel Jackson"]', 'Admin Owner');
    await page.fill('textarea[placeholder="Full physical address..."]', '123 Test Street');
    await page.fill('input[placeholder="+91..."]', '9876543210');
    await page.fill('input[placeholder="Max occupancy"]', '50');

    await page.getByRole('button', { name: /initialize property/i }).click();

    // 4. Extract Join Code (wait for the card to appear)
    // The code is usually displayed visually. Let's find the text that looks like HST-XXXX 
    const codeElement = page.locator('text=/HST-[A-Z0-9]{4,6}/').first();
    await codeElement.waitFor({ state: 'visible' });
    joinCode = await codeElement.textContent() || '';
    
    // Check code was extracted
    expect(joinCode).toMatch(/HST-[A-Z0-9]+/);

    // 5. Admin Log Out
    await page.getByRole('button', { name: /log out|logout/i }).first().click();
    await expect(page).toHaveURL(/.*\/login/);

    // 6. Student Signup
    await page.goto('/register');
    await page.getByRole('button', { name: /student/i }).click();

    await page.fill('input[name="name"]', 'Test Student');
    await page.fill('input[name="email"]', studentEmail);
    await page.fill('input[name="phone"]', '9876543211');
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.locator('input[name="agreeToTerms"]').check({ force: true });
    await page.getByRole('button', { name: /create account/i }).click();

    // Verify student redirect
    await expect(page).toHaveURL(/.*\/student\/select-hostel/, { timeout: 15000 });

    // 7. Student joins via code
    // The tab "Have a Code" is default
    await page.fill('input[placeholder="ENTER JOIN CODE..."]', joinCode);
    
    // Provide some time for auth context to be fully ready before clicking submit
    await page.waitForTimeout(2000);
    
    await page.getByRole('button', { name: /submit key/i }).click();

    // 8. Verify they redirect to dashboard or pending
    // Usually, code join has auto-approve true from the start, so maybe dashboard.
    await expect(page).toHaveURL(/.*\/student\/(dashboard|pending)/, { timeout: 10000 });
  });

});
