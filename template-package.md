# Pi Hello-World Tool Package Template

Research date: 2026-06-02.

This is the minimal shape for a pi-dev package that exposes one custom tool. The
tool returns a hello-world greeting and proves the package can register a tool
callable by Pi agents.

## What Pi Needs

A Pi package can bundle extensions, skills, prompt templates, and themes. For a
tool-only MVP, use an extension package:

```text
pi-hello-world-tool/
  package.json
  extensions/
    hello-world.ts
```

Pi can discover package resources either from a `pi` manifest in `package.json`
or from conventional directories such as `extensions/`. Use both a conventional
directory and an explicit manifest for clarity.

## package.json

```json
{
  "name": "pi-hello-world-tool",
  "version": "0.0.1",
  "description": "Minimal Pi package that registers a hello-world tool.",
  "type": "module",
  "keywords": ["pi-package"],
  "pi": {
    "extensions": ["./extensions"]
  },
  "peerDependencies": {
    "@earendil-works/pi-coding-agent": "*",
    "typebox": "*"
  }
}
```

Pi core packages imported by extensions should be listed as peer dependencies
with `"*"` and not bundled. For this hello-world package, the extension imports
`@earendil-works/pi-coding-agent` for types and `typebox` for the tool parameter
schema.

## extensions/hello-world.ts

```ts
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "hello_world",
    label: "Hello World",
    description: "Return a hello-world greeting.",
    promptSnippet: "Return a hello-world greeting.",
    promptGuidelines: [
      "Use hello_world when the user asks to test the hello-world Pi tool."
    ],
    parameters: Type.Object({
      name: Type.Optional(Type.String({
        description: "Name to greet. Defaults to world."
      }))
    }),
    async execute(_toolCallId, params) {
      const name = params.name?.trim() || "world";
      const greeting = `Hello, ${name}!`;

      return {
        content: [{ type: "text", text: greeting }],
        details: { greeting }
      };
    }
  });
}
```

The important API is `pi.registerTool()`. The returned object should include
`content` for the user/model-visible tool output and can include `details` for
structured data.

## Local Test

First test the extension file directly:

```bash
pi -e ./extensions/hello-world.ts
```

Then ask Pi to call the tool, for example:

```text
Use the hello_world tool to greet QAgent.
```

Once the extension works, test the package form from the package root:

```bash
pi install ./
pi list
pi
```

The package should appear in `pi list`, and the `hello_world` tool should be
available to the agent in a new Pi session.

## Notes For The QAgent Package

The QAgent MVP should follow this same package shape:

- `package.json` declares the Pi package and extension path.
- `extensions/` contains the tool registration.
- The tool exposes one callable operation.
- The tool returns compact structured output.

For QAgent, the hello-world `execute()` body will be replaced with runner logic
that invokes the published `qagent` CLI flow and routes pi-dev model/auth into
that run.

## Sources

- Pi package docs: https://pi.dev/docs/latest/packages
- Pi extension docs: https://pi.dev/docs/latest/extensions
- Pi package catalog: https://pi.dev/packages
