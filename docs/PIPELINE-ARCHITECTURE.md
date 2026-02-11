# LoreAI Pipeline Architecture

## Overview: Dual-Track Content Strategy

LoreAI 采用双轨内容策略，两条 Track 共享同一个数据源（daily-scout），但产出不同类型的内容。

## 整体架构图

```mermaid
flowchart TB
    subgraph DATA["🔍 数据采集层 (daily-scout.ts)"]
        TW["Twitter/X<br/>官方 + KOL + AI工程师"]
        HF["HuggingFace Blog<br/>≥30 likes"]
        HN["Hacker News<br/>AI/ML 相关"]
        GH["GitHub Trending"]
        BLOG["官方博客<br/>Anthropic/OpenAI/Google"]
        
        TW & HF & HN & GH & BLOG --> SCOUT["daily-scout.ts<br/>🕐 每日 01:00 UTC"]
        SCOUT --> DB[(SQLite: loreai.db<br/>news_items 表<br/>去重 + 评分)]
    end

    subgraph TRACKA["🅰️ Track A: 品牌内容 (手动触发)"]
        direction TB
        TOPIC["人工选题<br/>Bella 确定主题"] --> RESEARCH["Gemini Deep Research<br/>research-gemini-deep.py<br/>10-20分钟深度调研"]
        RESEARCH --> NARRATIVE["Claude Opus<br/>orchestrator.ts → narrative<br/>提炼核心叙事"]
        NARRATIVE --> WRITER_EN["Claude Opus (EN)<br/>skills/blog-en/SKILL.md<br/>英文深度文章"]
        NARRATIVE --> WRITER_ZH["Claude Opus (ZH)<br/>skills/blog-zh/SKILL.md<br/>中文深度文章"]
        RESEARCH --> WRITER_EN
        RESEARCH --> WRITER_ZH
        WRITER_EN --> T1_EN["Tier 1 博客 (EN)<br/>content/blogs/en/*.md"]
        WRITER_ZH --> T1_ZH["Tier 1 博客 (ZH)<br/>content/blogs/zh/*.md"]
    end

    subgraph TRACKB["🅱️ Track B: SEO 长尾内容 (自动化)"]
        direction TB
        DB2[(news_items)] --> KW["关键词提取<br/>Claude Opus<br/>10-15个关键词"]
        KW --> BRAVE["Brave Search 验证<br/>搜索需求确认<br/>2000次/月"]
        BRAVE --> ROUTE{"内容类型路由"}
        ROUTE -->|"新概念/术语"| GEN_GLOSS["生成 Glossary<br/>300-500词术语解释"]
        ROUTE -->|"X vs Y 对比"| GEN_COMP["生成 Compare<br/>800-1500词对比表"]
        ROUTE -->|"用户常见问题"| GEN_FAQ["生成 FAQ<br/>10个Q&A"]
        ROUTE -->|"趋势深度分析"| GEN_T2["生成 Tier 2<br/>1500-2500词分析"]
        ROUTE -->|"实用指南/How-to"| GEN_T3["生成 Tier 3<br/>800-1200词快读"]
    end

    subgraph PUBLISH["📦 发布层"]
        T1_EN --> BLOG_PAGE["/blog (Tier 1)<br/>品牌展示"]
        T1_ZH --> BLOG_PAGE
        GEN_T2 --> RES_PAGE["/resources (Tier 2/3)<br/>SEO 流量池"]
        GEN_T3 --> RES_PAGE
        GEN_FAQ --> FAQ_PAGE["/faq<br/>FAQPage Schema"]
        GEN_GLOSS --> GLOSS_PAGE["/glossary<br/>术语百科"]
        GEN_COMP --> COMP_PAGE["/compare<br/>对比数据产品"]
        
        SCOUT --> NEWSLETTER["/newsletter<br/>每日 AI 简报"]
    end

    subgraph SEO["🔗 SEO 增强"]
        BLOG_PAGE & RES_PAGE & FAQ_PAGE & GLOSS_PAGE & COMP_PAGE --> SCHEMA["JSON-LD Schema<br/>Article + BreadcrumbList<br/>+ FAQPage"]
        SCHEMA --> LLMS["llms.txt<br/>AEO 优化"]
        SCHEMA --> SITEMAP["sitemap.xml<br/>分层优先级"]
    end

    DB --> DB2

    style DATA fill:#1e293b,color:#e2e8f0,stroke:#3b82f6
    style TRACKA fill:#1e1b2e,color:#e2e8f0,stroke:#a855f7
    style TRACKB fill:#1b2e1e,color:#e2e8f0,stroke:#22c55e
    style PUBLISH fill:#2e1e1b,color:#e2e8f0,stroke:#f97316
    style SEO fill:#1b1e2e,color:#e2e8f0,stroke:#6366f1
```

