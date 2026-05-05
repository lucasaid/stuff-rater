import { test, expect, Page } from '@playwright/test';

// ── Helpers ───────────────────────────────────────────────────

async function setScore(page: Page, criterionKey: string, rating: number) {
  const row = page.locator(`[data-testid="criterion-${criterionKey}"]`);
  await row.getByRole('button', { name: `Rate ${rating}`, exact: true }).click();
}

// ── Tests ─────────────────────────────────────────────────────

test.describe('Item Appraisal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page loads with title and all three criterion groups', async ({ page }) => {
    await expect(page.locator('.game-title')).toHaveText('Item Appraisal');
    await expect(page.getByText('Core Attributes')).toBeVisible();
    await expect(page.getByText('Sentimental Stats')).toBeVisible();
    await expect(page.getByText('Item Properties')).toBeVisible();
  });

  test('default state is Junk / Discard (all zeros → hard discard)', async ({ page }) => {
    await expect(page.locator('.verdict-tier')).toHaveText('Junk');
    await expect(page.locator('.verdict-action')).toContainText('Discard');
    await expect(page.locator('.score-number')).toHaveText('0');
  });

  // ── Hard keep ───────────────────────────────────────────────

  test.describe('hard keep override', () => {
    test('joy = 9 → Legendary tier, Retain', async ({ page }) => {
      await setScore(page, 'joy', 9);
      await expect(page.locator('.verdict-tier')).toHaveText('Legendary');
      await expect(page.locator('.verdict-action')).toContainText('Retain');
    });

    test('joy = 9 → Override prefix in reason text', async ({ page }) => {
      await setScore(page, 'joy', 9);
      await expect(page.locator('.verdict-why-rule')).toHaveText('Override — ');
    });

    test('joy = 10 → Legendary regardless of other scores being zero', async ({ page }) => {
      await setScore(page, 'joy', 10);
      await expect(page.locator('.verdict-tier')).toHaveText('Legendary');
    });
  });

  // ── Hard discard ────────────────────────────────────────────

  test.describe('hard discard override', () => {
    test('joy = 4, engagement = 0 → not a hard discard', async ({ page }) => {
      await setScore(page, 'joy', 4);
      await expect(page.locator('.verdict-why-rule')).not.toBeVisible();
    });

    test('joy = 1, engagement = 4 → not a hard discard', async ({ page }) => {
      await setScore(page, 'joy', 1);
      await setScore(page, 'engagement', 4);
      await expect(page.locator('.verdict-why-rule')).not.toBeVisible();
    });
  });

  // ── Score-based keep ────────────────────────────────────────

  test.describe('score-based keep', () => {
    test('scores totalling exactly 62 → Uncommon / Retain', async ({ page }) => {
      // joy=7(21) + engagement=7(14) + repeatedValue=4(8) + identity=4(8) + nostalgia=5(5) + socialValue=4(4) + merit=2(2) = 62
      await setScore(page, 'joy', 7);
      await setScore(page, 'engagement', 7);
      await setScore(page, 'repeatedValue', 4);
      await setScore(page, 'identity', 4);
      await setScore(page, 'nostalgia', 5);
      await setScore(page, 'socialValue', 4);
      await setScore(page, 'merit', 2);

      await expect(page.locator('.score-number')).toHaveText('62');
      await expect(page.locator('.verdict-tier')).toHaveText('Uncommon');
      await expect(page.locator('.verdict-action')).toContainText('Retain');
    });

    test('high core scores → core-dominant why text', async ({ page }) => {
      // joy=8(24)+engagement=7(14)+repeatedValue=7(14)+nostalgia=10(10) = 62, coreTotal=52
      await setScore(page, 'joy', 8);
      await setScore(page, 'engagement', 7);
      await setScore(page, 'repeatedValue', 7);
      await setScore(page, 'nostalgia', 10);

      await expect(page.locator('.verdict-why')).toContainText('engagement and enjoyment');
    });

    test('high emotional scores → emotional-dominant why text', async ({ page }) => {
      // joy=5(15)+engagement=4(8)+repeatedValue=4(8)+identity=8(16)+nostalgia=8(8)+socialValue=6(6)+merit=2(2) = 63
      await setScore(page, 'joy', 5);
      await setScore(page, 'engagement', 4);
      await setScore(page, 'repeatedValue', 4);
      await setScore(page, 'identity', 8);
      await setScore(page, 'nostalgia', 8);
      await setScore(page, 'socialValue', 6);
      await setScore(page, 'merit', 2);

      await expect(page.locator('.verdict-why')).toContainText('personal significance');
    });
  });

  // ── Amplifier ───────────────────────────────────────────────

  test.describe('amplifier', () => {
    test('borderline score + replaceability ≥ 7 → Uncommon / Retain', async ({ page }) => {
      // joy=6(18)+engagement=6(12)+repeatedValue=5(10)+nostalgia=3(3)+replaceability=7(7) = 50
      await setScore(page, 'joy', 6);
      await setScore(page, 'engagement', 6);
      await setScore(page, 'repeatedValue', 5);
      await setScore(page, 'nostalgia', 3);
      await setScore(page, 'replaceability', 7);

      await expect(page.locator('.verdict-tier')).toHaveText('Uncommon');
      await expect(page.locator('.verdict-action')).toContainText('Retain');
      await expect(page.locator('.verdict-why-rule')).toHaveText('Amplifier — ');
    });

    test('same scores but replaceability = 6 → Discard (no amplifier)', async ({ page }) => {
      await setScore(page, 'joy', 6);
      await setScore(page, 'engagement', 6);
      await setScore(page, 'repeatedValue', 5);
      await setScore(page, 'nostalgia', 3);
      await setScore(page, 'replaceability', 6);

      await expect(page.locator('.verdict-action')).toContainText('Discard');
    });
  });

  // ── Score display ───────────────────────────────────────────

  test.describe('score display', () => {
    test('weighted total reflects criterion weights', async ({ page }) => {
      await setScore(page, 'joy', 5);         // joy ×3 = 15
      await expect(page.locator('.score-number')).toHaveText('15');

      await setScore(page, 'engagement', 4);  // engagement ×2 = 8 → total 23
      await expect(page.locator('.score-number')).toHaveText('23');
    });

    test('clicking the rightmost filled segment steps value down', async ({ page }) => {
      await setScore(page, 'joy', 5);         // score = 15
      await setScore(page, 'joy', 5);         // click again → steps to 4 → score = 12
      await expect(page.locator('.score-number')).toHaveText('12');
    });
  });

  // ── Reset ───────────────────────────────────────────────────

  test.describe('reset', () => {
    test('reset clears scores and returns verdict to Junk', async ({ page }) => {
      await setScore(page, 'joy', 8);
      await setScore(page, 'engagement', 7);
      await expect(page.locator('.verdict-tier')).not.toHaveText('Junk');

      await page.getByRole('button', { name: /Reset/ }).click();

      await expect(page.locator('.score-number')).toHaveText('0');
      await expect(page.locator('.verdict-tier')).toHaveText('Junk');
    });
  });

  // ── Mobile ──────────────────────────────────────────────────

  test.describe('mobile viewport', () => {
    test('panel fits within 390px viewport and verdict is visible', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.reload();

      await expect(page.locator('.game-title')).toBeVisible();
      await expect(page.locator('.verdict-tier')).toBeVisible();

      const panelBox = await page.locator('.game-panel').boundingBox();
      expect(panelBox!.width).toBeLessThanOrEqual(390);
    });

    test('stat segments are interactable on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.reload();

      await setScore(page, 'joy', 9);
      await expect(page.locator('.verdict-tier')).toHaveText('Legendary');
    });
  });
});
