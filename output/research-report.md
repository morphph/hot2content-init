# Research Report: Remotion Skills with Claude Code

**Date:** 2026-02-11  
**Topic:** How Remotion's Agent Skills integrate with Claude Code to enable AI-powered programmatic video generation

---

## 1. What is Remotion?

Remotion is an open-source framework (MIT-licensed, 23k+ GitHub stars) for creating videos programmatically using React. Instead of timeline-based editing in tools like Premiere or After Effects, developers write React components where each frame is a render cycle.

**Core concepts:**
- **Frames, not seconds:** `useCurrentFrame()` returns the current frame number; at 30fps, frame 30 = 1 second
- **Compositions:** `<Composition>` registers a video with dimensions, fps, and duration
- **Interpolation:** `interpolate(frame, inputRange, outputRange)` for smooth animations
- **Sequences:** `<Sequence from={90}>` controls when components appear
- **Spring animations:** `spring({ frame, fps, config })` for physics-based motion
- **Audio/Video support:** `<Audio>`, `<Video>`, `<OffthreadVideo>` components
- **Server-side rendering:** `npx remotion render` or `@remotion/lambda` for cloud rendering
- **TailwindCSS support:** First-class Tailwind integration for styling

**Use cases:** Personalized marketing videos, data visualization videos, automated social media content, tutorial series, product showcases, batch video generation (thousands of variants from one template).

**Source:** https://www.remotion.dev/, https://github.com/remotion-dev/remotion

---

## 2. What are Claude Code Skills?

Claude Code Skills are a feature of Claude Code (Anthropic's CLI coding agent) that extend Claude's capabilities through structured instruction files. Skills follow the open [Agent Skills](https://agentskills.io) standard.

**How Skills work:**
- Each skill is a folder with a required `SKILL.md` file
- `SKILL.md` contains YAML frontmatter (name, description, allowed-tools, model) + markdown instructions
- Claude autonomously decides when to invoke a skill based on the description and user request
- Users can also manually invoke skills via `/skill-name`
- Skills can include supporting files: templates, scripts, reference docs, examples

**Skill locations (priority order):**
1. Enterprise (org-wide, managed settings)
2. Personal (`~/.claude/skills/`)
3. Project (`.claude/skills/`)
4. Plugin (namespaced)

**Key frontmatter fields:**
- `name`, `description` — identity and trigger matching
- `disable-model-invocation` — prevent auto-loading (manual only)
- `allowed-tools` — tools Claude can use without permission prompts
- `context: fork` — run in a subagent for isolation
- `argument-hint` — autocomplete hints

**Variable substitutions:** `$ARGUMENTS`, `$ARGUMENTS[N]`, `${CLAUDE_SESSION_ID}`

**Source:** https://code.claude.com/docs/en/skills

---

## 3. Remotion Agent Skills — The Bridge

Remotion officially maintains a set of Agent Skills specifically designed for AI coding agents. These skills teach Claude (or Cursor, Codex, etc.) best practices for Remotion development.

**Installation:**
```bash
npx skills add remotion-dev/skills
```

Or automatically offered during project creation:
```bash
npx create-video@latest
# Select "Yes" to install Skills
```

**What the skills contain** (installed to `.claude/skills/remotion-best-practices/`):
- Animation rules and patterns (interpolate, spring, Sequence)
- Audio handling best practices
- Composition architecture
- Font loading patterns
- Subtitle generation
- 3D integration (Three.js)
- TailwindCSS usage in Remotion
- General Remotion coding conventions

**Source:** https://www.remotion.dev/docs/ai/skills, https://github.com/remotion-dev/remotion/tree/main/packages/skills

---

## 4. The Workflow: Claude Code + Remotion Skills

The official Remotion documentation describes a streamlined workflow:

1. **Create project:** `npx create-video@latest` (select Blank template + TailwindCSS + Skills)
2. **Start preview:** `npm run dev` (opens Remotion Studio in browser)
3. **Start Claude:** Open a separate terminal, `cd my-video && claude`
4. **Prompt videos:** Describe what you want in natural language

Because the Remotion skills are installed in `.claude/skills/`, Claude Code automatically picks them up and applies Remotion best practices when writing video code.

**Example workflow:**
- User: "Create a 10-second intro video with animated text that says 'Welcome' with a gradient background"
- Claude Code reads the Remotion skills, understands the APIs, and generates a complete React component with proper `useCurrentFrame()`, `interpolate()`, `<Sequence>` usage
- The Remotion Studio hot-reloads to show the result
- User iterates with follow-up prompts

**Source:** https://www.remotion.dev/docs/ai/claude-code

---

## 5. Community Reception and Real-World Use

The combination went viral in late January 2026, with multiple articles and social media posts:

- **Joe Njenga (Medium, Jan 21 2026):** Tested the workflow, described it as "blowing up" — noted Claude Code is evolving from coding tool to "full productivity tool"
- **Kristopher Dunham (Medium, Jan 2026):** "The Complete Guide to Remotion and Claude Code" — emphasized precision, editability, and ability to generate thousands of variations
- **Reddit r/MotionDesign (Jan 2026):** "Complete Guide: How to Setup Remotion Agent Skills with Claude Code" — highlighted that users can "literally type" natural language prompts to get motion graphics
- **DEV Community:** Detailed tutorial covering Remotion basics + Claude Code integration
- **Twitter/X:** Multiple viral demos showing launch videos created "with just 1 prompt"

**Key community insights:**
- The skills bridge the knowledge gap — without them, Claude often makes Remotion-specific mistakes
- Hot-reload in Remotion Studio makes iteration extremely fast
- Best for: motion graphics, data visualizations, branded content, social media clips
- Limitations: Complex scenes still need manual tweaking; audio sync can be tricky

---

## 6. Broader Context: AI-Powered Video Generation

This represents a shift in the "AI video" space:
- **Traditional AI video** (Sora, Runway, etc.): pixel-generation, limited control, non-deterministic
- **Remotion + Claude Code**: code-generation approach — deterministic, version-controlled, infinitely customizable, template-based scaling
- The two approaches are complementary, not competing

**Advantages of the code-generation approach:**
- Full Git version control
- CI/CD integration (render on deploy)
- Data-driven (API-fed content)
- Pixel-perfect consistency
- Batch generation from templates
- No per-render API costs (beyond compute)

---

## 7. References

1. Remotion Official Site: https://www.remotion.dev/
2. Remotion GitHub: https://github.com/remotion-dev/remotion
3. Remotion AI Skills Docs: https://www.remotion.dev/docs/ai/skills
4. Remotion Claude Code Docs: https://www.remotion.dev/docs/ai/claude-code
5. Claude Code Skills Docs: https://code.claude.com/docs/en/skills
6. Agent Skills Standard: https://agentskills.io
7. Joe Njenga, "Claude Code Remotion New Way To Create Videos," Medium, Jan 2026
8. Kristopher Dunham, "Making Videos with Code," Medium, Jan 2026
9. DEV Community, "New Claude+Remotion to create amazing videos using AI," Jan 2026
