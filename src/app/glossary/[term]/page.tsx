import { redirect } from 'next/navigation'
import { getGlossaryTerms } from '@/lib/glossary'

interface Props {
  params: Promise<{ term: string }>
}

export async function generateStaticParams() {
  return [
    ...getGlossaryTerms('en').map(t => ({ term: t.slug })),
    ...getGlossaryTerms('zh').map(t => ({ term: t.slug })),
  ]
}

export default async function GlossaryTermRedirect({ params }: Props) {
  const { term } = await params
  // Detect language from slug suffix, matching the pattern used by FAQ and compare redirects
  const lang = term.endsWith('-zh') ? 'zh' : 'en'
  redirect(`/${lang}/glossary/${term}`)
}
