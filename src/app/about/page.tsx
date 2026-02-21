import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getNavItems } from '@/lib/nav'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About LoreAI — Mission, Editorial Process & Team',
  description: 'LoreAI is an AI content engine that transforms trending AI/tech topics into bilingual deep-dive articles. Learn about our editorial process, quality standards, and team.',
  alternates: {
    canonical: 'https://loreai.dev/about/',
    languages: {
      'en': '/about/',
      'x-default': '/about/',
    },
  },
}

const aboutJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'About LoreAI',
  url: 'https://loreai.dev/about/',
  mainEntity: {
    '@type': 'Organization',
    name: 'LoreAI',
    url: 'https://loreai.dev',
    description: 'AI content engine producing bilingual deep-dive articles on AI development, models, and tools.',
    foundingDate: '2025',
    knowsAbout: [
      'Artificial Intelligence',
      'Large Language Models',
      'AI Development Tools',
      'Machine Learning',
    ],
  },
}

export default function AboutPage() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }} />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
        <Header
          lang="en"
          navItems={getNavItems('en', '/about')}
          langSwitchHref="/about/"
        />

        <h1
          style={{
            fontSize: '32px',
            fontWeight: 'bold',
            marginBottom: '16px',
            background: 'linear-gradient(to right, #ec4899, #a855f7, #6366f1)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          About LoreAI
        </h1>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>Mission</h2>
          <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '12px' }}>
            LoreAI is an AI content engine that transforms trending AI and technology topics into bilingual (English and Chinese) deep-dive articles. We publish daily newsletters, in-depth blog posts, FAQ pages, glossary entries, and model comparisons — all designed to help developers and tech professionals stay ahead.
          </p>
          <p style={{ color: '#4b5563', lineHeight: 1.8 }}>
            Our goal is to make complex AI topics accessible, accurate, and actionable — whether you read in English or Chinese.
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>Editorial Process</h2>
          <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '16px' }}>
            Every piece of content goes through a structured pipeline to ensure quality, accuracy, and SEO optimization:
          </p>
          <ol style={{ color: '#4b5563', lineHeight: 2, paddingLeft: '24px' }}>
            <li><strong>Topic Discovery:</strong> Automated trend scanning across 5 tiers of sources — research papers, developer communities, industry news, social media, and official announcements.</li>
            <li><strong>Deep Research:</strong> Each topic undergoes in-depth research using Gemini Deep Research to gather primary sources, benchmarks, and expert opinions.</li>
            <li><strong>Core Narrative:</strong> Research is distilled into a structured narrative document that captures the key insights, data points, and angles.</li>
            <li><strong>Content Generation:</strong> English and Chinese articles are independently crafted (not translated) from the core narrative, each with culturally appropriate tone and examples.</li>
            <li><strong>SEO Review:</strong> Automated audit for search optimization, E-E-A-T signals, and readability. Articles must score above threshold to publish.</li>
          </ol>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>Content Tiers</h2>
          <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '16px' }}>
            We produce content at three quality tiers:
          </p>
          <ul style={{ color: '#4b5563', lineHeight: 2, paddingLeft: '24px' }}>
            <li><strong>Tier 1 — Deep Dives:</strong> 1,500–2,500 word articles with original analysis, benchmarks, and code examples. Published 1–2 per week.</li>
            <li><strong>Tier 2 — Analysis:</strong> 800–1,500 word articles on trending topics. Published 3–5 per day.</li>
            <li><strong>Tier 3 — Quick Reads:</strong> 300–500 word summaries for fast consumption.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>Transparency</h2>
          <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '12px' }}>
            LoreAI content is AI-assisted. We use large language models (Claude, Gemini) in our production pipeline, with automated quality checks at each stage. Every article cites its sources and links to primary references where possible.
          </p>
          <p style={{ color: '#4b5563', lineHeight: 1.8 }}>
            We believe in making our process transparent — if you have questions about how a specific article was produced, please reach out.
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>Contact</h2>
          <p style={{ color: '#4b5563', lineHeight: 1.8 }}>
            Website: <Link href="/" style={{ color: '#2563eb' }}>loreai.dev</Link>
          </p>
        </section>

        <Footer lang="en" />
      </div>
    </main>
  )
}
