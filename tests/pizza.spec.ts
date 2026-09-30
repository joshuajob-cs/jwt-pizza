import { Page } from '@playwright/test';
import { test, expect } from 'playwright-test-coverage';
import { Franchise, Order, Role, User } from '../src/service/pizzaService';

async function basicInit(page: Page) {
  let loggedInUser: User | undefined;
  const validUsers: Record<string, User> = {
    'd@jwt.com': { id: '3', name: 'Kai Chen', email: 'd@jwt.com', password: 'a', roles: [{ role: Role.Diner }] },
    'f@jwt.com': { id: '5', name: 'Frank Owner', email: 'f@jwt.com', password: 'f', roles: [{ role: Role.Diner }, { role: Role.Franchisee, objectId: '2' }] },
  };
  const ownedFranchises: Record<string, Franchise[]> = {
    'f@jwt.com': [
      {
        id: '2',
        name: 'LotaPizza',
        stores: [
          { id: '4', name: 'Lehi', totalRevenue: 0.05 },
          { id: '5', name: 'Springville', totalRevenue: 0.12 },
        ],
      },
    ],
  };
  const pastOrders: Record<string, Order[]> = {
    'd@jwt.com': [
      {
        id: '7',
        franchiseId: '2',
        storeId: '4',
        date: '2024-06-05T05:14:40.000Z',
        items: [
          { menuId: '1', description: 'Veggie', price: 0.0038 },
          { menuId: '2', description: 'Pepperoni', price: 0.0042 },
        ],
      },
    ],
  };

  // Authorize login, register, and logout for the given user
  await page.route('*/**/api/auth', async (route) => {
    const method = route.request().method();

    if (method === 'POST') {
      const registerReq = route.request().postDataJSON();
      loggedInUser = { id: '4', name: registerReq.name, email: registerReq.email, roles: [{ role: Role.Diner }] };
      await route.fulfill({ json: { user: loggedInUser, token: 'abcdef' } });
      return;
    }

    if (method === 'DELETE') {
      loggedInUser = undefined;
      await route.fulfill({ json: { message: 'logout successful' } });
      return;
    }

    const loginReq = route.request().postDataJSON();
    const user = validUsers[loginReq.email];
    if (!user || user.password !== loginReq.password) {
      await route.fulfill({ status: 401, json: { error: 'Unauthorized' } });
      return;
    }
    loggedInUser = validUsers[loginReq.email];
    const loginRes = {
      user: loggedInUser,
      token: 'abcdef',
    };
    expect(method).toBe('PUT');
    await route.fulfill({ json: loginRes });
  });

  // Return the currently logged in user
  await page.route('*/**/api/user/me', async (route) => {
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: loggedInUser });
  });

  // A standard menu
  await page.route('*/**/api/order/menu', async (route) => {
    const menuRes = [
      {
        id: 1,
        title: 'Veggie',
        image: 'pizza1.png',
        price: 0.0038,
        description: 'A garden of delight',
      },
      {
        id: 2,
        title: 'Pepperoni',
        image: 'pizza2.png',
        price: 0.0042,
        description: 'Spicy treat',
      },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: menuRes });
  });

  // Standard franchises and stores
  await page.route(/\/api\/franchise(\?.*)?$/, async (route) => {
    const franchiseRes = {
      franchises: [
        {
          id: 2,
          name: 'LotaPizza',
          stores: [
            { id: 4, name: 'Lehi' },
            { id: 5, name: 'Springville' },
            { id: 6, name: 'American Fork' },
          ],
        },
        { id: 3, name: 'PizzaCorp', stores: [{ id: 7, name: 'Spanish Fork' }] },
        { id: 4, name: 'topSpot', stores: [] },
      ],
    };
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: franchiseRes });
  });

  // Return the franchises the logged-in user owns
  await page.route('*/**/api/franchise/*', async (route) => {
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: ownedFranchises[loggedInUser?.email ?? ''] ?? [] });
  });

  // Create a store
  await page.route('*/**/api/franchise/*/store', async (route) => {
    const storeReq = route.request().postDataJSON();
    expect(route.request().method()).toBe('POST');
    await route.fulfill({ json: { id: '8', name: storeReq.name, totalRevenue: 0 } });
  });

  // Close a store
  await page.route('*/**/api/franchise/*/store/*', async (route) => {
    expect(route.request().method()).toBe('DELETE');
    await route.fulfill({ json: { message: 'store deleted' } });
  });

  // Order a pizza, or list the logged-in diner's past orders
  await page.route('*/**/api/order', async (route) => {
    if (route.request().method() === 'GET') {
      const historyRes = { dinerId: loggedInUser?.id, orders: pastOrders[loggedInUser?.email ?? ''] ?? [], page: 1 };
      await route.fulfill({ json: historyRes });
      return;
    }

    const orderReq = route.request().postDataJSON();
    const orderRes = {
      order: { ...orderReq, id: 23 },
      jwt: 'eyJpYXQ',
    };
    expect(route.request().method()).toBe('POST');
    await route.fulfill({ json: orderRes });
  });

  // A one-endpoint API doc
  await page.route('*/**/api/docs', async (route) => {
    const docsRes = {
      endpoints: [{ requiresAuth: false, method: 'GET', path: '/api/order/menu', description: 'Get the pizza menu', example: 'curl localhost:3000/api/order/menu', response: [] }],
    };
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: docsRes });
  });

  await page.goto('/');
}

test.beforeEach(async ({ page }) => {
  await basicInit(page);
});

