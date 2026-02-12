# LoreAI Newsletter 深度优化策略

> **版本：** v1.0  
> **日期：** 2026-02-12  
> **作者：** 内容产品分析 + AI 工程分析  
> **目标：** 将 LoreAI Daily 从「合格的自动化 AI 日报」升级为「有灵魂的 AI Newsletter 品牌」

---

## 目录

1. [Part 1: LoreAI 当前系统分析](#part-1-loreai-当前系统分析)
2. [Part 2: Ben's Bites 深度分析](#part-2-bens-bites-深度分析)
3. [Part 3: 竞品交叉对比](#part-3-竞品交叉对比)
4. [Part 4: 差距分析](#part-4-差距分析)
5. [Part 5: 完整优化策略](#part-5-完整优化策略)

---

## Part 1: LoreAI 当前系统分析

### 1.1 技术架构总览

LoreAI 的 Newsletter Pipeline 由 `daily-newsletter.sh` 编排，分三步：

```
Step 1: daily-scout.ts --raw-only   → 采集原始数据 → raw-items-{date}.json
Step 2: agent-filter.ts             → Claude Opus 语义筛选 → filtered-items-{date}.json  
Step 3: daily-scout.ts --from-filtered → Claude Opus 写稿 → digest-{date}.md + digest-zh-{date}.md
```

### 1.2 数据源覆盖

**T1 官方博客（9 个源）：**
- Anthropic News + Engineering（两个独立爬虫）
- Google AI Blog（RSS）
- HuggingFace Blog（RSS + likes 过滤，≥30 likes）
- OpenAI, DeepMind, Meta AI, Mistral, xAI, Cohere（配置了但大多无 RSS，靠 HTML 解析）

**T2 Twitter/X（31 个账号 + 5 条搜索）：**
- Tier 1 官方：AnthropicAI, OpenAI, GoogleAI, MistralAI, AIatMeta 等
- Tier 1 个人：Anthropic 团队成员（bcherny, alexalbert__, ErikSchluntz, mikeyk, felixrieseberg）
- Tier 2 KOL：sama, karpathy, ylecun, DrJimFan, simonw, chipro
- 搜索查询：`Claude Code`, `AI coding agent`, `AI agent framework`, `MCP server`, `open source LLM`

**T3 HuggingFace Trending：** API `sort=likes` top 10

**T4 Hacker News：** Top 30，AI 关键词过滤 + score > 50

**T5 GitHub Trending：** HTML 解析 daily trending，AI 关键词过滤

### 1.3 筛选机制

**Agent Filter（agent-filter.ts）：**
- Claude Opus 从 raw items 中选 8-12 条
- 分类：LAUNCH / TOOL / TECHNIQUE / RESEARCH / INSIGHT / BUILD
- 输出：agent_score, why_it_matters, action
- 有规则 fallback（API 失败时按 tier + score 排序取 top 12）

**问题：** Agent Filter 的 prompt 没有参考 Ben's Bites 的选题标准，缺少「这条新闻是否有故事性」的判断维度。

### 1.4 写稿机制

**英文（Claude Opus via CLI pipe）：**
- 读 filtered items，按 6 个 category 分组
- 输出 markdown，包含 MODEL / APP / DEV / TECHNIQUE / PRODUCT / MODEL LITERACY / PICK OF THE DAY
- 遵循 `skills/newsletter-en/SKILL.md`

**中文（Claude Opus via CLI pipe）：**
- 同样的 raw data，独立的中文 prompt
- 栏目：模型动态 / 产品应用 / 开发工具 / 技术实践 / 开源前沿 / 概念科普 / 今日精选

### 1.5 产出质量评估

以 2026-02-12 英文版为样本分析：

**优点：**
- 覆盖全面：7 个 section，15+ 条新闻
- 每条有 source attribution 和链接
- MODEL LITERACY 和 PICK OF THE DAY 是好的差异化尝试
- 中文版不是翻译，有独立视角

**问题（对比 Ben's Bites 后凸显）：**

| 维度 | LoreAI 现状 | 问题 |
|------|------------|------|
| **标题** | `🌅 AI Daily Digest — 2026-02-12` | 日期标题，零吸引力 |
| **开头** | 无引言，直接进入第一个 section | 没有叙事开场，没有「今天最大的故事是什么」 |
| **语气** | 专业但机器味明显 | 缺乏人格、观点、幽默 |
| **选题** | 平铺罗列，无主次 | 没有头条，没有「这是今天最重要的事」的判断力 |
| **深度** | 每条 1-2 句 | 缺少 Ben's Bites 式的「个人使用体验」和「行业洞察」 |
| **个人化** | 零 | 完全没有作者的声音、经历、观点 |
| **重复** | 跨天内容重复率高 | 02-10、02-11、02-12 三期有大量相同新闻（Transformers.js v4、Nemotron ColEmbed V2） |

**具体例子对比：**

LoreAI 写 Opus 4.6：
> "Claude Opus 4.6 gets 2.5x speed boost — Anthropic's teams have been dogfooding a significantly faster Opus 4.6 variant..."

Ben's Bites 写 Opus 4.6：
> "We have two new coding models: Opus 4.6 from Anthropic and GPT-5.3-Codex from OpenAI. My feed is loving GPT-5.3-Codex more... I prefer it some of the time; when opus gets stuck or seems stupid about something → get codex to sort it out, if I know what I want and need it to just get done → codex, for planning, brainstorming and anything that needs resources → opus."

差距一目了然：**LoreAI 在报道事实，Ben 在分享使用经验。**

---

## Part 2: Ben's Bites 深度分析

### 2.1 内容结构

分析三期 Ben's Bites（Jan 27, Feb 5, Feb 10），结构高度一致：

```
1. 个人化开场（3-5 段）
   - 本周最大的故事 + Ben 的个人看法
   - 第二个重要话题 + 个人经历/观点
   - 偶尔推广社区/个人项目

2. Signals（5-8 条）
   - 短信号，每条 1-2 句
   - 产品更新、功能发布等
   - 无深度分析，纯信息

3. [赞助商内容]（自然融入）

4. What I'm consuming（8-12 条）
   - 长文推荐，每条 1 句描述
   - 涵盖文章、视频、播客

5. Tools and demos（5-8 条）
   - 工具推荐，每条 1 句
   - 有赞助标记（*号）

6. [Dev Dish]（偶尔出现）
   - 开发者专属的技术更新
```

### 2.2 选题逻辑

**头条（开场部分）的选题标准：**
1. **行业叙事冲突** — Claude vs ChatGPT 广告大战（Feb 5）、OpenAI vs Anthropic 模型竞赛（Feb 10）
2. **个人体验共鸣** — Karpathy 的 vibe coding 反思（Jan 27）
3. **趋势拐点** — skills 生态兴起（Jan 27）
4. **永远有个人角度** — "I prefer it some of the time"、"I built something small"

**Signals 的选题标准：**
- 产品功能更新（Droid plugins, Claude /insights, Mistral Voxtral）
- 值得知道但不值得深写的信息
- 每条 < 30 字

**What I'm consuming 的选题标准：**
- 深度长文（非新闻）
- 思考类内容（essays, talks, interactive essays）
- 实战经验分享

**Tools and demos 的选题标准：**
- 可以立即体验的工具
- 开源项目
- 有赞助的工具（标 *）

### 2.3 调性/Voice 深度分析

Ben 的写作有以下极其鲜明的特征：

**1. 第一人称贯穿始终**
- "I built something small that I needed..."
- "My feed is loving GPT-5.3-Codex more"
- "I prefer it some of the time"
- "I can't code, but I build"

**2. 坦诚到近乎脆弱**
- "I failed at learning to code the traditional way"
- "when opus gets stuck or seems stupid about something"
- 公开承认 Claude 的广告行为 "feels off-brand"

**3. 有判断力的观点表达**
- "Do they have a point? Yes. Do they look like crybabies? Also, yes."
- "To me, Frontier feels like an attempt to capture those users"
- "If you're building Docker for agents, I want to invest."

**4. 对话感**
- 句式短促，口语化
- 大量使用 dash（—）和括号做补充
- "Ooofff." 这种拟声词

**5. 投资人视角穿插**
- "If you're building X, I want to invest" — 多次出现
- 这不是空话，是 Ben 作为投资人的真实信号

### 2.4 信息密度对比

| 维度 | Ben's Bites | LoreAI |
|------|------------|--------|
| 头条字数 | 200-400 字（带个人分析） | 0（无头条概念） |
| Signals 每条 | 20-40 字 | N/A |
| 正文每条 | 30-80 字 | 40-80 字 |
| 推荐每条 | 10-20 字 | N/A |
| 总条目数 | 25-35 条 | 12-18 条 |
| 个人观点占比 | ~40% | ~0% |

### 2.5 差异化核心

Ben's Bites 不是 AI 新闻聚合器。它是 **Ben Tossell 这个人的 AI 世界观的日常表达**。

差异化来自：
1. **个人使用体验** — 不只是报道 Opus 4.6 发布，而是「我用了，感觉如何」
2. **投资人判断力** — "I want to invest" 是真实的投资信号
3. **建设者视角** — Ben 自己在用 agents 建产品，不是在旁观
4. **社区** — 有付费社区，形成正循环
5. **策展品味** — What I'm consuming 和 Tools 的选品质量极高

### 2.6 商业模式

- **赞助商内容** — 自然融入正文，用 * 号标记。例如 "Scroll.ai turns any knowledge base into an enterprise-grade AI agent. Get 2 free months ($158 value) with code BENSBITES26.*"
- **付费订阅** — "Upgrade to paid" CTA
- **社区** — 新推出的建设者社区
- **投资** — Ben 是投资人，newsletter 本身是 deal flow 来源

### 2.7 个人品牌

Ben 的自我定位非常清晰：**"I can't code, but I build. I sold a no-code community to Zapier, failed at learning to code the traditional way, and now ship software using AI agents."**

这个定位的妙处：
- 读者能共鸣（大多数人也不是 10x 工程师）
- 建立信任（不装专家）
- 差异化（不是又一个工程师写的技术博客）

---

## Part 3: 竞品交叉对比

### 3.1 TLDR AI

**定位：** "Keep up with AI in 5 minutes"，920K 读者

**内容结构：**
```
Headlines & Launches（2-3 条，2 min read 标记）
Deep Dives & Analysis（2-3 条，7-24 min read 标记）
Engineering & Research（2-3 条）
Miscellaneous（2-3 条）
Quick Links（3-5 条）
```

**特征分析：**
- 每条标注阅读时间（"2 minute read"、"24 minute read"）
- 纯链接聚合，每条 2-3 句摘要
- 无个人观点，纯编辑策展
- 赞助商融入顶部和中间
- 选题面广（不只 AI，含科技商业）

**调性：** 极度中性、专业、高效。像 RSS 阅读器的 AI 版。

### 3.2 Superhuman AI

**定位：** "#1 AI & Tech Newsletter"，1M+ 读者，由 Zain Kahn 运营

**内容结构：**
```
TODAY IN AI（3 条主要新闻）
FROM THE FRONTIER（1 条深度分析，500+ 字）
THE AI ACADEMY（1 条教程/How-to）
IN THE KNOW（3-5 条社交媒体热点）
```

以 Feb 10 期为例：
1. "OpenAI rolls out ads in ChatGPT" — 有分析和背景
2. Harvard 研究：AI 不减少工作反而加剧工作强度
3. Amazon 计划推出 AI 内容市场

**特征分析：**
- 标题极具点击欲（"The $70M domain name"、"Anthropic roasts OpenAI"）
- FROM THE FRONTIER 是真正的深度内容（AI + 体育生态系统分析）
- AI ACADEMY 教实用技巧（如何连接 NotebookLM 到 Gemini）
- 赞助商多但融入自然
- 个人品牌弱于 Ben's Bites，但有编辑视角

**调性：** 商业化、大众化。面向不懂技术的读者。

### 3.3 The Rundown AI

**定位：** 2M+ 读者（最大的 AI newsletter）

**特征：** 首页极简，主要依赖邮件订阅，网页内容少。定位大众市场，信息密度低。

### 3.4 竞品对比矩阵

| 维度 | Ben's Bites | TLDR AI | Superhuman | The Rundown | **LoreAI** |
|------|------------|---------|------------|-------------|-----------|
| 读者数 | ~500K | 920K | 1M+ | 2M+ | ~0 |
| 目标读者 | 建设者/投资人 | 技术从业者 | 大众/职场人 | 大众 | 开发者 |
| 个人品牌 | ★★★★★ | ★☆☆☆☆ | ★★★☆☆ | ★★☆☆☆ | ☆☆☆☆☆ |
| 观点深度 | ★★★★★ | ★★☆☆☆ | ★★★☆☆ | ★★☆☆☆ | ★☆☆☆☆ |
| 信息密度 | ★★★★☆ | ★★★★★ | ★★★☆☆ | ★★☆☆☆ | ★★★★☆ |
| 实用性 | ★★★★☆ | ★★★★☆ | ★★★★★ | ★★★☆☆ | ★★★☆☆ |
| 自动化程度 | 低（人工策展） | 中 | 低 | 中 | ★★★★★ |

---

## Part 4: 差距分析（Gap Analysis）

### 4.1 数据采集层

| 维度 | LoreAI | Ben's Bites | 差距 |
|------|--------|------------|------|
| 官方博客 | 9 个源，自动采集 | 同样的源 | ✅ 基本持平 |
| Twitter | 31 账号 + 5 搜索 | 个人 feed + 社区反馈 | ⚠️ LoreAI 缺少社区信号 |
| 独家信息 | 无 | Ben 的投资人网络 + 建设者社区 | ❌ 完全缺失 |
| 人工策展 | 无 | Ben 每天 2-3 小时亲自策展 | ❌ 核心差距 |
| 产品试用 | 无 | Ben 亲自试用新工具 | ❌ 无法自动化弥补 |

**关键洞察：** 数据采集层 LoreAI 其实不差，问题在于**缺少人工判断和个人体验**。

### 4.2 筛选层

| 维度 | LoreAI | Ben's Bites | 差距 |
|------|--------|------------|------|
| 选题标准 | Agent 按 signal vs noise 分 | 「这个故事有没有叙事冲突？」 | ❌ 缺少叙事判断力 |
| 头条判断 | 无头条概念 | 每期有 1-2 个头条故事 | ❌ |
| 信噪比 | 中等（Agent 已改善） | 极高（人工 + 品味） | ⚠️ |
| 跨天去重 | URL 匹配 | 人脑记忆 | ⚠️ LoreAI 02-10~12 重复严重 |

**具体问题：** 2026-02-10、02-11、02-12 三期中，以下内容反复出现：
- Transformers.js v4 — 出现在 02-10、02-11、02-12
- Nemotron ColEmbed V2 — 出现在 02-10、02-11
- Community Evals — 出现在 02-10、02-11
- 服务端压缩概念 — 02-11、02-12 的 MODEL LITERACY 完全相同

**根因：** `daily-scout.ts` 的 `getRecentNewsletterUrls()` 只做 URL 去重，但很多重复新闻是不同 URL 报道同一件事。Agent Filter 的 prompt 没有要求「对比昨天的 newsletter 去重」。

### 4.3 写作层

| 维度 | LoreAI | Ben's Bites | 差距 |
|------|--------|------------|------|
| 调性 | 中性专业 | 个人化、有态度 | ❌ 核心差距 |
| 深度 | 表面报道 | 个人使用体验 + 行业洞察 | ❌ |
| 观点 | 无 | 每条都有判断 | ❌ |
| 个人化 | 零 | 贯穿始终 | ❌ |
| 信息密度 | 中等 | 高 | ⚠️ |

### 4.4 格式层

| 维度 | LoreAI | Ben's Bites | 差距 |
|------|--------|------------|------|
| 标题 | 日期标题 | 新闻式标题 | ❌ 有机会改 |
| 开场 | 无 | 2-3 段个人化叙事 | ❌ |
| Section 结构 | 6 个固定 section | 灵活（Signals / What I'm consuming / Tools） | ⚠️ |
| Quick Links | 有但弱 | What I'm consuming 质量极高 | ⚠️ |
| 签名 | 无 | "Hey I'm Ben. I build stuff with agents..." | ❌ |

### 4.5 分发层

| 维度 | LoreAI | Ben's Bites | 差距 |
|------|--------|------------|------|
| 网站 | loreai.dev（Vercel SSG） | Substack | ✅ LoreAI 更灵活 |
| 邮件 | 无 | Substack 邮件列表 | ❌ 核心差距 |
| 社交 | 无 | Twitter 个人品牌 | ❌ |
| 社区 | 无 | 付费社区 | ❌ |

### 4.6 品牌层

| 维度 | LoreAI | Ben's Bites | 差距 |
|------|--------|------------|------|
| 个人品牌 | 无人格 | Ben Tossell — 投资人/建设者 | ❌ 最大的差距 |
| 信任感 | 机器生成感 | 人类策展人 | ❌ |
| 社区 | 无 | Discord + 付费社区 | ❌ |
| 一致性 | 高（自动化） | 高（每天发） | ✅ |

---

## Part 5: 完整优化策略

### A. 内容策略优化

#### A.1 新 Newsletter 模板设计

**核心理念：** 从「新闻列表」转变为「有主编视角的策展 Brief」

```markdown
# {新闻式标题 — 不含日期}

**{日期}**

{1-2 句个人化开场 — Bella 或 LoreAI 编辑的视角}

Today: {2-3 个关键话题预览}

---

## 📌 THE BIG STORY

{今日最重要的 1 个故事，3-5 段深度分析}
{包含：事实 + 为什么重要 + 编辑观点 + 关键数据}

---

## ⚡ SIGNALS

{5-8 条短信号，每条 1-2 句}
• **{产品名} {动词}**: {一句话} [→](url)

---

## 🔧 TOOLS & DEMOS

{3-5 条工具推荐}
• **{工具名}**: {一句话描述 + 为什么值得关注} [→](url)

---

## 📚 WORTH READING

{3-5 条长文/视频/播客推荐}
• **{标题}**: {一句话推荐理由} [→](url)

---

## 🎓 ONE CONCEPT

**{概念名}**: {3-4 句面向非技术读者的解释}

---

{签名}
```

**与当前模板的关键区别：**
1. 新增 **THE BIG STORY** — 每期有一个深度头条
2. 将 MODEL / DEV / APP 等合并为 **SIGNALS** — 不再按技术分类，按重要性排
3. 新增 **WORTH READING** — 对标 Ben's "What I'm consuming"
4. 保留 **ONE CONCEPT** — LoreAI 的差异化
5. 去掉 PICK OF THE DAY — 与 BIG STORY 重复

#### A.2 选题标准和优先级

**头条（BIG STORY）选题矩阵：**

| 优先级 | 类型 | 例子 |
|--------|------|------|
| P0 | 叙事冲突型 | Anthropic vs OpenAI 同日发模型 |
| P0 | 行业拐点型 | ChatGPT 开始投放广告 |
| P1 | 重大发布型 | 新旗舰模型发布 |
| P1 | 趋势确认型 | 多方印证的行业趋势 |
| P2 | 有趣洞察型 | 基础设施噪声影响 benchmark |

**SIGNALS 选题标准：**
- 产品功能更新
- 值得知道但不值得深写
- 每条 < 30 字

**WORTH READING 选题标准：**
- 深度长文（>5 min read）
- 思考类内容
- 实操指南

#### A.3 调性指南

**LoreAI 的声音定位：** 一个对 AI 行业有深度理解的策展人，用开发者听得懂的语言解释复杂事件，有明确判断力但不自大。

**Do：**
- 用具体数据支撑观点（"1M context window"而非"更大的上下文"）
- 对重大事件表达立场（"这对开发者意味着 X"）
- 头条必须有编辑判断（"最重要的不是发布本身，而是 Y"）
- 使用主动语态和短句
- 在 BIG STORY 中展示分析深度

**Don't：**
- "In today's issue..."
- 无立场的事实罗列
- 翻译腔（中文版）
- 同一条新闻在两天内重复出现
- 空洞的总结（"This is a significant development"）

**中文版特别指南：**
- 禁止翻译腔："值得注意的是"、"让我们来看看"
- 国产模型对比要自然融入，不要强行加入
- 语气参考：少数派科技栏目的深度 + 即刻社区的对话感

### B. 技术 Pipeline 优化

#### B.1 数据采集改进

**新增数据源：**

| 数据源 | 实现方式 | 优先级 |
|--------|----------|--------|
| Reddit r/LocalLLaMA, r/ClaudeAI | web_fetch Reddit .json API | P1 |
| arXiv AI 热门 | web_fetch arXiv API | P2 |
| Product Hunt AI 分类 | web_fetch | P2 |
| Ben's Bites / TLDR AI 内容参考 | web_fetch 最新一期 | P1 |

**具体实施（daily-scout.ts）：**

在 `daily-scout.ts` 的采集函数列表中新增：

```typescript
// 新增：Reddit 采集
async function scanReddit(): Promise<NewsItem[]> {
  const subreddits = ['LocalLLaMA', 'ClaudeAI', 'MachineLearning'];
  const items: NewsItem[] = [];
  for (const sub of subreddits) {
    const resp = await fetch(`https://www.reddit.com/r/${sub}/top/.json?t=day&limit=10`);
    const data = await resp.json();
    // 过滤 score > 100 的帖子
    // 分类为 developer_platform 或 model_release
  }
  return items;
}
```

**跨天去重改进（关键修复）：**

当前 `getRecentNewsletterUrls()` 只做 URL 去重。需要改为**语义去重**。

在 `agent-filter.ts` 的 prompt 中加入：

```
CRITICAL: Here are the titles from the last 3 days' newsletters. 
DO NOT select any item that covers the same topic as these:
${recentTitles.join('\n')}
```

**文件修改：** `scripts/agent-filter.ts`，在 `agentFilter()` 函数的 prompt 构造前，读取最近 3 天的 newsletter 标题：

```typescript
// 在 agentFilter() 函数开头添加
function getRecentTitles(days: number = 3): string[] {
  const titles: string[] = [];
  const dir = path.join(process.cwd(), 'content', 'newsletters', 'en');
  try {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort().slice(-days);
    for (const file of files) {
      const content = fs.readFileSync(path.join(dir, file), 'utf-8');
      const titleMatches = content.matchAll(/\*\*([^*]+)\*\*/g);
      for (const m of titleMatches) {
        if (m[1].length > 15) titles.push(m[1]);
      }
    }
  } catch {}
  return titles;
}
```

然后在 prompt 中插入：
```
## DEDUP: Recent titles (DO NOT repeat these topics)
${getRecentTitles().join('\n')}
```

#### B.2 筛选逻辑改进

**当前 Agent Filter prompt 的问题：**
1. 只要求选 8-12 条，没有要求选出「头条」
2. 没有叙事冲突检测
3. 没有跨天去重

**改进后的 Agent Filter prompt（替换 agent-filter.ts 中的 prompt）：**

```
You are the editor-in-chief of LoreAI Daily, an AI newsletter for developers and builders.

From ${items.length} raw items, select today's newsletter content:

## Step 1: Identify THE BIG STORY (exactly 1)
The big story should have:
- Narrative tension (company vs company, expectation vs reality, etc.)
- Wide impact on the AI industry
- Something genuinely new (not an incremental update)
- Enough substance for 3-5 paragraphs of analysis

## Step 2: Select SIGNALS (5-8 items)
Short updates worth knowing. Product launches, feature updates, funding.

## Step 3: Select TOOLS & DEMOS (3-5 items)
Tools people can try right now.

## Step 4: Select WORTH READING (3-5 items)
Deep content: essays, papers, tutorials.

## CRITICAL RULES:
- DO NOT select items that overlap with these recent titles:
  ${recentTitles}
- Every item must pass the "so what" test: why should a developer care?
- Prefer primary sources over secondary coverage
- If two items cover the same event, pick the better source

## Output format:
{
  "big_story": { "index": N, "headline": "...", "editorial_angle": "..." },
  "signals": [{ "index": N, "one_liner": "..." }],
  "tools": [{ "index": N, "one_liner": "..." }],
  "worth_reading": [{ "index": N, "one_liner": "..." }]
}
```

#### B.3 写作 Prompt/Skill 改进

**英文 Newsletter Skill（skills/newsletter-en/SKILL.md）需要大改：**

主要改动：
1. 移除固定 6-section 结构，改为 BIG STORY + SIGNALS + TOOLS + WORTH READING
2. 新增 BIG STORY 写作指南
3. 标题规则不变（已经很好）
4. 新增「编辑观点」要求

**BIG STORY 写作指南（新增到 SKILL.md）：**

```markdown
## BIG STORY Rules

The Big Story is the heart of each newsletter. It should:

1. **Open with the tension**: "Anthropic and OpenAI dropped competing models 20 minutes apart."
2. **Explain why it matters**: Not just what happened, but the strategic implications.
3. **Include specific data**: Benchmark scores, pricing, context windows.
4. **State an editorial position**: "The real winner is..." / "This matters because..."
5. **3-5 paragraphs**, 200-400 words total.
6. **End with a forward-looking statement**: What to watch for next.

Example:
> OpenAI just flipped the switch on ads in ChatGPT, and the AI industry's business 
> model debate is officially over. Free users in the US will now see "Sponsored" 
> results alongside ChatGPT responses — clearly labeled, but unmistakably there.
>
> The timing is telling. This comes just days after Anthropic ran a Super Bowl-adjacent 
> campaign positioning Claude as the ad-free alternative. The contrast couldn't be sharper: 
> OpenAI is betting that scale (300M+ users) justifies advertising, while Anthropic is 
> betting that trust justifies premium pricing.
>
> For developers, the signal is clear: if you're building on ChatGPT's free tier, your 
> users will now see ads. If that's a dealbreaker, Claude's API is the obvious alternative.
```

**中文版 prompt 改进：**

在 `generateNewsletterWithOpusZH()` 中（daily-scout.ts 约 L580），改进 prompt：

```
你是 LoreAI 每日简报的中文主编。

## 核心原则
1. 每期必须有一个「大故事」（📌 今日焦点），200-400 字深度分析
2. 大故事必须有编辑立场 — 不是简单报道事实
3. 信号区每条 < 30 字
4. 语气像懂技术的朋友在微信群里科普
5. 禁止翻译腔和官方腔

## 语气参考
✅ "Anthropic 和 OpenAI 前后脚发布了竞品模型，间隔只有 20 分钟。这不是巧合。"
✅ "实话说，这个 benchmark 数字看起来漂亮，但实际用起来..."
❌ "值得注意的是，Anthropic 近日发布了..."
❌ "总结来看，这一发展对行业有深远影响。"
```

#### B.4 Newsletter Writer 改进（daily-scout.ts --from-filtered）

当前 `--from-filtered` 模式在 `daily-scout.ts` 末尾（约 L1550-1700），读 filtered items 后直接调 Opus 写稿。

**改进方案：** 修改 `generateNewsletterWithOpus()` 函数，让它读 Agent Filter 的新输出格式（含 big_story / signals / tools / worth_reading 分组），而非扁平列表。

```typescript
// daily-scout.ts 中的改动
async function generateNewsletterFromFiltered(filteredData: any, date: string): Promise<string | null> {
  const { big_story, signals, tools, worth_reading } = filteredData;
  
  const prompt = `Write today's LoreAI Daily newsletter.
  
## THE BIG STORY (write 200-400 words with editorial analysis):
${JSON.stringify(big_story)}

## SIGNALS (write 1-2 sentences each):
${JSON.stringify(signals)}

## TOOLS & DEMOS (write 1 sentence each):
${JSON.stringify(tools)}

## WORTH READING (write 1 sentence recommendation each):
${JSON.stringify(worth_reading)}

Follow skills/newsletter-en/SKILL.md strictly.
Output pure markdown.`;

  // ... 调用 Opus 写作
}
```

#### B.5 分发流程改进

**Phase 1: 邮件订阅（P1）**
- 在 loreai.dev 添加 Buttondown 或 Resend 邮件订阅
- 每日 newsletter 自动发送邮件版
- 实现文件：新增 `scripts/send-newsletter.ts`

**Phase 2: 社交分发（P2）**
- 每天自动生成 Twitter thread 版本（从 BIG STORY 提取）
- 实现：新增 `scripts/generate-thread.ts`

### C. 实施路线图

#### Phase 1: Quick Wins（1-2 天）

| # | 任务 | 文件 | 预估时间 |
|---|------|------|----------|
| 1 | **修复跨天去重** — 在 agent-filter.ts 中注入最近 3 天标题 | `scripts/agent-filter.ts` | 30 min |
| 2 | **改标题** — Opus 生成新闻式标题而非日期标题 | `scripts/daily-scout.ts` generateNewsletterWithOpus() | 15 min |
| 3 | **加开场白** — prompt 要求生成 1-2 句有态度的开场 | 同上 | 15 min |
| 4 | **去掉重复 section** — PICK OF THE DAY 和 MODEL LITERACY 选题不能和正文重复 | 同上 prompt | 10 min |
| 5 | **中文版去翻译腔** — 改进 ZH prompt，加入禁用词列表和语气参考 | `scripts/daily-scout.ts` generateNewsletterWithOpusZH() | 20 min |

**Phase 1 完成后的效果：**
- 标题从 "🌅 AI Daily Digest — 2026-02-12" 变为 "Anthropic Speeds Up Opus While OpenAI Turns On the Ads"
- 跨天重复内容减少 80%+
- 开头有 2-3 句叙事性引言
- 中文版语气更自然

#### Phase 2: 核心改进（1 周）

| # | 任务 | 文件 | 预估时间 |
|---|------|------|----------|
| 6 | **重构 Agent Filter** — 新 prompt 输出 big_story/signals/tools/worth_reading | `scripts/agent-filter.ts` | 2h |
| 7 | **重构 Newsletter Writer** — 读新格式，生成 BIG STORY 结构 | `scripts/daily-scout.ts` | 3h |
| 8 | **更新 SKILL.md** — 新模板 + BIG STORY 写作指南 | `skills/newsletter-en/SKILL.md` | 1h |
| 9 | **新增 Reddit 数据源** — r/LocalLLaMA, r/ClaudeAI, r/MachineLearning | `scripts/daily-scout.ts` 新增 scanReddit() | 2h |
| 10 | **新增 WORTH READING 数据源** — 抓取 Ben's Bites / TLDR 最新一期提取推荐链接 | `scripts/daily-scout.ts` | 2h |
| 11 | **中文版独立模板** — 不再是英文版的中文翻译，有独立的栏目结构 | 新增 `skills/newsletter-zh/SKILL.md` | 1h |

**Phase 2 完成后的效果：**
- 每期有一个 200-400 字的深度头条
- 信息来源更丰富（+Reddit, +竞品参考）
- 中英文版各自独立，不再像翻译

#### Phase 3: 长期演进（持续）

| # | 任务 | 说明 |
|---|------|------|
| 12 | **邮件订阅** | Buttondown/Resend 集成 |
| 13 | **人工策展叠加** | Bella 每天花 10 分钟在 filtered items 上标注/调整 |
| 14 | **读者反馈循环** | 追踪哪些文章被点击最多 |
| 15 | **Twitter 自动发布** | BIG STORY 自动生成 thread |
| 16 | **品牌人格** | 逐步建立 LoreAI 的编辑人格（类似 Ben 之于 Ben's Bites） |
| 17 | **付费内容** | 深度分析报告作为付费内容 |

---

## 附录：关键文件修改清单

| 文件 | 改动类型 | Phase |
|------|----------|-------|
| `scripts/agent-filter.ts` | 重写 prompt + 添加跨天去重 | 1+2 |
| `scripts/daily-scout.ts` | 修改写稿 prompt + 新增数据源 | 1+2 |
| `skills/newsletter-en/SKILL.md` | 新模板结构 | 2 |
| `skills/newsletter-zh/SKILL.md` | 新建 | 2 |
| `scripts/daily-newsletter.sh` | 适配新 filtered 格式 | 2 |

---

## 结语

LoreAI Newsletter 的自动化采集和技术架构已经相当成熟。核心差距不在技术，而在**内容产品设计**：

1. **缺少叙事** — 每期需要一个「故事」，不只是一个「列表」
2. **缺少人格** — 读者不需要另一个 RSS 阅读器，需要一个值得信任的策展人
3. **缺少判断力** — 不是「报道发生了什么」，而是「告诉读者为什么重要、该怎么做」
4. **跨天重复** — 技术问题，Agent Filter + prompt 改进即可解决

好消息是：Phase 1 的改进只需要**修改 prompt**，不需要改架构。这是 ROI 最高的优化。
