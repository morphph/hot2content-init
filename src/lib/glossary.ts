import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'
import gfm from 'remark-gfm'

const GLOSSARY_DIR = path.join(process.cwd(), 'content', 'glossary')

export interface GlossaryEntry {
  term: string
  slug: string
  lang: string
  category: string
  definition: string
  related: string[]
  date: string
  source_topic: string
  contentHtml: string
}

export function getGlossaryTerms(lang: string = 'en'): Omit<GlossaryEntry, 'contentHtml'>[] {
  if (!fs.existsSync(GLOSSARY_DIR)) return []
  const files = fs.readdirSync(GLOSSARY_DIR).filter(f => f.endsWith(`-${lang}.md`))
  return files.map(file => {
    const content = fs.readFileSync(path.join(GLOSSARY_DIR, file), 'utf-8')
    const { data } = matter(content)
    return {
      term: data.term || '',
      slug: data.slug || file.replace(/-(?:en|zh)\.md$/, ''),
      lang: data.lang || lang,
      category: data.category || '',
      definition: data.definition || '',
      related: data.related || [],
      date: typeof data.date === 'string' ? data.date : (data.date ? new Date(data.date).toISOString().split('T')[0] : ''),
      source_topic: data.source_topic || '',
    }
  }).sort((a, b) => a.term.localeCompare(b.term))
}

export async function getGlossaryTerm(slug: string, lang: string = 'en'): Promise<GlossaryEntry | null> {
  const filePath = path.join(GLOSSARY_DIR, `${slug}-${lang}.md`)
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)
  const processed = await remark().use(gfm).use(html).process(content)

  return {
    term: data.term || slug,
    slug: data.slug || slug,
    lang: data.lang || lang,
    category: data.category || '',
    definition: data.definition || '',
    related: data.related || [],
    date: typeof data.date === 'string' ? data.date : (data.date ? new Date(data.date).toISOString().split('T')[0] : ''),
    source_topic: data.source_topic || '',
    contentHtml: processed.toString(),
  }
}

export function generateGlossaryJsonLd(entry: GlossaryEntry): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: entry.term,
    description: entry.definition,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      name: 'LoreAI Glossary',
      url: 'https://loreai.dev/glossary',
    },
  }
}
