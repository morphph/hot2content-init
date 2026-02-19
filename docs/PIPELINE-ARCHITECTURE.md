# LoreAI Pipeline Architecture

> Last updated: 2026-02-19

## Overview: Dual-Track Content Strategy

LoreAI 采用双轨内容策略，共享同一个 SQLite 数据层 (`loreai.db`)，由三个 cron 作业驱动，产出六种内容类型。

- **Track A (品牌深度):** 人工选题 → Gemini Deep Research → Core Narrative → Claude Opus 双语博客。每周 1-2 篇 Tier 1。
- **Track B (SEO 长尾):** 自动从 news_items 提取关键词 → 按类型路由生成 → PAA 问题挖掘 → 内容新鲜度更新 → git push 发布。每天 5-10 篇。
- **Newsletter:** 每日新闻聚合 → 智能筛选 → 双语 AI 简报。

## 整体架构图

```mermaid
flowchart TB
    subgraph DATA["🔍 数据采集层 (collect-news.ts)"]
        TW["Twitter/X<br/>30+ 账号 + 关键词搜索"]
        HF["HuggingFace Blog<br/>≥30 likes"]
        HN["Hacker News<br/>AI/ML 相关"]
        GH["GitHub Trending<br/>3种搜索策略"]
        BLOG["官方博客<br/>Anthropic/OpenAI/Google/Meta"]
        RD["Reddit<br/>4个 AI 子版块"]
        CL["OpenAI Changelog<br/>API 更新追踪"]

        TW & HF & HN & GH & BLOG & RD & CL --> COLLECT["collect-news.ts<br/>🕐 UTC 22:00"]
        COLLECT --> DB[(SQLite: loreai.db<br/>news_items<br/>去重 + 评分)]
    end

    subgraph NEWSLETTER["📰 Newsletter Pipeline (daily-newsletter.sh · UTC 23:00)"]
        direction TB
        FRESH_DET["freshness-detector.ts<br/>新闻 ↔ 博客匹配"] --> FRESH_DB[(freshness_signals)]
        DB_READ[(news_items<br/>72h)] --> AGENT_FILTER["Agent Filter<br/>Claude Opus CLI<br/>语义筛选 20-25 条"]
        AGENT_FILTER --> NL_EN["write-newsletter.ts<br/>EN Newsletter"]
        AGENT_FILTER --> NL_ZH["write-newsletter.ts<br/>ZH Newsletter"]
        NL_EN & NL_ZH --> GIT_NL["git push<br/>→ Vercel"]
    end

    subgraph TRACKA["🅰️ Track A: 品牌内容 (手动 · /hot2content)"]
        direction TB
        TOPIC["人工选题"] --> RESEARCH["Gemini 2.5 Pro<br/>Deep Research<br/>10-20 分钟"]
        RESEARCH --> NARRATIVE["Claude Opus<br/>Core Narrative<br/>(纯英文 JSON)"]
        NARRATIVE --> WRITER_EN["Claude Opus (EN)<br/>skills/blog-en/"]
        NARRATIVE --> WRITER_ZH["Claude Opus (ZH)<br/>skills/blog-zh/"]
        RESEARCH --> WRITER_EN
        RESEARCH --> WRITER_ZH
        WRITER_EN --> T1_EN["Tier 1 博客 (EN)<br/>content/blogs/en/"]
        WRITER_ZH --> T1_ZH["Tier 1 博客 (ZH)<br/>content/blogs/zh/"]
    end

    subgraph TRACKB["🅱️ Track B: SEO 自动化 (daily-seo.sh · UTC 02:00)"]
        direction TB
        DB3[(news_items<br/>48h)] --> S1["Step 1: seo-pipeline.ts<br/>关键词提取 → 内容生成"]
        S1 --> KW_DB[(keywords)]
        KW_DB --> S2["Step 2: keyword-enricher.ts<br/>Brave Search 搜索量"]
        KW_DB --> S3["Step 3: paa-miner.ts<br/>Brave Search PAA 挖掘"]
        S3 --> PAA_DB[(paa_questions)]
        PAA_DB --> S4["Step 4: generate-paa-faq.ts<br/>Brave 事实验证 → FAQ 生成"]
        FRESH_DB2[(freshness_signals)] --> S5["Step 5: content-updater.ts<br/>内容新鲜度更新"]
        S6["Step 6: export-timeline-data.ts<br/>时间线 JSON 导出"]
        S4 & S5 & S6 --> GIT_SEO["Step 7: git push<br/>→ Vercel"]
    end

    subgraph PUBLISH["📦 发布层 (Next.js SSG · Vercel)"]
        BLOG_PAGE["/blog<br/>Tier 1/2/3"]
        FAQ_PAGE["/faq<br/>FAQPage Schema"]
        GLOSS_PAGE["/glossary<br/>DefinedTerm Schema"]
        COMP_PAGE["/compare<br/>对比分析"]
        NL_PAGE["/newsletter<br/>每日简报"]
        TL_PAGE["/timeline<br/>话题时间线"]
        TOPIC_PAGE["/topics<br/>话题聚合页"]
        RES_PAGE["/resources<br/>Tier 2/3 索引"]
    end

    subgraph SEO["🔗 SEO + AEO 层"]
        SITEMAP["sitemap.xml<br/>分层优先级"]
        NEWS_SM["news-sitemap.xml<br/>Google News 协议"]
        LLMS["llms.txt<br/>AEO (LLM 爬虫)"]
        JSONLD["JSON-LD<br/>Article · FAQPage<br/>DefinedTerm · BreadcrumbList<br/>ItemList"]
        GLOSSLINK["自动术语链接<br/>blog.ts:linkGlossaryTerms()"]
    end

    DB --> DB_READ
    DB --> FRESH_DET
    DB --> DB3
    FRESH_DET -.-> FRESH_DB2

    style DATA fill:#e0f2fe,stroke:#3b82f6,color:#1e293b
    style NEWSLETTER fill:#ccfbf1,stroke:#14b8a6,color:#1e293b
    style TRACKA fill:#ede9fe,stroke:#a855f7,color:#1e293b
    style TRACKB fill:#dcfce7,stroke:#22c55e,color:#1e293b
    style PUBLISH fill:#ffedd5,stroke:#f97316,color:#1e293b
    style SEO fill:#e0e7ff,stroke:#6366f1,color:#1e293b
```

