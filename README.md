# qagent-pidev-package

Pi package for QAgent.

## Tools

- `qagent_run`: runs QAgent's public runner API with one URL and one
  natural-language verification goal, using Pi's active model and credentials.

`qagent_run` accepts `url` and `goal`, plus optional `headed`, `maxTurns`,
`testTimeoutSeconds`, `networkTimeoutSeconds`, and `actionTimeoutSeconds`
runner controls. It does not use QAgent CLI config, environment API keys, or a
separate credential store.

## Requirements

- Node.js 22.19.0 or newer.
- `@qagent/cli` 0.6.1 or newer.

## Local Install

```bash
npm install
pi install ./
```
