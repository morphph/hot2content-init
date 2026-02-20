import type { Metadata } from 'next'
import { getDashboardData } from '@/lib/dashboard'
import type { DashboardData } from '@/lib/dashboard'

export const metadata: Metadata = {
  title: 'LoreAI Dashboard',
  robots: { index: false, follow: false },
}

// ─── Style helpers ───────────────────────────────────────────────────────────

const card = {
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  padding: '20px',
  backgroundColor: '#ffffff',
} as const

const sectionHeading = {
  fontSize: '22px',
  fontWeight: '600' as const,
  color: '#111827',
  marginBottom: '16px',
}

const statValue = {
  fontSize: '28px',
  fontWeight: '700' as const,
  color: '#111827',
}

const statLabel = {
  fontSize: '13px',
  color: '#6b7280',
  marginTop: '4px',
}

const STATUS_COLORS: Record<string, string> = {
  success: '#22c55e',
  complete: '#22c55e',
  partial: '#f59e0b',
  failed: '#ef4444',
  error: '#ef4444',
  unknown: '#9ca3af',
}

const KEYWORD_STATUS_COLORS: Record<string, string> = {
  backlog: '#9ca3af',
  writing: '#3b82f6',
  published: '#22c55e',
  error: '#ef4444',
  skipped: '#d1d5db',
}

