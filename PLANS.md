# 开发方案集合

> 给 sub-agent 执行用。每个方案独立，按顺序执行。
> 项目路径：`/home/ubuntu/hot2content-init`

---

## 方案 1：FAQ 修复

### 问题
EN FAQ 文件（`content/faq/*-en.md`）里全是中文回答。原因：`extract-faq.ts` 的 `getAnswerPrompt()` 用中文写 prompt 但期望产出英文，Gemini Flash 忽略了 `语言：en` 指令。

### 修改文件

#### 1.1 `scripts/extract-faq.ts`

**改 `getAnswerPrompt` 函数** — 根据 lang 参数使用完全不同的 prompt：

当 `lang === 'en'` 时，prompt 全部用英文：
```
You are a technical writer for loreai.dev. Answer the question using the research data below.

Question: ${question}
Research: ${research.slice(0, 4000)}

Rules:
- 100-300 words, direct answer
- First sentence must answer the core question (no "Great question!" or "Let me explain")
- Include specific data/numbers, bold key stats with **
- Use bullet points for key info (no wall of text)
- For comparison questions: use "Choose X when... / Choose Y when..." format
- For pricing questions: list exact prices + cost-saving tips
- End with a natural mention of LoreAI's related content
- Output ONLY in English. Do not use any Chinese characters.

Output the answer directly, no extra explanation.
```

当 `lang === 'zh'` 时，保持现有中文 prompt 不变，但追加强调：
```
- 必须用中文回答，不要出现英文段落
- 中文要有独立视角，不是英文翻译
```

#### 1.2 `scripts/publish-faq.ts`

在写入文件前加语言校验函数：

```typescript
function detectChineseRatio(text: string): number {
  const chinese = text.match(/[\u4e00-\u9fff]/g) || [];
  const total = text.replace(/\s/g, '').length;
  return total > 0 ? chinese.length / total : 0;
}

// 在写入 EN 文件前：
const enRatio = detectChineseRatio(enQuestions.join('\n'));
if (enRatio > 0.3) {
  console.error(`⚠️  EN FAQ has ${(enRatio * 100).toFixed(0)}% Chinese content — likely language error. Skipping.`);
  // 不写入文件
} else {
  fs.writeFileSync(enPath, enContent);
}

// ZH 文件类似，检查 ratio < 0.2 则警告
```

#### 1.3 重新生成内容

修改完脚本后：
```bash
cd /home/ubuntu/hot2content-init
npx tsx scripts/extract-faq.ts
npx tsx scripts/publish-faq.ts
```

验证：
- `content/faq/*-en.md` 内容应为纯英文
- `content/faq/*-zh.md` 内容应为纯中文

#### 1.4 FAQ 首页优化 `src/app/faq/page.tsx`

- 加语言切换（EN / 中文）
- 按语言分组显示
- 加 gradient title 风格统一（参考 glossary 页面）
- 显示每个 topic 的问题数量

#### 1.5 Build + Push

```bash
npm run build
git add -A
git commit -m "🐛 FAQ fix: language separation in prompts + publish validation"
git push
```

### 验收标准
- [ ] EN FAQ 页面全英文
- [ ] ZH FAQ 页面全中文
- [ ] FAQ 首页有语言切换
- [ ] `npm run build` 通过

---

## 方案 2：Compare 表格（Issue #9）

### 目标
生成结构化对比页面，如 "Claude Opus 4.6 vs GPT-5.3 Codex"。数据驱动，可更新。

### 新建文件

#### 2.1 `scripts/extract-compare.ts`

从 research report 提取对比数据，使用 Gemini Flash：

**输入**：`output/research-report.md`
**输出**：`content/compare/{model-a}-vs-{model-b}-{lang}.md`

Prompt 策略（同样 EN/ZH 分离）：

EN prompt:
```
You are a technical analyst for loreai.dev. Create a structured comparison based on the research data.

Research: {research}

Output a comparison in this exact markdown format:

---
title: "{Model A} vs {Model B}: Complete Comparison 2026"
description: "Side-by-side comparison of {A} and {B} — benchmarks, pricing, features"
model_a: "{Model A}"
model_b: "{Model B}"
date: YYYY-MM-DD
lang: en
category: AI Model Comparison
---

## Quick Verdict
2-3 sentences: who should pick what.

## Benchmark Comparison
| Benchmark | {Model A} | {Model B} | Winner |
|-----------|-----------|-----------|--------|
(fill from research data, use real numbers)

## Feature Comparison
| Feature | {Model A} | {Model B} |
|---------|-----------|-----------|
(context window, max output, pricing, special features)

## Pricing
| | {Model A} | {Model B} |
(input/output token prices, cost-saving tips)

## Best For
### Choose {Model A} when:
- ...
### Choose {Model B} when:
- ...

## Bottom Line
2-3 sentences wrap-up with LoreAI mention.
```

