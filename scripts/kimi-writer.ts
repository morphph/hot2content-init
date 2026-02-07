#!/usr/bin/env tsx
/**
 * Kimi K2.5 Chinese Blog Writer
 *
 * Reads Core Narrative (output/core-narrative.json) and Research Report (output/research-report.md),
 * then calls Kimi K2.5 API (moonshot.cn) to generate native Chinese blog content.
 *
 * The output is NATIVE Chinese writing, NOT translation from English.
 *
 * Usage: npx tsx scripts/kimi-writer.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface CoreNarrative {
  topic: string;
  hook: string;
  thesis: string;
  narrative_arc: Array<{
    section: string;
    key_point: string;
    evidence: string[];
    transition: string;
  }>;
  key_quotes?: string[];
  counterarguments?: Array<{
    claim: string;
    rebuttal: string;
  }>;
  conclusion: string;
  cta?: string;
  seo_keywords?: string[];
  target_audience?: string;
}

interface KimiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface KimiResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
    finish_reason?: string;
  }>;
  error?: {
    message: string;
    type?: string;
  };
}

class KimiWriter {
  private apiKey: string;
  private apiEndpoint = 'https://api.moonshot.cn/v1/chat/completions';
  private model = 'moonshot-v1-128k';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generate native Chinese blog content
   */
  async generateChineseBlog(coreNarrative: CoreNarrative, researchReport: string): Promise<string> {
    console.log(`✍️  Generating native Chinese blog for: "${coreNarrative.topic}"`);
    console.log(`   Model: ${this.model}\n`);

    const prompt = this.buildChineseWritingPrompt(coreNarrative, researchReport);

    try {
      const response = await this.callKimiAPI(prompt);
      console.log('✅ Chinese blog generated successfully\n');
      return response;
    } catch (error) {
      throw new Error(`Chinese blog generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Build a comprehensive Chinese writing prompt
   */
  private buildChineseWritingPrompt(narrative: CoreNarrative, research: string): string {
    const narrativeJson = JSON.stringify(narrative, null, 2);

    return `你是一位资深的中文科技博客作者，擅长将复杂的技术话题转化为引人入胜、深入浅出的中文内容。你的写作风格自然流畅，富有洞察力，能够吸引中文读者并提供独特价值。

**重要说明：你需要创作原生的中文博客内容，而不是翻译英文内容。** 请基于提供的 Core Narrative 和调研报告，用中文思维重新组织和表达，使内容更符合中文读者的阅读习惯和文化背景。

---

## 输入材料

### Core Narrative (英文叙事骨架)
\`\`\`json
${narrativeJson}
\`\`\`

### Research Report (调研报告)
\`\`\`markdown
${research.slice(0, 50000)}
\`\`\`

---

## 写作要求

### 内容结构
请按照以下结构创作一篇 **3000-5000 字** 的中文博客：

1. **引人入胜的开头**（200-300字）
   - 用一个引人注目的场景、数据或问题开场
   - 快速建立话题的重要性和相关性
   - 清晰说明本文将带给读者的价值

2. **背景与现状**（500-800字）
   - 话题的背景信息和发展脉络
   - 当前的行业现状和关键数据
   - 为什么现在关注这个话题特别重要

3. **核心内容展开**（1500-2500字）
   - 遵循 Core Narrative 中的 narrative_arc 结构
   - 每个关键点都要有：
     * 清晰的小标题
     * 具体的证据和例子
     * 深入的分析和洞察
   - 适当引用 key_quotes（如有）
   - 讨论不同观点和 counterarguments（如有）

4. **中国视角**（400-600字）
   - 从中国市场、政策、技术发展角度分析
   - 对中国读者的特殊意义和影响
   - 本地化的案例和数据

5. **未来展望与启示**（300-500字）
   - 趋势预测和发展方向
   - 对读者的实际启示和建议
   - 呼应开头，升华主题

6. **总结与行动号召**（100-200字）
   - 简洁有力的总结
   - 如果 Core Narrative 中有 cta，自然融入

### 写作风格
- **自然流畅**：使用地道的中文表达，避免翻译腔
- **深入浅出**：技术内容要准确，但要用通俗易懂的方式表达
- **有理有据**：观点要有数据、案例、引用支撑
- **观点鲜明**：不要只是罗列信息，要有独特见解和分析
- **读者导向**：始终考虑中文读者的背景、兴趣和需求

### SEO 优化
- 自然融入 seo_keywords（如果 Core Narrative 中有）
- 标题要吸引眼球且包含核心关键词
- 小标题要清晰、可搜索
- 适当使用加粗、列表等格式增强可读性

### 质量标准
- ✅ 原创性：基于材料的原生创作，不是翻译
- ✅ 准确性：事实、数据、引用要准确
- ✅ 深度：不止是信息整理，要有分析和洞察
- ✅ 可读性：段落长短适中，逻辑清晰，行文流畅
- ✅ 价值感：读者读完后有收获，能理解话题的重要性

---

## 输出格式

请输出完整的 Markdown 格式博客文章，包括：

\`\`\`markdown
# [吸引眼球的中文标题]

> [可选：一句话精华总结或引言]

[正文内容，按照上述结构展开...]

## 参考资料

[列出主要参考来源，格式：
- [来源标题](URL) - 简短说明
]

---

*本文基于公开资料和行业研究撰写，观点仅供参考。*
\`\`\`

---

现在，请开始创作这篇中文博客。记住：**用中文思维创作，而不是翻译英文内容**。`;
  }

  /**
   * Call Kimi K2.5 API (Moonshot AI)
   */
  private async callKimiAPI(prompt: string): Promise<string> {
    const messages: KimiMessage[] = [
      {
        role: 'user',
        content: prompt
      }
    ];

    const requestBody = {
      model: this.model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 16000,
      top_p: 0.95,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    };

    console.log('📡 Calling Kimi K2.5 API (moonshot.cn)...');

    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed (${response.status}): ${errorText}`);
    }

    const data: KimiResponse = await response.json();

    // Handle API errors
    if (data.error) {
      throw new Error(`Kimi API error: ${data.error.message}`);
    }

    // Extract content from response
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in API response');
    }

    return content;
  }
}

/**
 * Load environment variables from .env file
 */
function loadEnv(): Map<string, string> {
  const envPath = path.join(process.cwd(), '.env');
  const envVars = new Map<string, string>();

  if (!fs.existsSync(envPath)) {
    console.warn('⚠️  Warning: .env file not found');
    return envVars;
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars.set(key.trim(), valueParts.join('=').trim());
      }
    }
  }

  return envVars;
}

/**
 * Main execution function
 */
async function main() {
  console.log('\n✍️  Kimi K2.5 中文博客生成器\n');
  console.log('='.repeat(60) + '\n');

  // Load environment variables
  const env = loadEnv();
  const apiKey = env.get('KIMI_API_KEY') || env.get('MOONSHOT_API_KEY') ||
                 process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY;

  if (!apiKey) {
    console.error('❌ Error: KIMI_API_KEY or MOONSHOT_API_KEY not found');
    console.error('   Please add one of these to .env file:');
    console.error('   KIMI_API_KEY=your_api_key');
    console.error('   MOONSHOT_API_KEY=your_api_key\n');
    process.exit(1);
  }

  // Read Core Narrative
  const narrativePath = path.join(process.cwd(), 'output', 'core-narrative.json');
  if (!fs.existsSync(narrativePath)) {
    console.error(`❌ Error: Core Narrative not found: ${narrativePath}`);
    console.error('   Please run the narrative-architect agent first.\n');
    process.exit(1);
  }

  let coreNarrative: CoreNarrative;
  try {
    const narrativeContent = fs.readFileSync(narrativePath, 'utf-8');
    coreNarrative = JSON.parse(narrativeContent);
  } catch (error) {
    console.error(`❌ Error parsing core-narrative.json: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }

  // Read Research Report
  const researchPath = path.join(process.cwd(), 'output', 'research-report.md');
  if (!fs.existsSync(researchPath)) {
    console.error(`❌ Error: Research Report not found: ${researchPath}`);
    console.error('   Please run the researcher agent first.\n');
    process.exit(1);
  }

  let researchReport: string;
  try {
    researchReport = fs.readFileSync(researchPath, 'utf-8');
  } catch (error) {
    console.error(`❌ Error reading research-report.md: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }

  console.log(`📝 Topic: ${coreNarrative.topic}`);
  console.log(`📄 Research Report: ${(researchReport.length / 1024).toFixed(2)} KB`);
  console.log(`🎯 Target Audience: ${coreNarrative.target_audience || 'General'}\n`);

  // Generate Chinese blog
  const writer = new KimiWriter(apiKey);

  let chineseBlog: string;
  try {
    chineseBlog = await writer.generateChineseBlog(coreNarrative, researchReport);
  } catch (error) {
    console.error(`❌ Chinese blog generation failed: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }

  // Ensure output directory exists
  const outputDir = path.join(process.cwd(), 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write Chinese blog to output/blog-zh.md
  const outputPath = path.join(outputDir, 'blog-zh.md');
  fs.writeFileSync(outputPath, chineseBlog, 'utf-8');

  console.log(`✅ Chinese blog saved to: ${outputPath}`);
  console.log(`📄 Blog size: ${(chineseBlog.length / 1024).toFixed(2)} KB`);
  console.log(`📊 Character count: ~${chineseBlog.length} characters\n`);
  console.log('='.repeat(60));
  console.log('✅ 中文博客生成完成！\n');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(`\n❌ Fatal error: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  });
}

export { KimiWriter, CoreNarrative };
