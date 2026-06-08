/**
 * E2E-GH-008 — Submit Collection Job → Navigate to Jobs
 *
 * Full-stack test (@fullstack). Requires Docker compose stack running.
 * Preconditions: valid GITHUB_TOKEN in .env; Celery worker healthy.
 *
 * Vault doc: C:\Dev\Project-Brain\Projects\RAISE\04_Testing\GitHub_Miner\Cases\TC_GitHub_Collection_Submit.md
 */
import { test, expect, shot } from '../fixtures';

test.describe('E2E-GH-008 — Submit Collection Job @fullstack', () => {
  test('happy path: submits job and navigates to Jobs page', async ({
    page,
    collectPage,
    collectModal,
    jobsPage,
  }) => {
    await collectPage.goto();
    await page.screenshot({ path: shot('E2E-GH-008', 1, 'collect-page-empty') });

    // Step 1: Add repository
    await collectPage.openAddRepositoryModal();
    await page.screenshot({ path: shot('E2E-GH-008', '1b', 'add-repo-modal') });

    await collectModal.fillRepository('octocat/Spoon-Knife');
    await collectModal.confirm();
    await expect(collectPage.repositoryTag('octocat/Spoon-Knife')).toBeVisible();

    // Steps 2-3: Set date range
    await collectPage.startDateInput.fill('2024-01-01');
    await collectPage.endDateInput.fill('2024-01-07');

    // Step 4: Select Commits scope
    await collectPage.commitsToggle.click();
    await expect(collectPage.selectedCountBadge).toHaveText('2 selected');
    await page.screenshot({ path: shot('E2E-GH-008', 4, 'scope-selected') });

    // Step 5: Intercept the API request to assert correct payload
    const [request] = await Promise.all([
      page.waitForRequest(
        (req) => req.url().includes('/api/github/collect') && req.method() === 'POST',
      ),
      collectPage.collectButton.click(),
    ]);

    const body = request.postDataJSON();
    expect(body.repositories).toContain('octocat/Spoon-Knife');
    expect(body.collect_types).toContain('metadata');
    expect(body.collect_types).toContain('commits');

    // Step 6: Wait for success toast
    await expect(page.getByText('GitHub collection started successfully.')).toBeVisible();

    // Step 7: Assert navigation to Jobs page
    await expect(page).toHaveURL(/\/jobs/);

    // Steps 8-9: Assert task is visible and not failed
    // Find the most recently created task row (first row that matches the repo)
    const taskRow = page.getByRole('row').filter({ hasText: 'octocat/Spoon-Knife' }).first();
    await taskRow.waitFor({ timeout: 30_000 });
    await expect(taskRow).toBeVisible();
    await page.screenshot({ path: shot('E2E-GH-008', 9, 'task-started') });

    // The newest task must not have a Failure status
    await expect(taskRow).not.toContainText('Failure');
  });
});
