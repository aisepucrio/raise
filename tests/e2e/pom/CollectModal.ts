import { type Page, type Locator } from '@playwright/test';

export class CollectModal {
  constructor(private page: Page) {}

  get dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  get repositoryInput(): Locator {
    return this.dialog.getByRole('textbox');
  }

  get addButton(): Locator {
    return this.dialog.getByRole('button', { name: 'Add' });
  }

  get cancelButton(): Locator {
    return this.dialog.getByRole('button', { name: 'Cancel' });
  }

  get inputErrorMessage(): Locator {
    return this.dialog.getByRole('alert').or(this.dialog.locator('[data-error]')).or(
      this.dialog.locator('.error, [class*="error"]')
    );
  }

  async fillRepository(value: string) {
    await this.repositoryInput.fill(value);
  }

  async confirm() {
    await this.addButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }
}
