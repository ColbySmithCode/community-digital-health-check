#!/usr/bin/env node
/**
 * MCP server for the Community Digital Health Check.
 *
 * Tools:
 *   - run_test_audit     : POST /audit on WORKER_URL with { name, city, type }
 *   - check_worker_health: GET /health on WORKER_URL
 *   - show_system_prompt : extract the SYSTEM_PROMPT constant from worker/src/index.js
 *
 * Transport: stdio. Exposes start(). Run with `--test` to self-check and exit 0.
 *
 * Reads the deployed worker URL from the WORKER_URL environment variable.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const WORKER_SOURCE = resolve(PROJECT_ROOT, "worker/src/index.js");

const TOOLS = [
  {
    name: "run_test_audit",
    description:
      "POST /audit on the deployed worker (WORKER_URL) with { name, city, type } and return the full audit JSON.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Organization name." },
        city: { type: "string", description: "City, e.g. 'Portland, OR'." },
        type: { type: "string", description: "Organization type, e.g. 'restaurant'." },
      },
      required: ["name", "city", "type"],
      additionalProperties: false,
    },
  },
  {
    name: "check_worker_health",
    description: "GET /health on the deployed worker (WORKER_URL). Returns status and response time.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "show_system_prompt",
    description:
      "Read worker/src/index.js and return the SYSTEM_PROMPT constant so it can be reviewed or edited without opening the file.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
];

function workerUrl() {
  const url = process.env.WORKER_URL;
  if (!url) throw new Error("WORKER_URL environment variable is not set");
  return url;
}

async function runTestAudit({ name, city, type }) {
  if (!name || !city || !type) {
    throw new Error("name, city, and type are all required");
  }
  const started = Date.now();
  const res = await fetch(new URL("/audit", workerUrl()), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, city, type }),
  });
  const latency = Date.now() - started;
  const text = await res.text();
  let audit;
  try {
    audit = JSON.parse(text);
  } catch {
    audit = { raw: text };
  }
  return { http_status: res.status, latency_ms: latency, audit };
}

async function checkWorkerHealth() {
  const started = Date.now();
  try {
    const res = await fetch(new URL("/health", workerUrl()), { method: "GET" });
    return {
      status: res.ok ? "ok" : `http_${res.status}`,
      response_time_ms: Date.now() - started,
    };
  } catch (err) {
    return { status: `error: ${err.message}`, response_time_ms: Date.now() - started };
  }
}

// Extract `const SYSTEM_PROMPT = <literal>;` — handles backtick, single, or double quotes.
function extractSystemPrompt(source) {
  const idx = source.indexOf("SYSTEM_PROMPT");
  if (idx === -1) return null;
  const eq = source.indexOf("=", idx);
  if (eq === -1) return null;
  // First quote char after the '='.
  let i = eq + 1;
  while (i < source.length && /\s/.test(source[i])) i++;
  const quote = source[i];
  if (quote !== "`" && quote !== "'" && quote !== '"') return null;
  let out = "";
  i++;
  while (i < source.length) {
    const ch = source[i];
    if (ch === "\\") {
      out += source[i] + source[i + 1];
      i += 2;
      continue;
    }
    if (ch === quote) break;
    out += ch;
    i++;
  }
  return out;
}

async function showSystemPrompt() {
  let source;
  try {
    source = await readFile(WORKER_SOURCE, "utf8");
  } catch {
    return { found: false, message: `Could not read ${WORKER_SOURCE}` };
  }
  const prompt = extractSystemPrompt(source);
  if (prompt == null) {
    return { found: false, message: "SYSTEM_PROMPT constant not found in worker/src/index.js" };
  }
  return { found: true, length: prompt.length, system_prompt: prompt };
}

async function dispatch(name, args) {
  switch (name) {
    case "run_test_audit":
      return runTestAudit(args ?? {});
    case "check_worker_health":
      return checkWorkerHealth();
    case "show_system_prompt":
      return showSystemPrompt();
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export function buildServer() {
  const server = new Server(
    { name: "community-digital-health-check", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      const result = await dispatch(name, args);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error in ${name}: ${err.message}` }],
      };
    }
  });
  return server;
}

export async function start() {
  const server = buildServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  return server;
}

async function selfTest() {
  const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
  const { InMemoryTransport } = await import(
    "@modelcontextprotocol/sdk/inMemory.js"
  );
  const server = buildServer();
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "selftest", version: "1.0.0" }, {});
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  const { tools } = await client.listTools();
  console.error(
    `✓ community-digital-health-check MCP server OK — ${tools.length} tools: ${tools
      .map((t) => t.name)
      .join(", ")}`
  );
  await client.close();
  await server.close();
}

const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  if (process.argv.includes("--test")) {
    selfTest()
      .then(() => process.exit(0))
      .catch((err) => {
        console.error("✗ self-test failed:", err);
        process.exit(1);
      });
  } else {
    start().catch((err) => {
      console.error("Fatal:", err);
      process.exit(1);
    });
  }
}
