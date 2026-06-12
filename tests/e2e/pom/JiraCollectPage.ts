import { type Page, type Locator } from '@playwright/test';

export class JiraCollectPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/collect?source=jira');
  }

  get addProjectButton(): Locator {
    return this.page.getByRole('button', { name: 'Add project' });
  }

  projectTag(label: string): Locator {
    return this.page.getByText(label, { exact: true });
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

  /** Opens the modal, fills domain + project key, and confirms. */
  async addProject(domain: string, projectKey: string) {
    await this.addProjectButton.click();
    const dialog = this.page.getByRole('dialog');
    await dialog.getByLabel('Jira domain').fill(domain);
    await dialog.getByLabel('Project key').fill(projectKey);
    await dialog.getByRole('button', { name: 'Add' }).click();
  }
}
