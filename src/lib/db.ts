/**
 * LoreAI SQLite Database Layer
 * Schema from PRD §16
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'loreai.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  
  // Ensure data directory exists
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  return _db;
}

export function initSchema(db: Database.Database): void {
  db.exec(`
    -- 1. 原始新闻采集
    CREATE TABLE IF NOT EXISTS news_items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT UNIQUE NOT NULL,
      source TEXT,
      source_tier INTEGER,
      category TEXT,
      score INTEGER,
      score_breakdown TEXT,
      raw_summary TEXT,
      detected_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. 内容（newsletter + 博客 + 未来 SEO 文章）
    CREATE TABLE IF NOT EXISTS content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      slug TEXT UNIQUE,
      body_markdown TEXT,
      language TEXT,
      status TEXT DEFAULT 'draft',
      source_type TEXT,
      seo_title TEXT,
      seo_description TEXT,
      seo_score INTEGER,
      hreflang_pair_id INTEGER REFERENCES content(id),
      published_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. 内容 ↔ 新闻关联（多对多）
    CREATE TABLE IF NOT EXISTS content_sources (
      content_id INTEGER REFERENCES content(id),
      news_item_id TEXT REFERENCES news_items(id),
      PRIMARY KEY (content_id, news_item_id)
    );

    -- 4. 关键词策略
    CREATE TABLE IF NOT EXISTS keywords (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword TEXT NOT NULL,
      keyword_zh TEXT,
      type TEXT,
      search_volume INTEGER,
      difficulty INTEGER,
      score INTEGER,
      status TEXT DEFAULT 'backlog',
      content_id INTEGER REFERENCES content(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 5. 分发记录
    CREATE TABLE IF NOT EXISTS distributions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_id INTEGER REFERENCES content(id),
      channel TEXT,
      format TEXT,
      channel_url TEXT,
      distributed_at DATETIME
    );

    -- 6. 调研 & Core Narrative
    CREATE TABLE IF NOT EXISTS research (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_id INTEGER REFERENCES content(id),
      topic_json TEXT,
      research_report TEXT,
      core_narrative TEXT,
      seo_review TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 7. 话题索引（替代 topic-index.json）
    CREATE TABLE IF NOT EXISTS topic_index (
      topic_id TEXT PRIMARY KEY,
      title TEXT,
      date DATE,
      keywords TEXT,
      urls_covered TEXT,
      slug TEXT,
      status TEXT,
      seo_score INTEGER
    );

    -- 8. PAA questions (from Brave Search mining)
    CREATE TABLE IF NOT EXISTS paa_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT UNIQUE NOT NULL,
      question_zh TEXT,
      source_keyword TEXT,
      source_query TEXT,
      result_count INTEGER,
      status TEXT DEFAULT 'discovered',
      content_id INTEGER REFERENCES content(id),
      discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 9. Freshness signals (news → existing content matches)
    CREATE TABLE IF NOT EXISTS freshness_signals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_slug TEXT NOT NULL,
      content_type TEXT NOT NULL,
      news_item_id TEXT REFERENCES news_items(id),
      match_score REAL,
      status TEXT DEFAULT 'detected',
      detected_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Add columns if missing (ALTER TABLE is idempotent via try/catch below)

    -- Indexes for common queries
    CREATE INDEX IF NOT EXISTS idx_news_items_detected_at ON news_items(detected_at);
    CREATE INDEX IF NOT EXISTS idx_news_items_url ON news_items(url);
    CREATE INDEX IF NOT EXISTS idx_content_type ON content(type);
    CREATE INDEX IF NOT EXISTS idx_content_slug ON content(slug);
  `);

  // Add columns that may not exist yet (idempotent)
  const alterStatements = [
    `ALTER TABLE keywords ADD COLUMN search_intent TEXT`,
    `ALTER TABLE keywords ADD COLUMN parent_research_id INTEGER REFERENCES research(id)`,
    `ALTER TABLE keywords ADD COLUMN language TEXT DEFAULT 'en'`,
  ];
  for (const sql of alterStatements) {
    try { db.exec(sql); } catch { /* column already exists */ }
  }
}

