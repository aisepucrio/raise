/**
 * E2E-JR-001 — Submit Jira Collection Job → Navigate to Jobs
 *
 * Full-stack test (@fullstack). Requires Docker compose stack running.
 * Preconditions: valid JIRA_URL, JIRA_EMAIL, JIRA_API_TOKEN in .env; Celery worker healthy.
 *
 * Placeholder: expand with additional Jira pipeline tests as coverage grows.
 */
import { test, expect, shot } from '../fixtures';

test.describe('E2E-JR-001 — Submit Jira Collection Job @fullstack', () => {
  test('happy path: submits job and navigates to Jobs page', async ({
    page,
    jiraCollectPage,
  }) => {
    await jiraCollectPage.goto();
    await page.screenshot({ path: shot('E2E-JR-001', 1, 'collect-page-empty') });

    // Step 1: Add a project via the modal
    await jiraCollectPage.addProject('your-domain.atlassian.net', 'TEST');
    await expect(
      jiraCollectPage.projectTag('your-domain.atlassian.net/TEST'),
    ).toBeVisible();
    await page.screenshot({ path: shot('E2E-JR-001', 2, 'project-added') });

    // Step 2: Intercept the API request to assert correct payload
    const [request] = await Promise.all([
      page.waitForRequest(
        (req) => req.url().includes('/api/jira/collect') && req.method() === 'POST',
      ),
      jiraCollectPage.collectButton.click(),
    ]);

    const body = request.postDataJSON();
    expect(body.projects).toHaveLength(1);
    expect(body.projects[0].jira_domain).toBe('your-domain.atlassian.net');
    expect(body.projects[0].project_key).toBe('TEST');

    // Step 3: Wait for success toast
    await expect(page.getByText('Jira collection started successfully.')).toBeVisible();

    // Step 4: Assert navigation to Jobs page
    await expect(page).toHaveURL(/\/jobs/);

    // Step 5: Assert task row appears and is not failed
    const taskRow = page.getByRole('row').filter({ hasText: 'TEST' }).first();
    await taskRow.waitFor({ timeout: 30_000 });
    await expect(taskRow).toBeVisible();
    await page.screenshot({ path: shot('E2E-JR-001', 5, 'task-started') });

    await expect(taskRow).not.toContainText('Failure');
  });
});
