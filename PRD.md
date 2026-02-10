# 🧠 LoreAI — AI Content Engine PRD

> **版本：** v4.0
> **日期：** 2026-02-09
> **基于：** Hot2Content PRD v3.1 by Bella & Meowjik + Claudiny 优化
> **实现方案：** Claude Code Subagents + Gemini API + twitterapi.io
> **品牌：** LoreAI (loreai.dev)
> **状态：** Phase 1 完成，Phase 2 进行中

---

## 0. 全局链路总览

```
╔══════════════════════════════════════════════════════════════════╗
║                    LoreAI 内容引擎全链路                          ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  ┌─────────────────────────────────────────────────────────┐     ║
║  │              📡 数据采集层                                │     ║
║  │  Twitter · 官方博客 · HN · GitHub · HuggingFace          │     ║
║  │                    ↓                                     │     ║
║  │            news_items 表 (SQLite)                        │     ║
║  └─────────────┬───────────────────────┬───────────────────┘     ║
║                │                       │                         ║
║       ┌────────▼────────┐    ┌─────────▼──────────┐              ║
║       │  📰 Newsletter   │    │  📝 Blog Pipeline   │              ║
║       │  Pipeline (自动)  │    │     (手动触发)      │              ║
║       │                  │    │                     │              ║
║       │ daily-scout.ts   │    │ Gemini Deep Research│              ║
║       │ Gemini Flash     │    │ → Core Narrative    │              ║
║       │ → 日报 markdown   │    │ → EN blog (Opus)   │              ║
║       │ → DB 存储        │    │ → ZH blog (Opus)   │              ║
║       │                  │    │ → DB 存储           │              ║
║       └────────┬─────────┘    └─────────┬──────────┘              ║
║                │                        │                         ║
║                │              ┌─────────▼──────────┐              ║
║                │              │  🔑 调研资产复用     │              ║
║                │              │  (一鱼多吃)         │              ║
║                │              │                     │              ║
║                │              │ research report     │              ║
║                │              │ → LLM 提取衍生关键词 │              ║
║                │              │ → keywords 表       │              ║
║                │              └─────────┬──────────┘              ║
║                │                        │                         ║
║       ┌────────▼────────────────────────▼──────────┐              ║
║       │            🔑 关键词策略层                    │              ║
║       │                                             │              ║
║       │  来源 1: Newsletter 热点 → trending 关键词    │              ║
║       │  来源 2: Research report → 衍生话题          │              ║
║       │  来源 3: Brave Search "People Also Ask"     │              ║
║       │  来源 4: LLM 基于用户画像扩展长尾词           │              ║
║       │  来源 5: 手动导入 (SEO 工具/竞品分析)         │              ║
║       │                                             │              ║
║       │  → LLM 去重 + 评分 + 标注搜索意图             │              ║
║       │  → keywords 表                              │              ║
║       └────────┬──────────────────┬────────────────┘              ║
║                │                  │                               ║
║       ┌────────▼───────┐  ┌──────▼─────────┐                     ║
║       │ Tier 2 标准文章  │  │ Tier 3 批量文章  │                     ║
║       │ Brave+WebFetch  │  │ Brave snippets  │                     ║
║       │ + 复用 research  │  │ Gemini Flash    │                     ║
║       │ Claude Sonnet   │  │ ~$0.02/篇       │                     ║
║       │ ~$0.1/篇        │  │ 10-20篇/周      │                     ║
║       │ 3-5篇/周        │  │                 │                     ║
║       └────────┬───────┘  └──────┬─────────┘                     ║
║                │                 │                                ║
║       ┌────────▼─────────────────▼─────────┐                     ║
║       │         📄 内容生成层                 │                     ║
║       │                                     │                     ║
║       │  Tier 1 Deep Dive (blog pipeline)   │                     ║
║       │  Tier 2/3 Articles (generate-tier2) │                     ║
║       │  FAQ Pages (extract-faq.ts)         │                     ║
║       │  Glossary Wiki (extract-glossary.ts)│                     ║
║       │  Compare Tables (extract-compare.ts)│                     ║
║       │  Monthly Roundup (generate-roundup) │                     ║
║       └────────────────┬───────────────────┘                     ║
║                        │                                         ║
║       ┌────────────────▼───────────────────┐                     ║
║       │         📂 内容存储层                 │                     ║
║       │                                     │                     ║
║       │  content/newsletters/*.md (日报)     │                     ║
║       │  content/blogs/{en,zh}/*.md (博客)   │                     ║
║       │  SQLite DB (结构化管理)               │                     ║
║       └────────────────┬───────────────────┘                     ║
║                        │                                         ║
║       ┌────────────────▼───────────────────┐                     ║
║       │         🌐 发布层                    │                     ║
║       │                                     │                     ║
║       │  loreai.dev (Vercel SSG)            │                     ║
║       │  → Newsletter 页面                   │                     ║
║       │  → 中英文博客页面                     │                     ║
║       │  → Sitemap + SEO                    │                     ║
║       └────────────────┬───────────────────┘                     ║
║                        │                                         ║
║       ┌────────────────▼───────────────────┐                     ║
║       │         📢 分发层 (未来)              │                     ║
║       │                                     │                     ║
║       │  Twitter thread · 口播视频           │                     ║
║       │  YouTube · 小红书 · 邮件订阅          │                     ║
║       │  → distributions 表追踪             │                     ║
║       └─────────────────────────────────────┘                     ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 1. 完整 Pipeline 架构（Blog）

```
输入层（三种模式）
│
├── 模式 A: 手动关键词 → 写入 topic.json → 跳到 Step 2
├── 模式 B: 输入 URL  → 写入 topic.json → 跳到 Step 2
└── 模式 C: 自动检测  → Step 1
│
▼
┌──────────────────────────────────┐
│  Step 1: 🔥 trend-scout          │  Claude Subagent (sonnet)
│  5 层信息源扫描 + 话题评分筛选    │
│  输出: input/topic.json          │
└───────────────┬──────────────────┘
                ▼
┌──────────────────────────────────┐
│  Step 2: 🔄 dedup-checker        │  Claude Subagent (haiku)
│  三级去重 + 跟进判定              │
│  输出: input/dedup-report.json   │
│  ├── SKIP → 停止，报告原因        │
│  ├── UPDATE → 继续，标记跟进角度   │
│  └── PASS → 继续                  │
└───────────────┬──────────────────┘
                ▼
┌──────────────────────────────────┐
│  Step 3: 🔬 researcher           │  Claude Subagent (sonnet)
│  Gemini 2.5 Pro Deep Research    │  + scripts/gemini-research.ts
│  输出: output/research-report.md │
└───────────────┬──────────────────┘
                ▼
┌──────────────────────────────────┐
│  Step 4: 🧠 narrative-architect  │  Claude Subagent (opus)
│  提炼 Core Narrative JSON        │  ⚠️ 纯英文（不含中文字段）
│  输出: output/core-narrative.json│
└───────────────┬──────────────────┘
                ▼
        ┌───────┴───────┐           ← 并行
        ▼               ▼
┌─────────────┐  ┌─────────────┐
│ Step 5a:    │  │ Step 5b:    │
│ 🇺🇸 writer-en│  │ 🇨🇳 writer-zh│
│ Claude(opus)│  │ Claude(opus)│  ← 两者都用 Opus，A/B 测试证明 Opus 中文 > Kimi
│ 英文SEO Blog │  │ 中文 Blog   │
└──────┬──────┘  └──────┬──────┘
       └───────┬────────┘           ← 两者都完成后
               ▼
┌──────────────────────────────────┐
│  Step 6: 🔍 seo-reviewer         │  Claude Subagent (sonnet)
│  SEO/GEO 质量门控                │
│  输出: output/seo-review.md      │
└───────────────┬──────────────────┘
                ▼
