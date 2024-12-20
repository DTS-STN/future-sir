import { expect, test } from '@playwright/test';

test('Navigating to / renders the language chooser page', async ({ page }) => {
  await page.goto('/');

  expect(await page.locator('main').innerHTML()).toMatchSnapshot();
});
