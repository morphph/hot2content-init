import { test, expect } from '@playwright/test';

// ──────────────────────────────────────────────
// A. Core pages load (no 500s)
// ──────────────────────────────────────────────

test.describe('A. Core pages load', () => {
  test('homepage redirects to /newsletter and renders', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/newsletter/);
    await expect(page.locator('text=LoreAI')).toBeVisible();
    await expect(page.locator('h1')).toContainText('AI Newsletter');
  });

  test('EN blog list renders with at least 1 article link', async ({ page }) => {
    await page.goto('/en/blog');
    await expect(page.locator('h1')).toBeVisible();
    const articleLinks = page.locator('a[href*="/en/blog/"]');
    await expect(articleLinks.first()).toBeVisible();
    expect(await articleLinks.count()).toBeGreaterThan(0);
  });

  test('ZH blog list renders', async ({ page }) => {
    await page.goto('/zh/blog');
    await expect(page.locator('h1')).toBeVisible();
    const articleLinks = page.locator('a[href*="/zh/blog/"]');
    await expect(articleLinks.first()).toBeVisible();
  });
});

// ──────────────────────────────────────────────
// B. Shared Header component
// ──────────────────────────────────────────────

test.describe('B. Header component', () => {
  test('newsletter page has nav links and language switcher', async ({ page }) => {
    await page.goto('/newsletter');
    const header = page.locator('header');
    await expect(header).toBeVisible();
    // Nav links
    await expect(header.locator('text=Blog')).toBeVisible();
    // Language switcher
    await expect(header.locator('text=中文')).toBeVisible();
  });

  test('header appears on /en/blog', async ({ page }) => {
    await page.goto('/en/blog');
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('header >> text=LoreAI')).toBeVisible();
  });

  test('header appears on /en/faq', async ({ page }) => {
    await page.goto('/en/faq');
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('header >> text=LoreAI')).toBeVisible();
  });
});

// ──────────────────────────────────────────────
// C. Blog detail page (JSON-LD, BreadcrumbList, XSS)
// ──────────────────────────────────────────────