## Cron 作业 — 三条流水线

### 流水线 1: daily-newsletter.sh (UTC 22:00 采集 / UTC 23:00 生成)

```mermaid
flowchart LR
    C1["Step 1<br/>collect-news.ts<br/>7个数据源<br/>去重入库"] --> C2["Step 2<br/>freshness-detector.ts<br/>新闻↔博客关键词匹配<br/>→ freshness_signals"]
    C2 --> C3["Step 3<br/>write-newsletter.ts<br/>72h DB → Agent Filter<br/>→ EN/ZH Newsletter<br/>→ git push"]

    style C1 fill:#e0f2fe,stroke:#3b82f6,color:#1e293b
    style C2 fill:#dcfce7,stroke:#22c55e,color:#1e293b
    style C3 fill:#ede9fe,stroke:#a855f7,color:#1e293b
```

- Step 1 失败 → 整个流水线退出
- Step 2 失败 → 继续（non-fatal）
- Step 3 包含 git add + commit + push

### 流水线 2: daily-seo.sh (UTC 02:00)

```mermaid
flowchart LR
    S1["Step 1<br/>seo-pipeline.ts<br/>新闻→关键词→内容"] --> S2["Step 2<br/>keyword-enricher.ts<br/>Brave 搜索量"]
    S2 --> S3["Step 3<br/>paa-miner.ts<br/>Brave PAA 挖掘"]
    S3 --> S4["Step 4<br/>generate-paa-faq.ts<br/>Brave事实验证→FAQ"]
    S4 --> S5["Step 5<br/>content-updater.ts<br/>新鲜度更新"]
    S5 --> S6["Step 6<br/>export-timeline-data.ts<br/>时间线JSON"]
    S6 --> S7["Step 7<br/>git push<br/>content/ only"]

    style S1 fill:#e0f2fe,stroke:#3b82f6,color:#1e293b
    style S2 fill:#dcfce7,stroke:#22c55e,color:#1e293b
    style S3 fill:#ede9fe,stroke:#a855f7,color:#1e293b
    style S4 fill:#ffedd5,stroke:#f97316,color:#1e293b
    style S5 fill:#ccfbf1,stroke:#14b8a6,color:#1e293b
    style S6 fill:#fef9c3,stroke:#eab308,color:#1e293b
    style S7 fill:#fecdd3,stroke:#f43f5e,color:#1e293b
```

