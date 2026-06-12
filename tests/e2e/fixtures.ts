import { test as base } from '@playwright/test';
import { CollectPage } from './pom/CollectPage';
import { CollectModal } from './pom/CollectModal';
import { OverviewPage } from './pom/OverviewPage';
import { JobsPage } from './pom/JobsPage';
import { CommitsPreviewPage } from './pom/CommitsPreviewPage';
import { IssuesPreviewPage } from './pom/IssuesPreviewPage';
import { JiraCollectPage } from './pom/JiraCollectPage';
import { SOCollectPage } from './pom/SOCollectPage';

type Fixtures = {
  collectPage: CollectPage;
  collectModal: CollectModal;
  overviewPage: OverviewPage;
  jobsPage: JobsPage;
  commitsPreview: CommitsPreviewPage;
  issuesPreview: IssuesPreviewPage;
  jiraCollectPage: JiraCollectPage;
  soCollectPage: SOCollectPage;
};

export const test = base.extend<Fixtures>({
  collectPage: async ({ page }, use) => {
    await use(new CollectPage(page));
  },
  collectModal: async ({ page }, use) => {
    await use(new CollectModal(page));
  },
  overviewPage: async ({ page }, use) => {
    await use(new OverviewPage(page));
  },
  jobsPage: async ({ page }, use) => {
    await use(new JobsPage(page));
  },
  commitsPreview: async ({ page }, use) => {
    await use(new CommitsPreviewPage(page));
  },
  issuesPreview: async ({ page }, use) => {
    await use(new IssuesPreviewPage(page));
  },
  jiraCollectPage: async ({ page }, use) => {
    await use(new JiraCollectPage(page));
  },
  soCollectPage: async ({ page }, use) => {
    await use(new SOCollectPage(page));
  },
});

export { expect } from '@playwright/test';

/** Helper: screenshot path following the vault naming convention.
 *  Example: shot('E2E-GH-001', 1, 'overview-page')
 *  → tests/e2e/screenshots/E2E-GH-001_step1_overview-page_2026-04-10.png
 */
export function shot(testId: string, step: number | string, slug: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `tests/e2e/screenshots/${testId}_step${step}_${slug}_${date}.png`;
}
