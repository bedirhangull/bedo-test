import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "bedo-test-mcp",
    version: "0.1.0",
  });

  server.registerTool(
    "greet",
    {
      title: "Greet User",
      description: "Returns a friendly greeting message for the given name.",
      inputSchema: z.object({
        name: z.string().describe("Name to greet"),
      }),
    },
    async ({ name }) => ({
      content: [
        {
          type: "text" as const,
          text: `Hello, ${name}! 👋 The MCP OAuth connection is working perfectly.`,
        },
      ],
    }),
  );

  server.registerTool(
    "get_time",
    {
      title: "Get Current Time",
      description: "Returns the current server date and time.",
      inputSchema: z.object({}),
    },
    async () => ({
      content: [
        {
          type: "text" as const,
          text: `Current server time: ${new Date().toISOString()}`,
        },
      ],
    }),
  );

  server.registerTool(
    "calculate",
    {
      title: "Calculate",
      description: "Performs basic arithmetic: add, subtract, multiply, divide.",
      inputSchema: z.object({
        a: z.number().describe("First number"),
        b: z.number().describe("Second number"),
        operation: z
          .enum(["add", "subtract", "multiply", "divide"])
          .describe("Arithmetic operation"),
      }),
    },
    async ({ a, b, operation }) => {
      let result: number;
      switch (operation) {
        case "add":
          result = a + b;
          break;
        case "subtract":
          result = a - b;
          break;
        case "multiply":
          result = a * b;
          break;
        case "divide":
          if (b === 0)
            return {
              content: [{ type: "text" as const, text: "Error: Division by zero" }],
            };
          result = a / b;
          break;
        default:
          result = 0;
      }
      return {
        content: [{ type: "text" as const, text: `${a} ${operation} ${b} = ${result}` }],
      };
    },
  );

  return server;
}