async function login(page: Page, email: string, password: string) {
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
}

async function register(page: Page, name: string, email: string, password: string) {
  await page.getByRole('link', { name: 'Register' }).click();
  await page.getByPlaceholder('Full name').fill(name);
  await page.getByPlaceholder('Email address').fill(email);
  await page.getByPlaceholder('Password').fill(password);
  await page.getByRole('button', { name: 'Register' }).click();
}

test('login', async ({ page }) => {
  await login(page, 'd@jwt.com', 'a');

  await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();
});

test('purchase with login', async ({ page }) => {
  // Go to order page
  await page.getByRole('button', { name: 'Order now' }).click();

  // Create order
  await expect(page.locator('h2')).toContainText('Awesome is a click away');
  await page.getByRole('combobox').selectOption('4');
  await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
  await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
  await expect(page.locator('form')).toContainText('Selected pizzas: 2');
  await page.getByRole('button', { name: 'Checkout' }).click();

  // Login
  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  // Pay
  await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
  await expect(page.locator('tbody')).toContainText('Veggie');
  await expect(page.locator('tbody')).toContainText('Pepperoni');
  await expect(page.locator('tfoot')).toContainText('0.008 ₿');
  await page.getByRole('button', { name: 'Pay now' }).click();

  // Check balance
  await expect(page.getByRole('heading', { name: 'Here is your JWT Pizza!' })).toBeVisible();
  await expect(page.getByText('0.008')).toBeVisible();
});

test('register and logout', async ({ page }) => {
  await register(page, 'Pizza Lover', 'p@jwt.com', 'pie');

  await expect(page.getByRole('link', { name: 'PL' })).toBeVisible();

  await page.getByRole('link', { name: 'Logout' }).click();
  await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'PL' })).not.toBeVisible();
});

test('about and history pages', async ({ page }) => {
  await page.getByRole('contentinfo').getByRole('link', { name: 'About' }).click();
  await expect(page.getByRole('heading', { name: 'The secret sauce' })).toBeVisible();

  await page.getByRole('contentinfo').getByRole('link', { name: 'History' }).click();
  await expect(page.getByRole('heading', { name: 'Mama Rucci, my my' })).toBeVisible();
});

test('unknown page shows not found', async ({ page }) => {
  await page.goto('/no-such-page');
  await expect(page.getByRole('heading', { name: 'Oops' })).toBeVisible();
});

test('docs page lists endpoints', async ({ page }) => {
  await page.goto('/docs');
  await expect(page.getByRole('heading', { name: 'JWT Pizza API' })).toBeVisible();
  await expect(page.getByText('[GET] /api/order/menu')).toBeVisible();
});

test('diner dashboard shows profile and order history', async ({ page }) => {
  await login(page, 'd@jwt.com', 'a');
  await page.getByRole('link', { name: 'KC' }).click();

  await expect(page.getByRole('heading', { name: 'Your pizza kitchen' })).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Kai Chen');
  await expect(page.getByRole('main')).toContainText('d@jwt.com');
  await expect(page.getByRole('main')).toContainText('diner');
  await expect(page.getByRole('cell', { name: '7', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: '0.008 ₿' })).toBeVisible();
});

test('new diner has no order history', async ({ page }) => {
  await register(page, 'Pizza Lover', 'p@jwt.com', 'pie');
  await page.getByRole('link', { name: 'PL' }).click();

  await expect(page.getByText('How have you lived this long without having a pizza?')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Buy one' })).toBeVisible();
});

test('diner sees the franchise pitch', async ({ page }) => {
  await login(page, 'd@jwt.com', 'a');
  await page.getByLabel('Global').getByRole('link', { name: 'Franchise' }).click();

  await expect(page.getByRole('heading', { name: 'So you want a piece of the pie?' })).toBeVisible();
});

test('franchisee dashboard lists stores', async ({ page }) => {
  await login(page, 'f@jwt.com', 'f');
  await page.getByLabel('Global').getByRole('link', { name: 'Franchise' }).click();

  await expect(page.getByRole('heading', { name: 'LotaPizza' })).toBeVisible();
  await expect(page.getByRole('row', { name: /Lehi.*0\.05 ₿/ })).toBeVisible();
  await expect(page.getByRole('row', { name: /Springville.*0\.12 ₿/ })).toBeVisible();
});

test('franchisee creates a store', async ({ page }) => {
  await login(page, 'f@jwt.com', 'f');
  await page.getByLabel('Global').getByRole('link', { name: 'Franchise' }).click();
  await page.getByRole('button', { name: 'Create store' }).click();

  await expect(page.getByRole('heading', { name: 'Create store' })).toBeVisible();
  await page.getByPlaceholder('store name').fill('Provo');
  await page.getByRole('button', { name: 'Create' }).click();

  await expect(page.getByRole('heading', { name: 'LotaPizza' })).toBeVisible();
});

test('franchisee closes a store', async ({ page }) => {
  await login(page, 'f@jwt.com', 'f');
  await page.getByLabel('Global').getByRole('link', { name: 'Franchise' }).click();
  await page.getByRole('row', { name: /Lehi/ }).getByRole('button', { name: 'Close' }).click();

  await expect(page.getByRole('main')).toContainText('Are you sure you want to close the LotaPizza store Lehi ?');
  await page.getByRole('button', { name: 'Close' }).click();

  await expect(page.getByRole('heading', { name: 'LotaPizza' })).toBeVisible();
});