## Track A vs Track B 详细对比

```mermaid
flowchart LR
    subgraph A["Track A: 品牌深度"]
        A1["触发方式: 手动选题"]
        A2["调研: Gemini Deep Research<br/>$1/篇, 10-20分钟"]
        A3["写作: Claude Opus<br/>双输入(Research+Narrative)"]
        A4["产出: Tier 1 深度文章<br/>3000-5000词"]
        A5["频率: 每周 1-2 篇"]
        A6["目标: 品牌建设 + 权威性"]
        A1 --> A2 --> A3 --> A4
    end

    subgraph B["Track B: SEO 长尾"]
        B1["触发方式: 自动/定时"]
        B2["数据源: news_items 表<br/>48小时内新闻"]
        B3["提取: Claude Opus<br/>10-15个关键词"]
        B4["产出: 5种内容类型<br/>300-2500词"]
        B5["频率: 每天 5-10 篇"]
        B6["目标: 搜索流量 + 覆盖"]
        B1 --> B2 --> B3 --> B4
    end

    style A fill:#2d1b4e,color:#e2e8f0,stroke:#a855f7
    style B fill:#1b3a1e,color:#e2e8f0,stroke:#22c55e
```

## 关键词到内容的路由逻辑

```mermaid
flowchart TD
    NEWS["48h内新闻数据<br/>(news_items表)"] --> EXTRACT["Claude Opus 提取关键词"]
    
    EXTRACT --> KW_LIST["关键词列表<br/>每个含: keyword, type,<br/>relevance, newness,<br/>category, news_ids"]
    
    KW_LIST --> DEDUP{"去重检查"}
    DEDUP -->|"slug已存在"| SKIP["跳过"]
    DEDUP -->|"标题已存在"| SKIP
    DEDUP -->|"全新关键词"| BRAVE_CHECK{"Brave Search<br/>验证搜索需求"}
    
    BRAVE_CHECK -->|"有搜索结果"| PASS["通过验证 ✅"]
    BRAVE_CHECK -->|"无结果"| SKIP2["跳过 ❌"]
    BRAVE_CHECK -->|"API错误/无Key"| PASS
    
    PASS --> TYPE{"type 字段决定<br/>内容类型"}
    
    TYPE -->|"glossary"| G["📖 Glossary<br/>slug-en.md + slug-zh.md<br/>→ content/glossary/"]
    TYPE -->|"compare"| C["⚖️ Compare<br/>slug-en.md + slug-zh.md<br/>→ content/compare/"]
    TYPE -->|"faq"| F["❓ FAQ<br/>slug-en.md + slug-zh.md<br/>→ content/faq/"]
    TYPE -->|"tier2"| T2["📊 Tier 2 Analysis<br/>slug.md (en + zh)<br/>→ content/blogs/{lang}/"]
    TYPE -->|"tier3"| T3["⚡ Tier 3 Quick Read<br/>slug.md (en + zh)<br/>→ content/blogs/{lang}/"]
    
    G & C & F & T2 & T3 --> VALIDATE["Frontmatter 验证<br/>slug, title, description,<br/>date, lang 必填"]
    VALIDATE --> REPORT["生成报告<br/>output/seo-pipeline/report.md"]

    style NEWS fill:#1e293b,color:#e2e8f0
    style TYPE fill:#2d1b4e,color:#e2e8f0
    style VALIDATE fill:#1b3a1e,color:#e2e8f0
```

## 数据流：从新闻到页面

