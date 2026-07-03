import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  name: string;
}

let uniqueCounter = 0;

// Generate credentials that are unique per test run so tests never collide
// with each other or with data from previous runs.
export function makeTestUser(label: string): TestUser {
  uniqueCounter += 1;
  return {
    email: `e2e-${label}-${Date.now()}-${uniqueCounter}@example.com`,
    password: 'Password123!',
    name: `E2E ${label}`
  };
}

// Create an account through the API, using the page's cookie jar so the
// browser session is signed in afterwards. Goes through the Vite proxy so the
// session cookie is set for the client origin.
export async function signUpViaApi(page: Page, user: TestUser): Promise<void> {
  const response = await page.request.post('/api/auth/signup', {
    data: { email: user.email, password: user.password, name: user.name }
  });
  expect(response.status(), 'signup should succeed').toBe(201);
}
