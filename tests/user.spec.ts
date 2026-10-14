import { Page } from '@playwright/test';
import { test, expect } from 'playwright-test-coverage';

// Register a new diner with a random name and email, open their dashboard, and return both.
// The name stays two words starting with p and d, so the header's initials link is always 'pd'.
async function registerDiner(page: Page): Promise<{ name: string; email: string }> {
  const id = Math.floor(Math.random() * 1000000);
  const name = `pizza diner${id}`;
  const email = `user${id}@jwt.com`;
  await page.goto('/');
  await page.getByRole('link', { name: 'Register' }).click();
  await page.getByRole('textbox', { name: 'Full name' }).fill(name);
  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill('diner');
  await page.getByRole('button', { name: 'Register' }).click();

  await page.getByRole('link', { name: 'pd' }).click();
  return { name, email };
}

// Log in and open the dashboard.
async function login(page: Page, email: string, password: string) {
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Login' }).click();

  await page.getByRole('link', { name: 'pd' }).click();
}

// Log in as the seeded admin and open the admin dashboard.
async function loginAdmin(page: Page) {
  await page.goto('/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();

  await page.getByRole('link', { name: 'Admin' }).click();
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
  const { email } = await registerDiner(page);
  await expect(page.getByRole('main')).toContainText('pizza diner');

  await updateName(page, 'pizza dinerx');
  await expect(page.getByRole('main')).toContainText('pizza dinerx');

  await page.getByRole('link', { name: 'Logout' }).click();
  await login(page, email, 'diner');
  await expect(page.getByRole('main')).toContainText('pizza dinerx');
});

test('listUsers', async ({ page }) => {
  const { name, email } = await registerDiner(page);
  await page.getByRole('link', { name: 'Logout' }).click();
  await loginAdmin(page);

  const usersTable = page.getByRole('table', { name: 'Users' });
  await expect(usersTable).toBeVisible();
  await page.getByRole('textbox', { name: 'Filter users' }).fill(name);
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(usersTable).toContainText(name);
  await expect(usersTable).toContainText(email);
  await expect(usersTable).toContainText('diner');
});

test('listUsers pages through users', async ({ page, request }) => {
  // Make sure there are more users than one page (10) holds.
  for (let i = 0; i < 11; i++) {
    const id = Math.floor(Math.random() * 1000000);
    await request.post('http://localhost:3000/api/auth', { data: { name: `paging user${id}`, email: `paging${id}@jwt.com`, password: 'a' } });
  }
  await loginAdmin(page);

  const usersTable = page.getByRole('table', { name: 'Users' });
  // The first user row (tbody, so not the header or footer). textContent waits until it exists.
  const firstRow = usersTable.locator('tbody tr').first();
  const firstOnPage0 = await firstRow.textContent();
  await expect(page.getByRole('button', { name: 'Prev' })).toBeDisabled();

  await page.getByRole('button', { name: 'Next' }).click();
  await expect(firstRow).not.toHaveText(firstOnPage0 ?? '');
  await expect(page.getByRole('button', { name: 'Prev' })).toBeEnabled();

  await page.getByRole('button', { name: 'Prev' }).click();
  await expect(firstRow).toHaveText(firstOnPage0 ?? '');
});
