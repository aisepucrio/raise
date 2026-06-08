import { type Page, type Locator } from '@playwright/test';

export class CommitsPreviewPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/preview?source=github&section=commits');
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

  get repositoryFilter(): Locator {
    return this.page.getByLabel('Repository');
  }

  get startDateInput(): Locator {
    return this.page.getByLabel(/start/i);
  }

  get endDateInput(): Locator {
    return this.page.getByLabel(/end|finish/i);
  }

  get nextPageButton(): Locator {
    return this.page.getByLabel('Go to next page');
  }

  get previousPageButton(): Locator {
    return this.page.getByLabel('Go to previous page');
  }

  get exportButton(): Locator {
    return this.page.getByRole('button', { name: /export/i });
  }
}