┌──────────────────────────────────┐
│  Step 7: 📝 更新 topic-index     │  主编排命令直接执行
│  追加到 output/topic-index.json  │
└──────────────────────────────────┘
```

### 关键设计决策

**为什么 Core Narrative 是纯英文？**
Core Narrative 是结构化的叙事框架，语言无关。中文 writer 基于英文框架 + 调研报告独立创作中文内容，不是翻译。

**为什么 writer-zh 也用 Claude Opus？**
经过 A/B 测试对比 Claude Opus vs Kimi K2.5，结论是 Opus 的中文博客质量更高（更有深度、结构更好）。Kimi 保留给未来的视频脚本等轻量内容。

**为什么 Writer 同时参考 Research Report + Core Narrative？**
A/B 测试证明双输入方案（V2）产出质量明显高于只读 Narrative 的方案（V1）：内容更丰富(+600词)、更实用（具体操作细节）、更有深度（行业趋势分析）。见 output/blog-comparison.md。

---

## 2. Agent + 脚本一览表

| # | 组件 | 类型 | Model | 职责 | 预估 Token |
|---|------|------|-------|------|-----------|
| 1 | trend-scout | Claude Subagent | sonnet | 5 层信息源扫描 + 评分 | ~15K |
| 2 | dedup-checker | Claude Subagent | haiku | 去重检查 + 判定 | ~3K |
| 3 | researcher | Claude Subagent | sonnet | 调 Gemini API + 整理报告 | ~15K |
| 4 | narrative-architect | Claude Subagent | **opus** | Core Narrative 提炼（纯英文） | ~20K |
| 5 | writer-en | Claude Subagent | **opus** | 英文 SEO 博客 | ~25K |
| 6 | writer-zh | Claude Subagent | **opus** | 中文博客（非翻译，独立创作） | ~25K |
| 7 | seo-reviewer | Claude Subagent | sonnet | SEO/GEO 质量审核 | ~10K |

**外部 API 脚本：**
| 脚本 | 调用 API | 用途 |
|------|---------|------|
| scripts/gemini-research.ts | Gemini 2.5 Pro | 深度调研 |
| scripts/daily-scout.ts | Gemini 2.0 Flash + twitterapi.io | Newsletter 自动生成 |
| scripts/twitter-collector.ts | twitterapi.io | X/Twitter 采集 |
| scripts/validate-narrative.ts | 无（本地） | JSON schema 校验 |
| scripts/kimi-writer.ts | Kimi K2.5 | 保留：未来视频脚本等轻量内容 |

---

## 3. 项目结构

```
hot2content/
├── .claude/
│   ├── agents/                          # Claude Subagent 配置（6 个）
│   │   ├── trend-scout.md
│   │   ├── dedup-checker.md
│   │   ├── researcher.md
│   │   ├── narrative-architect.md
│   │   ├── writer-en.md
│   │   └── seo-reviewer.md
│   │   # 注意：没有 writer-zh.md（由脚本实现）
│   └── commands/
│       ├── hot2content.md
│       └── hot2content-scout.md
│
├── input/
│   ├── topic.json                       # 话题输入
│   ├── raw-sources.json                 # trend-scout 原始采集
│   └── dedup-report.json               # 去重报告
│
├── output/
│   ├── research-report.md               # 调研报告
│   ├── core-narrative.json              # 叙事中枢 ⭐ 纯英文
│   ├── blog-en.md                       # 英文博客
│   ├── blog-zh.md                       # 中文博客（Kimi 生成）
│   ├── seo-review.md                    # SEO 审核报告
│   └── topic-index.json                 # 已覆盖话题索引 ⭐ 持久化
│
├── scripts/
│   ├── gemini-research.ts               # Gemini API 封装
│   ├── kimi-writer.ts                   # Kimi API 封装（保留：未来视频脚本）
│   ├── twitter-collector.ts             # twitterapi.io 封装（X 采集）
│   └── validate-narrative.ts            # JSON schema 校验
│
├── skills/
│   ├── blog-en/SKILL.md                 # 英文博客规范
│   └── blog-zh/SKILL.md                 # 中文博客规范（Kimi prompt 引用）
│
├── CLAUDE.md
└── package.json
```

---

## 4. 信息源分层架构

### 第一层：🏢 官方信息源（必抓）

| 区域 | Provider | 采集 URL |
|------|----------|---------|
| 🇺🇸 | Anthropic | anthropic.com/news, anthropic.com/engineering |
| 🇺🇸 | OpenAI | openai.com/blog |
| 🇺🇸 | Google | blog.google/technology/ai, deepmind.google/blog |
| 🇺🇸 | Meta | ai.meta.com/blog |
| 🇺🇸 | xAI | x.ai/blog |
| 🇺🇸 | Amazon | aws.amazon.com/ai/generative-ai |
| 🇪🇺 | Mistral | mistral.ai/news |
| 🇪🇺 | Cohere | cohere.com/blog |
| 🇨🇳 | 千问 | qwen.ai |
| 🇨🇳 | Kimi | kimi.moonshot.cn |
| 🇨🇳 | 智谱 | zhipuai.cn/news |
| 🇨🇳 | 文心 | cloud.baidu.com/article |
| 🇨🇳 | 豆包 | doubao.com |

**监控四维度：**
- **model_release** — 新模型发布 / 版本更新 / benchmark
- **developer_platform** — API 变更 / 新功能 / 定价调整
- **official_blog** — Best practices / Case studies / 技术报告
- **product_ecosystem** — SDK / 框架 / 工具 / C 端产品更新

**采集方法：** WebFetch（公开博客页面，无需登录）

---

### 第二层：🐦 Twitter/X 热点信号

Twitter/X 是 AI 行业最快的信息传播渠道，往往比官方博客早 1-24 小时。

#### Targeted Accounts

**Tier 1 — 官方账号（必查）：**

| Provider | 账号 | 关注重点 |
|----------|------|---------|
| OpenAI | @OpenAI | GPT 模型, ChatGPT, API 更新 |
| Anthropic | @AnthropicAI | Claude 模型, 安全研究 |
| Google | @GoogleAI | Gemini, AI 研究 |
| Meta | @AIatMeta | Llama 模型, 开源 |
| Mistral | @MistralAI | 开放权重模型 |
| xAI | @xai | Grok, xAI 动态 |

**Tier 2 — 创始人/高管（战略信号）：**

| 人物 | 账号 | 信号价值 |
|------|------|---------|
| Sam Altman | @sama | OpenAI CEO, 行业方向 |
| Dario Amodei | @DarioAmodei | Anthropic CEO, 安全视角 |
| Demis Hassabis | @demaborevsky | DeepMind CEO |
| Yann LeCun | @ylecun | Meta AI Chief, 学术视角 |
| Andrej Karpathy | @karpathy | AI 教育, 技术深度 |
| Elon Musk | @elonmusk | xAI, 行业影响 |
| Jeff Dean | @JeffDean | Google AI, 研究方向 |

**Tier 3 — 知名研究者/KOL：**

| 账号 | 关注重点 |
|------|---------|
| @swyx | AI 工程, 行业趋势分析 |
| @emaborevski | 前沿研究, 技术评论 |

**Tier 4 — 开发者工具/平台：**

| 账号 | 关注重点 |
|------|---------|
| @OpenAIDevs | API 更新, 开发者新闻 |
| @huggingface | 开源模型, 数据集 |
| @LangChainAI | LangChain 框架 |

**Tier 5 — 科技媒体：**

| 账号 | 关注重点 |
|------|---------|
| @TechCrunch | 融资, 产品发布 |
| @TheVerge | AI 产品评测 |

#### Engagement 阈值

| 内容类型 | 最低 Engagement |
|---------|----------------|
| Breaking news（官方账号发布） | 任意（不论 engagement） |
| 功能/产品更新 | 100+ likes |
| 评论/观点类 | 500+ likes |
| Thread（深度发布） | 200+ likes on first tweet |

#### 内容过滤

**✅ 采集：**
- 新模型/功能发布公告
- API 变更或新功能
- 定价变动
- 论文发布
- 重大合作/集成
- 100+ likes 的帖子（官方账号）
- Thread 形式的深度发布

**❌ 跳过：**
- 转发旧内容
- 泛泛的营销推广
- Engagement bait
- 50 likes 以下（除非是突发新闻）
- 招聘帖、公司活动等无关内容

#### 热度判断

同一话题被多个不同 Tier 的账号讨论 → 交叉验证强信号
Thread 形式的深度发布 → 高内容价值信号
engagement 异常高于该账号平均值 → 热点信号

#### 采集方式演进路线

| 阶段 | 方案 | 复杂度 |
|------|------|--------|
| **MVP (P0)** | scripts/twitter-collector.ts 调用 twitterapi.io，自动采集 Tier 1-2 账号 | 低 |
| **V1** | 扩展到 Tier 3-5 全部账号，增加 Thread 自动展开 | 低 |
| **V2** | Claude in Chrome 全自动浏览（复用 ainews chrome-collector 方案） | 高 |

> ✅ 已有 twitterapi.io API，MVP 即可自动采集 X。预计覆盖率 ~95%。

---

### 第三层：🔥 GitHub Trending

- github.com/trending（总榜）
- github.com/trending/python?since=daily
- github.com/trending/typescript?since=daily

**关注信号：** AI/ML repo 进入 trending, star 24h 内 +500, 知名组织新 repo

**采集方法：** WebFetch

---

### 第四层：💬 Hacker News

- news.ycombinator.com 首页 Top 30
- Show HN 中的 AI 工具/项目
- Ask HN 中的 AI 讨论

**关注信号：** AI 相关进入 Top 10, 评论数 > 100

**内容价值：** HN 评论区是高质量多方观点来源，适合 Core Narrative 的 risks 和 significance 部分。

**采集方法：** WebFetch 或 HN API

---

### 第五层：🗣️ Reddit

| Subreddit | 特点 |
|-----------|------|
| r/MachineLearning | 学术导向, 论文讨论 |
| r/LocalLLaMA | 开源/本地部署, 动手派 |
| r/ClaudeAI | Claude 用户社区 |
| r/ChatGPT | 消费者视角 |

**关注信号：** 日榜 Top 帖, [D] 标记讨论, 跨 subreddit 重复话题

**采集方法：** WebFetch（Reddit .json 后缀 API）

---

## 5. 话题评分机制

| 维度 | 权重 | 说明 |
|------|------|------|
| 影响力 | 30% | 影响多少人？改变行业格局？ |
| 新鲜度 | 25% | 首次披露？还是旧闻？ |
| 内容潜力 | 25% | 快讯 vs 深度长文？ |
| 时效性 | 20% | 今天必须覆盖？一周都行？ |

**加分：** 官方源 +5 | 交叉验证 ≥3 层 +10 | 中国角度 +2 | GitHub 项目 +5
**过滤：** 营销稿 / 非 AI / 已覆盖话题 → 排除

---

## 6. 去重判定矩阵

| 关键词重叠 | < 3天 | 3-7天 | > 7天 |
|-----------|-------|-------|-------|
| < 40% | PASS | PASS | PASS |
| 40%-70% | SKIP | UPDATE* | PASS |
| > 70% | SKIP | SKIP | UPDATE |

*UPDATE 条件：有旧话题未覆盖的第一层官方源

**例外：** 有全新第一层源 → 强制 UPDATE | force: true → 强制 PASS

---

## 7. Core Narrative Schema（纯英文）

```json
{
  "topic_id": "kebab-case-slug",
  "title": "English Title",
  "created_at": "2026-02-07T00:00:00Z",
  "is_update": false,
  "previous_topic_id": null,

  "one_liner": "One sentence summary",

  "key_points": [
    "Independently quotable point 1",
    "Independently quotable point 2",
    "Independently quotable point 3"
  ],

  "story_spine": {
    "background": "Context and backstory",
    "breakthrough": "Core new information",
    "mechanism": "How it works technically",
    "significance": "Why it matters",
    "risks": "Concerns and limitations"
  },

  "faq": [
    { "question": "FAQ question?", "answer": "FAQ answer." }
  ],

  "references": [
    { "title": "Source Title", "url": "https://...", "source": "Publication", "date": "2026-02-06" }
  ],

  "diagrams": [
    { "type": "mermaid", "title": "Diagram Title", "code": "graph TD\n  A-->B" }
  ],

  "seo": {
    "slug": "topic-slug",
    "meta_title_en": "SEO Title | Site Name (50-60 chars)",
    "meta_description_en": "Description (150-160 chars)",
    "keywords_en": ["keyword1", "keyword2", "keyword3"],
    "keywords_zh": ["关键词1", "关键词2", "关键词3"]
  },

}
```

**注意：** seo.keywords_zh 保留，供中文 writer 生成中文 frontmatter 时使用。

---

## 8. input/topic.json 统一 Schema

```json
// 模式 A
{ "mode": "keyword", "keyword": "话题", "created_at": "ISO", "force": false }

