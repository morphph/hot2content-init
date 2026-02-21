'use client'

import { useState } from 'react'
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
 * Responsive: hamburger menu on mobile, horizontal nav on desktop.
 */
export default function Header({ lang, navItems, langSwitchHref }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const isEn = lang === 'en'
  const homeHref = isEn ? '/newsletter' : '/zh/newsletter'

  return (
    <header className="site-header sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-transparent">
      <div className="flex items-center justify-between py-4">
        {/* Logo + Desktop Nav */}
        <div className="flex items-center gap-8">
          <Link href={homeHref} className="text-xl font-extrabold text-blue-600 tracking-tight no-underline">
            LoreAI
          </Link>
          <nav className="hidden md:flex gap-6 text-sm">
            {navItems.map((item) =>
              item.active ? (
                <span
                  key={item.label}
                  className="text-gray-900 font-semibold border-b-2 border-purple-500 pb-1"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-gray-500 hover:text-gray-900 no-underline pb-1 transition-colors"
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>
        </div>

        {/* Language Switcher + Mobile Toggle */}
        <div className="flex items-center gap-4">
          {/* Language Switcher */}
          <div className="flex gap-2 text-[13px]">
            {isEn ? (
              <>
                <span className="text-gray-900 font-medium">EN</span>
                <span className="text-gray-300">|</span>
                <Link href={langSwitchHref} className="text-gray-500 no-underline hover:text-gray-900 transition-colors">
                  中文
                </Link>
              </>
            ) : (
              <>
                <Link href={langSwitchHref} className="text-gray-500 no-underline hover:text-gray-900 transition-colors">
                  EN
                </Link>
                <span className="text-gray-300">|</span>
                <span className="text-gray-900 font-medium">中文</span>
              </>
            )}
          </div>

          {/* Hamburger Button (mobile only) */}
          <button
            className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            <span className={`block w-5 h-0.5 bg-gray-700 transition-transform duration-200 ${mobileOpen ? 'rotate-45 translate-y-[4px]' : ''}`} />
            <span className={`block w-5 h-0.5 bg-gray-700 transition-opacity duration-200 ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-gray-700 transition-transform duration-200 ${mobileOpen ? '-rotate-45 -translate-y-[4px]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-200 ease-in-out ${mobileOpen ? 'max-h-96 pb-4' : 'max-h-0'}`}
      >
        <nav className="flex flex-col gap-1 border-t border-gray-100 pt-3">
          {navItems.map((item) =>
            item.active ? (
              <span
                key={item.label}
                className="text-gray-900 font-semibold text-sm py-2 px-3 rounded-lg bg-purple-50 border-l-2 border-purple-500"
              >
                {item.label}
              </span>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className="text-gray-500 hover:text-gray-900 hover:bg-gray-50 text-sm py-2 px-3 rounded-lg no-underline transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  )
}
