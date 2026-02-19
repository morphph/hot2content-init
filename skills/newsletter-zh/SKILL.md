# 中文 Newsletter 写作规范

## 定位与语气

像一个消息灵通的科技圈朋友在微信群里给你分享今天最值得关注的 AI 动态 — 专业、简洁、有态度。你知道什么重要，帮读者过滤噪音。

目标读者：中国的 AI 开发者、产品经理、创业者、技术管理者。

要：
- 每条新闻先说**"跟我有什么关系"** — 读者为什么现在就该知道这件事？
- 用短句、主动句式："发布了"、"上线了"、"跑分碾压"、"直接开源"
- 关键产品/公司名首次出现加粗：**Claude Opus 4.6**、**Qwen 3.0**
- 有态度 — 适当加入判断和点评，但不要情绪化
- 用具体数据说话（跑分、上下文长度、价格、百分比）
- 技术术语首次出现标注英文：大语言模型（LLM）

不要：
- "在本期简报中..."、"今天我们来看看..."
- 翻译腔的 RSS 摘要："X 公司宣布了 Y 产品的发布"
- 不同条目之间重复相同信息
- 空洞的吹捧："划时代的"、"颠覆性的"、"里程碑式的"
- 被动语态描述关键事件
- 大段文字不分行

## 结构模板

```markdown
# {有态度的标题 — 不要只写日期}

**{日期}**

{1-2 句开场白，点出今天最大的新闻。要有画面感。}

{1 句预告："今天聊：X、Y、Z。"}

---

## 🧠 模型动态

**{产品名} {动词}。** {1-2 句：做了什么 + 关键指标 + 为什么值得关注。} [详情 →](url)

**{产品名} {动词}。** {同上格式。} [详情 →](url)

---

## 🔧 开发者工具

**{功能/产品}**：{1-2 句，讲清楚对开发者的实际价值。} [详情 →](url)

---

## 📝 技术前沿

**{标题}**：{1-2 句，先说洞察再说出处。} [详情 →](url)

---

## 📱 产品与生态

**{公司} + {动作}**：{1-2 句。} [详情 →](url)

---

## 🔥 圈内热议

{emoji} **{简短标签}**：{1 句带态度的点评。} [查看 →](url)

---

## ⚡ 快讯

- **{名称}**：{半句话描述。} [链接](url)
- **{名称}**：{半句话描述。} [链接](url)

---

下期见 ✌️
```

## 单条规则

1. **每条最多 2-3 句**。能 1 句说清的不写 2 句。
2. **先说"跟我有什么关系"** — 不要以"X 公司宣布"开头。先说影响："你的代码助手刚快了 25%。"
3. **关键名称首次加粗**：**Claude Opus 4.6**、**GPT-5.3 Codex**
4. **每条附来源链接**，格式：`[详情 →](url)`
5. **用有力的动词**：来了、上线、开源、碾压、反超
6. **具体数字**胜过空洞描述："100 万 token 上下文" > "更大的上下文"
7. **分类 emoji 固定**：🧠 🔧 📝 📱 🔥 ⚡

## 分类指南

| 分类 | Emoji | 内容 | 最多条数 |
|------|-------|------|----------|
| 模型动态 | 🧠 | 新模型发布、跑分、能力更新 | 2-3 |
| 开发者工具 | 🔧 | SDK、API、平台集成 | 2-3 |
| 技术前沿 | 📝 | 技术博客、论文、评测方法 | 2-4 |
| 产品与生态 | 📱 | 合作、企业落地、商业化 | 2-3 |
| 圈内热议 | 🔥 | 社区热点、争议、文化现象 | 2-3 |
| 快讯 | ⚡ | 一句话小新闻 | 3-5 |

- 某个分类没有值得写的内容就跳过，不要凑数。
- 分类之间用 `---` 分隔。

## 中文特有规则

### 标点符号
- 使用中文标点：，。！？""''（）
- 括号内是英文时用半角括号内容但外用中文括号：大语言模型（LLM）
- 英文与中文之间加空格：使用 Claude 进行开发

### 术语处理
- 首次出现：中文全称（英文缩写），如：大语言模型（LLM）
- 后续使用：可直接用缩写或中文简称
- 没有公认中文译名的术语直接用英文：Transformer、Token、Prompt
- 不要生造翻译

### 数字与单位
- 阿拉伯数字：1500 万参数、提升了 30%
- 金额用美元符号：$20/月
- 大数用万/亿：15 亿参数

### 中国视角
- 涉及国产模型（Qwen、Kimi、GLM、DeepSeek 等）时自然融入对比
- API 可用性、国内访问、合规等问题简要提及
- 用中国读者熟悉的类比，不要照搬英文类比
- 不要强行加入不相关的中国视角

## 禁止事项

- 不要写 "在本期简报中我们将..." — 直接开始
- 不要写 RSS 标题式的摘要
- 不要在开场和正文中重复同一条信息
- 不要每条超过 3 句（这是简报，不是博客）
- 不要写 "让我们开始吧" / "话不多说" / "敬请期待"
- 不要收录 20 条以上 — 精选 12-18 条
- 不要忽略叙事 — 如果两家公司 20 分钟内发布竞品模型，这就是头条