/**
 * Insert a news item (upsert on url conflict)
 */
export function insertNewsItem(db: Database.Database, item: {
  id: string;
  title: string;
  url: string;
  source?: string;
  source_tier?: number;
  category?: string;
  score?: number;
  score_breakdown?: string;
  raw_summary?: string;
  detected_at?: string;
}): void {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO news_items (id, title, url, source, source_tier, category, score, score_breakdown, raw_summary, detected_at)
    VALUES (@id, @title, @url, @source, @source_tier, @category, @score, @score_breakdown, @raw_summary, @detected_at)
  `);
  stmt.run({
    id: item.id,
    title: item.title,
    url: item.url,
    source: item.source ?? null,
    source_tier: item.source_tier ?? null,
    category: item.category ?? null,
    score: item.score ?? null,
    score_breakdown: item.score_breakdown ?? null,
    raw_summary: item.raw_summary ?? null,
    detected_at: item.detected_at ?? new Date().toISOString(),
  });
}

/**
 * Bulk insert news items
 */
export function insertNewsItems(db: Database.Database, items: Array<Parameters<typeof insertNewsItem>[1]>): void {
  const tx = db.transaction((items: Array<Parameters<typeof insertNewsItem>[1]>) => {
    for (const item of items) {
      insertNewsItem(db, item);
    }
  });
  tx(items);
}

/**
 * Get URLs from recent news items (for cross-day dedup)
 */
export function getRecentUrls(db: Database.Database, days: number = 3): Set<string> {
  const rows = db.prepare(
    `SELECT url FROM news_items WHERE detected_at > datetime('now', '-' || ? || ' days')`
  ).all(days) as { url: string }[];
  return new Set(rows.map(r => r.url));
}

/**
 * Insert content (newsletter, blog, etc.)
 */
export function insertContent(db: Database.Database, content: {
  type: string;
  title: string;
  slug?: string;
  body_markdown?: string;
  language?: string;
  status?: string;
  source_type?: string;
  published_at?: string;
}): number {
  const stmt = db.prepare(`
    INSERT INTO content (type, title, slug, body_markdown, language, status, source_type, published_at)
    VALUES (@type, @title, @slug, @body_markdown, @language, @status, @source_type, @published_at)
  `);
  const result = stmt.run({
    type: content.type,
    title: content.title,
    slug: content.slug ?? null,
    body_markdown: content.body_markdown ?? null,
    language: content.language ?? null,
    status: content.status ?? 'draft',
    source_type: content.source_type ?? 'auto',
    published_at: content.published_at ?? new Date().toISOString(),
  });
  return Number(result.lastInsertRowid);
}

/**
 * Link content to news items
 */
export function linkContentSources(db: Database.Database, contentId: number, newsItemIds: string[]): void {
  const stmt = db.prepare(`INSERT OR IGNORE INTO content_sources (content_id, news_item_id) VALUES (?, ?)`);
  const tx = db.transaction((ids: string[]) => {
    for (const id of ids) {
      stmt.run(contentId, id);
    }
  });
  tx(newsItemIds);
}

/**
 * Insert research data
 */
export function insertResearch(db: Database.Database, research: {
  content_id?: number;
  topic_json?: string;
  research_report?: string;
  core_narrative?: string;
  seo_review?: string;
}): number {
  const stmt = db.prepare(`
    INSERT INTO research (content_id, topic_json, research_report, core_narrative, seo_review)
    VALUES (@content_id, @topic_json, @research_report, @core_narrative, @seo_review)
  `);
  const result = stmt.run({
    content_id: research.content_id ?? null,
    topic_json: research.topic_json ?? null,
    research_report: research.research_report ?? null,
    core_narrative: research.core_narrative ?? null,
    seo_review: research.seo_review ?? null,
  });
  return Number(result.lastInsertRowid);
}

/**
 * Upsert topic index entry
 */
export function upsertTopicIndex(db: Database.Database, topic: {
  topic_id: string;
  title: string;
  date: string;
  keywords?: string[];
  urls_covered?: string[];
  slug?: string;
  status?: string;
  seo_score?: number;
}): void {
  const stmt = db.prepare(`
    INSERT INTO topic_index (topic_id, title, date, keywords, urls_covered, slug, status, seo_score)
    VALUES (@topic_id, @title, @date, @keywords, @urls_covered, @slug, @status, @seo_score)
    ON CONFLICT(topic_id) DO UPDATE SET
      title = @title, date = @date, keywords = @keywords, urls_covered = @urls_covered,
      slug = @slug, status = @status, seo_score = @seo_score
  `);
  stmt.run({
    topic_id: topic.topic_id,
    title: topic.title,
    date: topic.date,
    keywords: topic.keywords ? JSON.stringify(topic.keywords) : null,
    urls_covered: topic.urls_covered ? JSON.stringify(topic.urls_covered) : null,
    slug: topic.slug ?? null,
    status: topic.status ?? null,
    seo_score: topic.seo_score ?? null,
  });
}

/**
 * Get recent news items with full fields (for newsletter writing)
 */
export function getRecentItemsFull(db: Database.Database, hours: number = 72): Array<{
  id: string;
  title: string;
  url: string;
  source: string;
  source_tier: number;
  category: string;
  score: number;
  raw_summary: string;
  detected_at: string;
}> {
  const rows = db.prepare(
    `SELECT id, title, url, source, source_tier, category, score, raw_summary, detected_at
     FROM news_items
     WHERE detected_at > datetime('now', '-' || ? || ' hours')
     ORDER BY detected_at DESC`
  ).all(hours) as Array<{
    id: string;
    title: string;
    url: string;
    source: string;
    source_tier: number;
    category: string;
    score: number;
    raw_summary: string;
    detected_at: string;
  }>;
  return rows;
}

/**
 * Insert a keyword into the keywords table (idempotent on keyword text)
 */
export function insertKeyword(db: Database.Database, kw: {
  keyword: string;
  keyword_zh?: string;
  type?: string;
  score?: number;
  status?: string;
  search_intent?: string;
  language?: string;
}): void {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO keywords (keyword, keyword_zh, type, score, status, search_intent, language)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    kw.keyword,
    kw.keyword_zh ?? null,
    kw.type ?? null,
    kw.score ?? null,
    kw.status ?? 'backlog',
    kw.search_intent ?? null,
    kw.language ?? 'en',
  );
}

/**
 * Get keywords with status='backlog', ordered by score descending
 */
export function getKeywordBacklog(db: Database.Database, limit: number = 20): Array<{
  id: number;
  keyword: string;
  keyword_zh: string | null;
  type: string | null;
  score: number | null;
  search_volume: number | null;
  difficulty: number | null;
  search_intent: string | null;
  language: string;
}> {
  return db.prepare(
    `SELECT id, keyword, keyword_zh, type, score, search_volume, difficulty, search_intent, language
     FROM keywords WHERE status = 'backlog'
     ORDER BY score DESC, id
     LIMIT ?`
  ).all(limit) as any[];
}

/**
 * Insert a PAA question (idempotent on question text)
 */
export function insertPAAQuestion(db: Database.Database, q: {
  question: string;
  question_zh?: string;
  source_keyword: string;
  source_query: string;
  result_count?: number;
}): void {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO paa_questions (question, question_zh, source_keyword, source_query, result_count)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(
    q.question,
    q.question_zh ?? null,
    q.source_keyword,
    q.source_query,
    q.result_count ?? null,
  );
}

/**
 * Get discovered PAA questions not yet turned into content
 */
export function getDiscoveredPAAQuestions(db: Database.Database, limit: number = 20): Array<{
  id: number;
  question: string;
  question_zh: string | null;
  source_keyword: string;
  result_count: number | null;
}> {
  return db.prepare(
    `SELECT id, question, question_zh, source_keyword, result_count
     FROM paa_questions WHERE status = 'discovered'
     ORDER BY result_count DESC, id
     LIMIT ?`
  ).all(limit) as any[];
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}