function StatusDot({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.unknown
  return (
    <span
      style={{
        display: 'inline-block',
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        backgroundColor: color,
        marginRight: '6px',
      }}
    />
  )
}

function Check({ ok }: { ok: boolean }) {
  return <span style={{ color: ok ? '#22c55e' : '#d1d5db', marginLeft: '4px' }}>{ok ? '\u2713' : '\u2717'}</span>
}

// ─── Sections ────────────────────────────────────────────────────────────────

function PipelineHealth({ data }: { data: DashboardData['pipelineHealth'] }) {
  const { newsletter, seo, newsItems, recentErrors } = data

  return (
    <section style={{ marginBottom: '40px' }}>
      <h2 style={sectionHeading}>Pipeline Health</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* Newsletter */}
        <div style={card}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Newsletter</div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
            <StatusDot status={newsletter.lastRunStatus} />
            <span style={{ fontWeight: '600', color: '#111827' }}>{newsletter.lastRunDate || 'Never'}</span>
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280' }}>
            EN<Check ok={newsletter.enPublished} /> ZH<Check ok={newsletter.zhPublished} />
          </div>
          {newsletter.lastRunMessage && (
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px', wordBreak: 'break-word' }}>
              {newsletter.lastRunMessage}
            </div>
          )}
        </div>

        {/* SEO Pipeline */}
        <div style={card}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>SEO Pipeline</div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
            <StatusDot status={seo.lastRunStatus} />
            <span style={{ fontWeight: '600', color: '#111827' }}>{seo.lastRunStatus}</span>
          </div>
          <div style={{ fontSize: '13px', color: '#9ca3af' }}>
            {seo.lastRunTimestamp || 'No timestamp'}
          </div>
        </div>

        {/* News Items */}
        <div style={card}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>News Items</div>
          <div style={statValue}>{newsItems.last24h}</div>
          <div style={statLabel}>last 24h</div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>
            72h: {newsItems.last72h} &middot; Total: {newsItems.total.toLocaleString()}
          </div>
        </div>
      </div>

      {recentErrors.length > 0 && (
        <div style={{ marginTop: '16px', ...card, borderColor: '#fecaca', backgroundColor: '#fef2f2' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#991b1b', marginBottom: '8px' }}>Recent Errors</div>
          <pre style={{ fontSize: '12px', color: '#7f1d1d', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
            {recentErrors.join('\n')}
          </pre>
        </div>
      )}
    </section>
  )
}

function KeywordQuality({ data }: { data: DashboardData['keywordQuality'] }) {
  const { byStatus, byLanguage, byIntent, volumeDistribution, difficultyDistribution, top20, staleBacklogCount, total } = data

  // Colored status bar
  const statusEntries = Object.entries(byStatus).sort((a, b) => b[1] - a[1])
  const barTotal = statusEntries.reduce((sum, [, c]) => sum + c, 0) || 1

  return (
    <section style={{ marginBottom: '40px' }}>
      <h2 style={sectionHeading}>Keyword Quality <span style={{ fontSize: '14px', fontWeight: '400', color: '#9ca3af' }}>({total} total)</span></h2>

      {/* Status bar */}
      <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', height: '24px', marginBottom: '16px' }}>
        {statusEntries.map(([status, count]) => (
          <div
            key={status}
            title={`${status}: ${count}`}
            style={{
              width: `${(count / barTotal) * 100}%`,
              backgroundColor: KEYWORD_STATUS_COLORS[status] || '#d1d5db',
              minWidth: count > 0 ? '2px' : '0',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', fontSize: '13px' }}>
        {statusEntries.map(([status, count]) => (
          <span key={status} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', backgroundColor: KEYWORD_STATUS_COLORS[status] || '#d1d5db' }} />
            {status}: {count}
          </span>
        ))}
      </div>

      {/* Mini cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div style={card}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>By Language</div>
          {Object.entries(byLanguage).map(([l, c]) => (
            <div key={l} style={{ fontSize: '14px', color: '#111827' }}>{l.toUpperCase()}: {c}</div>
          ))}
        </div>
        <div style={card}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>By Intent</div>
          {Object.entries(byIntent).map(([i, c]) => (
            <div key={i} style={{ fontSize: '14px', color: '#111827' }}>{i}: {c}</div>
          ))}
        </div>
        <div style={card}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>Stale Backlog</div>
          <div style={{ ...statValue, color: staleBacklogCount > 50 ? '#ef4444' : '#111827' }}>{staleBacklogCount}</div>
          <div style={statLabel}>older than 7 days</div>
        </div>
      </div>

      {/* Volume + Difficulty distributions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <div style={card}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>Volume Distribution</div>
          <DistributionBar items={[
            { label: 'No data', value: volumeDistribution.noData, color: '#d1d5db' },
            { label: 'Low', value: volumeDistribution.low, color: '#93c5fd' },
            { label: 'Medium', value: volumeDistribution.medium, color: '#3b82f6' },
            { label: 'High', value: volumeDistribution.high, color: '#1d4ed8' },
          ]} />
        </div>
        <div style={card}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>Difficulty Distribution</div>
          <DistributionBar items={[
            { label: 'No data', value: difficultyDistribution.noData, color: '#d1d5db' },
            { label: 'Easy', value: difficultyDistribution.easy, color: '#86efac' },
            { label: 'Medium', value: difficultyDistribution.medium, color: '#f59e0b' },
            { label: 'Hard', value: difficultyDistribution.hard, color: '#ef4444' },
          ]} />
        </div>
      </div>

      {/* Top 20 keywords table */}
      {top20.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>Top 20 Keywords</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: '#6b7280' }}>Keyword</th>
                <th style={{ textAlign: 'center', padding: '8px 6px', color: '#6b7280' }}>Lang</th>
                <th style={{ textAlign: 'right', padding: '8px 6px', color: '#6b7280' }}>Score</th>
                <th style={{ textAlign: 'center', padding: '8px 6px', color: '#6b7280' }}>Status</th>
                <th style={{ textAlign: 'right', padding: '8px 6px', color: '#6b7280' }}>Vol</th>
                <th style={{ textAlign: 'right', padding: '8px 6px', color: '#6b7280' }}>Diff</th>
                <th style={{ textAlign: 'left', padding: '8px 6px', color: '#6b7280' }}>Intent</th>
              </tr>
            </thead>
            <tbody>
              {top20.map((kw, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 12px', color: '#111827', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{kw.keyword}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'center', color: '#6b7280' }}>{kw.language?.toUpperCase()}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: '600', color: '#111827' }}>{kw.score ?? '-'}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: '500',
                      backgroundColor: `${KEYWORD_STATUS_COLORS[kw.status] || '#d1d5db'}20`,
                      color: KEYWORD_STATUS_COLORS[kw.status] || '#6b7280',
                    }}>
                      {kw.status}
                    </span>
                  </td>
                  <td style={{ padding: '8px 6px', textAlign: 'right', color: '#6b7280' }}>{kw.search_volume?.toLocaleString() ?? '-'}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'right', color: '#6b7280' }}>{kw.difficulty ?? '-'}</td>
                  <td style={{ padding: '8px 6px', color: '#6b7280' }}>{kw.search_intent ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function DistributionBar({ items }: { items: Array<{ label: string; value: number; color: string }> }) {
  const total = items.reduce((sum, i) => sum + i.value, 0) || 1
  return (
    <>
      <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', height: '16px', marginBottom: '8px' }}>
        {items.map(item => (
          <div
            key={item.label}
            title={`${item.label}: ${item.value}`}
            style={{
              width: `${(item.value / total) * 100}%`,
              backgroundColor: item.color,
              minWidth: item.value > 0 ? '2px' : '0',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '12px' }}>
        {items.map(item => (
          <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6b7280' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', backgroundColor: item.color }} />
            {item.label}: {item.value}
          </span>
        ))}
      </div>
    </>
  )
}

function ContentOutput({ data }: { data: DashboardData['contentOutput'] }) {
  const { byType, byTier, publishedLast7d, publishedLast30d, seoScoreDistribution, enArticles, zhArticles, newsletterStreak } = data
  const totalContent = Object.values(byType).reduce((s, c) => s + c, 0)

  return (
    <section style={{ marginBottom: '40px' }}>
      <h2 style={sectionHeading}>Content Output</h2>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div style={card}>
          <div style={statValue}>{totalContent}</div>
          <div style={statLabel}>Total content</div>
        </div>
        <div style={card}>
          <div style={statValue}>{publishedLast7d}</div>
          <div style={statLabel}>Last 7 days</div>
        </div>
        <div style={card}>
          <div style={statValue}>{publishedLast30d}</div>
          <div style={statLabel}>Last 30 days</div>
        </div>
        <div style={card}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>
            {enArticles} EN / {zhArticles} ZH
          </div>
          <div style={statLabel}>Blog articles</div>
        </div>
      </div>

      {/* By type + by tier */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <div style={card}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>By Type</div>
          {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
            <div key={type} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ color: '#374151' }}>{type}</span>
              <span style={{ fontWeight: '600', color: '#111827' }}>{count}</span>
            </div>
          ))}
        </div>
        <div style={card}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>By Tier</div>
          {Object.entries(byTier).sort((a, b) => Number(a[0]) - Number(b[0])).map(([tier, count]) => (
            <div key={tier} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ color: '#374151' }}>Tier {tier}</span>
              <span style={{ fontWeight: '600', color: '#111827' }}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SEO score distribution */}
      <div style={{ ...card, marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>SEO Score Distribution</div>
        <DistributionBar items={[
          { label: 'No score', value: seoScoreDistribution.noScore, color: '#d1d5db' },
          { label: 'Poor (<50)', value: seoScoreDistribution.poor, color: '#ef4444' },
          { label: 'Fair (50-69)', value: seoScoreDistribution.fair, color: '#f59e0b' },
          { label: 'Good (70-84)', value: seoScoreDistribution.good, color: '#3b82f6' },
          { label: 'Excellent (85+)', value: seoScoreDistribution.excellent, color: '#22c55e' },
        ]} />
      </div>

      {/* Newsletter streak */}
      <div style={card}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>Newsletter Streak</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>{newsletterStreak.en} days</div>
            <div style={statLabel}>EN streak (last: {newsletterStreak.lastEnDate || 'none'})</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>{newsletterStreak.zh} days</div>
            <div style={statLabel}>ZH streak (last: {newsletterStreak.lastZhDate || 'none'})</div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const data = getDashboardData()

  if (!data) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px', background: 'linear-gradient(to right, #ec4899, #a855f7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            LoreAI Dashboard
          </h1>
          <div style={{ ...card, textAlign: 'center', padding: '48px 24px', color: '#6b7280' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#128202;</div>
            <p style={{ fontSize: '16px' }}>No dashboard data yet.</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>Data will appear after the next cron run.</p>
            <p style={{ fontSize: '13px', marginTop: '4px', color: '#9ca3af' }}>
              Or run manually: <code style={{ backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>npm run dashboard</code>
            </p>
          </div>
        </div>
      </main>
    )
  }

  // Staleness warning
  const generatedAt = new Date(data.generatedAt)
  const hoursAgo = (Date.now() - generatedAt.getTime()) / (1000 * 60 * 60)
  const isStale = hoursAgo > 36

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', background: 'linear-gradient(to right, #ec4899, #a855f7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          LoreAI Dashboard
        </h1>

        <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '32px' }}>
          Last updated: {generatedAt.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
          {isStale && (
            <span style={{ marginLeft: '8px', color: '#f59e0b', fontWeight: '600' }}>
              &#9888; Data is {Math.round(hoursAgo)}h old — may be stale
            </span>
          )}
        </div>

        <PipelineHealth data={data.pipelineHealth} />
        <KeywordQuality data={data.keywordQuality} />
        <ContentOutput data={data.contentOutput} />

        <footer style={{ textAlign: 'center', marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #e5e7eb', color: '#9ca3af', fontSize: '13px' }}>
          Internal dashboard. Refreshes after each cron run.
        </footer>
      </div>
    </main>
  )
}
