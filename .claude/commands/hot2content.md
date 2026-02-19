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
用 Task tool 启动 **writer-zh**：
"读取 output/core-narrative.json + output/research-report.md，按 skills/blog-zh/SKILL.md 规范独立创作中文博客 → output/blog-zh.md"

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
  - output/blog-zh.md (Claude 中文博客, XXXX 字)
  - output/seo-review.md (审核报告)
```