- Step 1 失败 → 整个流水线退出
- Steps 2-6 失败 → 继续（non-fatal，|| echo warning）
- Step 7: `git add content/` → 只提交 content/ 目录（不含 output/、logs/、loreai.db）

### 流水线 3: /hot2content (手动触发)

```
Step 1: trend-scout (Sonnet) → input/topic.json
Step 2: dedup-checker (Haiku) → PASS/UPDATE/SKIP
Step 3: researcher (Sonnet) → Gemini Deep Research → output/research-report.md
Step 4: narrative-architect (Opus) → output/core-narrative.json (纯英文)
Step 5: writer-en + writer-zh (Opus, 并行) → output/blog-en.md + blog-zh.md
Step 6: seo-reviewer (Sonnet) → output/seo-review.md
Step 7: 更新 output/topic-index.json
Step 8: 汇总报告
```

## Track A vs Track B 详细对比

```mermaid
flowchart LR
    subgraph A["Track A: 品牌深度"]
        A1["触发: 手动选题"]
        A2["调研: Gemini 2.5 Pro Deep Research<br/>~$1/篇, 10-20分钟"]
        A3["写作: Claude Opus<br/>双输入(Research+Narrative)"]
        A4["产出: Tier 1 深度文章<br/>EN 1500-2500词 / ZH 2000-3000字"]
        A1 --> A2 --> A3 --> A4
    end

    subgraph B["Track B: SEO 长尾"]
        B1["触发: Cron UTC 02:00"]
        B2["数据: news_items(48h)<br/>+ keywords + paa_questions"]
        B3["生成: Claude CLI + Brave 事实验证<br/>5种内容类型"]
        B4["产出: Glossary/Compare/FAQ/Tier2/Tier3<br/>300-2500词, 双语"]
        B1 --> B2 --> B3 --> B4
    end

    style A fill:#ede9fe,stroke:#a855f7,color:#1e293b
    style B fill:#dcfce7,stroke:#22c55e,color:#1e293b
```

| 维度 | Track A | Track B |
|------|---------|---------|
| 触发方式 | 手动 (`/hot2content`) | 自动 Cron |
| 调研 | Gemini 2.5 Pro Deep Research | news_items 48h 窗口 |
| 写作模型 | Claude Opus (via subagents) | Claude via `claude -p` CLI |
| 事实验证 | 深度调研本身 | Brave Search 预取 |
| 产出 | Tier 1 深度文章 | Glossary/Compare/FAQ/Tier2/Tier3 |
| 字数 | EN 1500-2500 / ZH 2000-3000 | 300-2500 (按类型) |
| 频率 | 每周 1-2 篇 | 每天 5-10 篇 |
| 成本 | ~$1/篇 (Gemini) | 免费 (Claude Max + Brave Free) |
| 目标 | 品牌权威 + E-E-A-T | 搜索流量 + 长尾覆盖 |

## 数据库 Schema (9 张表)