// 模式 B
{ "mode": "url", "source_url": "https://...", "created_at": "ISO", "force": false }

// 模式 C（trend-scout 生成）
{
  "mode": "auto_detect",
  "detected_at": "ISO",
  "sources_scanned": { "tier_1_official": 12, "tier_2_twitter": 0, ... },
  "top_topics": [ { "rank": 1, "title": "...", "score": 85, ... } ],
  "selected_topic": 0,
  "no_hot_topic_fallback": null
}
```

dedup-checker 追加字段：
```json
{ "dedup_verdict": "PASS|UPDATE|SKIP", "update_angle": "...", "previous_topic_id": "..." }
```

---

## 9. Subagent 配置文件

### 9.1 `.claude/agents/trend-scout.md`

```markdown
---
name: trend-scout
description: AI/科技热点发现。扫描 5 层信息源，评分筛选 Top 3 话题。
tools: Read, Write, Bash, WebFetch, Grep
model: sonnet
---

你是 Hot2Content 的热点侦察员（Trend Scout）。

## 职责
扫描 AI/科技领域的 5 层信息源，发现并筛选最有内容价值的热点话题。

## 工作流程

### Step 1: 信息采集

对以下源执行 WebFetch，重点关注最近 48 小时。
将原始数据保存到 input/raw-sources.json。

**第一层 — 官方信息源（必抓）：**

美国/欧洲：
- https://www.anthropic.com/news
- https://openai.com/blog
- https://blog.google/technology/ai/
- https://ai.meta.com/blog/
- https://mistral.ai/news
- https://x.ai/blog
- https://aws.amazon.com/ai/generative-ai/
- https://cohere.com/blog

中国：
- https://qwen.ai
- https://kimi.moonshot.cn

对每条新发布标记维度：model_release / developer_platform / official_blog / product_ecosystem

**第二层 — Twitter/X（twitterapi.io 自动采集）：**

执行: npx tsx scripts/twitter-collector.ts
脚本自动采集以下 Targeted Accounts 的最近 48 小时帖子：

Tier 1 官方：@OpenAI, @AnthropicAI, @GoogleAI, @AIatMeta, @MistralAI, @xai
Tier 2 创始人：@sama, @DarioAmodei, @ylecun, @elonmusk, @JeffDean, @karpathy
Tier 3 开发者工具：@OpenAIDevs, @huggingface, @LangChainAI

Engagement 过滤（由脚本执行）：
- 官方 breaking news → 任意 engagement 都采集
- 功能更新 → 100+ likes
- 评论/观点 → 500+ likes
- Thread → 首条 200+ likes

脚本输出保存到 input/raw-sources.json 的 tier_2_twitter 字段。

**第三层 — GitHub Trending：**
- https://github.com/trending
- https://github.com/trending/python?since=daily

关注 AI/ML repo 和 star 异常增长项目。

**第四层 — Hacker News：**
- https://news.ycombinator.com/

AI 相关首页 Top 30。评论 > 100 重点标记。Show HN AI 项目单独标记。

**第五层 — Reddit：**
- https://www.reddit.com/r/MachineLearning/top/.json?t=day
- https://www.reddit.com/r/LocalLLaMA/top/.json?t=day
- https://www.reddit.com/r/ClaudeAI/top/.json?t=day

### Step 2: 话题识别与评分

从采集数据中识别独立话题。跨源讨论同一事件的信号合并为一个话题。

评分（满分 100）：
- 影响力 (30%): 影响范围多大？
- 新鲜度 (25%): 首次披露？
- 内容潜力 (25%): 能写深度长文？
- 时效性 (20%): 必须今天覆盖？

加分：官方源 +5 | ≥3 层交叉验证 +10 | 中国角度 +2 | GitHub 项目 +5
过滤：营销稿、非 AI 新闻、无实质内容 → 排除

