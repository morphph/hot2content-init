import { ImageResponse } from 'next/og'
import { getBlogPost, getBlogPosts } from '@/lib/blog'

export const alt = 'LoreAI Blog'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export async function generateStaticParams() {
  const posts = await getBlogPosts('en')
  return posts.map((post) => ({ slug: post.slug }))
}

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getBlogPost('en', slug)

  const title = post?.title || 'LoreAI Blog'
  const description = post?.description || ''

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #172554 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              lineHeight: 1.2,
              maxWidth: '900px',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {title}
          </div>
          {description && (
            <div
              style={{
                fontSize: '24px',
                color: '#94a3b8',
                maxWidth: '800px',
                lineHeight: 1.4,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {description}
            </div>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <div
            style={{
              fontSize: '28px',
              fontWeight: 'bold',
              background: 'linear-gradient(to right, #ec4899, #a855f7, #6366f1)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            loreai.dev
          </div>
          {post?.date && (
            <div style={{ fontSize: '20px', color: '#64748b' }}>
              {post.date}
            </div>
          )}
        </div>
      </div>
    ),
    { ...size },
  )
}