```mermaid
erDiagram
    news_items {
        TEXT id PK
        TEXT title
        TEXT url UK
        TEXT source
        INT source_tier
        TEXT category
        INT score
        TEXT raw_summary
        DATETIME detected_at
    }

    keywords {
        INT id PK
        TEXT keyword
        TEXT keyword_zh
        TEXT type
        INT search_volume
        INT difficulty
        INT score
        TEXT status
        TEXT search_intent
        TEXT language
    }

    paa_questions {
        INT id PK
        TEXT question UK
        TEXT question_zh
        TEXT source_keyword
        INT result_count
        TEXT status
        DATETIME discovered_at
    }

    freshness_signals {
        INT id PK
        TEXT content_slug
        TEXT content_type
        TEXT news_item_id FK
        REAL match_score
        TEXT status
    }

    content {
        INT id PK
        TEXT type
        TEXT title
        TEXT slug UK
        TEXT language
        TEXT status
        INT hreflang_pair_id
    }

    research {
        INT id PK
        INT content_id FK
        TEXT core_narrative
        TEXT research_report
    }

    topic_index {
        TEXT topic_id PK
        TEXT title
        DATE date
        TEXT slug
        INT seo_score
    }

    news_items ||--o{ freshness_signals : "triggers"
    news_items ||--o{ content_sources : "cited in"
    content ||--o{ content_sources : "cites"
    keywords ||--o{ paa_questions : "source_keyword"
    content ||--o| research : "has"
```

### 关键状态流转

| 表 | 字段 | 流转 |
|----|------|------|
| `keywords` | `status` | `backlog` → `used` (被 seo-pipeline 消费后) |
| `paa_questions` | `status` | `discovered` → `published` / `duplicate` / `error` |
| `freshness_signals` | `status` | `detected` → `processed` / `skipped` |
| `content` | `status` | `draft` → `published` |

## SEO Pipeline: 关键词到内容的路由

```mermaid
flowchart TD
    NEWS["48h 内新闻<br/>(news_items)"] --> EXTRACT["Step 1: seo-pipeline.ts<br/>Claude Opus 提取 10-15 个关键词"]

    EXTRACT --> KW_LIST["关键词列表<br/>keyword, type, relevance,<br/>newness, category, news_ids"]

    KW_LIST --> DEDUP{"去重检查<br/>slug + title"}
    DEDUP -->|"已存在"| SKIP["跳过"]
    DEDUP -->|"全新"| BRAVE{"Brave Search<br/>验证搜索需求"}

    BRAVE -->|"有结果"| TYPE{"type 路由"}
    BRAVE -->|"无结果"| SKIP2["跳过"]
    BRAVE -->|"API 错误"| TYPE

    TYPE -->|"glossary"| G["📖 Glossary<br/>300-500词<br/>content/glossary/"]
    TYPE -->|"compare"| C["⚖️ Compare<br/>800-1500词<br/>content/compare/"]
    TYPE -->|"faq"| F["❓ FAQ<br/>10个Q&A<br/>content/faq/"]
    TYPE -->|"tier2"| T2["📊 Tier 2<br/>1500-2500词<br/>content/blogs/"]
    TYPE -->|"tier3"| T3["⚡ Tier 3<br/>800-1200词<br/>content/blogs/"]

    G & C & F & T2 & T3 --> VALIDATE["Frontmatter 验证"]
    VALIDATE --> DB_KW["关键词持久化<br/>→ keywords 表"]

    style NEWS fill:#e0f2fe,stroke:#3b82f6,color:#1e293b
    style TYPE fill:#ede9fe,stroke:#a855f7,color:#1e293b
    style VALIDATE fill:#dcfce7,stroke:#22c55e,color:#1e293b
```

### 多样性控制规则

| 规则 | 约束 |
|------|------|
| 公司多样性 | 同一公司最多 5 个关键词，至少覆盖 3 家 |
| 类别配额 | models: 2-3, tools: 2-3, infra: 1-2, opensource: 1-2, applications: 1-2, safety: 0-1 |
| 类型混合 | glossary + compare + faq + tier2 + tier3 |
| 评分排序 | `relevance × newness` 降序，取前 10 |

## PAA 问题挖掘 → FAQ 生成

