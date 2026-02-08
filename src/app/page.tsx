import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-4">Hot2Content</h1>
      <p className="text-xl text-gray-600 mb-8">
        AI Content Engine — From Research to Multi-platform Publishing
      </p>
      
      <div className="grid grid-cols-2 gap-4">
        <Link 
          href="/en/blog" 
          className="p-6 border rounded-lg hover:bg-gray-50 transition"
        >
          <h2 className="text-2xl font-semibold mb-2">🇺🇸 English Blog</h2>
          <p className="text-gray-600">SEO-optimized tech articles</p>
        </Link>
        
        <Link 
          href="/zh/blog" 
          className="p-6 border rounded-lg hover:bg-gray-50 transition"
        >
          <h2 className="text-2xl font-semibold mb-2">🇨🇳 中文博客</h2>
          <p className="text-gray-600">科技深度解读</p>
        </Link>
      </div>
    </main>
  )
}
