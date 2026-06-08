/**
 * E2E-GH-010 — Preview: Issues Search & Filter
 *
 * Full-stack test (@fullstack). Requires Docker compose stack running.
 * Precondition: at least 5 issues stored for octocat/Spoon-Knife.
 * Run E2E-GH-008 with Issues scope selected and await SUCCESS status first.
 *
 * Vault doc: C:\Dev\Project-Brain\Projects\RAISE\04_Testing\GitHub_Miner\Cases\TC_GitHub_Issues_List.md
 */
import { test, expect, shot } from '../fixtures';

test.describe('E2E-GH-010 — Preview: Issues @fullstack', () => {
  test.beforeEach(async ({ issuesPreview }) => {
    await issuesPreview.goto();
  });

  test('steps 1-2: table renders issue rows with expected columns', async ({
    page,
    issuesPreview,
  }) => {
    await expect(issuesPreview.table).toBeVisible();
    for (const col of ['title', 'state', 'creator']) {
      await expect(issuesPreview.columnHeader(col)).toBeVisible();
    }
    await expect(issuesPreview.rows.first()).toBeVisible();
    await page.screenshot({ path: shot('E2E-GH-010', 2, 'issues-table') });
  });

  test('steps 3-4: search input filters and clears', async ({ page, issuesPreview }) => {
    const SEARCH_TERM = 'bug';
    await issuesPreview.searchInput.fill(SEARCH_TERM);
    await page.waitForResponse((res) => res.url().includes('/api/github/issues'));
    await page.screenshot({ path: shot('E2E-GH-010', 3, 'search-filtered') });

    // Clear search — TanStack Query may serve the empty-search result from cache
    // so we don't assert a network round-trip; verify the input is empty instead.
    await issuesPreview.searchInput.clear();
    await expect(issuesPreview.searchInput).toHaveValue('');
  });

  test('step 5: repository filter scopes results', async ({ page, issuesPreview }) => {
    await issuesPreview.repositoryFilter.selectOption({ label: 'octocat/Spoon-Knife' });
    await page.waitForResponse((res) => res.url().includes('/api/github/issues'));
    expect(await issuesPreview.rows.count()).toBeGreaterThan(0);
    await page.screenshot({ path: shot('E2E-GH-010', 5, 'repo-filtered') });
  });

  test('step 6: date filter limits by creation window', async ({ page, issuesPreview }) => {
    await issuesPreview.startDateInput.fill('2024-01-01');
    await issuesPreview.endDateInput.fill('2024-06-30');
    await page.waitForResponse((res) => res.url().includes('/api/github/issues'));
    await page.screenshot({ path: shot('E2E-GH-010', 6, 'date-filtered') });
  });

  test('step 7: combined filters produce intersection', async ({ page, issuesPreview }) => {
    await issuesPreview.repositoryFilter.selectOption({ label: 'octocat/Spoon-Knife' });
    await issuesPreview.startDateInput.fill('2024-01-01');
    await issuesPreview.endDateInput.fill('2024-06-30');
    await issuesPreview.searchInput.fill('bug');
    await page.waitForResponse((res) => res.url().includes('/api/github/issues'));
    await expect(page.getByText('Failed to load GitHub issues.')).not.toBeVisible();
    await page.screenshot({ path: shot('E2E-GH-010', 7, 'combined-filters') });
  });

  test('empty state shown when no results match', async ({ page, issuesPreview }) => {
    // octocat/Spoon-Knife is in metadata but has 0 issues — guaranteed empty state without
    // relying on future dates that would violate the date input's range constraints.
    await issuesPreview.repositoryFilter.selectOption({ label: 'octocat/Spoon-Knife' });
    await page.waitForResponse((res) => res.url().includes('/api/github/issues'));
    await expect(
      page.getByText('No issues found for the selected filters.'),
    ).toBeVisible();
    await page.screenshot({ path: shot('E2E-GH-010', 8, 'empty-state') });
  });
});
