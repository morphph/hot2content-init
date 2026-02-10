import { redirect } from 'next/navigation'
import { getAllCompares } from '@/lib/compare'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllCompares().map(c => ({ slug: c.slug }))
}

export default async function CompareDetailRedirect({ params }: Props) {
  const { slug } = await params
  const lang = slug.endsWith('-zh') ? 'zh' : 'en'
  redirect(`/${lang}/compare/${slug}`)
}
