import { redirect } from 'next/navigation'
import { getAllFAQTopics } from '@/lib/faq'

interface Props {
  params: Promise<{ topic: string }>
}

export async function generateStaticParams() {
  return getAllFAQTopics().map(t => ({ topic: t.slug }))
}

export default async function FAQTopicRedirect({ params }: Props) {
  const { topic } = await params
  const lang = topic.endsWith('-zh') ? 'zh' : 'en'
  redirect(`/${lang}/faq/${topic}`)
}
