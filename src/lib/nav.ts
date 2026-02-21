import type { NavItem } from '@/components/Header'

/**
 * Standard navigation items for the site.
 * Returns a consistent set of nav links with the active item auto-detected from the path.
 */
export function getNavItems(lang: 'en' | 'zh', activePath: string): NavItem[] {
  const isEn = lang === 'en'
  const prefix = isEn ? '' : '/zh'

  const items: NavItem[] = [
    {
      label: 'Newsletter',
      href: isEn ? '/newsletter' : '/zh/newsletter',
    },
    {
      label: isEn ? 'Blog' : '博客',
      href: `/${lang}/blog`,
    },
    {
      label: isEn ? 'FAQ' : '常见问题',
      href: `${prefix || '/en'}/faq`,
    },
    {
      label: isEn ? 'Glossary' : '术语表',
      href: `${prefix || '/en'}/glossary`,
    },
    {
      label: isEn ? 'Compare' : '对比',
      href: `${prefix || '/en'}/compare`,
    },
    {
      label: isEn ? 'Topics' : '话题',
      href: `${prefix || '/en'}/topics`,
    },
  ]

  // Auto-detect active item based on path
  for (const item of items) {
    if (activePath === item.href || activePath.startsWith(item.href + '/')) {
      item.active = true
    }
  }

  return items
}
