---
slug: anthropic-responsible-scaling-policy-v3
title: "Anthropic Responsible Scaling Policy v3 — Analysis and Industry Impact"
description: "In-depth analysis of Anthropic Responsible Scaling Policy v3: what happened, why it matters, and what comes next."
keywords: ["Anthropic Responsible Scaling Policy v3", "AI safety", "AI governance", "RSP", "frontier AI"]
date: 2026-02-25
tier: 2
lang: en
type: blog
tags: ["analysis", "AI safety", "AI governance"]
---

# Anthropic Responsible Scaling Policy v3

**TL;DR:** Anthropic's RSP v3 fundamentally restructures the company's AI safety framework, replacing hard commitments to pause development with a transparency-focused approach featuring Risk Reports, Frontier Safety Roadmaps, and separated industry recommendations—a pragmatic acknowledgment that unilateral safety commitments face inherent limitations in a competitive landscape.

## Background: The Origins of Responsible Scaling

In September 2023, Anthropic became the first major AI company to publish a Responsible Scaling Policy. The original framework introduced AI Safety Levels (ASL), a tiered system establishing progressively stricter safeguards as model capabilities increased. The core promise was categorical: Anthropic would not train or deploy models capable of causing catastrophic harm unless safety measures kept risks below acceptable thresholds.

The policy drew inspiration from METR's (formerly ARC Evals) responsible scaling framework and aligned with emerging regulatory proposals in the UK, EU, and US. Within months, the approach influenced the broader industry. OpenAI adopted a similar [Preparedness Framework](https://openai.com/index/updating-our-preparedness-framework/), while Google DeepMind developed their [Frontier Safety Framework](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) with Critical Capability Levels. The policy also shaped legislation including California's SB 53 and New York's RAISE Act.

Version 2.0 arrived in October 2024, refining the ASL definitions and introducing more detailed evaluation procedures. ASL-3, focused on chemical, biological, radiological, and nuclear (CBRN) risks, received particular attention as models approached these capability thresholds.

By early 2026, however, Anthropic had accumulated substantial operational experience revealing both the policy's successes and its fundamental limitations.

## What Happened: RSP v3's Structural Overhaul

On February 24, 2026, Anthropic released version 3.0—described internally as "a comprehensive rewrite" rather than an incremental update. The changes address specific problems identified during two years of implementation.

### The Core Problem Identified

