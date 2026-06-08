/**
 * E2E-GH-011 — Preview: Export JSON Download
 *
 * Full-stack test (@fullstack). Requires Docker compose stack running.
 * Preconditions: commits and issues exist in the database for octocat/Spoon-Knife.
 * Run E2E-GH-009 and E2E-GH-010 first to confirm data is seeded.
 *
 * Vault doc: C:\Dev\Project-Brain\Projects\RAISE\04_Testing\GitHub_Miner\Cases\TC_GitHub_Preview_Export.md
 */
import { test, expect, shot } from '../fixtures';
import path from 'path';
import fs from 'fs/promises';

test.describe('E2E-GH-011 — Preview: Export @fullstack', () => {
  test('steps 1-5: commits export downloads a valid JSON file', async ({
    page,
    commitsPreview,
  }) => {
    await commitsPreview.goto();
    await expect(commitsPreview.rows.first()).toBeVisible();
    await page.screenshot({ path: shot('E2E-GH-011', 1, 'commits-preview') });

    // Intercept the download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      commitsPreview.exportButton.click(),
    ]);

    // Step 4: verify filename
    expect(download.suggestedFilename()).toMatch(/^github-commits-preview.*\.json$/);

    // Step 5: verify content is valid JSON
    const filePath = await download.path();
    const content = await fs.readFile(filePath!, 'utf-8');
    expect(() => JSON.parse(content)).not.toThrow();

    await page.screenshot({ path: shot('E2E-GH-011', 5, 'export-complete') });
  });

  test('step 2: export button shows pending state during download', async ({
    page,
    commitsPreview,
  }) => {
    await commitsPreview.goto();
    await expect(commitsPreview.rows.first()).toBeVisible();

    await page.route('**/api/github/export/**', async (route) => {
      await page.waitForTimeout(300);
      await route.continue();
    });

    const clickPromise = commitsPreview.exportButton.click();
    await expect(commitsPreview.exportButton).toBeDisabled();
    await clickPromise;
  });

  test('step 8: success toast appears after export', async ({ page, commitsPreview }) => {
    await commitsPreview.goto();
    await expect(commitsPreview.rows.first()).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      commitsPreview.exportButton.click(),
    ]);
    await download.path();

    await expect(page.getByText('GitHub preview exported successfully.')).toBeVisible();
  });
});
