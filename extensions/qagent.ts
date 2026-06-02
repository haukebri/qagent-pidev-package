import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const execFileAsync = promisify(execFile);
const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const localQAgent = join(packageRoot, "node_modules", ".bin", "qagent");

type QAgentParams = {
  url: string;
  goal: string;
};

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "qagent_run",
    label: "QAgent",
    description: "Run the installed qagent CLI against one URL and goal.",
    promptSnippet: "Use qagent_run to run the qagent CLI against one URL and goal.",
    parameters: Type.Object({
      url: Type.String(),
      goal: Type.String()
    }),
    async execute(_toolCallId, params: QAgentParams, signal) {
      const result = await execFileAsync(qagentCommand(), ["--url", params.url, params.goal], {
        encoding: "utf8",
        signal
      });
      const text = result.stdout.trim() || result.stderr.trim() || "qagent finished with no output.";

      return {
        content: [{ type: "text", text }],
        details: result
      };
    }
  });
}

function qagentCommand() {
  return existsSync(localQAgent) ? localQAgent : "qagent";
}