```mermaid
flowchart LR
    subgraph Mine["paa-miner.ts (Step 3)"]
        TOPICS["话题来源<br/>topic-clusters.json<br/>+ 博客关键词<br/>+ 术语表"] --> BRAVE_Q["Brave Search<br/>3种查询模板/话题<br/>~60 calls/run"]
        BRAVE_Q --> EXTRACT_Q["提取问题<br/>标题含问号/疑问词<br/>+ Brave FAQ 区"]
        EXTRACT_Q --> PAA_DB[(paa_questions<br/>status: discovered)]
    end

    subgraph Generate["generate-paa-faq.ts (Step 4)"]
        PAA_DB2[(paa_questions<br/>discovered, limit 5)] --> DEDUP_FAQ{"去重<br/>vs content/faq/"}
        DEDUP_FAQ -->|"新问题"| BRAVE_GROUND["Brave Search<br/>预取5条结果<br/>事实验证上下文"]
        BRAVE_GROUND --> CLAUDE_EN["Claude CLI<br/>EN FAQ<br/>含 Grounding Sources"]
        BRAVE_GROUND --> CLAUDE_ZH["Claude CLI<br/>ZH FAQ<br/>含参考资料"]
        CLAUDE_EN --> FAQ_EN["content/faq/<br/>{slug}-en.md"]
        CLAUDE_ZH --> FAQ_ZH["content/faq/<br/>{slug}-zh.md"]
    end

    PAA_DB -.-> PAA_DB2

    style Mine fill:#dcfce7,stroke:#22c55e,color:#1e293b
    style Generate fill:#ede9fe,stroke:#a855f7,color:#1e293b
```

## 内容新鲜度更新

```mermaid
flowchart LR
    NEWS_NEW["新 news_items<br/>(48h)"] --> DETECT["freshness-detector.ts<br/>关键词双向匹配<br/>≥2 matches → signal"]
    DETECT --> SIGNALS[(freshness_signals<br/>status: detected)]
    SIGNALS --> UPDATE["content-updater.ts<br/>Claude CLI 生成<br/>200-300词更新段落"]
    UPDATE --> BLOG["追加到现有博客<br/>+ 更新 frontmatter<br/>updated: date"]

    style NEWS_NEW fill:#e0f2fe,stroke:#3b82f6,color:#1e293b
    style SIGNALS fill:#ffedd5,stroke:#f97316,color:#1e293b
    style UPDATE fill:#dcfce7,stroke:#22c55e,color:#1e293b
```

## 数据流: 从新闻到页面

```mermaid
flowchart LR
    subgraph Sources["7 个数据源"]
        S1["Twitter/X<br/>30+ 账号"]
        S2["HF Blog<br/>≥30 likes"]
        S3["Hacker News"]
        S4["GitHub Search<br/>3种策略"]
        S5["官方博客<br/>5家"]
        S6["Reddit<br/>4个子版块"]
        S7["OpenAI Changelog"]
    end

    subgraph DB["SQLite (9 张表)"]
        NEWS["news_items"]
        KW["keywords"]
        PAA["paa_questions"]
        FRESH["freshness_signals"]
        CONTENT["content"]
    end

    subgraph Output["内容产出 (content/)"]
        NL["📰 Newsletter<br/>newsletters/{en,zh}/"]
        T1["🔬 Tier 1 Blog<br/>blogs/{en,zh}/"]
        T23["📝 Tier 2/3<br/>blogs/{en,zh}/"]
        FAQ["❓ FAQ<br/>faq/"]
        GLOSS["📖 Glossary<br/>glossary/"]
        COMP["⚖️ Compare<br/>compare/"]
        TL["📅 Timeline<br/>timelines/*.json"]
    end

    subgraph Deploy["发布"]
        GIT["git push"]
        VERCEL["Vercel SSG<br/>自动部署"]
    end

    Sources --> NEWS
    NEWS -->|"Agent Filter → 简报"| NL
    NEWS -->|"人工选题 + Gemini"| T1
    NEWS -->|"SEO Pipeline 提取"| KW
    NEWS -->|"关键词匹配"| FRESH
    KW -->|"按 type 路由生成"| T23 & FAQ & GLOSS & COMP
    KW -->|"PAA 挖掘"| PAA
    PAA -->|"Brave 验证 → FAQ"| FAQ
    FRESH -->|"内容更新"| T1
    NEWS -->|"话题聚类"| TL
    NL & T1 & T23 & FAQ & GLOSS & COMP & TL --> GIT --> VERCEL

    style Sources fill:#e0f2fe,stroke:#3b82f6,color:#1e293b
    style DB fill:#ffedd5,stroke:#f97316,color:#1e293b
    style Output fill:#dcfce7,stroke:#22c55e,color:#1e293b
    style Deploy fill:#ede9fe,stroke:#a855f7,color:#1e293b
```

