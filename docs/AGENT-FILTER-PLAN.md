# 改造方案：Agent 参与 Daily Scout 筛选环节

> 2026-02-12 | 状态：草案，等 Bella 确认

## 🎯 目标

把 Daily Scout 从「全自动正则筛选」升级为「Agent 语义筛选」，保留自动化采集，提升内容判断质量。

## 📊 现状分析

### 当前 Daily Scout 链路
```
crontab (每天 UTC 01:00)
  └─ daily-newsletter.sh
       └─ daily-scout.ts
            ├─ 采集层（5 个数据源，效果不错）
            │   ├─ T1: 官方博客 RSS/web_fetch
            │   ├─ T2: Twitter API (31 账号)
            │   ├─ T3: HuggingFace trending
            │   ├─ T4: Hacker News top
            │   └─ T5: GitHub trending
            │
            ├─ 筛选层（⚠️ 瓶颈在这里）
            │   ├─ 硬编码 score（官方博客=88-95，Twitter 按 tier 50-80）
            │   ├─ Jaccard 去重（标题词袋相似度 >0.5）
            │   ├─ isLowQualityTweet() — 正则过滤
            │   ├─ HF likes 阈值过滤
            │   └─ HN score > 50 过滤
            │
            ├─ 写稿层（Gemini Flash 写英文，Opus 写中文）
            │   └─ 按 4 个固定 category 分组
            │
            └─ 输出：digest-{date}.md + digest-zh-{date}.md
```

### AI News Skill 链路（对比）
```
Agent session（手动或 cron 触发）
  ├─ bash 脚本采集 Twitter + 官方博客
  ├─ Agent 读原始数据 → 语义理解 + 判断重要性
  ├─ Agent 按 6 个语义分类（LAUNCH/TOOL/TECHNIQUE/RESEARCH/INSIGHT/BUILD）
  ├─ Agent 挑 top 5-7，附 "Why it matters" + "Action"
  └─ 输出：Telegram 消息 + digest 存档
```

### 关键差距

| 维度 | Daily Scout | AI News Skill |
|------|-------------|---------------|
| 分类 | 4 个硬编码 category | 6 个语义 category |
| 打分 | 规则公式（tier + engagement） | Agent 综合判断 |
| 去重 | Jaccard 词袋 | 语义理解（知道 "Seedance 刷屏" 是同一事件） |
| 过滤 | 正则 + 阈值 | 理解信号 vs 噪音 |
| 关联 | 无 | 能识别趋势（多条推文 → 一个大事件） |

---

## 🔧 改造方案

### 核心思路：在采集和写稿之间插入 Agent 筛选层

```
daily-newsletter.sh
  └─ daily-scout.ts（采集 + 原始数据输出）   ← 改动小
       │
       │  输出 raw-items-{date}.json（全量原始数据）
       ▼
  agent-filter（新增）                        ← 核心改动
       │  OpenClaw cron → isolated agentTurn
       │  Agent 读 raw-items，做语义筛选 + 分类 + 排序
       │  输出 filtered-items-{date}.json
       ▼
  writer（Gemini/Opus，现有）                 ← 改动小
       │  读 filtered-items 而不是全量 items
       ▼
  digest-{date}.md
```

### 具体改动

#### 1. daily-scout.ts 改造（小改）
- 采集逻辑不动
- 新增：采集完成后，把**全量原始数据**写到 `output/raw-items-{date}.json`
- 包含：标题、摘要、URL、source、engagement 数据、原始推文全文
- 去掉硬编码 score 和规则筛选（或保留作为 fallback）

#### 2. Agent 筛选环节（新增）
- 用 OpenClaw cron 的 `agentTurn` 触发一个 isolated session
- Agent 的 prompt：

```
读取 /home/ubuntu/hot2content-init/output/raw-items-{date}.json

作为 AI 行业编辑，从中筛选今日最重要的 8-12 条新闻：

筛选标准：
1. 信号 vs 噪音 — 真正的新闻 vs 日常讨论
2. 影响力 — 对 AI 开发者/产品经理有实际影响
3. 新鲜度 — 优先 24h 内
4. 去重 — 多条推文讲同一件事，合并为一条
5. 趋势识别 — 多人讨论同一话题 = 重要信号

输出 JSON 到 /home/ubuntu/hot2content-init/output/filtered-items-{date}.json
格式：{ items: [{ title, summary, why_it_matters, action, url, category, importance_score }] }

分类使用：LAUNCH / TOOL / TECHNIQUE / RESEARCH / INSIGHT / BUILD
```

#### 3. Writer 层调整（小改）
- 读 `filtered-items` 而不是全量 items
- Agent 已经做好分类和排序，writer 专注写作质量

#### 4. daily-newsletter.sh 改造
```bash
# Step 1: 采集（现有）
npx tsx scripts/daily-scout.ts --raw-only

# Step 2: Agent 筛选（新增）
# 方案 A: 调用 OpenClaw API 触发 agent session
# 方案 B: 用简单的 Claude API 调用脚本
npx tsx scripts/agent-filter.ts

# Step 3: 写稿（现有，改读 filtered）
npx tsx scripts/write-newsletter.ts
```

---

## 💰 成本评估

| 环节 | 现在 | 改造后 |
|------|------|--------|
| 采集 | ~$0 (API free tier) | 不变 |
| 筛选 | $0 (正则) | ~$0.20-0.50 (Opus, ~3K input tokens) |
| 英文写稿 | ~$0.01 (Flash) | 不变 |
| 中文写稿 | ~$0.10 (Opus) | 不变 |
| **日均总计** | ~$0.11 | ~$0.15 |

增加 ~$0.20-0.50/天，月增 ~$10-15。质量优先。

---

## 📅 实施步骤

1. **Phase 1**（1-2h）— daily-scout.ts 输出 raw-items JSON
2. **Phase 2**（2-3h）— 写 agent-filter.ts，用 Anthropic API 直接调用 Sonnet
3. **Phase 3**（1h）— writer 改读 filtered-items
4. **Phase 4**（30min）— 更新 daily-newsletter.sh 串联流程
5. **Phase 5**（测试）— 手动跑一次，对比新旧输出质量

总工时：约半天。

---

## ✅ 已决策（2026-02-12）

1. **Agent 筛选模型：Claude Opus** — 质量优先
2. **分类：6 个** — LAUNCH / TOOL / TECHNIQUE / RESEARCH / INSIGHT / BUILD
3. **保留规则筛选作为 fallback** — API 失败时降级
4. **直接 API 调用**（不走 OpenClaw session）

### 补充说明：Twitter 热点采集机制保留
现有采集层通过两个渠道抓热门推文，改造中完全保留：
- **关键词搜索**：`Claude Code`, `MCP server` 等，engagement > 1000 才入选
- **关注账号列表**：31 个账号，tier 1 自动高优先级
Agent 筛选层拿到的 raw data 已包含这些热推，且能做更好的语义去重和趋势合并。
