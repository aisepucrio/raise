import { type Page, type Locator } from '@playwright/test';

export class JobsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/jobs?source=github');
  }

  async waitForPageLoad() {
    await this.page.waitForURL(/\/jobs/);
  }

  jobRow(repoName: string): Locator {
    return this.page.getByText(repoName).first();
  }

  get table(): Locator {
    return this.page.getByRole('table');
  }

  /**
   * Wait for the first poll cycle to complete and a job row to appear.
   * The Jobs page polls the API on a fixed interval (~6 s).
   */
  async waitForJobRow(repoName: string, timeout = 30_000): Promise<Locator> {
    const row = this.jobRow(repoName);
    await row.waitFor({ timeout });
    return row;
  }
}
