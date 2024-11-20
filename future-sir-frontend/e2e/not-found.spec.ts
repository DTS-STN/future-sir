import { expect, test } from '@playwright/test';

test.skip('Navigating to /foo renders the bilingual 404 page', async ({ page }) => {
  await page.goto('/foo');
  expect(await page.content()).toMatchSnapshot();
});

test.skip('Navigating to /en/foo renders the unilingual 404 page', async ({ page }) => {
  await page.goto('/en/foo');
  expect(await page.content()).toMatchSnapshot();
});
