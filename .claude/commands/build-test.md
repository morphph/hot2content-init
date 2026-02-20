Run the full build + test verification suite. Fix any issues found.

## Steps

1. **Build**: Run `npm run build`. If it fails, diagnose and fix the build errors.
2. **Lint**: Run `npm run lint`. Fix any lint violations.
3. **Unit tests**: Run `npm run test:unit`. Fix any failing tests (distinguish between test bugs and real content issues).
4. **E2E tests** (optional — skip if no dev server is available): Run `npm run test:e2e`.

Report a summary of results at the end: which steps passed, which failed, and what was fixed.
