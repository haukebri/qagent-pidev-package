# Skill Approach

The pi-dev QAgent skill should behave like a senior QA agent: if no testing scope
is provided, inspect the task, changed app surface, and likely risks, then derive
a focused set of checks. For the MVP, it runs those checks through the QAgent
tool and returns concise evidence-backed verdicts. The prompt layer defines QA
judgment and scope selection; the technical layer exposes QAgent safely. Later,
the skill can offer direct Playwright and specialized QA tools for deeper
investigation.
