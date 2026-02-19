import Link from 'next/link'

export type NavItem = {
  label: string
  href: string
  active?: boolean
}

interface HeaderProps {
  lang: 'en' | 'zh'
  /** Navigation items to display. Active item is rendered as a span, others as links. */
  navItems: NavItem[]
  /** The URL for the language switcher link (the non-active language). */
  langSwitchHref: string
}

/**
 * Shared site header with logo, navigation, and language switcher.
 * Used across all pages to avoid duplicating header markup.
 */
export default function Header({ lang, navItems, langSwitchHref }: HeaderProps) {
  const isEn = lang === 'en'
  const homeHref = isEn ? '/newsletter' : '/zh/newsletter'

  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '48px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <Link href={homeHref} style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '20px', fontWeight: '800', color: '#2563eb', letterSpacing: '-0.02em' }}>
            LoreAI
          </span>
        </Link>
        <nav style={{ display: 'flex', gap: '24px', fontSize: '14px' }}>
          {navItems.map((item) =>
            item.active ? (
              <span
                key={item.label}
                style={{
                  color: '#111827',
                  fontWeight: '600',
                  borderBottom: '2px solid #8b5cf6',
                  paddingBottom: '4px',
                }}
              >
                {item.label}
              </span>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                style={{ color: '#6b7280', textDecoration: 'none', paddingBottom: '4px' }}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>
      </div>
      <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
        {isEn ? (
          <>
            <span style={{ color: '#111827', fontWeight: '500' }}>EN</span>
            <span style={{ color: '#d1d5db' }}>|</span>
            <Link href={langSwitchHref} style={{ color: '#6b7280', textDecoration: 'none' }}>
              中文
            </Link>
          </>
        ) : (
          <>
            <Link href={langSwitchHref} style={{ color: '#6b7280', textDecoration: 'none' }}>
              EN
            </Link>
            <span style={{ color: '#d1d5db' }}>|</span>
            <span style={{ color: '#111827', fontWeight: '500' }}>中文</span>
          </>
        )}
      </div>
    </header>
  )
}
