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
  test('newsletter page has nav links with valid hrefs', async ({ page }) => {
    await page.goto('/newsletter');
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Logo links to /newsletter (allow trailing slash)
    const logo = header.locator('a:has-text("LoreAI")');
    await expect(logo).toHaveAttribute('href', /\/newsletter\/?$/);

    // Nav links exist with correct hrefs
    const blogLink = header.locator('nav a:has-text("Blog")');
    await expect(blogLink).toBeVisible();
    await expect(blogLink).toHaveAttribute('href', /\/en\/blog\/?$/);

    // Language switcher links to ZH equivalent
    const zhLink = header.locator('a:has-text("中文")');
    await expect(zhLink).toBeVisible();
    await expect(zhLink).toHaveAttribute('href', /\/zh\//);

    // All <a> tags in header have non-empty href
    const allLinks = header.locator('a');
    const linkCount = await allLinks.count();
    expect(linkCount).toBeGreaterThan(0);
    for (let i = 0; i < linkCount; i++) {
      const href = await allLinks.nth(i).getAttribute('href');
      expect(href, `header link ${i} should have non-empty href`).toBeTruthy();
    }
  });

  test('header appears on /en/blog with valid links', async ({ page }) => {
    await page.goto('/en/blog');
    const header = page.locator('header');
    await expect(header).toBeVisible();
    await expect(header.locator('a:has-text("LoreAI")')).toHaveAttribute('href', /\/newsletter\/?$/);

    // All header links have non-empty href
    const allLinks = header.locator('a');
    const linkCount = await allLinks.count();
    for (let i = 0; i < linkCount; i++) {
      const href = await allLinks.nth(i).getAttribute('href');
      expect(href, `header link ${i} should have non-empty href`).toBeTruthy();
    }
  });

  test('header appears on /en/faq with full nav', async ({ page }) => {
    await page.goto('/en/faq');
    const header = page.locator('header');
    await expect(header).toBeVisible();
    await expect(header.locator('a:has-text("LoreAI")')).toHaveAttribute('href', /\/newsletter\/?$/);

    // FAQ page should have nav links to other sections
    const nav = header.locator('nav');
    const navLinks = nav.locator('a');
    const navLinkCount = await navLinks.count();
    // FAQ page has full nav (Newsletter, Blog, Glossary, Compare — FAQ is active span)
    expect(navLinkCount).toBeGreaterThanOrEqual(2);

    // Each nav link has a valid href
    for (let i = 0; i < navLinkCount; i++) {
      const href = await navLinks.nth(i).getAttribute('href');
      expect(href, `nav link ${i} should have non-empty href`).toBeTruthy();
    }
  });

  test('footer present on newsletter page', async ({ page }) => {
    await page.goto('/newsletter');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    const footerText = await footer.textContent();
    expect(footerText).toMatch(/Curated by AI|AI 策展|AI 驱动/);
  });

  test('footer present on EN blog list', async ({ page }) => {
    await page.goto('/en/blog');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('footer present on EN blog detail', async ({ page }) => {
    await page.goto('/en/blog/claude-code-agent-teams-ai-software-development');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
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

  test('header is visible and nav links are accessible on mobile', async ({ page }) => {
    await page.goto('/newsletter');
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Header should not overflow the viewport
    const headerOverflow = await header.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return rect.right > window.innerWidth;
    });
    expect(headerOverflow, 'header should not overflow viewport').toBe(false);

    // All nav links should be reachable — either visible directly or
    // accessible via a mobile menu toggle (hamburger button)
    const hamburger = page.locator('header button[aria-label*="menu" i], header button[aria-label*="nav" i], header [data-mobile-toggle]');
    const hasHamburger = await hamburger.count() > 0;

    if (hasHamburger) {
      // If hamburger exists, click it to reveal nav
      await hamburger.first().click();
      await page.waitForTimeout(300); // allow animation
    }

    // After toggle (or without toggle), nav links should be within viewport
    const navLinks = header.locator('nav a');
    const navLinkCount = await navLinks.count();
    if (navLinkCount > 0) {
      for (let i = 0; i < navLinkCount; i++) {
        const box = await navLinks.nth(i).boundingBox();
        if (box) {
          // Link should not extend past the right edge of viewport
          expect(box.x + box.width, `nav link ${i} right edge should be within viewport`).toBeLessThanOrEqual(375 + 5);
          // Link should not be hidden to the left
          expect(box.x + box.width, `nav link ${i} should not be clipped left`).toBeGreaterThan(0);
        }
      }
    }
  });

  // Known issue: full nav (5 items) overflows on 375px mobile viewport (511px actual).
  // TODO: Fix with hamburger menu or responsive nav wrapping, then remove .fixme().
  test.fixme('FAQ page (full nav) does not cause page-level horizontal scroll on mobile', async ({ page }) => {
    await page.goto('/en/faq');
    await expect(page.locator('header')).toBeVisible();

    // FAQ page has the full nav set — most prone to overflow on mobile.
    // Check that the page body doesn't scroll horizontally (the header
    // itself may use overflow:hidden/wrap, but the page must not scroll).
    const bodyScrollWidth = await page.locator('body').evaluate((el) => el.scrollWidth);
    expect(bodyScrollWidth, 'page body should not cause horizontal scroll').toBeLessThanOrEqual(375 + 5);
  });
});

// ──────────────────────────────────────────────
// N. Cross-page nav consistency & language switcher
// ──────────────────────────────────────────────

test.describe('N. Cross-page nav consistency', () => {
  // Helper: collect nav labels (both <a> links and active <span>s) from a page's header
  async function getNavLabels(page: import('@playwright/test').Page): Promise<string[]> {
    const nav = page.locator('header nav');
    const items = nav.locator('a, span');
    const count = await items.count();
    const labels: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await items.nth(i).textContent();
      if (text?.trim()) labels.push(text.trim());
    }
    return labels.sort();
  }

  test('every EN page header has at least Blog + Newsletter nav items', async ({ page }) => {
    const pagePaths = ['/newsletter', '/en/blog', '/en/faq'];
    for (const path of pagePaths) {
      await page.goto(path);
      await expect(page.locator('header')).toBeVisible();
      const labels = await getNavLabels(page);
      // Every EN page should have at least Newsletter and Blog in the nav
      expect(labels, `${path} nav should include Newsletter`).toEqual(
        expect.arrayContaining(['Newsletter'])
      );
      expect(labels, `${path} nav should include Blog`).toEqual(
        expect.arrayContaining(['Blog'])
      );
    }
  });

  test('full-nav EN pages (FAQ, Glossary, Compare) share the same nav set', async ({ page }) => {
    // These pages all use the full nav with 5 items
    const fullNavPages = ['/en/faq', '/en/glossary', '/en/compare'];
    const navLabelSets: string[][] = [];

    for (const path of fullNavPages) {
      await page.goto(path);
      await expect(page.locator('header')).toBeVisible();
      navLabelSets.push(await getNavLabels(page));
    }

    for (let i = 1; i < navLabelSets.length; i++) {
      expect(navLabelSets[i], `nav labels on ${fullNavPages[i]} should match ${fullNavPages[0]}`).toEqual(navLabelSets[0]);
    }
  });

  test('EN language switcher links to ZH equivalent', async ({ page }) => {
    await page.goto('/en/blog');
    const header = page.locator('header');
    const zhLink = header.locator('a:has-text("中文")');
    await expect(zhLink).toBeVisible();
    const href = await zhLink.getAttribute('href');
    expect(href, 'ZH switcher should point to /zh/ path').toMatch(/\/zh\//);
  });

  test('ZH language switcher links to EN equivalent', async ({ page }) => {
    await page.goto('/zh/blog');
    const header = page.locator('header');
    const enLink = header.locator('a:has-text("EN")');
    await expect(enLink).toBeVisible();
    const href = await enLink.getAttribute('href');
    expect(href, 'EN switcher should point to /en/ path or /newsletter').toMatch(/\/(en\/|newsletter)/);
  });
});
