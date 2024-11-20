import { expect, test } from '@playwright/test';

test.skip('Navigating to / renders the language chooser page', async ({ page }) => {
  await page.goto('/');
  expect(await page.content()).toMatchSnapshot();
});