### Step 3: 输出

选出 Top 3，写入 input/topic.json：

```json
{
  "mode": "auto_detect",
  "detected_at": "ISO 8601",
  "sources_scanned": {
    "tier_1_official": 0, "tier_2_twitter": 0,
    "tier_3_github": 0, "tier_4_hackernews": 0, "tier_5_reddit": 0
  },
  "top_topics": [
    {
      "rank": 1,
      "title": "Topic Title",
      "title_zh": "话题中文标题",
      "score": 85,
      "score_breakdown": { "impact": 0, "novelty": 0, "depth": 0, "urgency": 0 },
      "bonuses": [],
      "summary": "为什么值得写",
      "key_sources": [
        { "title": "...", "url": "...", "tier": 1, "type": "model_release" }
      ],
      "suggested_angle": "建议切入角度",
      "urgency": "high | medium | low",
      "suggested_angle": "建议切入角度"
    }
  ],
  "selected_topic": 0,
  "no_hot_topic_fallback": null
}
```

如果无 > 70 分话题，设置 no_hot_topic_fallback 推荐长尾话题。

## 注意事项
- 优先：新模型发布、API 变更、融资/收购、开源里程碑
- 每个话题至少 2 个独立来源
- 采集失败的源记录在 raw-sources.json 的 errors 字段，不中断流程
```

---

### 9.2 `.claude/agents/dedup-checker.md`

```markdown
---
name: dedup-checker
description: 话题去重检查。检查候选话题是否与已覆盖内容重复，输出判定报告。
tools: Read, Write, Bash, Grep
model: haiku
---

你是 Hot2Content 的话题去重检查员。

## 输入
- input/topic.json — 候选话题
- output/topic-index.json — 已覆盖话题索引（不存在则全部 PASS）

## 检查流程

### Level 1: URL 精确匹配
将候选话题 key_sources 的 URL 与 topic-index 每个话题的 urls_covered 比对。
命中则记录，但不直接判定 SKIP。

### Level 2: 关键词重叠
从候选话题 title + summary 提取核心关键词（名词、专有名词）。
与 topic-index 每个话题的 keywords 比对。
重叠率 = 重叠词数 / min(新词数, 旧词数)

### Level 3: 综合判定

| 关键词重叠 | < 3天 | 3-7天 | > 7天 |
|-----------|-------|-------|-------|
| < 40% | PASS | PASS | PASS |
| 40%-70% | SKIP | UPDATE* | PASS |
| > 70% | SKIP | SKIP | UPDATE |

*UPDATE 条件：有旧话题未覆盖的第一层官方源

例外：
- 有全新第一层官方源 → 强制 UPDATE
- force: true → 强制 PASS

## 输出

写入 input/dedup-report.json：

```json
{
  "checked_at": "ISO 8601",
  "index_size": 0,
  "results": [
    {
      "rank": 1,
      "title": "话题标题",
      "verdict": "PASS | UPDATE | SKIP",
      "reason": "判定原因（人话）",
      "matched_topic": {
        "topic_id": "旧话题 ID",
        "title": "旧话题标题",
        "date": "2026-02-05",
        "keyword_overlap": 0.75,
        "url_matches": []
      },
      "suggestion": "UPDATE 时建议的新角度"
    }
  ],
  "summary": { "total_checked": 0, "passed": 0, "updated": 0, "skipped": 0 }
}
```

同时更新 input/topic.json：
- 每个话题添加 dedup_verdict 字段
- UPDATE 话题追加 update_angle 和 previous_topic_id
- 更新 selected_topic 指向最高分的 PASS/UPDATE 话题
- 全部 SKIP → selected_topic 设为 -1
```

---

### 9.3 `.claude/agents/researcher.md`

```markdown
---
name: researcher
description: 深度调研。调用 Gemini 2.5 Pro Deep Research API，生成结构化调研报告。
tools: Read, Write, Bash
model: sonnet
---

你是 Hot2Content 的深度调研专家。

## 输入
读取 input/topic.json，根据 mode 和 selected_topic 确定话题：
- auto_detect → top_topics[selected_topic]
- keyword → keyword 字段
- url → source_url 字段

如果 dedup_verdict 为 UPDATE，侧重调研新信息。

## 工作流程

### Step 1: 构造调研 prompt
要求覆盖：背景现状、技术突破、多方观点、数据引用、行业影响。
确保调研报告覆盖多角度观点。

### Step 2: 调用 Gemini
执行: npx tsx scripts/gemini-research.ts

### Step 3: 整理输出
写入 output/research-report.md：

```
# Research Report: [标题]
## 调研时间
## Executive Summary（3-5 句）
## 背景与现状
## 关键突破 / 核心事件
## 技术原理 / 工作机制
## 行业影响与意义
## 风险与争议
## 多方观点
## 引用来源
```

## 质量要求
- 至少 5 个引用源，优先一手来源
- 每个核心观点有来源支撑
- Gemini API 失败 → 回退到 WebFetch 手动调研
```

---

### 9.4 `.claude/agents/narrative-architect.md`

```markdown
---
name: narrative-architect
description: 叙事架构师。将调研报告提炼为 Core Narrative JSON（纯英文）。
  这是所有内容的唯一叙事来源。需要最强推理能力。
tools: Read, Write, Bash
model: opus
---

你是 Hot2Content 的叙事架构师。

## 输入
- output/research-report.md — 调研报告
- input/topic.json — 话题元信息

## 输出
写入 output/core-narrative.json（纯英文 Schema，见 PRD 第 7 节）

## 重要说明
Core Narrative 输出纯英文。中文内容由下游的 Kimi 模型基于此框架独立创作，
不需要你在 JSON 中提供中文字段。

唯一需要包含中文的字段：
- seo.keywords_zh — 中文 SEO 关键词（3-5 个），供 Kimi 使用

## 质量要求

### story_spine
五段缺一不可，形成完整叙事弧：
background → breakthrough → mechanism → significance → risks

### key_points
3-5 个，每个可独立引用（想象被 AI 搜索引擎摘录），彼此不重复。

### FAQ
至少 3 个，覆盖读者最可能的问题。

### diagrams
至少 1 个 Mermaid 图。

### seo
- slug: kebab-case，含主关键词
- meta_title_en: 50-60 chars
- meta_description_en: 150-160 chars
- keywords_en: 3-5 个英文关键词
- keywords_zh: 3-5 个中文关键词

### UPDATE 模式
如果 topic.json 中 dedup_verdict 为 UPDATE：
- is_update: true，previous_topic_id 填入旧话题 ID
- story_spine.background 提及前次覆盖
- 重点放在新信息

## 校验
完成后执行: npx tsx scripts/validate-narrative.ts
失败则根据错误修复后重新输出。
```

---

### 9.5 `.claude/agents/writer-en.md`

```markdown
---
name: writer-en
description: 英文 SEO 博客作家。基于 Core Narrative 生成英文博客。
tools: Read, Write, Bash
model: opus
skills: blog-en
---

你是 Hot2Content 的英文博客作家。

## 输入
- output/core-narrative.json
- skills/blog-en/SKILL.md（如存在）

## 输出
写入 output/blog-en.md

## 文章结构

```markdown
---
slug: {seo.slug}
title: {seo.meta_title_en}
description: {seo.meta_description_en}
keywords: {seo.keywords_en}
date: {created_at}
lang: en
hreflang_zh: /zh/blog/{seo.slug}
---

# {title}

**TL;DR:** {one_liner}

## [Background]
## [Breakthrough]
## [How It Works]
{mermaid diagram}
## [Why It Matters]
## [Risks and Limitations]
## Frequently Asked Questions
{H3 questions}
## References
```

## 写作规范
- 1500-2500 词
- 语气：专业但易读
- SEO 关键词密度 1-2%
- TL;DR 放最前（GEO 优化）
- FAQ 用 H3（JSON-LD friendly）
- 每个观点引用来源
- 禁止: "In this article we will explore", "Let's dive in", "Game-changing"
```

---

### 9.6 `.claude/agents/seo-reviewer.md`

```markdown
---
name: seo-reviewer
description: SEO/GEO 质量审核。检查博客内容的搜索引擎优化质量。
tools: Read, Write, Bash
model: sonnet
---

