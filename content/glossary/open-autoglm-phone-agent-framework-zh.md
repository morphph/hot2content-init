---
slug: open-autoglm-phone-agent-framework
title: "Open-AutoGLM手机智能体框架（Open-AutoGLM phone agent framework）— 定义、原理与应用"
description: "了解Open-AutoGLM手机智能体框架的含义、工作原理以及对开发者和企业的重要性。"
keywords: ["Open-AutoGLM手机智能体框架", "Open-AutoGLM phone agent framework", "AI术语"]
date: 2026-02-28
tier: 3
lang: zh
type: glossary
tags: ["术语表", "AI"]
---

# Open-AutoGLM手机智能体框架（Open-AutoGLM phone agent framework）

## 定义

Open-AutoGLM 是由智谱AI（Zhipu AI）开源的手机智能体（Phone Agent）模型与框架，能够让 AI 直接操控手机界面完成复杂任务。该框架基于视觉语言模型（VLM），通过理解屏幕内容和用户指令，自动执行点击、滑动、输入等操作，实现"用自然语言控制手机"的能力。

## 为什么重要

手机智能体代表了 AI 应用的下一个重要方向。传统的 AI 助手只能回答问题或生成内容，而手机智能体能够真正"动手"——帮你订外卖、发消息、设置日程。Open-AutoGLM 的开源让这项技术不再是大厂专属，中小开发者也能构建自己的手机自动化方案。

从 GitHub 近 24000 星的热度来看，开发者社区对这类工具有强烈需求。对企业而言，手机智能体可以用于客服自动化、测试自动化、无障碍辅助等场景，显著降低人力成本。

## 工作原理

Open-AutoGLM 的核心是一个经过手机操作数据训练的视觉语言模型。工作流程如下：

1. **屏幕理解**：模型接收手机屏幕截图，识别界面元素（按钮、输入框、图标等）
2. **意图解析**：将用户的自然语言指令（如"帮我给张三发微信说明天见"）转化为操作序列
3. **动作执行**：输出具体的操作坐标和类型（点击、长按、滑动、输入文字）
4. **状态反馈**：执行后获取新屏幕，判断任务是否完成，必要时继续下一步

框架支持 Android 系统，通过 ADB（Android Debug Bridge）与设备通信，开发者可在本地部署模型进行调试。

## 相关术语

- **GUI Agent**：图形界面智能体，能操控桌面或移动端界面的 AI 系统
- **视觉语言模型（VLM）**：同时处理图像和文本的多模态模型
- **RPA（机器人流程自动化）**：基于规则的自动化工具，与 AI Agent 的区别在于是否具备理解和推理能力
- **GLM**：智谱AI的通用语言模型系列，Open-AutoGLM 基于此构建

## 延伸阅读

- [zai-org/Open-AutoGLM](https://github.com/zai-org/Open-AutoGLM) — 官方 GitHub 仓库，含模型权重与部署指南