## 标题规则

标题要像新闻标题，不要像标签：
- 对 "Anthropic 和 OpenAI 20 分钟内先后发模型，AI 军备竞赛白热化"
- 对 "谷歌趁超级碗发 Gemini 3.0，时机拿捏了"
- 错 "AI 简报 — 2026 年 2 月 8 日"
- 错 "本周 AI 动态汇总 #47"

## 开场白规则

- 用一句有画面感的话设定基调："AI 军备竞赛今天进入了白热化阶段"
- 点名最大的新闻
- 以 "今天聊：" 开头预告 2-3 个重点话题
- 总共 2-3 句

## 结尾

保持简短一致：
- "下期见 ✌️"
- 不要长篇免责声明或订阅引导

## 核心原则

**这不是英文 Newsletter 的翻译。** 基于同一批新闻源，独立创作中文版本。可以：
- 调整新闻的优先级排序（中国读者更关心的放前面）
- 增加国产模型、国内生态的相关内容
- 用不同的切入角度和类比
- 省略对中国读者不太相关的内容

---

## 范例

以下是标准输出示例：

```markdown
# Anthropic 和 OpenAI 20 分钟内先后发模型，这仗打到家门口了

**2026 年 2 月 8 日**

AI 军备竞赛白热化 — **Anthropic** 刚发布 Claude Opus 4.6，**OpenAI** 20 分钟后就掏出了 GPT-5.3 Codex。卷到这个程度，开发者倒是赢麻了。

今天聊：双雄对决、Apple Xcode 接入 Claude、以及一个可能改变你跑分方式的发现。

---

## 🧠 模型动态

**Claude Opus 4.6 来了。** Anthropic 最强模型 — 100 万 token 上下文（beta）、Agent Teams 多智能体协作、代码和法律推理跑分登顶。Claude 和 Claude Code 已可使用。 [详情 →](https://www.anthropic.com/news/claude-opus-4-6)

**GPT-5.3 Codex 紧随其后。** OpenAI 的回应：SWE-Bench Pro 57%、Terminal-Bench 2.0 77%、速度提升 25%。另外还发布了企业级 AI Agent 平台 OpenAI Frontier。 [详情 →](https://openai.com/index/introducing-gpt-5-3-codex/)

---

## 🔧 开发者工具

**Apple Xcode 接入 Claude Agent SDK**：iPhone、Mac、Vision Pro 开发全面支持 Claude Code 能力。苹果生态开发者的 AI 工具箱一下子充实了不少。 [详情 →](https://www.anthropic.com/news/apple-xcode-claude-agent-sdk)

**Claude 高级工具调用上线**：三项 beta 功能让 Claude 能动态发现、学习和执行工具。Agent 开发的灵活度又上了一个台阶。 [详情 →](https://www.anthropic.com/engineering/advanced-tool-use)

---

## 📝 技术前沿

**基础设施噪声正在干扰你的跑分结果**：Anthropic 工程团队发现，服务器配置差异能让 Agent 编码得分波动好几个百分点 — 有时比顶级模型之间的差距还大。跑分排行榜要打个问号了。 [详情 →](https://www.anthropic.com/engineering/infrastructure-noise)

**如何设计 AI 做不了的技术面试题**：当 Claude 能轻松通过你的 take-home exam 时怎么办？Anthropic 分享了三轮迭代的经验。 [详情 →](https://www.anthropic.com/engineering/AI-resistant-technical-evaluations)

---

## 📱 产品与生态

**ServiceNow 选择 Claude**：企业软件巨头用 Anthropic 驱动客户应用和内部提效。又一个大单。 [详情 →](https://www.anthropic.com/news/servicenow-anthropic-claude)

---

## 🔥 圈内热议

🦞 **谷歌超级碗广告**：Gemini 在全美收视最高的周末抢了个 C 位。 [查看 →](https://blog.google/company-news/inside-google/company-announcements/gemini-ad-new-home/)

🖼️ **HuggingFace 社区评测**："不再信任黑箱排行榜" — 去中心化模型评测时代来了。 [详情 →](https://huggingface.co/blog/community-evals)

---

## ⚡ 快讯

- **SyGra Studio**：HuggingFace + ServiceNow 联合出品。 [链接](https://huggingface.co/blog/ServiceNow-AI/sygra-studio)
- **Nemotron ColEmbed V2**：NVIDIA 多模态检索模型登顶 ViDoRe V3。 [链接](https://huggingface.co/blog/nvidia/nemotron-colembed-v2)
- **AI 保护濒危物种**：谷歌用 AI 帮助濒危动物基因组测序。 [链接](https://blog.google/innovation-and-ai/technology/ai/ai-to-preserve-endangered-species/)

---

下期见 ✌️
```

---

## 集成说明

在 `write-newsletter.ts` 中使用此规范时，将以下内容加入 Gemini/Claude 提示词：

```
请阅读并严格遵循 skills/newsletter-zh/SKILL.md 中定义的写作规范，包括语气、结构和单条格式要求。
```

此规范文件应作为上下文注入提示词，替换函数中目前硬编码的风格指南。