```mermaid
flowchart LR
    subgraph Sources["数据源"]
        S1["Twitter<br/>~20个账号"]
        S2["HF Blog<br/>≥30 likes"]
        S3["Hacker News"]
        S4["GitHub Trending"]
        S5["官方博客"]
    end
    
    subgraph Scout["daily-scout.ts"]
        COLLECT["采集<br/>~300-400条/天"]
        DEDUP["URL去重<br/>跨天去重"]
        SCORE["评分排序"]
        COLLECT --> DEDUP --> SCORE
    end
    
    subgraph DB["SQLite"]
        NEWS_TABLE["news_items<br/>~385条"]
        KW_TABLE["keywords<br/>status: backlog→used"]
        CONTENT_TABLE["content<br/>tracking"]
    end
    
    subgraph Output["内容产出"]
        NL["📰 Newsletter<br/>每日简报"]
        T1["🔬 Tier 1 Blog<br/>深度文章"]
        T23["📝⚡ Tier 2/3<br/>分析/快读"]
        FAQ["❓ FAQ"]
        GLOSS["📖 Glossary"]
        COMP["⚖️ Compare"]
    end
    
    Sources --> Scout --> NEWS_TABLE
    NEWS_TABLE --> |"Opus 生成摘要"| NL
    NEWS_TABLE --> |"人工选题 + Gemini Research"| T1
    NEWS_TABLE --> |"SEO Pipeline 自动提取关键词"| KW_TABLE
    KW_TABLE --> |"按type路由生成"| T23 & FAQ & GLOSS & COMP

    style Sources fill:#1e293b,color:#e2e8f0
    style Scout fill:#1b2e1e,color:#e2e8f0
    style DB fill:#2e1e1b,color:#e2e8f0
    style Output fill:#2d1b4e,color:#e2e8f0
```

## 关键词提取的多样性控制

```mermaid
flowchart TD
    INPUT["48h新闻 + 已有内容slug列表"] --> PROMPT["Claude Opus 提取 Prompt"]
    
    PROMPT --> RULES["多样性规则"]
    
    RULES --> R1["🏢 公司多样性<br/>同一公司最多5个关键词<br/>至少覆盖3家公司"]
    RULES --> R2["📂 类别配额<br/>models: 2-3<br/>tools: 2-3<br/>infra: 1-2<br/>opensource: 1-2<br/>applications: 1-2<br/>safety: 0-1"]
    RULES --> R3["📝 类型混合<br/>glossary + compare +<br/>faq + tier2 + tier3"]
    RULES --> R4["🔢 评分标准<br/>relevance × newness<br/>降序排列取前10"]
    
    R1 & R2 & R3 & R4 --> FILTER["过滤 + 排序"]
    FILTER --> FINAL["最终 10-15 个关键词<br/>每个带: keyword, type,<br/>category, relevance, newness,<br/>context, news_ids"]

    style RULES fill:#1b2e1e,color:#e2e8f0
```

## 脚本与文件对应关系

| 脚本 | 功能 | 输入 | 输出 | 触发方式 |
|------|------|------|------|----------|
| `daily-scout.ts` | 新闻采集 | Twitter/HF/HN/GH/Blog APIs | `loreai.db:news_items` + Newsletter MD | Cron 01:00 UTC |
| `seo-pipeline.ts` | SEO 内容批量生成 | `loreai.db:news_items` | Glossary/FAQ/Compare/Blog MD | 待设 Cron 02:00 UTC |
| `orchestrator.ts` | Tier 1 深度文章 | 人工主题 | Research + Narrative + EN/ZH Blog | 手动 |
| `extract-keywords.ts` | 关键词提取(独立) | `output/research-report.md` | `loreai.db:keywords` | 被 orchestrator 调用 |
| `generate-tier2.ts` | Tier 2 生成(独立) | `loreai.db:keywords` | `content/blogs/{lang}/*.md` | 手动 |
| `extract-faq.ts` | FAQ 提取 | Blog MD | FAQ MD | 手动 |
| `extract-glossary.ts` | Glossary 提取 | Blog MD | Glossary MD | 手动 |
| `extract-compare.ts` | Compare 提取 | Blog MD | Compare MD | 手动 |
| `publish-faq.ts` | FAQ 发布到 content/ | `output/` FAQ files | `content/faq/` | 手动 |
| `research-gemini-deep.py` | Gemini 深度调研 | 主题关键词 | `output/research-gemini-deep.md` | 被 orchestrator 调用 |
| `validate-narrative.ts` | 叙事验证 | `output/core-narrative.json` | Pass/Fail | 被 orchestrator 调用 |
| `validate-blog.ts` | Blog Frontmatter 验证 | Blog MD files | Pass/Fail + 错误列表 | 手动 / CI |

## 成本结构

| 组件 | 成本 | 频率 |
|------|------|------|
| daily-scout (Gemini Flash) | ~$0.01/天 | 每天 |
| Newsletter (Claude Opus via Max) | 免费 | 每天 |
| SEO Pipeline (Claude Opus via Max) | 免费 | 每天 |
| Track A Research (Gemini Deep) | ~$1/篇 | 每周1-2次 |
| Track A Writers (Claude Opus via Max) | 免费 | 每周1-2次 |
| Brave Search API | 免费(2000次/月) | SEO验证 |

> 所有 Claude 调用都通过 `claude -p` CLI (Max Plan)，不消耗 API credits。
> Gemini 调用通过 API，按用量计费。
