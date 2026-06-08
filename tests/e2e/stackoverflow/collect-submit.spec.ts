/**
 * E2E-SO-001 — Submit Stack Overflow Collection Job → Navigate to Jobs
 *
 * Full-stack test (@fullstack). Requires Docker compose stack running.
 * Preconditions: Celery worker healthy; start and end dates required by the SO collect form.
 *
 * Placeholder: expand with additional SO pipeline tests as coverage grows.
 */
import { test, expect, shot } from '../fixtures';

test.describe('E2E-SO-001 — Submit Stack Overflow Collection Job @fullstack', () => {
  test('happy path: submits job and navigates to Jobs page', async ({
    page,
    soCollectPage,
  }) => {
    await soCollectPage.goto();
    await page.screenshot({ path: shot('E2E-SO-001', 1, 'collect-page-empty') });

    // Step 1: Fill required date range (SO requires both dates)
    await soCollectPage.startDateInput.fill('2024-01-01');
    await soCollectPage.endDateInput.fill('2024-01-07');
    await page.screenshot({ path: shot('E2E-SO-001', 2, 'dates-filled') });

    // Step 2: Intercept the API request to assert correct payload
    const [request] = await Promise.all([
      page.waitForRequest(
        (req) =>
          req.url().includes('/api/stackoverflow/collect') && req.method() === 'POST',
      ),
      soCollectPage.collectButton.click(),
    ]);

    const body = request.postDataJSON();
    expect(body.options).toContain('collect_questions');
    expect(body.start_date).toBe('2024-01-01');
    expect(body.end_date).toBe('2024-01-07');

    // Step 3: Wait for success toast
    await expect(
      page.getByText('Stack Overflow collection started successfully.'),
    ).toBeVisible();

    // Step 4: Assert navigation to Jobs page
    await expect(page).toHaveURL(/\/jobs/);

    // Step 5: Assert a task row appears and is not failed
    const taskRow = page.getByRole('row').first();
    await taskRow.waitFor({ timeout: 30_000 });
    await expect(taskRow).toBeVisible();
    await page.screenshot({ path: shot('E2E-SO-001', 5, 'task-started') });

    await expect(taskRow).not.toContainText('Failure');
  });
});
