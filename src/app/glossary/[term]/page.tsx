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
  redirect(`/en/glossary/${term}`)
}
