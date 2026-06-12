import { type Page, type Locator } from '@playwright/test';

export class SOCollectPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/collect?source=stackoverflow');
  }

  get collectButton(): Locator {
    return this.page.getByRole('main').getByRole('button', { name: /^Collect/ });
  }

  get startDateInput(): Locator {
    return this.page.getByLabel(/start/i);
  }

  get endDateInput(): Locator {
    return this.page.getByLabel(/finish|end/i);
  }
}