## 内容目录结构

```
content/
├── blogs/
│   ├── en/                     ← 所有英文博客 (Tier 1/2/3)
│   └── zh/                     ← 所有中文博客 (Tier 1/2/3)
├── newsletters/
│   ├── en/                     ← YYYY-MM-DD.md (每日)
│   └── zh/                     ← YYYY-MM-DD.md (每日)
├── faq/                        ← {slug}-en.md / {slug}-zh.md
├── glossary/                   ← {slug}-en.md / {slug}-zh.md
├── compare/                    ← {slug}-en.md / {slug}-zh.md
├── timelines/                  ← {topic-slug}.json (SSG 数据)
└── topic-clusters.json         ← 8 个话题聚类定义
```

### 话题聚类 (topic-clusters.json)

| Slug | 话题 | 用途 |
|------|------|------|
| `claude-code` | Claude Code | Timeline + Topics hub |
| `claude-opus` | Claude Opus 4.6 | Timeline + Topics hub |
| `gpt-codex` | GPT-5.3 Codex | Timeline + Topics hub |
| `ai-agents` | AI Agents | Timeline + Topics hub |
| `model-comparison` | 模型对比 | Timeline + Topics hub |
| `ai-coding-tools` | AI 编程工具 | Timeline + Topics hub |
| `context-window` | 上下文窗口 | Timeline + Topics hub |
| `ai-video` | AI 视频制作 | Timeline + Topics hub |

## SEO + AEO 层

| 组件 | 路径 | 功能 |
|------|------|------|
| sitemap.xml | `/sitemap.xml` | 分层优先级: Tier 1 = 0.9, Tier 2 = 0.7, Tier 3 = 0.5 |
| news-sitemap.xml | `/news-sitemap.xml` | Google News 协议: 30天内 Newsletter + 48h 内 Tier 1/2 |
| llms.txt | `/llms.txt` | AEO: 所有内容 URL 列表，供 LLM 爬虫索引 |
| robots.txt | `/robots.txt` | 允许: GPTBot, ClaudeBot, PerplexityBot, Applebot; 禁止: Bytespider, CCBot |
| JSON-LD | 每个页面 | Article, FAQPage, DefinedTerm, BreadcrumbList, ItemList |
| 自动术语链接 | 博客渲染时 | `blog.ts:linkGlossaryTerms()` 自动在博客正文中超链接术语表词条 |

## 脚本与文件对应关系

### Cron 自动脚本