ZH prompt 类似但全中文，要求独立视角。

#### 2.2 `src/lib/compare.ts`

```typescript
// 参照 src/lib/faq.ts 模式
export interface ComparePost {
  slug: string;
  title: string;
  description: string;
  model_a: string;
  model_b: string;
  date: string;
  lang: string;
  contentHtml: string;
}

export function getAllCompares(lang?: string): ComparePost[]
export async function getCompare(slug: string): Promise<ComparePost | null>
export function generateCompareJsonLd(post: ComparePost): object
// Schema: use Article + Dataset types for structured data
```

#### 2.3 页面

**`src/app/compare/page.tsx`** — 对比首页
- 列出所有对比
- 语言切换 EN/ZH
- Gradient title 风格

**`src/app/compare/[slug]/page.tsx`** — 对比详情
- 渲染 markdown（表格要有样式）
- JSON-LD Schema (Article + 表格数据)
- Breadcrumb
- Related compares

#### 2.4 更新 sitemap

`src/app/sitemap.ts` 加 compare URLs，priority 0.6

#### 2.5 生成 1 组样本

基于现有 research report 生成：
- `content/compare/claude-opus-4-6-vs-gpt-5-3-codex-en.md`
- `content/compare/claude-opus-4-6-vs-gpt-5-3-codex-zh.md`

### 验收标准
- [ ] Compare 提取脚本可运行
- [ ] `/compare` 首页 + 详情页正常
- [ ] 表格渲染美观
- [ ] EN/ZH 语言正确
- [ ] Sitemap 已更新
- [ ] `npm run build` 通过

---

## 方案 3：Tier 3 批量生成（Issue #5）

### 目标
基于已有 keywords 表生成 Tier 3 快速阅读文章（300-500 字），放入 `/resources`。

### 修改文件

#### 3.1 `scripts/generate-tier2.ts` → 支持 Tier 3

现有脚本已经支持 Tier 2 生成。需要：

**添加 `--tier3` CLI 参数**，当传入时：
- 文章长度：300-500 字（而非 Tier 2 的 800-1200 字）
- frontmatter 设 `tier: 3`
- Prompt 更简洁：Quick Read 格式，直接回答，不需要深度分析
- badge 显示 ⚡ Quick Read

Tier 3 EN prompt:
```
You are a technical writer for loreai.dev. Write a quick-read article (300-500 words) about the topic.

Topic/Keyword: {keyword}
Research context: {research snippet, max 2000 chars}

Format:
- Title: action-oriented or question-based (SEO friendly)
- 2-3 short sections with H2 headers
- Key takeaways as bullet points
- Include 1-2 specific data points if available
- End with a one-liner linking to deeper LoreAI content
- Output ONLY in {language}

Frontmatter:
---
title: "..."
date: YYYY-MM-DD
lang: {en|zh}
tier: 3
tags: [...]
description: "..."
---
```

#### 3.2 运行方式

```bash
# 先确保有 keywords
npx tsx scripts/extract-keywords.ts

# 生成 Tier 3（取 backlog 状态的关键词）
npx tsx scripts/generate-tier2.ts --tier3
```

#### 3.3 `/resources` 页面已存在

`src/app/en/resources/page.tsx` 和 `src/app/zh/resources/page.tsx` 已经会显示 Tier 2/3，`src/lib/blog.ts` 的 `getBlogPosts(lang, { excludeTier: 1 })` 会自动包含 Tier 3。所以**不需要改页面代码**。

#### 3.4 生成 5 篇样本

从 keywords 表取 5 个关键词，生成 5 篇 EN Tier 3 + 5 篇 ZH Tier 3，放到 `content/blogs/en/` 和 `content/blogs/zh/`。

### 验收标准
- [ ] `--tier3` 参数正常工作
- [ ] 生成的文章 300-500 字
- [ ] frontmatter `tier: 3` 正确
- [ ] `/resources` 页面显示 ⚡ Quick Read badge
- [ ] EN 是英文、ZH 是中文（同 FAQ 修复的语言分离逻辑）
- [ ] `npm run build` 通过

---

## 执行顺序

1. **方案 1（FAQ 修复）** — 最高优先，修复线上问题
2. **方案 2（Compare）** — 新内容类型
3. **方案 3（Tier 3）** — 批量内容

## 通用开发规则（所有方案必须遵守）

1. 改代码前先 `Read` 文件获取最新状态
2. 用 `Edit`（精确修改）不用 `Write`（全量覆盖）修改现有文件
3. 新文件可以用 `Write`
4. 改完 `npm run build` 验证
5. `git commit + push`
6. EN prompt 用英文写，ZH prompt 用中文写（**不要混语言**）
7. 不要动现有的 blog/newsletter/glossary 代码