test.describe('C. Blog detail page', () => {
  const blogSlug = 'claude-code-agent-teams-ai-software-development';

  test('blog detail renders article content', async ({ page }) => {
    await page.goto(`/en/blog/${blogSlug}`);
    await expect(page.locator('article')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('blog detail has Article JSON-LD', async ({ page }) => {
    await page.goto(`/en/blog/${blogSlug}`);
    const jsonLdScripts = page.locator('script[type="application/ld+json"]');
    const count = await jsonLdScripts.count();
    expect(count).toBeGreaterThan(0);

    let foundArticle = false;
    for (let i = 0; i < count; i++) {
      const text = await jsonLdScripts.nth(i).textContent();
      if (text && text.includes('"@type":"Article"')) {
        foundArticle = true;
        const data = JSON.parse(text);
        expect(data['@type']).toBe('Article');
        expect(data).toHaveProperty('headline');
        expect(data).toHaveProperty('datePublished');
        break;
      }
    }
    expect(foundArticle).toBe(true);
  });

  test('blog detail has BreadcrumbList JSON-LD', async ({ page }) => {
    await page.goto(`/en/blog/${blogSlug}`);
    const jsonLdScripts = page.locator('script[type="application/ld+json"]');
    const count = await jsonLdScripts.count();

    let foundBreadcrumb = false;
    for (let i = 0; i < count; i++) {
      const text = await jsonLdScripts.nth(i).textContent();
      if (text && text.includes('"BreadcrumbList"')) {
        foundBreadcrumb = true;
        break;
      }
    }
    expect(foundBreadcrumb).toBe(true);
  });

  test('no raw script tags inside article content (XSS check)', async ({ page }) => {
    await page.goto(`/en/blog/${blogSlug}`);
    const articleContent = page.locator('.article-content');
    const scripts = articleContent.locator('script:not([type="application/ld+json"])');
    expect(await scripts.count()).toBe(0);
  });
});

// ──────────────────────────────────────────────
// D. Newsletter pages
// ──────────────────────────────────────────────

test.describe('D. Newsletter pages', () => {
  test('EN newsletter date page renders', async ({ page }) => {
    const response = await page.goto('/newsletter/2026-02-08');
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('main')).toBeVisible();
  });

  test('ZH newsletter date page renders', async ({ page }) => {
    const response = await page.goto('/zh/newsletter/2026-02-08');
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('main')).toBeVisible();
  });
});

// ──────────────────────────────────────────────
// E. FAQ pages (hreflang, BreadcrumbList, FAQPage JSON-LD)
// ──────────────────────────────────────────────

test.describe('E. FAQ pages', () => {
  test('EN FAQ list renders', async ({ page }) => {
    await page.goto('/en/faq');
    await expect(page.locator('h1')).toContainText('Frequently Asked Questions');
  });

  test('EN FAQ list has hreflang alternate', async ({ page }) => {
    await page.goto('/en/faq');
    const zhAlternate = page.locator('link[hreflang="zh"]');
    await expect(zhAlternate).toHaveAttribute('href', /\/zh\/faq/);
  });

  test('FAQ topic page has FAQPage JSON-LD', async ({ page }) => {
    await page.goto('/en/faq/agent-teams-multi-agent-en');
    const jsonLdScripts = page.locator('script[type="application/ld+json"]');
    const count = await jsonLdScripts.count();
    expect(count).toBeGreaterThan(0);

    let foundFAQ = false;
    for (let i = 0; i < count; i++) {
      const text = await jsonLdScripts.nth(i).textContent();
      if (text && text.includes('"FAQPage"')) {
        foundFAQ = true;
        break;
      }
    }
    expect(foundFAQ).toBe(true);
  });
});

// ──────────────────────────────────────────────
// F. Glossary redirects
// ──────────────────────────────────────────────

test.describe('F. Glossary redirects', () => {
  test('ZH glossary term redirects to /zh/glossary/', async ({ page }) => {
    await page.goto('/glossary/adaptive-thinking-zh');
    await expect(page).toHaveURL(/\/zh\/glossary\/adaptive-thinking-zh/);
  });

  test('EN glossary term redirects to /en/glossary/', async ({ page }) => {
    await page.goto('/glossary/adaptive-thinking-en');
    await expect(page).toHaveURL(/\/en\/glossary\/adaptive-thinking-en/);
  });
});

// ──────────────────────────────────────────────
// G. Compare pages
// ──────────────────────────────────────────────

test.describe('G. Compare pages', () => {
  test('EN compare list renders', async ({ page }) => {
    await page.goto('/en/compare');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('compare detail has BreadcrumbList JSON-LD', async ({ page }) => {
    await page.goto('/en/compare/claude-code-vs-github-copilot-en');
    const jsonLdScripts = page.locator('script[type="application/ld+json"]');
    const count = await jsonLdScripts.count();

    let foundBreadcrumb = false;
    for (let i = 0; i < count; i++) {
      const text = await jsonLdScripts.nth(i).textContent();
      if (text && text.includes('"BreadcrumbList"')) {
        foundBreadcrumb = true;
        break;
      }
    }
    expect(foundBreadcrumb).toBe(true);
  });
});

// ──────────────────────────────────────────────
// H. ZH layout lang attribute
// ──────────────────────────────────────────────

test.describe('H. ZH layout lang attribute', () => {
  test('/zh/blog page has lang="zh" in DOM', async ({ page }) => {
    await page.goto('/zh/blog');
    const zhDiv = page.locator('[lang="zh"]');
    await expect(zhDiv).toBeVisible();
  });
});

// ──────────────────────────────────────────────
// I. Sitemap & SEO
// ──────────────────────────────────────────────

test.describe('I. Sitemap', () => {
  test('sitemap.xml returns valid XML with newsletter URLs', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('<?xml');
    expect(body).toContain('<urlset');
    expect(body).toContain('/newsletter/');
  });
});

// ──────────────────────────────────────────────
// J. Fonts self-hosted (no external font requests)
// ──────────────────────────────────────────────

test.describe('J. Self-hosted fonts', () => {
  test('no requests to fonts.googleapis.com', async ({ page }) => {
    const externalFontRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('fonts.googleapis.com') || req.url().includes('fonts.gstatic.com')) {
        externalFontRequests.push(req.url());
      }
    });
    await page.goto('/newsletter');
    await page.waitForLoadState('networkidle');
    expect(externalFontRequests).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────
// K. Content rendering integrity
// ──────────────────────────────────────────────

test.describe('K. Content rendering integrity', () => {
  const blogSlug = 'claude-code-agent-teams-ai-software-development';

  test('blog article renders markdown as HTML, not raw text', async ({ page }) => {
    await page.goto(`/en/blog/${blogSlug}`);
    const article = page.locator('article');
    await expect(article).toBeVisible();
    // Should have rendered HTML elements (paragraphs, headings, etc.), not raw markdown
    const paragraphs = article.locator('p');
    expect(await paragraphs.count()).toBeGreaterThan(0);
    // Should NOT contain raw markdown syntax like "## " or "**" as visible text
    const articleText = await article.textContent();
    expect(articleText).not.toMatch(/^## /m);
  });

  test('blog article does not show raw frontmatter delimiters', async ({ page }) => {
    await page.goto(`/en/blog/${blogSlug}`);
    const bodyText = await page.locator('article').textContent();
    expect(bodyText).not.toContain('---\nslug:');
    expect(bodyText).not.toContain('---\ntitle:');
  });
});

// ──────────────────────────────────────────────
// L. Internal link validation
// ──────────────────────────────────────────────

test.describe('L. Internal link validation', () => {
  test('EN blog list links resolve to valid pages (sample first 3)', async ({ page }) => {
    await page.goto('/en/blog');
    const links = page.locator('a[href*="/en/blog/"]');
    const count = Math.min(await links.count(), 3);
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      if (!href) continue;
      const response = await page.goto(href);
      expect(response?.status(), `${href} should not 404/500`).toBeLessThan(400);
      await expect(page.locator('article')).toBeVisible();
    }
  });

  test('newsletter page links resolve (sample first 2)', async ({ page }) => {
    await page.goto('/newsletter');
    const links = page.locator('a[href*="/newsletter/2"]');
    const count = Math.min(await links.count(), 2);
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      if (!href) continue;
      const response = await page.goto(href);
      expect(response?.status(), `${href} should not 404/500`).toBeLessThan(400);
      await expect(page.locator('main')).toBeVisible();
    }
  });
});

// ──────────────────────────────────────────────
// M. Mobile viewport
// ──────────────────────────────────────────────

test.describe('M. Mobile viewport', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('homepage renders without horizontal overflow on mobile', async ({ page }) => {
    await page.goto('/newsletter');
    const body = page.locator('body');
    const bodyWidth = await body.evaluate((el) => el.scrollWidth);
    // scrollWidth should not significantly exceed viewport width
    expect(bodyWidth).toBeLessThanOrEqual(375 + 5); // allow 5px tolerance
  });

  test('blog list is usable on mobile', async ({ page }) => {
    await page.goto('/en/blog');
    await expect(page.locator('h1')).toBeVisible();
    const links = page.locator('a[href*="/en/blog/"]');
    await expect(links.first()).toBeVisible();
  });

  test('header is visible on mobile', async ({ page }) => {
    await page.goto('/newsletter');
    await expect(page.locator('header')).toBeVisible();
  });
});
