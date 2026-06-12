import { type Page, type Locator } from '@playwright/test';

export class IssuesPreviewPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/preview?source=github&section=issues');
  }

  get table(): Locator {
    return this.page.getByRole('main').getByRole('table').first();
  }

  get rows(): Locator {
    return this.page.getByRole('row').filter({ hasNot: this.page.getByRole('columnheader') });
  }

  columnHeader(name: string): Locator {
    return this.page.getByRole('columnheader', { name, exact: false });
  }

  get searchInput(): Locator {
    return this.page.getByLabel('Search');
  }

  get repositoryFilter(): Locator {
    return this.page.getByLabel('Repository');
  }

  get startDateInput(): Locator {
    return this.page.getByLabel(/start/i);
  }

  get endDateInput(): Locator {
    return this.page.getByLabel(/end|finish/i);
  }
}
