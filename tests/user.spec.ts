import { Page } from '@playwright/test';
import { test, expect } from 'playwright-test-coverage';

// Register a new diner with a random email, open their dashboard, and return the email.
async function registerDiner(page: Page): Promise<string> {
  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  await page.goto('/');
  await page.getByRole('link', { name: 'Register' }).click();
  await page.getByRole('textbox', { name: 'Full name' }).fill('pizza diner');
  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill('diner');
  await page.getByRole('button', { name: 'Register' }).click();

  await page.getByRole('link', { name: 'pd' }).click();
  return email;
}

// Log in and open the dashboard.
async function login(page: Page, email: string, password: string) {
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Login' }).click();

  await page.getByRole('link', { name: 'pd' }).click();
}

// Change the name in the edit dialog and wait for the dialog to close.
async function updateName(page: Page, name: string) {
  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('h3')).toContainText('Edit user');
  await page.getByRole('textbox', { name: 'name', exact: true }).fill(name);
  await page.getByRole('button', { name: 'Update' }).click();

  await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });
}

test('updateUser', async ({ page }) => {
  const email = await registerDiner(page);
  await expect(page.getByRole('main')).toContainText('pizza diner');

  await updateName(page, 'pizza dinerx');
  await expect(page.getByRole('main')).toContainText('pizza dinerx');

  await page.getByRole('link', { name: 'Logout' }).click();
  await login(page, email, 'diner');
  await expect(page.getByRole('main')).toContainText('pizza dinerx');
});
