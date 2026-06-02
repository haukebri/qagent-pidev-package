# QAgent Pi Package Project Overview

Status: revised 2026-06-02.

## Purpose

This repository packages [QAgent](https://github.com/haukebri/QAgent) for
pi-dev.

QAgent is a published single-goal CLI checker: one URL, one natural-language
goal, one browser verification result. The pi-dev package should make that
runner available to Pi agents without changing QAgent's direct CLI usage.

## MVP

The MVP is a Pi tool that exposes the existing QAgent CLI flow.

Pi agents should be able to call the tool with the same core inputs a CLI user
would provide: URL, goal, run limits, and headed/headless preference. The tool
then runs QAgent as a single-goal checker and returns a compact structured result
with outcome, evidence, turn count, elapsed time, and final URL.

The key difference from direct CLI usage is authentication and model selection:
in the pi-dev flow, QAgent should use the LLM model and credentials supplied by
pi-dev, so users do not need to maintain separate QAgent model/API-key config.

## Future Skill

After the tool exists, this package can add a QAgent skill.

The skill is the higher-level QA driver. When a user says something like "use
qagent to verify the result", the skill should inspect the task or recent
changes, derive a handful of focused verification checks, call the MVP QAgent
tool once per check, and summarize the result.

If a QAgent failure is ambiguous or potentially flaky, the skill can manually
inspect the path with Playwright before giving the final verdict.

## Boundaries

- QAgent remains a single-goal CLI checker.
- This package should not copy or reimplement QAgent's browser runner.
- The MVP is the Pi tool, not the skill.
- The future skill uses the MVP tool; it does not add multi-goal behavior to
  QAgent itself.
- QAgent's standalone npm/CLI usage remains valid for non-Pi users.
- pi-dev owns model selection and authentication for QAgent runs launched through
  this package.

## References

- QAgent upstream repo: `~/Projects/qagent`
- QAgent architecture notes: `~/Projects/qagent/docs/project-architecture.md`
- QAgent Pi auth prep notes: `~/Projects/qagent/docs/pi-dev-cli-prep.md`
- Pi package catalog: https://pi.dev/packages
