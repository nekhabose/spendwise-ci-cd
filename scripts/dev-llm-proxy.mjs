#!/usr/bin/env node
import http from "node:http";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.LLM_PROXY_PORT || 8789;

const buildConfig = () => {
  const apiKey = process.env.GROQ_API_KEY || process.env.VITE_OPENAI_API_KEY;
  const model =
    process.env.GROQ_MODEL || process.env.VITE_OPENAI_MODEL || "llama-3.3-70b-versatile";
  const baseUrl =
    process.env.GROQ_BASE_URL || process.env.VITE_OPENAI_BASE_URL || "https://api.groq.com/openai/v1";
  return { apiKey, model, baseUrl: baseUrl.replace(/\/$/, "") };
};

const collectBody = async (req) =>
  new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(data || "{}"));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });

const handler = async (req, res) => {
  if (req.method !== "POST" || req.url !== "/.netlify/functions/llm-proxy") {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  const { apiKey, model, baseUrl } = buildConfig();
  if (!apiKey) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Missing GROQ_API_KEY for the LLM proxy." }));
    return;
  }

  let payload;
  try {
    payload = await collectBody(req);
  } catch (error) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid JSON payload." }));
    return;
  }

  const { mode } = payload;
  console.log(`[dev-llm-proxy] Incoming request`, mode);

  const buildMessages = () => {
    if (mode === "extract") {
      const statement = payload.statement || "";
      return [
        {
          role: "system",
          content:
            "You are a financial data parser. Return strictly minified JSON with this shape: " +
            '{"transactions":[{"date":"YYYY-MM-DD","description":"string","merchant":"string","amount":123.45}]}',
        },
        {
          role: "user",
          content:
            "Extract every transaction row (date, description, merchant, amount) from the following credit card statement text. " +
            "Group refunds or credits as negative numbers. If a field is missing, leave it blank. " +
            "Do NOT add categories. Statement text:\n\"\"\"\n" +
            statement +
            "\n\"\"\"",
        },
      ];
    }
    if (mode === "categorize") {
      const categories = (payload.categories || [])
        .filter((category) => category.id !== "other")
        .map((category) => `${category.id}: ${category.label} (${category.helper})`)
        .join("\n");
      const transactions = (payload.transactions || [])
        .map(
          (transaction, index) =>
            `${index}. ${transaction.description || "Unknown"} | amount: ${Number(
              transaction.amount || 0
            ).toFixed(2)} | date: ${transaction.date || "n/a"}`
        )
        .join("\n");
      return [
        {
          role: "system",
          content:
            "You map transactions to budgeting categories. Respond with strictly minified JSON shaped as " +
            '{"assignments":[{"idx":0,"bucket":"groceries"}]}. Only use category IDs from the list provided by the user.',
        },
        {
          role: "user",
          content:
            "Possible categories:\n" +
            categories +
            "\n\nTransactions:\n" +
            transactions +
            "\n\nReturn JSON only.",
        },
      ];
    }
    return null;
  };

  const messages = buildMessages();
  if (!messages) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Unsupported mode." }));
    return;
  }

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: mode === "extract" ? 0 : 0.1,
        max_tokens: mode === "extract" ? 900 : 600,
        messages,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error(`[dev-llm-proxy] Mode=${mode} failed:`, data);
      res.writeHead(response.status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: data?.error?.message || "LLM request failed." }));
      return;
    }

    console.log(`[dev-llm-proxy] Mode=${mode} success`);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        content: data.choices?.[0]?.message?.content || "",
        meta: { model, mode },
      })
    );
  } catch (error) {
    console.error(`[dev-llm-proxy] Mode=${mode} exception:`, error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: error instanceof Error ? error.message : "LLM proxy request failed.",
      })
    );
  }
};

const server = http.createServer(handler);

server.listen(PORT, () => {
  console.log(`[dev-llm-proxy] Listening on http://localhost:${PORT}/.netlify/functions/llm-proxy`);
});

process.on("SIGINT", () => {
  server.close(() => {
    process.exit(0);
  });
});
