// tests/components.spec.js
import { test, expect } from '@playwright/test';

test.describe('FootWorks widgets', () => {
  // --- HOME PAGE TESTS ---

  test('Home page lists widget links', async ({ page }) => {
    await page.goto('/');

    // These are the literal /selector, /scheduler, /media links in your Home component
    await expect(page.getByRole('link', { name: '/selector' })).toBeVisible();
    await expect(page.getByRole('link', { name: '/scheduler' })).toBeVisible();
    await expect(page.getByRole('link', { name: '/media' })).toBeVisible();
  });

  test('Home page can navigate to Shoe Selector via /selector link', async ({ page }) => {
    await page.goto('/');

    // Click the /selector text link
    await page.getByRole('link', { name: '/selector' }).click();

    // URL should now end in /selector
    await expect(page).toHaveURL(/\/selector$/);
  });

  // --- SHOE SELECTOR TESTS ---

  test('Shoe Selector page renders welcome and Start flow + bottom nav', async ({ page }) => {
    await page.goto('/selector');

    // Treat appearance of the Start button as "welcome screen loaded"
    const startButton = page.getByRole('button', { name: /start/i });
    await expect(startButton).toBeVisible({ timeout: 15000 });

    // There should be some <h2> heading for the welcome/question text
    const heading = page.locator('h2').first();
    await expect(heading).toBeVisible();

    // Bottom widget nav (WidgetBottomBar) – uses aria-labels
    await expect(page.getByRole('link', { name: 'Open selector' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open scheduler' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open media' })).toBeVisible();
  });

  test('Shoe Selector question flow: Next disabled until choice and Back restores previous question', async ({ page }) => {
    await page.goto('/selector');

    // Wait for welcome Start button
    const startButton = page.getByRole('button', { name: /start/i });
    await expect(startButton).toBeVisible({ timeout: 15000 });
    await startButton.click();

    // First question screen: we always render an <h2> with currentQuestion.text
    const headingLocator = page.locator('h2').first();
    await expect(headingLocator).toBeVisible({ timeout: 15000 });

    const firstQuestionText = (await headingLocator.textContent())?.trim() ?? '';

    // "Next" should be disabled until a choice is made
    const nextButton = page.getByRole('button', { name: 'Next' });
    await expect(nextButton).toBeDisabled();

    // Answer choices have aria-pressed (true/false) set
    const firstAnswer = page.locator('button[aria-pressed]').first();
    await firstAnswer.click();

    // Now Next should be enabled
    await expect(nextButton).toBeEnabled();

    // Go forward to the next question
    await nextButton.click();
    await expect(headingLocator).toBeVisible({ timeout: 15000 });

    // Heading text should have changed
    if (firstQuestionText) {
      await expect(headingLocator).not.toHaveText(firstQuestionText, { timeout: 15000 });
    }

    // Use Back to return to previous question
    const backButton = page.getByRole('button', { name: 'Back' });
    await backButton.click();

    // We should be back on the original question
    if (firstQuestionText) {
      await expect(headingLocator).toHaveText(firstQuestionText, { timeout: 15000 });
    }
  });

  // --- SMART SCHEDULER TESTS ---

  test('Smart Scheduler page validates services and date/time/associate selection', async ({ page }) => {
    await page.goto('/scheduler');

    // Step 1: main heading and Book Appointment button
    await expect(
      page.getByRole('heading', { name: /Book Your Appointment/i })
    ).toBeVisible();

    await expect(
      page.getByRole('button', { name: /Book Appointment/i })
    ).toBeVisible();

    // Move to Step 2 (services)
    await page.getByRole('button', { name: /Book Appointment/i }).click();

    // Step 2: "Select Services" heading
    await expect(
      page.getByRole('heading', { name: /Select Services/i })
    ).toBeVisible();

    // Click Next with no services -> validation error
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(
      page.getByText('Please select at least one service.')
    ).toBeVisible();

    // Select first service checkbox
    const firstServiceCheckbox = page.getByRole('checkbox').first();
    await firstServiceCheckbox.check();

    // Move to Step 3 (date/time/associate)
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 3 heading
    await expect(
      page.getByRole('heading', { name: /Select a Date/i })
    ).toBeVisible();

    // Click Next with no date/time/associate -> validation error
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(
      page.getByText('Please select a date, time, and associate.')
    ).toBeVisible();

    // Bottom widget nav is present on this page
    await expect(page.getByRole('link', { name: 'Open selector' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open scheduler' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open media' })).toBeVisible();
  });

  // --- EDUCATIONAL MEDIA TESTS ---

  test('Educational Media page renders filters + contents list + bottom nav', async ({ page }) => {
    await page.goto('/media');

    // Filter chips: #All is always present
    await expect(
      page.getByRole('button', { name: '#All' })
    ).toBeVisible();

    // Contents header for right-hand list
    await expect(page.getByText(/Contents \(/i)).toBeVisible();

    // Widget bottom nav
    await expect(page.getByRole('link', { name: 'Open selector' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open scheduler' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open media' })).toBeVisible();
  });
});
