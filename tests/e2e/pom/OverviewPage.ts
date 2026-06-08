import { type Page, type Locator } from '@playwright/test';

export class OverviewPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/overview?source=github');
  }

  get repositorySelector(): Locator {
    // Scoped by label to avoid matching the sidebar source combobox
    return this.page.getByLabel('Repository');
  }

  metricCard(title: string): Locator {
    return this.page.getByText(title, { exact: true });
  }

  get activityChart(): Locator {
    return this.page.getByText('GitHub Activity');
  }
}
