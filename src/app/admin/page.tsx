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

const SOURCE_BADGE_COLORS: Record<string, { bg: string; fg: string }> = {
  research: { bg: '#dbeafe', fg: '#1e40af' },
  news: { bg: '#fef3c7', fg: '#92400e' },
  paa: { bg: '#f3e8ff', fg: '#6b21a8' },
}

const FLAG_COLORS: Record<string, { bg: string; fg: string }> = {
  pass: { bg: '#dcfce7', fg: '#166534' },
  warn: { bg: '#fef3c7', fg: '#92400e' },
  fail: { bg: '#fecaca', fg: '#991b1b' },
}

const TYPE_BADGE_COLORS: Record<string, { bg: string; fg: string }> = {
  blog: { bg: '#dbeafe', fg: '#1e40af' },
  glossary: { bg: '#dcfce7', fg: '#166534' },
  faq: { bg: '#fef3c7', fg: '#92400e' },
  compare: { bg: '#f3e8ff', fg: '#6b21a8' },
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

function Badge({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: '9999px',
      fontSize: '11px', fontWeight: '600', backgroundColor: bg, color: fg,
    }}>
      {label}
    </span>
  )
}

// ─── Sections ────────────────────────────────────────────────────────────────

function HealthStrip({ data }: { data: DashboardData }) {
  const { pipelineHealth, keywordQuality, contentOutput } = data
  const { newsletter, seo, newsItems } = pipelineHealth
  const backlog = keywordQuality.byStatus['backlog'] || 0
  const bilingual = contentOutput.bilingualCoverage || { paired: 0, enOnly: 0, zhOnly: 0 }

  // Count today's content from dailyTrend
  const trend = data.dailyTrend || []
  const todayContent = trend.length > 0 ? trend[0].contentCount : 0

  return (
    <section style={{ marginBottom: '24px' }}>
      <div style={{
        ...card, padding: '12px 20px',
        display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap',
        fontSize: '13px', color: '#374151',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <StatusDot status={newsletter.lastRunStatus} />
          <span>Newsletter</span>
          <Check ok={newsletter.enPublished} />
          <Check ok={newsletter.zhPublished} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <StatusDot status={seo.lastRunStatus} />
          <span>SEO Pipeline</span>
        </div>
        <div style={{ borderLeft: '1px solid #e5e7eb', paddingLeft: '16px' }}>
          <strong>{newsItems.last24h}</strong> news (24h)
        </div>
        <div>
          <strong>{backlog}</strong> kw backlog
        </div>
        <div>
          <strong>{todayContent}</strong> content today
        </div>
        <div>
          <strong>{bilingual.paired}</strong> paired / <strong>{bilingual.enOnly + bilingual.zhOnly}</strong> unpaired
        </div>
        {(contentOutput.freshnessBacklog || 0) > 0 && (
          <div style={{ color: '#f59e0b' }}>
            <strong>{contentOutput.freshnessBacklog || 0}</strong> freshness signals
          </div>
        )}
      </div>

      {pipelineHealth.recentErrors.length > 0 && (
        <div style={{ marginTop: '8px', ...card, padding: '10px 20px', borderColor: '#fecaca', backgroundColor: '#fef2f2' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#991b1b', marginBottom: '4px' }}>Recent Errors</div>
          <pre style={{ fontSize: '11px', color: '#7f1d1d', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
            {pipelineHealth.recentErrors.slice(-5).join('\n')}
          </pre>
        </div>
      )}
    </section>
  )
}

function KeywordProvenance({ data }: { data: DashboardData['keywordProvenance'] }) {
  const sources = [
    { key: 'research', label: 'Research', stats: data.research, color: '#3b82f6' },
    { key: 'news', label: 'News', stats: data.news, color: '#f59e0b' },
  ] as const

  const paa = data.paa

  return (
    <section style={{ marginBottom: '40px' }}>
      <h2 style={sectionHeading}>Keyword Provenance</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {sources.map(({ key, label, stats, color }) => {
          const convRate = stats.total > 0 ? Math.round((stats.published / stats.total) * 100) : 0
          const barTotal = stats.total || 1
          const last7 = data.last7d[key]
          return (
            <div key={key} style={card}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>{label}</div>
              {/* Stacked bar */}
              <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', height: '20px', marginBottom: '8px' }}>
                <div title={`Published: ${stats.published}`} style={{ width: `${(stats.published / barTotal) * 100}%`, backgroundColor: '#22c55e', minWidth: stats.published > 0 ? '2px' : '0' }} />
                <div title={`Backlog: ${stats.backlog}`} style={{ width: `${(stats.backlog / barTotal) * 100}%`, backgroundColor: '#9ca3af', minWidth: stats.backlog > 0 ? '2px' : '0' }} />
                <div title={`Error: ${stats.error}`} style={{ width: `${(stats.error / barTotal) * 100}%`, backgroundColor: '#ef4444', minWidth: stats.error > 0 ? '2px' : '0' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#22c55e', display: 'inline-block' }} /> {stats.published}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#9ca3af', display: 'inline-block' }} /> {stats.backlog}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#ef4444', display: 'inline-block' }} /> {stats.error}</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>{stats.total}</div>
              <div style={statLabel}>total keywords</div>
              <div style={{ marginTop: '8px', fontSize: '13px', color: '#374151' }}>
                <strong>{convRate}%</strong> conversion rate
              </div>
              {stats.avgDaysToPublish !== null && (
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  ~{stats.avgDaysToPublish}d avg to publish
                </div>
              )}
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f3f4f6', fontSize: '12px', color: '#6b7280' }}>
                7d: +{last7.added} added, {last7.published} published
              </div>
            </div>
          )
        })}

        {/* PAA column */}
        <div style={card}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>PAA Questions</div>
          <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', height: '20px', marginBottom: '8px' }}>
            <div title={`Published: ${paa.published}`} style={{ width: `${(paa.published / (paa.total || 1)) * 100}%`, backgroundColor: '#22c55e', minWidth: paa.published > 0 ? '2px' : '0' }} />
            <div title={`Discovered: ${paa.discovered}`} style={{ width: `${(paa.discovered / (paa.total || 1)) * 100}%`, backgroundColor: '#a78bfa', minWidth: paa.discovered > 0 ? '2px' : '0' }} />
            <div title={`Duplicate: ${paa.duplicate}`} style={{ width: `${(paa.duplicate / (paa.total || 1)) * 100}%`, backgroundColor: '#d1d5db', minWidth: paa.duplicate > 0 ? '2px' : '0' }} />
            <div title={`Error: ${paa.error}`} style={{ width: `${(paa.error / (paa.total || 1)) * 100}%`, backgroundColor: '#ef4444', minWidth: paa.error > 0 ? '2px' : '0' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#6b7280', marginBottom: '12px', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#22c55e', display: 'inline-block' }} /> {paa.published}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#a78bfa', display: 'inline-block' }} /> {paa.discovered}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#d1d5db', display: 'inline-block' }} /> {paa.duplicate}</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>{paa.total}</div>
          <div style={statLabel}>total questions</div>
          <div style={{ marginTop: '8px', fontSize: '13px', color: '#374151' }}>
            <strong>{paa.total > 0 ? Math.round((paa.published / paa.total) * 100) : 0}%</strong> conversion rate
          </div>
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f3f4f6', fontSize: '12px', color: '#6b7280' }}>
            7d: +{data.last7d.paa.added} added, {data.last7d.paa.published} published
          </div>
        </div>
      </div>
    </section>
  )
}

function SampleReview({ data }: { data: DashboardData['sampleReview'] }) {
  if (data.days.length === 0) {
    return (
      <section style={{ marginBottom: '40px' }}>
        <h2 style={sectionHeading}>Sample Review</h2>
        <div style={{ ...card, textAlign: 'center', padding: '32px 24px', color: '#6b7280' }}>
          No keywords found in the last 7 days.
        </div>
      </section>
    )
  }

  return (
    <section style={{ marginBottom: '40px' }}>
      <h2 style={sectionHeading}>Sample Review <span style={{ fontSize: '14px', fontWeight: '400', color: '#9ca3af' }}>(last 7 days)</span></h2>
      {data.days.map((day, i) => {
        const qs = day.qualitySummary
        return (
          <details key={day.date} open={i === 0} style={{ marginBottom: '8px', ...card, padding: 0 }}>
            <summary style={{ padding: '12px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#111827', listStyle: 'none', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span>{i === 0 ? '\u25BC' : '\u25B6'} {day.date}</span>
              <span style={{ fontSize: '13px', fontWeight: '400', color: '#6b7280' }}>
                {day.items.length} keyword{day.items.length !== 1 ? 's' : ''}
              </span>
              {qs.total > 0 && (
                <span style={{ fontSize: '12px', fontWeight: '500', color: qs.flagged > 0 ? '#f59e0b' : '#22c55e' }}>
                  {qs.passed}/{qs.total} passed{qs.flagged > 0 ? `, ${qs.flagged} flagged` : ''}
                </span>
              )}
            </summary>
            <div style={{ padding: '0 20px 16px' }}>
              {day.items.map((item, j) => {
                const srcBadge = SOURCE_BADGE_COLORS[item.source] || { bg: '#f3f4f6', fg: '#374151' }
                return (
                  <div key={j} style={{ borderBottom: j < day.items.length - 1 ? '1px solid #f3f4f6' : 'none', padding: '12px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{item.keyword}</span>
                      {item.type && <Badge label={item.type} bg="#f3f4f6" fg="#374151" />}
                      <Badge label={item.source} bg={srcBadge.bg} fg={srcBadge.fg} />
                      {item.score !== null && (
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>score: {item.score}</span>
                      )}
                    </div>

                    {item.sourceNews.length > 0 && (
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>
                        {item.sourceNews.map((s, k) => (
                          <span key={k}>
                            <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>
                              {s.title.length > 60 ? s.title.slice(0, 60) + '...' : s.title}
                            </a>
                            {k < item.sourceNews.length - 1 ? ' | ' : ''}
                          </span>
                        ))}
                      </div>
                    )}

                    {item.content.length > 0 && (
                      <div style={{ marginTop: '8px', paddingLeft: '16px', borderLeft: '2px solid #e5e7eb' }}>
                        {item.content.map((ci, m) => (
                          <div key={m} style={{ marginBottom: m < item.content.length - 1 ? '8px' : 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                              <span style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>{ci.title}</span>
                              <span style={{ fontSize: '11px', color: '#6b7280' }}>{ci.language.toUpperCase()}</span>
                              {ci.tier && <span style={{ fontSize: '11px', color: '#6b7280' }}>T{ci.tier}</span>}
                              <span style={{ fontSize: '11px', color: '#9ca3af' }}>{ci.wordCount} words</span>
                            </div>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {ci.flags.map((flag, n) => {
                                const fc = FLAG_COLORS[flag.status]
                                return (
                                  <span
                                    key={n}
                                    title={flag.detail || flag.name}
                                    style={{
                                      display: 'inline-block', padding: '1px 6px', borderRadius: '4px',
                                      fontSize: '10px', fontWeight: '500', backgroundColor: fc.bg, color: fc.fg,
                                    }}
                                  >
                                    {flag.name}
                                  </span>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </details>
        )
      })}
    </section>
  )
}

function DailyTrend({ data }: { data: DashboardData['dailyTrend'] }) {
  if (data.length === 0) return null

  const maxContent = Math.max(...data.map(d => d.contentCount), 1)
  const maxKw = Math.max(...data.map(d => d.kwExtracted), 1)

  return (
    <section style={{ marginBottom: '40px' }}>
      <h2 style={sectionHeading}>Daily Trend <span style={{ fontSize: '14px', fontWeight: '400', color: '#9ca3af' }}>(14 days)</span></h2>
      <div style={card}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '12px', color: '#6b7280' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '12px', height: '8px', borderRadius: '2px', backgroundColor: '#3b82f6', display: 'inline-block' }} /> Content</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '12px', height: '8px', borderRadius: '2px', backgroundColor: '#a78bfa', display: 'inline-block' }} /> KW Extracted</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '12px', height: '8px', borderRadius: '2px', backgroundColor: '#22c55e', display: 'inline-block' }} /> Quality Pass %</span>
        </div>
        {data.map((day, i) => (
          <div key={day.date} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', color: '#6b7280', width: '62px', textAlign: 'right', flexShrink: 0 }}>
              {day.date.slice(5)}
            </span>
            <div style={{ flex: 1, display: 'flex', gap: '2px', alignItems: 'center', height: '18px' }}>
              {/* Content count bar */}
              <div
                title={`${day.contentCount} content`}
                style={{
                  width: `${(day.contentCount / maxContent) * 40}%`,
                  height: '14px', borderRadius: '3px',
                  backgroundColor: '#3b82f6', minWidth: day.contentCount > 0 ? '3px' : '0',
                }}
              />
              {/* KW extracted bar */}
              <div
                title={`${day.kwExtracted} kw extracted`}
                style={{
                  width: `${(day.kwExtracted / maxKw) * 40}%`,
                  height: '14px', borderRadius: '3px',
                  backgroundColor: '#a78bfa', minWidth: day.kwExtracted > 0 ? '3px' : '0',
                }}
              />
              {/* Quality pass rate indicator */}
              {day.contentCount > 0 && (
                <span style={{
                  fontSize: '10px', fontWeight: '600', marginLeft: '4px',
                  color: day.qualityPassRate >= 80 ? '#22c55e' : day.qualityPassRate >= 50 ? '#f59e0b' : '#ef4444',
                }}>
                  {day.qualityPassRate}%
                </span>
              )}
            </div>
            <span style={{ fontSize: '11px', color: '#9ca3af', width: '50px', textAlign: 'right', flexShrink: 0 }}>
              {day.contentCount}c / {day.kwExtracted}k
            </span>
          </div>
        ))}
      </div>
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

function KeywordQuality({ data }: { data: DashboardData['keywordQuality'] }) {
  const { byStatus, byLanguage, volumeDistribution, difficultyDistribution, top20, staleBacklogCount, total } = data
  const byType = data.byType || {}
  const enrichmentCoverage = data.enrichmentCoverage || { enriched: 0, unenriched: 0 }

  // Colored status bar
  const statusEntries = Object.entries(byStatus).sort((a, b) => b[1] - a[1])
  const barTotal = statusEntries.reduce((sum, [, c]) => sum + c, 0) || 1

  return (
    <section style={{ marginBottom: '40px' }}>
      <h2 style={sectionHeading}>Keyword Health <span style={{ fontSize: '14px', fontWeight: '400', color: '#9ca3af' }}>({total} total)</span></h2>

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
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>By Type</div>
          {Object.entries(byType).map(([t, c]) => (
            <div key={t} style={{ fontSize: '14px', color: '#111827' }}>{t}: {c}</div>
          ))}
        </div>
        <div style={card}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>Enrichment</div>
          <div style={{ fontSize: '14px', color: '#111827' }}>Enriched: {enrichmentCoverage.enriched}</div>
          <div style={{ fontSize: '14px', color: '#111827' }}>Unenriched: {enrichmentCoverage.unenriched}</div>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function ContentOutput({ data }: { data: DashboardData['contentOutput'] }) {
  const { byType, byTier, publishedLast7d, publishedLast30d, seoScoreDistribution, enArticles, zhArticles, newsletterStreak } = data
  const bilingualCoverage = data.bilingualCoverage || { paired: 0, enOnly: 0, zhOnly: 0 }
  const freshnessBacklog = data.freshnessBacklog || 0
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

      {/* By type + by tier + bilingual */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
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
        <div style={card}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>Bilingual Coverage</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px', borderBottom: '1px solid #f3f4f6' }}>
            <span style={{ color: '#374151' }}>Paired (EN+ZH)</span>
            <span style={{ fontWeight: '600', color: '#22c55e' }}>{bilingualCoverage.paired}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px', borderBottom: '1px solid #f3f4f6' }}>
            <span style={{ color: '#374151' }}>EN only</span>
            <span style={{ fontWeight: '600', color: '#f59e0b' }}>{bilingualCoverage.enOnly}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px', borderBottom: '1px solid #f3f4f6' }}>
            <span style={{ color: '#374151' }}>ZH only</span>
            <span style={{ fontWeight: '600', color: '#f59e0b' }}>{bilingualCoverage.zhOnly}</span>
          </div>
          {freshnessBacklog > 0 && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#f59e0b' }}>
              {freshnessBacklog} freshness signal{freshnessBacklog !== 1 ? 's' : ''} pending
            </div>
          )}
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

        {/* 1. Health Strip */}
        <HealthStrip data={data} />

        {/* 2. Keyword Provenance */}
        {data.keywordProvenance && <KeywordProvenance data={data.keywordProvenance} />}

        {/* 3. Sample Review */}
        {data.sampleReview && <SampleReview data={data.sampleReview} />}

        {/* 4. Daily Trend */}
        {data.dailyTrend && <DailyTrend data={data.dailyTrend} />}

        {/* 5. Keyword Health */}
        <KeywordQuality data={data.keywordQuality} />

        {/* 6. Content Output */}
        <ContentOutput data={data.contentOutput} />

        <footer style={{ textAlign: 'center', marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #e5e7eb', color: '#9ca3af', fontSize: '13px' }}>
          Internal dashboard. Refreshes after each cron run.
        </footer>
      </div>
    </main>
  )
}