你是 Hot2Content 的 SEO/GEO 质量审核员。

## 输入
- output/core-narrative.json
- output/blog-en.md
- output/blog-zh.md

## 审核清单

### A. SEO 技术
- frontmatter 完整（slug, title, description, keywords, lang, hreflang）
- meta_title 含主关键词（EN 50-60 chars / ZH 25-30 字）
- meta_description 含关键词（EN 150-160 chars / ZH 70-80 字）
- slug 为 kebab-case 含主关键词
- H1 唯一含关键词
- H2/H3 层级正确
- 关键词密度 1-2%
- hreflang 互指正确

### B. GEO（AI 搜索优化）
- 有 TL;DR / 一句话总结（最前面）
- FAQ 完整，H3 格式
- 关键概念有清晰定义
- 引用带链接
- 结构清晰

### C. 内容质量
- Core Narrative key_points 全覆盖
- story_spine 五段叙事弧完整
- 中英文各自独立成文（中文不是英文的翻译）
- EN 1500-2500 词 / ZH 2000-3000 字

### D. E-E-A-T
- 一手来源引用
- 独到分析
- 数据/案例支撑

## 输出
写入 output/seo-review.md：

```markdown
# SEO/GEO Review Report
## 总评: [PASS ✅ | NEEDS REVISION ⚠️ | FAIL ❌]
## 英文博客
### ✅ 通过项
### ⚠️ 建议优化（附修改建议）
### ❌ 必须修复（附修复方案）
## 中文博客
### ✅ / ⚠️ / ❌
## 评分
- 技术 SEO: /25
- GEO 就绪: /25
- 内容质量: /25
- E-E-A-T: /25
- 总分: /100
```
```

---

## 10. writer-zh (Claude Subagent) 规格

> 中文博客由 Claude Opus 生成（A/B 测试证明优于 Kimi K2.5）。
> Kimi K2.5 脚本 (scripts/kimi-writer.ts) 保留给未来视频脚本等轻量内容。

### 输入

writer-zh 同时读取：
1. `output/core-narrative.json` — 英文叙事框架
2. `output/research-report.md` — 完整调研报告
3. `skills/blog-zh/SKILL.md` — 中文博客规范

### 写作原则
- **不是翻译**：基于同一话题独立创作中文内容
- **双输入**：Core Narrative 提供结构框架，Research Report 提供深度素材
- 用中文读者熟悉的比喻和类比
- 专业术语首次出现标注英文：大语言模型（LLM）
- 语气像懂技术的朋友在科普，不是论文也不是新闻稿

### 写作规范
- 2000-3000 字
- 段落短，适合手机阅读
- 中文标点（，。！？""）
- 避免翻译腔（"值得注意的是"、"让我们来看看"）

### 输出
`output/blog-zh.md`

### 参考
当前网站上的 Claude Agent Teams 中文博客是此方案的成功案例。

---

## 11. scripts/twitter-collector.ts 规格

> 调用 twitterapi.io 自动采集 Targeted Accounts 的推文。

### 输入

脚本接受可选参数：
- `--accounts` — 指定采集哪些账号（默认 Tier 1 + Tier 2 全部）
- `--hours` — 时间窗口（默认 48 小时）

### 采集逻辑

```typescript
// 伪代码
const TIER_1_OFFICIAL = ["OpenAI", "AnthropicAI", "GoogleAI", "AIatMeta", "MistralAI", "xai"];
const TIER_2_FOUNDERS = ["sama", "DarioAmodei", "ylecun", "elonmusk", "JeffDean", "karpathy"];
const TIER_3_DEVTOOLS = ["OpenAIDevs", "huggingface", "LangChainAI"];

for (const account of allAccounts) {
  const tweets = await twitterApiIo.getUserTweets(account, { since: cutoffDate });

  for (const tweet of tweets) {
    // Engagement 过滤
    if (isTier1(account)) {
      // 官方账号：全部采集（breaking news 无门槛）
      collect(tweet);
    } else if (tweet.likes >= 100) {
      // 非官方：100+ likes
      collect(tweet);
    }

    // Thread 检测
    if (tweet.isThread) {
      const threadTweets = await twitterApiIo.getThread(tweet.id);
      tweet.thread_content = threadTweets;
    }
  }
}
```

### 输出

返回 JSON 结构，由 trend-scout 读取：

```json
{
  "collected_at": "ISO 8601",
  "accounts_checked": 15,
  "accounts_with_content": 8,
  "items": [
    {
      "account": "@OpenAI",
      "account_tier": 1,
      "content": "推文全文",
      "url": "https://x.com/OpenAI/status/...",
      "timestamp": "ISO 8601",
      "engagement": { "likes": 5200, "retweets": 1100, "replies": 340 },
      "is_thread": false,
      "thread_content": [],
      "links": ["https://openai.com/blog/..."]
    }
  ],
  "errors": []
}
```

### 异常处理

```typescript
try {
  const result = await twitterApiIo.getUserTweets(account);
} catch (error) {
  // API 限流 → 等待后重试
  if (error.status === 429) { await sleep(30000); retry(); }
  // 其他错误 → 记录并跳过该账号
  errors.push({ account, error: error.message });
}
```

### 运行方式

```bash
npx tsx scripts/twitter-collector.ts
npx tsx scripts/twitter-collector.ts --accounts "OpenAI,AnthropicAI" --hours 24
```

需要环境变量：`TWITTER_API_KEY`（twitterapi.io）

---

## 12. 编排命令

### 12.1 `.claude/commands/hot2content.md`

```markdown
---
name: hot2content
description: 运行 Hot2Content 完整内容生产 pipeline。
  用法: /hot2content [话题关键词|URL|留空自动检测]
---

执行 Hot2Content pipeline。

## 确定输入模式

**模式 A — 关键词：** 用户附带文字（非 URL）
→ 写入 input/topic.json: { "mode": "keyword", "keyword": "...", "created_at": "ISO" }
→ 跳到 Step 2

**模式 B — URL：** 用户提供 URL
→ 写入 input/topic.json: { "mode": "url", "source_url": "...", "created_at": "ISO" }
→ 跳到 Step 2

**模式 C — 自动：** 用户没有指定话题
→ 进入 Step 1

---

## Step 1: 热点发现（仅模式 C）

用 Task tool 启动 **trend-scout**：
"扫描 5 层信息源，识别 AI/科技热点，输出 Top 3 到 input/topic.json。"

等待完成。向用户展示 Top 3，询问选择（默认 #1）。

---

## Step 2: 去重检查

用 Task tool 启动 **dedup-checker**：
"读取 input/topic.json 和 output/topic-index.json，检查去重，输出 input/dedup-report.json。"

等待完成。读取 dedup-report.json：
- 选中话题 SKIP → 看有无其他 PASS/UPDATE 话题；全部 SKIP → 停止
- UPDATE → 告知用户"跟进更新"，继续
- PASS → 继续

---

## Step 3: 深度调研

用 Task tool 启动 **researcher**：
"读取 input/topic.json 的选定话题，调用 Gemini Deep Research，输出 output/research-report.md。"

等待完成。确认文件存在且非空。

---

## Step 4: 提炼 Core Narrative

用 Task tool 启动 **narrative-architect**：
"读取 output/research-report.md 和 input/topic.json，提炼纯英文 Core Narrative，写入 output/core-narrative.json，完成后执行 npx tsx scripts/validate-narrative.ts。"

等待完成。校验失败则要求修复，最多重试 2 次。

---

## Step 5: 生成博客内容（并行）

**同时**执行：

**Task A — writer-en (Claude Subagent)：**
"读取 output/core-narrative.json，生成英文 SEO 博客 → output/blog-en.md"

**Task B — writer-zh (Claude Subagent)：**
"读取 output/core-narrative.json + output/research-report.md，生成中文博客 → output/blog-zh.md"

等待两者都完成。
确认两个 .md 文件都存在且非空。

---

## Step 6: SEO 审核

用 Task tool 启动 **seo-reviewer**：
"审核 core-narrative.json + blog-en.md + blog-zh.md → output/seo-review.md"

