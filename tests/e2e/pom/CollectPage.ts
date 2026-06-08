import { type Page, type Locator } from '@playwright/test';

export class CollectPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/collect?source=github');
  }

  get addRepositoryButton(): Locator {
    return this.page.getByRole('button', { name: 'Add repository' });
  }

  async openAddRepositoryModal() {
    await this.addRepositoryButton.click();
  }

  repositoryTag(name: string): Locator {
    return this.page.getByText(name, { exact: true });
  }

  get repositoriesHeading(): Locator {
    return this.page.getByRole('heading', { name: /Repositories/ });
  }

  get collectButton(): Locator {
    // Scoped to main to avoid the sidebar "Collect" navigation button
    return this.page.getByRole('main').getByRole('button', { name: /^Collect/ });
  }

  get startDateInput(): Locator {
    return this.page.getByLabel(/start/i);
  }

  get endDateInput(): Locator {
    return this.page.getByLabel(/finish|end/i);
  }

  // Scope section
  get selectedCountBadge(): Locator {
    return this.page.getByText(/\d+ selected/);
  }

  get selectAllScopeButton(): Locator {
    return this.page.getByRole('button', { name: /select all|clear extras/i });
  }

  get issuesToggle(): Locator {
    return this.page.getByRole('button', { name: 'Issues', exact: true });
  }

  get commentsToggle(): Locator {
    return this.page.getByRole('button', { name: 'Comments', exact: true });
  }

  get pullRequestsToggle(): Locator {
    return this.page.getByRole('button', { name: 'Pull requests', exact: true });
  }

  get commitsToggle(): Locator {
    return this.page.getByRole('button', { name: 'Commits', exact: true });
  }
}
