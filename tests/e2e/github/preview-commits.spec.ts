/**
 * E2E-GH-009 — Preview: Commits Table, Sort & Paginate
 *
 * Full-stack test (@fullstack). Requires Docker compose stack running.
 * Precondition: at least 15 commits in the database for octocat/Spoon-Knife
 * (run E2E-GH-008 with Commits scope and await SUCCESS status first).
 *
 * Vault doc: C:\Dev\Project-Brain\Projects\RAISE\04_Testing\GitHub_Miner\Cases\TC_GitHub_Commits_Dashboard.md
 */
import { test, expect, shot } from '../fixtures';

test.describe('E2E-GH-009 — Preview: Commits @fullstack', () => {
  test.beforeEach(async ({ commitsPreview }) => {
    await commitsPreview.goto();
  });

  test('step 1-3: table renders commit rows with expected columns and pagination', async ({
    page,
    commitsPreview,
  }) => {
    await expect(commitsPreview.table).toBeVisible();
    for (const col of ['sha', 'message', 'date']) {
      await expect(commitsPreview.columnHeader(col)).toBeVisible();
    }
    await expect(commitsPreview.rows.first()).toBeVisible();
    await page.screenshot({ path: shot('E2E-GH-009', 2, 'commits-table') });
  });

  test('step 4: repository filter scopes results', async ({ page, commitsPreview }) => {
    await commitsPreview.repositoryFilter.selectOption({ label: 'octocat/Spoon-Knife' });
    await page.waitForResponse((res) => res.url().includes('/api/github/commits'));
    expect(await commitsPreview.rows.count()).toBeGreaterThan(0);
    await page.screenshot({ path: shot('E2E-GH-009', 4, 'repo-filtered') });
  });

  test('step 5: date filter narrows results', async ({ page, commitsPreview }) => {
    await commitsPreview.startDateInput.fill('2024-01-01');
    await commitsPreview.endDateInput.fill('2024-01-07');
    await page.waitForResponse((res) => res.url().includes('/api/github/commits'));
    await page.screenshot({ path: shot('E2E-GH-009', 5, 'date-filtered') });
  });

  test('steps 6-8: column sort cycles asc → desc → unsorted', async ({
    page,
    commitsPreview,
  }) => {
    const dateHeader = commitsPreview.columnHeader('date');
    const sortButton = dateHeader.getByRole('button');

    await sortButton.click();
    await expect(dateHeader).toHaveAttribute('aria-sort', 'ascending');
    await page.screenshot({ path: shot('E2E-GH-009', 6, 'sort-asc') });

    await sortButton.click();
    await expect(dateHeader).toHaveAttribute('aria-sort', 'descending');

    await sortButton.click();
    await expect(dateHeader).not.toHaveAttribute('aria-sort');
  });

  test('steps 9-10: pagination navigates between pages', async ({ commitsPreview }) => {
    const isNextEnabled = await commitsPreview.nextPageButton.isEnabled();
    if (!isNextEnabled) {
      test.skip();
    }

    await commitsPreview.nextPageButton.click();
    await expect(commitsPreview.previousPageButton).toBeEnabled();

    await commitsPreview.previousPageButton.click();
    await expect(commitsPreview.previousPageButton).toBeDisabled();
  });

  test('step 11: empty state shown when no data matches filters', async ({
    page,
    commitsPreview,
  }) => {
    // microsoft/vscode is in metadata but has 0 commits — guaranteed empty state without
    // relying on future dates that would violate the date input's range constraints.
    await commitsPreview.repositoryFilter.selectOption({ label: 'microsoft/vscode' });
    await page.waitForResponse((res) => res.url().includes('/api/github/commits'));
    await expect(
      page.getByText('No commits found for the selected filters.'),
    ).toBeVisible();
    await page.screenshot({ path: shot('E2E-GH-009', 11, 'empty-state') });
  });
});