等待完成。
- PASS (≥80): 继续
- 有 ❌ 项:
  - 英文问题 → 发给 writer-en 修复
  - 中文问题 → 发给 writer-zh 修复
  - 重新审核（最多 1 次）
- 仅 ⚠️: 展示建议，继续

---

## Step 7: 更新索引

将本次话题追加到 output/topic-index.json：

```json
{
  "topic_id": "from core-narrative",
  "title": "from core-narrative",
  "date": "YYYY-MM-DD",
  "keywords": "merge seo.keywords_en + keywords_zh",
  "urls_covered": "from references",
  "slug": "from seo.slug",
  "status": "published",
  "seo_score": "from review"
}
```

如果 topic-index.json 不存在，创建: { "topics": [] }

---

## Step 8: 完成报告

```
✅ Hot2Content Pipeline 完成

📌 话题: {title}
📝 模式: A/B/C | 去重: PASS/UPDATE
📊 SEO: XX/100

📂 文件:
  - output/research-report.md (Gemini 调研)
  - output/core-narrative.json (叙事中枢)
  - output/blog-en.md (Claude 英文博客, XXXX 词)
  - output/blog-zh.md (Kimi 中文博客, XXXX 字)
  - output/seo-review.md (审核报告)
```
```

---

### 12.2 `.claude/commands/hot2content-scout.md`

```markdown
---
name: hot2content-scout
description: 只运行热点发现 + 去重检查，不生成内容。
---

## Step 1
用 Task tool 启动 **trend-scout**。等待完成。

## Step 2
用 Task tool 启动 **dedup-checker**。等待完成。

## Step 3
向用户展示：Top 3 话题及评分 + 去重结果 + 推荐。
询问是否对某个话题运行完整 /hot2content pipeline。
```

---

## 13. CLAUDE.md

```markdown
# Hot2Content — AI Content Engine

## 概述
输入话题 → AI 深度调研 → Core Narrative → 多平台内容 → SEO/GEO 长期流量

## 技术栈
- 热点采集: WebFetch + twitterapi.io (scripts/twitter-collector.ts)
- 调研: Gemini 2.5 Pro Deep Research API (scripts/gemini-research.ts)
- 英文内容: Claude Opus (writer-en subagent)
- 中文内容: Claude Opus (writer-zh subagent)
- Newsletter: Gemini 2.0 Flash (scripts/daily-scout.ts)
- 编排: Claude Code Subagents (Task tool)
- 质量审核: Claude Sonnet (seo-reviewer subagent)