Pre-set capability thresholds proved far more ambiguous than anticipated. Models "clearly approached" RSP thresholds while uncertainty remained about whether they definitively crossed them. As Anthropic acknowledged in their [announcement](https://www.anthropic.com/news/responsible-scaling-policy-v3), this ambiguity made external advocacy for industry-wide action difficult. The biological science threshold illustrates the challenge: current models demonstrate sufficient biological knowledge to fail simple risk assessments, yet "tests alone aren't sufficient for a strong argument that risks are high."

This created an impossible position. Anthropic couldn't confidently rule out risks—including potential bioterrorism facilitation—but also lacked strong evidence that models actually posed such dangers. Rather than a clear red line triggering action, safety teams faced what critics characterized as a "fuzzy gradient."

### Three Structural Changes

**Separated Commitments.** RSP v3 explicitly distinguishes between mitigations Anthropic will pursue unilaterally and industry-wide recommendations requiring collective implementation. The previous policy implied Anthropic would pause development if ASL-4 or ASL-5 safeguards couldn't be met. The new version removes this expectation, acknowledging that higher-level requirements are "currently not possible" for individual companies without "assistance from the national security community."

**Frontier Safety Roadmaps.** Anthropic now commits to publishing detailed roadmaps with concrete safety goals across four domains: Security, Alignment, Safeguards, and Policy. These targets are described as "ambitious yet achievable" and presented as public goals rather than hard commitments. Specific elements include moonshot R&D projects for information security, automated red-teaming surpassing bug bounty contributions, and a proposed "regulatory ladder" for government guidance.

**Risk Reports.** Published every 3-6 months with minimal redactions, these reports detail the safety profile of all models—both deployed and internal. They explain how capabilities, threat models, and active mitigations interconnect with overall risk assessments. Expert third-party reviewers receive unredacted access for comprehensive public reviews.

### Governance Changes

Jared Kaplan, Anthropic's Co-Founder and Chief Science Officer, now serves as Responsible Scaling Officer. The evaluation interval extended from 3 to 6 months "to improve quality." New transparency measures include noncompliance reporting and anti-retaliation policies for internal safety concerns.

The policy also introduces the AI R&D-4 threshold: once models cross this capability milestone, Anthropic must develop "an affirmative case identifying the most immediate and relevant misalignment risks" and demonstrate mitigation strategies. Notably, Anthropic's Sabotage Risk Report for Claude Opus 4.6 acknowledged that "confidently ruling out this threshold is becoming increasingly difficult."

## Analysis: What This Reveals About AI Governance

### What the Previous Approach Got Right

The RSP served as an effective internal forcing function. Safety teams reported that capability thresholds motivated faster safeguard development across the organization. ASL-3 requirements proved implementable at reasonable operational cost, demonstrating that meaningful safety measures need not halt progress.

The policy's industry influence exceeded expectations. Competitor adoption within months validated the framework's practical applicability. Its incorporation into multiple legislative proposals showed regulators found the structure useful as a reference model.

### The Fundamental Tension

RSP v3 represents an honest acknowledgment of a problem that has plagued voluntary AI safety commitments: unilateral action faces structural limits in competitive markets.

Consider the ASL-4 challenge. State-actor-proof model weight security—preventing sophisticated nation-state adversaries from stealing model weights—likely requires classified threat intelligence and coordination with national security agencies. No private company, regardless of resources or intent, can achieve this independently.

This creates what Holden Karnofsky (Anthropic board member) characterized as "perverse incentives." Setting unachievable security standards distorts risk assessment pressures, potentially diverting resources from more tractable safety work toward symbolic compliance efforts.

### The Transparency Bet

RSP v3 effectively pivots from commitment-based governance to transparency-based governance. The theory: public Risk Reports and Frontier Safety Roadmaps, combined with external review, create accountability through visibility rather than through pre-specified bright lines.

This approach has precedent in financial regulation and nuclear safety, where disclosure requirements complement hard rules. The question is whether AI's unique characteristics—rapid capability gains, dual-use potential, competitive dynamics—make transparency sufficient.

The policy explicitly addresses competitive dynamics, requiring documentation of "competitive landscape considerations when scaling." This acknowledges the elephant in the room: safety decisions don't occur in isolation from market pressures.

## Industry Impact

### Competitive Positioning

RSP v3 maintains Anthropic's position as an AI safety thought leader while providing more operational flexibility. The company can now describe its approach as "matching or surpassing competitor safety efforts" without committing to unilateral pauses that competitors won't observe.

OpenAI's Preparedness Framework and Google DeepMind's Frontier Safety Framework follow similar capability-threshold approaches. All three now emphasize evaluation, documentation, and governance structures over hard pause commitments. RSP v3 brings Anthropic's explicit commitments closer to industry norms while maintaining more detailed public reporting requirements.

### Regulatory Implications

The shift matters for pending legislation. If the leading "safety-focused" AI company retreats from categorical development restrictions, regulators face pressure to recalibrate expectations. RSP v3's emphasis on government partnership for higher ASL levels implicitly argues for public-sector involvement rather than private-sector self-regulation.

The policy's proposed "regulatory ladder" for government guidance suggests Anthropic views current regulatory frameworks as insufficient. This positions the company to advocate for specific policy interventions while explaining why voluntary commitments alone cannot address frontier risks.

### Research Community Response

Reactions split along predictable lines. Chris Painter from METR expressed concern that the change signals "society is not prepared for the potential catastrophic risks posed by AI," worrying about a "frog-boiling" effect where dangers escalate gradually without triggering alarms.

Others, including Karnofsky, argue this reflects "learning from design flaws" rather than abandoning safety. The forcing function works best, this view holds, when goals are "ambitious but achievable" rather than abstract ideals that create compliance theater.

## What's Next

### Near-Term Expectations

The first Risk Report under the new framework will establish precedent for depth and candor. Stakeholders will scrutinize whether the documents provide genuine risk assessment or sanitized public relations. External reviewer selection and their published findings will test the transparency commitment's substance.

The Frontier Safety Roadmap's R&D goals—particularly automated red-teaming and alignment research—will face measurable evaluation. Unlike vague safety rhetoric, specific targets enable external accountability even without hard commitments.

### Industry Evolution

Expect other frontier AI companies to adopt similar separated-commitment structures. The practical challenges Anthropic identified—threshold ambiguity, unilateral limitations, capability-safeguard mismatches—apply industry-wide. RSP v3 provides a template for maintaining safety credibility while acknowledging these constraints.

Government engagement will determine whether the transparency approach generates real accountability. If Risk Reports face serious regulatory scrutiny and inform policy decisions, the framework gains teeth. If they become perfunctory disclosures, the shift from commitments to transparency represents a net loosening of constraints.

### The Fundamental Question

RSP v3 places significant weight on a hypothesis: that transparency creates sufficient pressure for responsible behavior even without binding commitments. This assumes informed stakeholders—regulators, researchers, the public—will effectively process detailed risk information and respond appropriately.

The alternative view holds that without hard tripwires, the industry will rationalize incremental risk increases indefinitely. Pre-specified pause points, however imperfect, force binary decisions that transparency requirements do not.

The answer will emerge through practice over the coming years. Anthropic has bet that honest acknowledgment of limitations, combined with unprecedented disclosure, serves safety better than commitments that prove unkeepable. Whether that bet pays off depends as much on external actors—regulators, competitors, civil society—as on Anthropic's own choices.

---

*Sources:*
- [Anthropic: Responsible Scaling Policy Version 3.0](https://www.anthropic.com/news/responsible-scaling-policy-v3)
- [Anthropic RSP Updates Portal](https://www.anthropic.com/rsp-updates)
- [TIME: Anthropic Drops Flagship Safety Pledge](https://time.com/7380854/exclusive-anthropic-drops-flagship-safety-pledge/)
- [EA Forum: Responsible Scaling Policy v3 Discussion](https://forum.effectivealtruism.org/posts/DGZNAGL2FNJfftwgE/responsible-scaling-policy-v3-1)
- [OpenAI Preparedness Framework](https://openai.com/index/updating-our-preparedness-framework/)
- [Google DeepMind Frontier Safety Framework](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/)