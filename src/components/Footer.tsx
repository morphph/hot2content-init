import Link from 'next/link'

interface FooterProps {
  lang: 'en' | 'zh'
}

/**
 * Shared site footer with consistent links and bilingual tagline.
 */
export default function Footer({ lang }: FooterProps) {
  const isEn = lang === 'en'

  return (
    <footer className="mt-16 pt-6 border-t border-gray-100 text-center">
      <p className="text-gray-400 text-[13px] mb-3">
        {isEn ? 'Curated by AI \u00b7 Built for humans' : 'AI \u7b56\u5c55 \u00b7 \u4e3a\u4eba\u800c\u5efa'}
      </p>
      <div className="flex justify-center gap-4 text-sm">
        <Link href={isEn ? '/newsletter' : '/zh/newsletter'} className="link-blue">
          Newsletter
        </Link>
        <Link href={`/${lang}/blog`} className="link-blue">
          {isEn ? 'Blog' : '\u535a\u5ba2'}
        </Link>
        <Link href={isEn ? '/en/faq' : '/zh/faq'} className="link-blue">
          {isEn ? 'FAQ' : '\u5e38\u89c1\u95ee\u9898'}
        </Link>
        <Link href={isEn ? '/en/glossary' : '/zh/glossary'} className="link-blue">
          {isEn ? 'Glossary' : '\u672f\u8bed\u8868'}
        </Link>
      </div>
    </footer>
  )
}