## Pipeline
### Newsletter (每日自动)
daily-scout.ts → content/newsletters/*.md → Vercel 自动部署

### Blog (手动触发)
trend-scout → dedup-checker → researcher → narrative-architect → (writer-en ∥ writer-zh) → seo-reviewer → 更新索引

## 核心约定
- Core Narrative (output/core-narrative.json) 是纯英文叙事中枢
- 中文博客由 Claude Opus 基于英文 Core Narrative + 调研报告独立创作，不是翻译
- output/topic-index.json 是去重数据源，pipeline 完成后追加，勿覆盖

## 运行
- /hot2content [话题] — 完整 pipeline
- /hot2content https://... — URL 模式
- /hot2content — 自动热点检测
- /hot2content-scout — 仅发现话题

## 环境变量
- GEMINI_API_KEY — Gemini 2.5 Pro API
- TWITTER_API_KEY — twitterapi.io API

## 质量标准
- Core Narrative 必须通过 validate-narrative.ts
- SEO ❌ 项必须修复
- 所有引用含来源链接
```

---

## 14. Clawdbot 集成

```bash
/hot2content                → 模式 C（自动）
/hot2content <关键词>       → 模式 A
/hot2content <URL>          → 模式 B
/scout                      → 仅热点发现

# 执行
echo '{"mode":"keyword","keyword":"$TOPIC","created_at":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' > input/topic.json
claude -p "运行 /hot2content pipeline" --dangerously-skip-permissions
```

---

## 15. Newsletter Pipeline（已实现）

Newsletter 是独立于 Blog Pipeline 的轻量级日报系统。

### 架构
```
crontab (每天 UTC 01:00 / 北京 09:00)
  → scripts/daily-newsletter.sh
    → scripts/daily-scout.ts (Gemini 2.0 Flash)
      → 5层信息源采集 + AI 编辑生成
    → content/newsletters/YYYY-MM-DD.md
    → git commit + push
      → Vercel 自动部署
```

### 特性
- **跨天去重**：读取最近 3 天 newsletter 的 URL，过滤重复新闻
- **AI 标题**：Gemini 生成新闻风格 headline（非模板化日期标题）
- **品牌统一**：LoreAI Daily

### 未来计划
- Weekly Newsletter（每周深度总结，需要数据库支持）

---

## 16. 数据库设计（Phase 2）

### 为什么需要数据库
- Newsletter 跨天去重需要结构化数据
- Weekly 总结需要聚合查询
- Blog Pipeline 的 topic-index.json 扩展性有限
- 未来 SEO 关键词策略 + 多渠道分发需要关系数据

### 技术选型
**SQLite** — 单文件，零运维，够用。迁移到 PostgreSQL 成本极低（SQL 语法 95% 兼容）。

### Schema

```sql
-- 1. 原始新闻采集
CREATE TABLE news_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT UNIQUE NOT NULL,
  source TEXT,
  source_tier INTEGER,
  category TEXT,
  score INTEGER,
  score_breakdown TEXT,  -- JSON
  raw_summary TEXT,
  detected_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 内容（newsletter + 博客 + 未来 SEO 文章）
CREATE TABLE content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,     -- 'newsletter', 'blog_en', 'blog_zh', 'seo_article'
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  body_markdown TEXT,
  language TEXT,
  status TEXT DEFAULT 'draft',
  source_type TEXT,       -- 'auto', 'manual', 'programmatic'
  seo_title TEXT,
  seo_description TEXT,
  seo_score INTEGER,
  hreflang_pair_id INTEGER REFERENCES content(id),
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. 内容 ↔ 新闻关联（多对多）
CREATE TABLE content_sources (
  content_id INTEGER REFERENCES content(id),
  news_item_id TEXT REFERENCES news_items(id),
  PRIMARY KEY (content_id, news_item_id)
);

-- 4. 关键词策略
CREATE TABLE keywords (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT NOT NULL,
  keyword_zh TEXT,
  type TEXT,             -- 'trending', 'longtail'
  search_volume INTEGER,
  difficulty INTEGER,
  score INTEGER,
  search_intent TEXT,      -- 'informational', 'comparison', 'tutorial'
  status TEXT DEFAULT 'backlog',
  content_id INTEGER REFERENCES content(id),
  parent_research_id INTEGER REFERENCES research(id),  -- 衍生自哪篇调研
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. 分发记录
CREATE TABLE distributions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id INTEGER REFERENCES content(id),
  channel TEXT,          -- 'website', 'twitter', 'youtube', 'xiaohongshu'
  format TEXT,           -- 'post', 'thread', 'video_script', 'short_video'
  channel_url TEXT,
  distributed_at DATETIME
);

-- 6. 调研 & Core Narrative
CREATE TABLE research (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id INTEGER REFERENCES content(id),
  topic_json TEXT,
  research_report TEXT,
  core_narrative TEXT,
  seo_review TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. 话题索引（替代 topic-index.json）
CREATE TABLE topic_index (
  topic_id TEXT PRIMARY KEY,
  title TEXT,
  date DATE,
  keywords TEXT,         -- JSON array
  urls_covered TEXT,     -- JSON array
  slug TEXT,
  status TEXT,
  seo_score INTEGER
);
```

---

## 17. 内容金字塔策略

### 三层内容体系

```
        ▲ Tier 1: 深度文章
       ╱ ╲  Gemini Deep Research + Claude Opus
      ╱   ╲  $1-2/篇 · 1-2篇/周
     ╱─────╲
    ╱ Tier 2: 标准文章 ╲
   ╱  Brave Search + WebFetch  ╲
  ╱  + Claude Sonnet · ~$0.1/篇 ╲
 ╱     3-5篇/周                   ╲
╱───────────────────────────────────╲
╱  Tier 3: Programmatic SEO 批量文章  ╲
╱  LLM 关键词扩展 + Gemini Flash       ╲
╱  ~$0.02/篇 · 10-20篇/周               ╲
╱─────────────────────────────────────────╲
```

| | Tier 1 深度 | Tier 2 标准 | Tier 3 批量 |
|---|---|---|---|
| **调研** | Gemini Deep Research | Brave Search + WebFetch | 仅 Brave snippets |
| **写作** | Claude Opus | Claude Sonnet | Gemini Flash |
| **成本** | $1-2/篇 | ~$0.1/篇 | ~$0.02/篇 |
| **质量** | 深度分析，独家见解 | 中等，有来源支撑 | 基础，覆盖关键词 |
| **频率** | 1-2篇/周 | 3-5篇/周 | 10-20篇/周 |
| **用途** | 品牌建设，高价值流量 | 中等竞争关键词 | 长尾词，铺量 |

### 关键词来源与策略

LoreAI 的关键词不依赖单一来源，而是从 5 个渠道持续汇入：

```
┌──────────────────────────────────────────────────────────┐
│                    🔑 关键词来源                           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  来源 1: 📰 Newsletter 热点提取                           │
│  ├─ 每日 daily-scout 采集的 news_items                    │
│  ├─ 提取高分话题的核心关键词                                │
│  └─ 类型: trending                                       │
│                                                          │
│  来源 2: 🔬 Research Report 衍生                          │
│  ├─ Tier 1 深度调研完成后自动提取                           │
│  ├─ 一篇调研 → 5-10 个衍生话题                             │
│  └─ 类型: longtail, 关联 parent_research_id               │
│                                                          │
│  来源 3: 🔍 Brave Search "People Also Ask"               │
│  ├─ 做 Tier 2 调研时，搜索结果中的相关问题                   │
│  ├─ 真实用户搜索意图，SEO 价值高                            │
│  └─ 类型: longtail (informational / tutorial)             │
│                                                          │
│  来源 4: 🤖 LLM 基于用户画像扩展                           │
│  ├─ 输入: 话题 + 目标读者画像                               │
│  ├─ 输出: 对比类、教程类、问答类、年份类关键词                 │
│  ├─ 中英文各 5-10 个                                      │
│  └─ 模型: Gemini Flash (~$0.001/次)                       │
│                                                          │
│  来源 5: 📊 手动导入                                       │
│  ├─ SEO 工具 (Ahrefs / SEMrush / Google Search Console)  │
│  ├─ 竞品分析 (看竞品排名的关键词)                            │
│  └─ 类型: longtail, 含 search_volume + difficulty          │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                    ↓ 汇入 keywords 表                     │
│                                                          │
│  LLM 去重 + 评分 + 标注搜索意图                             │
│  (informational / comparison / tutorial)                  │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                    ↓ 自动选题消费                           │
│                                                          │
│  每周:                                                    │
│  ├─ 1-2 篇 Tier 1 (最热 trending, Gemini Deep Research)  │
│  ├─ 3-5 篇 Tier 2 (高分 longtail, Brave + Sonnet)        │
│  └─ 10-20 篇 Tier 3 (批量 longtail, Flash)               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

#### 目标用户画像（关键词扩展参考）
- **AI 开发者**：关注 API、SDK、benchmark、教程
- **产品经理**：关注产品对比、定价、用例
- **技术管理者**：关注选型决策、ROI、团队效率

### 调研资产复用（一鱼多吃）

每完成一篇 Tier 1 深度文章后，自动从 research report 中提取衍生话题：

```
Tier 1 Blog Pipeline 完成
    │
    ▼
读取 research 表中的 research_report
    │
    ▼
LLM 提取衍生话题 + 长尾关键词 (Gemini Flash)
    │  例: "Opus 4.6 vs GPT-5.3" →
    │    - "2026年最佳AI编程助手选购指南"
    │    - "Claude Opus 4.6 上手教程"
    │    - "AI编程工具定价对比 2026"
    ▼
入库 keywords 表 (status='backlog', parent_research_id=xxx)
    │
    ▼
Tier 2/3 pipeline 自动消费
```

### Tier 2 标准文章 Pipeline

```
长尾关键词 (从 keywords 表取 status='backlog')
    → 检查是否有关联的 research_report (parent_research_id)
    → 有: 提取相关片段作为基础素材
    → Brave Search 补充该关键词特有信息 (top 10 结果)
    → WebFetch 前 3-5 篇
    → Claude Sonnet 生成 1500-2000 词 (输入: research 片段 + Brave 结果)
    → content/blogs/{lang}/{slug}.md
    → 自动发布
```

### Tier 3 批量文章 Pipeline

```
长尾关键词 (从 keywords 表取 longtail)
    → 如有关联 research_report: 仅提取 1-2 段相关背景
    → Brave Search snippets (仅摘要，不 WebFetch)
    → Gemini Flash 生成 800-1200 词
    → content/blogs/{lang}/{slug}.md
    → 自动发布
```

### 长尾关键词 Prompt 模板

```
话题: {topic}
目标读者: AI 开发者、产品经理、技术管理者
网站: loreai.dev

生成:
1. 5-10 个英文长尾关键词
2. 5-10 个中文长尾关键词
3. 每个标注搜索意图: informational / comparison / tutorial

优先:
- 对比类: "X vs Y"
- 教程类: "how to use X"
- 问答类: "what is X"
- 年份类: "best X 2026"
```

### 内容类型生成策略

> **模型选择待定**：Tier 2/3、FAQ、Glossary 等内容生成的模型（Gemini Flash vs Claude Sonnet）需先做 A/B 质量测试再决定。Bella 的 Claude Code Max Plan 包含 Sonnet 额度，如果质量够用则优先用 Sonnet（已有额度，边际成本更低）。

**FAQ 页面** (`/faq/{topic}`)
- 输入：Brave Search "People Also Ask" + Research Report Q&A + Tier 1 博客 FAQ 部分
- 模型：待定（Flash vs Sonnet A/B 测试后决定）
- 长度：每页 5-8 个问答，每个答案 100-300 字
- 格式：必须包含 FAQPage JSON-LD 结构化数据 → Google 富摘要
- 触发：Tier 1 完成后自动提取问题 → 批量生成
- 成本：~$0.005/页
- 脚本：`scripts/extract-faq.ts`

**Glossary Wiki** (`/glossary/{term}`)
- 输入：Research Report 中的专业术语（LLM 自动提取）
- 模型：待定（Flash vs Sonnet A/B 测试后决定）
- 长度：每词条 300-500 字
- 格式：固定模板（定义 → 为什么重要 → 工作原理 → 相关术语 → 相关文章链接）
- 特殊：正文中的术语自动内链到对应 glossary 页
- 触发：Tier 1 完成后提取 3-5 个术语 → 检查已有 → 新增
- 成本：~$0.005/词条
- 脚本：`scripts/extract-glossary.ts`

**Compare 对比表** (`/compare/{x-vs-y}`)
- 输入：Research Report 中的 benchmark 数据 + 定价 + 功能列表
- 模型：Flash 提取数据 + 模板渲染（大部分不需 LLM 写正文）
- 格式：对比表（HTML table）+ 总结 + "谁该选谁" + FAQ
- 特殊：可更新 — 新数据来后更新同一页面
- 触发：当 research 包含 2+ 产品对比数据时自动生成
- 成本：~$0.01/页
- 脚本：`scripts/extract-compare.ts`

**月度 Roundup** (`/blog/{month}-ai-roundup`)
- 输入：当月所有 research reports + newsletters + 博客
- 模型：Claude Sonnet（需综合能力）
- 长度：2000-3000 字
- 格式：按主题分区 + 数据亮点 + 下月预测
- 触发：每月 1 号 cron 自动生成
- 成本：~$0.05/篇
- 脚本：`scripts/generate-roundup.ts`

### 站点 URL 结构

```
loreai.dev
├─ /newsletter          ← 每日日报
├─ /blog                ← Tier 1 深度文章 (品牌橱窗)
├─ /resources           ← Tier 2/3 文章 (可浏览 + SEO)
├─ /glossary            ← 术语 Wiki
├─ /compare             ← 对比表
├─ /faq                 ← FAQ 合集 (Google 富摘要)
```

### AI 搜索引擎优化 (AEO)

传统 SEO 优化 Google 排名，AEO 优化被 AI 搜索引擎（Perplexity、ChatGPT Search、Google AI Overview）引用的概率。

**llms.txt**
- 网站根目录放置 `llms.txt`，向 AI 爬虫声明网站结构、内容类型、更新频率
- 类似 robots.txt，但面向 LLM 爬虫

**引用优化格式规则**
- 每篇文章开头 50 字内包含核心结论（AI 摘要优先抓取）
- 关键数据用"数据摘要块"格式（加粗数字 + 上下文）
- 使用清晰的编号列表和对比表（AI 容易结构化引用）
- Writer skill 中加入这些格式规则

**Schema Markup 清单**
- `Article` + `dateModified`：所有博客文章（时效性信号）
- `FAQPage`：FAQ 页面 → Google 富摘要
- `HowTo`：教程类内容
- `Dataset`：Compare 对比表、原创数据
- `ItemList`：列表页（/blog, /resources, /glossary）
- `BreadcrumbList`：所有页面（站点结构信号）

**Topic Cluster 内链策略**
- 每个 Tier 1 主题为"支柱页"（Pillar Page）
- Tier 2/3 + FAQ + Glossary 自动链接回支柱页
- 每篇文章底部自动生成 "Related Reads"（基于 keywords 表的关联）
- 目标：形成主题权威性，AI 引擎更倾向引用"权威集群"

**原创数据：LoreAI AI Index**
- 每月从 news_items 表聚合统计（模型发布数、融资事件、开源项目等）
- 生成 "State of AI" 数据页面
- 原创数据是 AI 引擎最爱引用的内容类型

**时效性信号**
- 所有页面必须有 `dateModified`（AI 引擎优先引用最新内容）
- Compare 页面定期更新数据 → 更新 dateModified
- 月度 Roundup 天然具有时效性

---

## 18. Roadmap

### Phase 1 ✅ 已完成 — MVP
- [x] Newsletter 自动采集 + 发布 (daily-scout.ts + crontab)
- [x] Blog Pipeline 跑通 (orchestrator + Gemini research + Claude writer)
- [x] Next.js 网站 + Vercel 部署 (loreai.dev)
- [x] A/B 测试确定最佳写作方案 (双输入 + Claude Opus)

### Phase 2 🔜 — 数据库化
- [ ] SQLite 数据库初始化
- [ ] daily-scout.ts 采集数据入库 (news_items)
- [ ] Newsletter 和博客内容入库 (content)
- [ ] 基于数据库的去重（替代文件正则匹配）
- [ ] 网站从数据库读取（替代读 markdown 文件）

### Phase 3 — Newsletter 增强
- [ ] Weekly Newsletter（每周深度总结）
- [ ] 邮件订阅功能
- [ ] Telegram 推送通知

### 执行计划与优先级

#### 本周 — 零成本 SEO 基建
- [ ] 添加 `llms.txt` 到网站根目录
- [ ] 所有博客加 `Article` JSON-LD Schema + `dateModified`
- [ ] Writer skill 加"引用优化格式"规则（数据摘要块）
- [ ] 创建 `/resources` 页面（Tier 2/3 文章列表）→ Bella 看一眼布局
- [ ] `/blog` 列表页过滤只显示 tier: 1

#### 下周 — FAQ（第一个内容类型测试）
- [ ] 改造 Brave Search 脚本，采集 "People Also Ask"
- [ ] 开发 `scripts/extract-faq.ts`
- [ ] 生成 3 个 FAQ 样本 → **Bella Review**
- [ ] A/B 测试: Gemini Flash vs Claude Sonnet → **Bella 选模型**
- [ ] 根据反馈调整 prompt → 再生成 3 个确认
- [ ] 确认后小批量生成 10 个 → Bella 抽查 2-3 个
- [ ] FAQ 页面模板 + FAQPage JSON-LD Schema
- [ ] 通过后开启自动生产

#### 第3周 — Glossary Wiki
- [ ] 开发 `scripts/extract-glossary.ts`
- [ ] 生成 3 个样本 → **Bella Review + A/B 测试**
- [ ] 调整 → 小批量 15 个 → 抽查
- [ ] Glossary 页面模板 + 自动内链
- [ ] 通过后开启自动生产

#### 第4周 — Compare + Tier 3
- [ ] 开发 `scripts/extract-compare.ts`
- [ ] 生成 2 个样本 → **Bella Review**
- [ ] Tier 3 批量脚本 + 5 个样本 → **Bella Review + A/B**
- [ ] 调整后批量生产

#### 月末 — Roundup + 回顾
- [ ] 月度 Roundup 第一期 → **Bella Review**
- [ ] 回顾所有内容类型质量，调整策略

#### 持续
- [ ] 每周 1 篇 Tier 1 深度博客 → 自动衍生所有内容类型
- [ ] 每篇 Tier 1 完成后 Bella review 深度文章
- [ ] 每周抽查 1-2 篇自动生成的内容（抽样质检）

### 人工 Review 流程

每种新内容类型上线前必须经过以下流程：

1. **开发脚本** + 生成 3 个样本
2. **Bella Review**: 质量OK? 哪里要改?
3. **A/B 模型测试**: Flash vs Sonnet，Bella 选模型
4. **调整 Prompt** → 再生成 3 个确认
5. **小批量** (10-15 个) → Bella 抽查 2-3 个
6. **通过** → 开启自动批量生产
7. **持续质检** → 每周抽查 1-2 个

适用于: FAQ, Glossary, Compare, Tier 2/3 文章, Roundup

### Phase 5 — 多渠道分发
- [ ] distributions 表
- [ ] 博客 → Twitter thread（自动生成）
- [ ] 博客 → 口播视频脚本
- [ ] 博客 → 小红书图文
- [ ] 博客 → YouTube 视频

### Phase 6 — 高级功能
- [ ] SEO 审核自动返工
- [ ] Twitter/X 扩展到 Tier 3-5 + Thread 自动展开
- [ ] Reddit 信息源集成
- [ ] 用户 dashboard（内容管理后台）
- [ ] 邮件订阅 + Telegram 推送

---

## Deep Review (2026-02-10)

### 一、做得好的部分

- Newsletter Pipeline 稳定运行（每日01:00 UTC，EN+ZH，Opus写作+Flash fallback，监控到位）
- 内容金字塔6层全部建成（66页面，生成+验证+发布全链路）
- 博客Pipeline E2E验证通过（Research→Narrative→Writers→Validate→Publish）
- 技术债务意识好（AGENTS.md规范，Git source of truth，Edit>Write）

### 二、断点风险

- 🔴 Gemini Deep Research不稳定（卡35min）→ Plan B: Brave Search + Flash
- 🔴 Claude CLI token过期风险 → 需要Telegram告警(#22)
- 🟡 Blog Pipeline手动触发 → #24自动选题
- 🟡 Tier 2/3衍生内容没有自动触发 → orchestrator自动调用
- 🟡 EN/ZH内容不对称（EN:9, ZH:5）→ 补ZH旧内容

### 三、内容价值问题（最重要）

- 🔴 话题太窄 — 几乎全是Claude/GPT对比，像Anthropic粉丝站
- 🔴 没有原创洞察 — 全靠LLM生成，内容同质化
- 🟡 缺少实操内容 — 需要教程/代码示例/实战案例
- 🟡 没有社区验证 — 无GSC数据
- 🟡 FAQ/Glossary太模板化

### 四、三阶段Roadmap

- **Phase A（本周）：** 关闭已完成Issues + Telegram告警(#22) + Buttondown邮件(#28) + GSC注册(#13)
- **Phase B（下周）：** 话题多样化 + Bella个人视角(AI PM→AI Engineer实战笔记) + SKILL.md few-shot + Gemini fallback
- **Phase C（下下周）：** 自动选题(#24) + 月度Roundup(#10) + 衍生内容自动触发 + Weekly Newsletter(#2)

### 五、核心判断

最大风险不是技术而是内容同质化。Pipeline很强但需要差异化内容。Bella个人视角（AI PM转AI Engineer）是不可替代的差异化。