| 脚本 | 功能 | 输入 | 输出 | Cron |
|------|------|------|------|------|
| `collect-news.ts` | 新闻采集 (7源) | APIs | `news_items` | UTC 22:00 |
| `freshness-detector.ts` | 新鲜度信号检测 | `news_items` + blog frontmatter | `freshness_signals` | UTC 23:00 |
| `write-newsletter.ts` | 简报生成 + 推送 | `news_items` (72h) | `newsletters/{en,zh}/` → git push | UTC 23:00 |
| `seo-pipeline.ts` | 关键词提取 → 内容生成 | `news_items` (48h) | `glossary/`, `faq/`, `compare/`, `blogs/` + `keywords` | UTC 02:00 Step 1 |
| `keyword-enricher.ts` | 搜索量/难度评估 | `keywords` (backlog) | 更新 `search_volume`, `difficulty` | UTC 02:00 Step 2 |
| `paa-miner.ts` | PAA 问题挖掘 | topic-clusters + blog kw + glossary | `paa_questions` | UTC 02:00 Step 3 |
| `generate-paa-faq.ts` | PAA→FAQ (Brave 事实验证) | `paa_questions` (discovered) | `faq/{slug}-{en,zh}.md` | UTC 02:00 Step 4 |
| `content-updater.ts` | 内容新鲜度更新 | `freshness_signals` (detected) | 修改现有 blog MD | UTC 02:00 Step 5 |
| `export-timeline-data.ts` | 时间线 JSON 导出 | `news_items` + `topic-clusters.json` | `timelines/*.json` | UTC 02:00 Step 6 |

### Track A 手动脚本

| 脚本 | 功能 | 输入 | 输出 |
|------|------|------|------|
| `orchestrator.ts` | Tier 1 完整流水线 | `input/topic.json` | Research + Narrative + EN/ZH Blog |
| `research-gemini-deep.py` | Gemini 深度调研 | 主题关键词 | `output/research-report.md` |
| `validate-narrative.ts` | Core Narrative 验证 | `output/core-narrative.json` | Pass/Fail |
| `validate-blog.ts` | Blog Frontmatter 验证 | `content/blogs/` | Pass/Fail + 错误列表 |

### 辅助脚本

| 脚本 | 功能 |
|------|------|
| `extract-faq.ts` | 从博客内容提取 FAQ |
| `extract-glossary.ts` | 从博客内容提取术语 |
| `extract-compare.ts` | 从博客内容提取对比表 |
| `extract-keywords.ts` | 从调研报告提取关键词 |
| `generate-tier2.ts` | 独立 Tier 2/3 生成 |
| `twitter-collector.ts` | 独立 Twitter 采集 |
| `generate-roundup.ts` | 月度总结 (Phase 2+ 存根) |

## AI 模型路由

| 任务 | 模型 | 调用方式 | 成本 |
|------|------|----------|------|
| 新闻采集 (HN 评分/摘要) | Gemini 2.0 Flash | REST API | ~$0.01/天 |
| Newsletter 筛选 + 写作 | Claude (Max Plan) | `claude -p` CLI | 免费 |
| SEO 内容生成 (全类型) | Claude (Max Plan) | `claude -p --allowedTools ""` | 免费 |
| PAA FAQ 生成 | Claude (Max Plan) | `claude -p --allowedTools ""` | 免费 |
| 内容新鲜度更新 | Claude (Max Plan) | `claude -p --allowedTools ""` | 免费 |
| 关键词搜索需求验证 | Brave Search API | REST | 免费 (2000/月) |
| PAA 问题挖掘 | Brave Search API | REST | ~900 calls/月 |
| PAA FAQ 事实验证 | Brave Search API | REST | ~150 calls/月 |
| Track A 深度调研 | Gemini 2.5 Pro | Python script | ~$1/篇 |
| Track A Tier 1 写作 | Claude Opus (Max Plan) | `.claude/agents/` subagents | 免费 |

> 所有 Claude 调用都通过 `claude -p` CLI (Max Plan)，不消耗 API credits。
> Gemini 调用通过 API，按用量计费。
> Brave Search 免费额度: 2000 calls/月，当前预估用量 ~1050/月。

## 成本月度总结

| 组件 | 月成本 | 说明 |
|------|--------|------|
| Claude (Max Plan) | $200/月 (固定) | 所有 CLI 调用 |
| Gemini 2.5 Pro (调研) | ~$4-8/月 | ~$1/篇 × 4-8 篇 |
| Brave Search | $0 | 免费额度内 |
| Vercel | $0 | Hobby Plan |
| **总计** | **~$204-208/月** | Sonnet/Opus CLI calls included in Max Plan |
