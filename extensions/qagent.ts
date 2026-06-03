// @ts-ignore @qagent/cli is JavaScript-only and does not publish declarations.
import { runQAgent } from "@qagent/cli/src/runner.js";
import type { Api, Model } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

type QAgentParams = {
  url: string;
  goal: string;
  headed?: boolean;
  maxTurns?: number;
  testTimeoutSeconds?: number;
  networkTimeoutSeconds?: number;
  actionTimeoutSeconds?: number;
};

type RequestAuth = {
  apiKey?: string;
  headers?: Record<string, string>;
};

type PiModel = Model<Api>;

type QAgentResult = {
  outcome?: string;
  evidence?: string;
  turns?: number;
  elapsedMs?: number;
  finalUrl?: string;
  [key: string]: unknown;
};

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "qagent_run",
    label: "QAgent",
    description: "Run QAgent against one URL and goal using Pi's active model and authentication.",
    promptSnippet: "Use qagent_run to verify a web page with QAgent using Pi's active model and credentials.",
    promptGuidelines: [
      "Use qagent_run for single-page browser verification tasks with one URL and one natural-language goal.",
      "Do not use qagent_run for multi-step planning across unrelated pages; call it once per focused check."
    ],
    parameters: Type.Object({
      url: Type.String({
        description: "Start URL for QAgent."
      }),
      goal: Type.String({
        description: "Natural-language verification goal."
      }),
      headed: Type.Optional(Type.Boolean({
        description: "Show the browser window. Defaults to QAgent's headless mode."
      })),
      maxTurns: Type.Optional(Type.Number({
        minimum: 1,
        description: "Maximum QAgent turns. Defaults to QAgent's runner default."
      })),
      testTimeoutSeconds: Type.Optional(Type.Number({
        minimum: 1,
        description: "Overall QAgent run timeout in seconds. Defaults to QAgent's runner default."
      })),
      networkTimeoutSeconds: Type.Optional(Type.Number({
        minimum: 1,
        description: "Per-navigation timeout in seconds. Defaults to QAgent's runner default."
      })),
      actionTimeoutSeconds: Type.Optional(Type.Number({
        minimum: 1,
        description: "Per-action timeout in seconds. Defaults to QAgent's runner default."
      }))
    }),
    async execute(_toolCallId, params: QAgentParams, signal, _onUpdate, ctx) {
      throwIfAborted(signal);

      const model = ctx.model;
      if (!model) {
        throw new Error("No active Pi model is configured.");
      }

      const authCache = new Map<PiModel, RequestAuth>();
      const resolveRequestAuth = async (requestedModel: PiModel): Promise<RequestAuth> => {
        if (authCache.has(requestedModel)) {
          return authCache.get(requestedModel)!;
        }

        const auth = await ctx.modelRegistry.getApiKeyAndHeaders(requestedModel);
        if (!auth.ok) {
          throw new Error(auth.error);
        }

        const requestAuth = {
          apiKey: auth.apiKey,
          headers: auth.headers
        };
        authCache.set(requestedModel, requestAuth);
        return requestAuth;
      };

      // Fail Pi auth before QAgent launches a browser.
      await resolveRequestAuth(model);
      throwIfAborted(signal);

      const options = buildRunnerOptions(params);
      const result = await runQAgent({
        url: params.url,
        goal: params.goal,
        model,
        resolveRequestAuth,
        ...options
      }) as QAgentResult;

      return {
        content: [{ type: "text", text: formatResult(result) }],
        details: {
          result,
          run: {
            url: params.url,
            goal: params.goal,
            options
          }
        }
      };
    }
  });
}

function buildRunnerOptions(params: QAgentParams) {
  const options: {
    headed?: boolean;
    maxTurns?: number;
    testTimeoutMs?: number;
    networkTimeoutMs?: number;
    actionTimeoutMs?: number;
  } = {};

  if (params.headed !== undefined) {
    if (typeof params.headed !== "boolean") {
      throw new Error("headed must be a boolean.");
    }
    options.headed = params.headed;
  }

  const maxTurns = optionalPositiveInteger(params.maxTurns, "maxTurns");
  if (maxTurns !== undefined) options.maxTurns = maxTurns;

  const testTimeoutSeconds = optionalPositiveNumber(params.testTimeoutSeconds, "testTimeoutSeconds");
  if (testTimeoutSeconds !== undefined) options.testTimeoutMs = secondsToMilliseconds(testTimeoutSeconds);

  const networkTimeoutSeconds = optionalPositiveNumber(params.networkTimeoutSeconds, "networkTimeoutSeconds");
  if (networkTimeoutSeconds !== undefined) options.networkTimeoutMs = secondsToMilliseconds(networkTimeoutSeconds);

  const actionTimeoutSeconds = optionalPositiveNumber(params.actionTimeoutSeconds, "actionTimeoutSeconds");
  if (actionTimeoutSeconds !== undefined) options.actionTimeoutMs = secondsToMilliseconds(actionTimeoutSeconds);

  return options;
}

function optionalPositiveInteger(value: number | undefined, name: string) {
  if (value === undefined) return undefined;
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return value;
}

function optionalPositiveNumber(value: number | undefined, name: string) {
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number.`);
  }
  return value;
}

function secondsToMilliseconds(seconds: number) {
  return seconds * 1000;
}

function formatResult(result: QAgentResult) {
  const outcome = String(result.outcome ?? "unknown").toUpperCase();
  const evidence = String(result.evidence ?? "No evidence returned.");
  const lines = [
    `QAgent ${outcome}`,
    `Evidence: ${evidence}`
  ];

  if (result.finalUrl) {
    lines.push(`Final URL: ${result.finalUrl}`);
  }
  if (typeof result.turns === "number") {
    lines.push(`Turns: ${result.turns}`);
  }
  if (typeof result.elapsedMs === "number") {
    lines.push(`Elapsed: ${(result.elapsedMs / 1000).toFixed(1)}s`);
  }

  return lines.join("\n");
}

function throwIfAborted(signal: AbortSignal | undefined) {
  if (!signal?.aborted) return;
  if (signal.reason instanceof Error) {
    throw signal.reason;
  }
  throw new Error("qagent_run was cancelled.");
}
