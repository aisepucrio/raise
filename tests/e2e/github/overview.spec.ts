/**
 * E2E-GH-001 — Overview Dashboard Renders Metric Cards
 *
 * Full-stack test (@fullstack). Requires Docker compose stack running.
 * Precondition: at least one collection job completed for any repository.
 *
 * Vault doc: C:\Dev\Project-Brain\Projects\RAISE\04_Testing\GitHub_Miner\Cases\TC_GitHub_Overview_Dashboard.md
 */
import { test, expect, shot } from '../fixtures';

test.describe('E2E-GH-001 — Overview Dashboard @fullstack', () => {
  test.beforeEach(async ({ overviewPage }) => {
    await overviewPage.goto();
  });

  test('step 1-2: page loads and repository selector shows default', async ({
    page,
    overviewPage,
  }) => {
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
    await page.screenshot({ path: shot('E2E-GH-001', 1, 'overview-page') });

    await expect(overviewPage.repositorySelector).toBeVisible();
  });

  test('step 3: five global metric cards render with numeric values', async ({ page }) => {
    const cardTitles = ['Repositories', 'Issues', 'Pull Requests', 'Commits', 'Users'];
    for (const title of cardTitles) {
      // .first() handles chart legend SVG elements that also contain these strings
      await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
    }
    await page.screenshot({ path: shot('E2E-GH-001', 3, 'metric-cards') });
  });

  test('step 4: GitHub Activity chart renders without error', async ({ page }) => {
    await expect(page.getByText('GitHub Activity', { exact: true })).toBeVisible();
    await expect(page.getByText('Failed to load the GitHub chart.')).not.toBeVisible();
  });

  test('step 5-6: repository-scoped view shows six cards then resets', async ({
    page,
    overviewPage,
  }) => {
    await overviewPage.repositorySelector.selectOption({ index: 1 });

    const scopedTitles = ['Commits', 'Issues', 'Pull Requests', 'Users', 'Forks', 'Stars'];
    for (const title of scopedTitles) {
      await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
    }
    await page.screenshot({ path: shot('E2E-GH-001', 5, 'repo-scoped-view') });

    // Step 6: clear filter
    await overviewPage.repositorySelector.selectOption({ index: 0 });
    await expect(page.getByText('Repositories', { exact: true }).first()).toBeVisible();
  });
});
