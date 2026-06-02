import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { completeSimple, type Context, type TextContent } from "@earendil-works/pi-ai";
import { Type } from "typebox";

type HelloWorldParams = {
  topic?: string;
};

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "hello_world",
    label: "Hello World",
    description: "Write a short haiku about hello-world using Pi's currently configured LLM.",
    promptSnippet: "Use hello_world to test whether the QAgent Pi package can call Pi's configured LLM.",
    promptGuidelines: [
      "Use hello_world when the user asks to smoke-test the QAgent Pi package LLM authentication path."
    ],
    parameters: Type.Object({
      topic: Type.Optional(Type.String({
        description: "Haiku topic. Defaults to hello-world."
      }))
    }),
    async execute(_toolCallId, params: HelloWorldParams, signal, _onUpdate, ctx) {
      const model = ctx.model;
      if (!model) {
        throw new Error("No active Pi model is configured.");
      }

      const auth = await ctx.modelRegistry.getApiKeyAndHeaders(model);
      if (!auth.ok) {
        throw new Error(auth.error);
      }

      const topic = params.topic?.trim() || "hello-world";
      const context: Context = {
        systemPrompt: [
          "You write concise haiku.",
          "Return exactly three short lines.",
          "Do not include a title, explanation, bullets, or code formatting."
        ].join("\n"),
        messages: [
          {
            role: "user",
            content: `Write a small haiku about ${topic}.`,
            timestamp: Date.now()
          }
        ]
      };

      const thinkingLevel = pi.getThinkingLevel();
      const response = await completeSimple(model, context, {
        apiKey: auth.apiKey,
        headers: auth.headers,
        maxTokens: 80,
        signal,
        ...(thinkingLevel === "off" ? {} : { reasoning: thinkingLevel })
      });

      if (response.stopReason === "error") {
        throw new Error(response.errorMessage || "The active Pi model returned an error.");
      }

      const haiku = response.content
        .filter((block): block is TextContent => block.type === "text")
        .map((block) => block.text.trim())
        .filter(Boolean)
        .join("\n")
        .trim();

      if (!haiku) {
        throw new Error("The active Pi model did not return text.");
      }

      return {
        content: [{ type: "text", text: haiku }],
        details: {
          haiku,
          topic,
          model: {
            provider: response.provider,
            id: response.model,
            responseModel: response.responseModel
          },
          usage: response.usage
        }
      };
    }
  });
}
