const buildGroqConfig = () => {
  const apiKey = process.env.GROQ_API_KEY || process.env.VITE_OPENAI_API_KEY;
  const model =
    process.env.GROQ_MODEL || process.env.VITE_OPENAI_MODEL || "llama-3.3-70b-versatile";
  const baseUrl =
    process.env.GROQ_BASE_URL || process.env.VITE_OPENAI_BASE_URL || "https://api.groq.com/openai/v1";
  return { apiKey, model, baseUrl: baseUrl.replace(/\/$/, "") };
};

const buildExtractMessages = (statement) => [
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

const buildCategorizeMessages = (categories = [], transactions = []) => {
  const categoryLines = categories
    .filter((category) => category.id !== "other")
    .map((category) => `${category.id}: ${category.label} (${category.helper})`)
    .join("\n");
  const transactionLines = transactions
    .map(
      (transaction, index) =>
        `${index}. ${transaction.description || "Unknown"} | amount: ${Number(
          transaction.amount
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
        categoryLines +
        "\n\nTransactions:\n" +
        transactionLines +
        "\n\nReturn JSON only.",
    },
  ];
};

const buildResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return buildResponse(405, { error: "Method not allowed" });
  }

  const { apiKey, model, baseUrl } = buildGroqConfig();
  if (!apiKey) {
    return buildResponse(400, { error: "Missing GROQ_API_KEY for the LLM proxy." });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (error) {
    return buildResponse(400, { error: "Invalid JSON payload." });
  }

  const mode = payload.mode;
  let messages;

  if (mode === "extract") {
    if (!payload.statement) {
      return buildResponse(400, { error: "Missing statement text." });
    }
    const snippet =
      payload.statement.length > 18000 ? payload.statement.slice(0, 18000) : payload.statement;
    messages = buildExtractMessages(snippet);
  } else if (mode === "categorize") {
    if (!Array.isArray(payload.transactions) || !payload.transactions.length) {
      return buildResponse(400, { error: "Missing transactions to categorize." });
    }
    messages = buildCategorizeMessages(payload.categories || [], payload.transactions);
  } else {
    return buildResponse(400, { error: "Unsupported mode." });
  }

  let responseData;
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
      return buildResponse(response.status, {
        error: data?.error?.message || "LLM request failed.",
      });
    }

    responseData = {
      content: data.choices?.[0]?.message?.content || "",
      meta: { model, mode },
    };
    console.log(`[llm-proxy] Mode=${mode} Success. Tokens used:`, data.usage || {});
    return buildResponse(200, responseData);
  } catch (error) {
    console.error(`[llm-proxy] Mode=${mode} Failure:`, error);
    return buildResponse(500, {
      error: error instanceof Error ? error.message : "LLM proxy request failed.",
      mode,
    });
  }
};
