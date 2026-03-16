export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { message, history } = body as {
    message: string;
    history?: { role: "user" | "assistant"; content: string }[];
  };

  if (!message)
    throw createError({ statusCode: 400, message: "message required" });

  const config = useRuntimeConfig();
  const apiKey = config.openaiApiKey as string;
  const baseUrl =
    (config.openaiBaseUrl as string) || "https://api.openai.com/v1";
  const model = (config.openaiModel as string) || "gpt-4o-mini";

  if (!apiKey)
    throw createError({
      statusCode: 503,
      message: "AI 功能未配置，请在 .env 中设置 OPENAI_API_KEY",
    });

  const messages = [
    {
      role: "system",
      content:
        "你是一个专业的 DevOps 工程师助手，擅长分析 CI/CD 构建日志、Docker、GitLab Pipeline 错误，并给出简洁明了的中文修复建议。",
    },
    ...(history || []).slice(-8),
    { role: "user", content: message },
  ];

  try {
    const res = await $fetch<{ choices: { message: { content: string } }[] }>(
      `${baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 2000,
          temperature: 0.7,
        }),
      }
    );

    const reply = res.choices?.[0]?.message?.content || "抱歉，无法获取回复。";
    return { reply };
  } catch (err: unknown) {
    const e = err as {
      data?: { error?: { message?: string } };
      message?: string;
    };
    const msg = e?.data?.error?.message || e?.message || "AI 服务请求失败";
    throw createError({ statusCode: 502, message: msg });
  }
});
