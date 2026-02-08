#!/usr/bin/env npx tsx
/**
 * Hot2Content Digest Notifier
 * 
 * 读取 daily-digest.json，格式化为 Telegram 消息
 * 输出格式供 Clawdbot cron 使用
 */

import * as fs from 'fs'
import * as path from 'path'

interface Topic {
  id: string
  rank: number
  title: string
  summary: string
  score: number
  sources: Array<{
    tier: number
    name: string
    url: string
  }>
  urgency: string
}

interface DailyDigest {
  date: string
  generated_at: string
  topics: Topic[]
}

function formatDigestMessage(digest: DailyDigest): string {
  const date = new Date(digest.date).toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })

  let message = `🔥 **AI Newsletter - ${date}**\n\n`
  message += `今日 AI/Tech 热点 Top 10:\n\n`

  for (const topic of digest.topics) {
    const tierEmoji = topic.sources[0]?.tier === 1 ? '🏢' : 
                      topic.sources[0]?.tier === 3 ? '💻' : 
                      topic.sources[0]?.tier === 4 ? '📰' : '🐦'
    const urgencyEmoji = topic.urgency === 'high' ? '🔥' : ''
    
    // Truncate title for readability
    const shortTitle = topic.title.length > 60 
      ? topic.title.slice(0, 57) + '...' 
      : topic.title

    message += `**${topic.rank}.** ${tierEmoji} ${shortTitle} ${urgencyEmoji}\n`
    message += `   Score: ${topic.score} | ${topic.sources[0]?.name || 'Unknown'}\n\n`
  }

  message += `---\n`
  message += `🌐 查看完整列表: loreai.dev/newsletter\n`
  message += `\n回复数字 (1-10) 生成对应话题的博客文章`

  return message
}

function formatButtonData(digest: DailyDigest): Array<Array<{text: string, callback_data: string}>> {
  // Create 2 rows of 5 buttons each
  const buttons: Array<Array<{text: string, callback_data: string}>> = []
  
  const row1 = []
  const row2 = []
  
  for (const topic of digest.topics.slice(0, 5)) {
    row1.push({
      text: `${topic.rank}`,
      callback_data: `/hot2content topic:${topic.rank}`
    })
  }
  
  for (const topic of digest.topics.slice(5, 10)) {
    row2.push({
      text: `${topic.rank}`,
      callback_data: `/hot2content topic:${topic.rank}`
    })
  }
  
  if (row1.length > 0) buttons.push(row1)
  if (row2.length > 0) buttons.push(row2)
  
  return buttons
}

async function main() {
  const digestPath = path.join(process.cwd(), 'output', 'daily-digest.json')
  
  if (!fs.existsSync(digestPath)) {
    console.error('❌ daily-digest.json not found. Run daily-scout.ts first.')
    process.exit(1)
  }

  const digest: DailyDigest = JSON.parse(fs.readFileSync(digestPath, 'utf-8'))
  
  if (digest.topics.length === 0) {
    console.log('No topics found in digest.')
    process.exit(0)
  }

  const message = formatDigestMessage(digest)
  const buttons = formatButtonData(digest)

  // Output for Clawdbot
  console.log('=== MESSAGE ===')
  console.log(message)
  console.log('\n=== BUTTONS ===')
  console.log(JSON.stringify(buttons, null, 2))

  // Also save to file for cron job
  const notifyPath = path.join(process.cwd(), 'output', 'digest-notification.json')
  fs.writeFileSync(notifyPath, JSON.stringify({
    message,
    buttons,
    generated_at: new Date().toISOString()
  }, null, 2))

  console.log(`\n✅ Notification saved to ${notifyPath}`)
}

main().catch(console.error)

export { formatDigestMessage, formatButtonData }
