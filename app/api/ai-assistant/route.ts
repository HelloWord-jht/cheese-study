import {
  ACTIVITY_LIBRARY,
  INTEREST_LABELS,
  activityTemplate,
  isInterestKey,
  type ActivityResult,
  type InterestKey,
} from "../../../lib/learning";

type ProviderId = "deepseek" | "openai";
type ChatRole = "user" | "assistant";
type ChatMessage = { role: ChatRole; content: string };

type RequestPayload = {
  provider?: unknown;
  messages?: unknown;
  context?: unknown;
  clientId?: unknown;
};

type LearningContext = {
  interests: InterestKey[];
  recentResults: Array<{
    activityId: string;
    title: string;
    domain: string;
    skill: string;
    template: string;
    attempts: number;
    completed: boolean;
    hintLevel: number;
    audioReplayCount: number;
    durationSeconds: number;
  }>;
  todayActivities: Array<{ activityId: string; title: string; domain: string; skill: string }>;
};

const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
const DEEPSEEK_BASE_URL = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/$/, "");
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";
const OPENAI_BASE_URL = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
const configuredDefault = process.env.AI_DEFAULT_PROVIDER === "openai" ? "openai" : "deepseek";
const requestBuckets = new Map<string, { date: string; count: number }>();
const MAX_REQUESTS_PER_DAY = 40;
const MAX_REQUESTS_PER_IP_PER_DAY = 120;

const SYSTEM_PROMPT = `你是“小满的小世界”的家长 AI 共学助手，服务对象是具备独立判断能力的成年家长。
你可以开放讨论三岁幼儿启蒙、亲子阅读、语言、数学、英语、游戏、家庭活动和教育观点，也可以创作故事、方案与清单，不受儿童审核题库内容限制。
回答要直接、具体、有信息密度；必要时主动指出不同观点、证据强弱、假设与不确定性，不使用居高临下的语气。
学习记录只是少量家庭观察，不得据此诊断、给孩子贴标签或把相关性说成因果。医疗、心理、发育等高风险问题应说明信息边界并建议寻求适当专业意见。
家长可能提供学习上下文，也可能关闭上下文。不要声称看到了未提供的数据。默认使用中文回答，除非家长要求其他语言。`;

function json(data: object, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function providerInfo() {
  return [
    {
      id: "deepseek" as const,
      label: "DeepSeek",
      model: DEEPSEEK_MODEL,
      configured: Boolean(process.env.DEEPSEEK_API_KEY?.trim()),
    },
    {
      id: "openai" as const,
      label: "GPT",
      model: OPENAI_MODEL,
      configured: Boolean(process.env.OPENAI_API_KEY?.trim()),
    },
  ];
}

function sanitizeClientId(value: unknown) {
  if (typeof value !== "string") return "family_device";
  return value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || "family_device";
}

function sanitizeProvider(value: unknown): ProviderId {
  return value === "openai" ? "openai" : "deepseek";
}

function sanitizeMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(-10)
    .map((message) => {
      if (!message || typeof message !== "object") return null;
      const item = message as { role?: unknown; content?: unknown };
      if (item.role !== "user" && item.role !== "assistant") return null;
      if (typeof item.content !== "string") return null;
      const content = item.content
        .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ")
        .replace(/\s{3,}/g, "  ")
        .trim()
        .slice(0, 500);
      return content ? { role: item.role, content } : null;
    })
    .filter((message): message is ChatMessage => Boolean(message));
}

function sanitizeContext(value: unknown): LearningContext | null {
  if (!value || typeof value !== "object") return null;
  const context = value as {
    interests?: unknown;
    recentResults?: unknown;
    todayActivities?: unknown;
  };
  const interests = Array.isArray(context.interests)
    ? context.interests.filter(isInterestKey).slice(0, 6)
    : [];
  const recentResults = Array.isArray(context.recentResults)
    ? context.recentResults.slice(-12).flatMap((result) => {
        if (!result || typeof result !== "object") return [];
        const item = result as Partial<ActivityResult>;
        const activity = ACTIVITY_LIBRARY.find((candidate) => candidate.id === item.activityId);
        if (!activity) return [];
        return [{
          activityId: activity.id,
          title: activity.title,
          domain: activity.domain,
          skill: activity.skill,
          template: activityTemplate(activity),
          attempts: Math.min(Math.max(Number(item.attempts) || 0, 0), 8),
          completed: Boolean(item.correct),
          hintLevel: Math.min(Math.max(Number(item.hintLevelUsed) || 0, 0), 2),
          audioReplayCount: Math.min(Math.max(Number(item.audioReplayCount) || 0, 0), 10),
          durationSeconds: Math.min(Math.max(Number(item.durationSeconds) || 0, 0), 1200),
        }];
      })
    : [];
  const todayActivities = Array.isArray(context.todayActivities)
    ? context.todayActivities.slice(0, 3).flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const activityId = (item as { activityId?: unknown }).activityId;
        const activity = ACTIVITY_LIBRARY.find((candidate) => candidate.id === activityId);
        return activity ? [{
          activityId: activity.id,
          title: activity.title,
          domain: activity.domain,
          skill: activity.skill,
        }] : [];
      })
    : [];

  return { interests, recentResults, todayActivities };
}

function contextPrompt(context: LearningContext | null) {
  if (!context) return "家长没有授权携带学习上下文，请只根据对话回答。";
  return `以下是家长主动授权的匿名学习摘要，仅作为参考：\n${JSON.stringify({
    ageBand: "三岁左右",
    interests: context.interests.map((interest) => INTEREST_LABELS[interest]),
    recentResults: context.recentResults,
    todayActivities: context.todayActivities,
  })}`;
}

function applyRateLimit(key: string, limit: number) {
  const date = new Date().toISOString().slice(0, 10);
  const current = requestBuckets.get(key);
  if (!current || current.date !== date) {
    requestBuckets.set(key, { date, count: 1 });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

function extractOpenAIText(response: {
  output_text?: unknown;
  output?: Array<{ content?: Array<{ type?: string; text?: unknown }> }>;
}) {
  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }
  return response.output
    ?.flatMap((item) => item.content ?? [])
    .filter((item) => item.type === "output_text" && typeof item.text === "string")
    .map((item) => item.text as string)
    .join("\n")
    .trim() || "";
}

async function askDeepSeek(messages: ChatMessage[], context: LearningContext | null, clientId: string, signal: AbortSignal) {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) throw new Error("provider_not_configured");
  const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: "system", content: `${SYSTEM_PROMPT}\n\n${contextPrompt(context)}` },
        ...messages,
      ],
      thinking: { type: "disabled" },
      temperature: 0.65,
      max_tokens: 1800,
      stream: false,
      user_id: clientId,
    }),
    signal,
  });
  if (!response.ok) throw new Error(`upstream_${response.status}`);
  const completion = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  return completion.choices?.[0]?.message?.content?.trim() || "";
}

async function askOpenAI(messages: ChatMessage[], context: LearningContext | null, clientId: string, signal: AbortSignal) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("provider_not_configured");
  const response = await fetch(`${OPENAI_BASE_URL}/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      instructions: `${SYSTEM_PROMPT}\n\n${contextPrompt(context)}`,
      input: messages,
      reasoning: { effort: "low" },
      text: { verbosity: "medium" },
      max_output_tokens: 1800,
      store: false,
      safety_identifier: clientId,
      prompt_cache_key: `cheese-family-${clientId}`,
    }),
    signal,
  });
  if (!response.ok) throw new Error(`upstream_${response.status}`);
  return extractOpenAIText(await response.json());
}

export function GET() {
  return json({ providers: providerInfo(), defaultProvider: configuredDefault });
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 64_000) return json({ error: "请求内容过长" }, 413);

  let payload: RequestPayload;
  try {
    payload = (await request.json()) as RequestPayload;
  } catch {
    return json({ error: "请求格式不正确" }, 400);
  }

  const provider = sanitizeProvider(payload.provider);
  const messages = sanitizeMessages(payload.messages);
  const context = sanitizeContext(payload.context);
  const clientId = sanitizeClientId(payload.clientId);
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  const remoteAddress = request.headers.get("cf-connecting-ip")
    || request.headers.get("x-real-ip")
    || forwardedFor
    || "local";
  const selectedProvider = providerInfo().find((item) => item.id === provider);
  if (!selectedProvider?.configured) {
    return json({ error: `${selectedProvider?.label || "所选模型"} 尚未配置 API Key`, code: "provider_not_configured" }, 503);
  }
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return json({ error: "请输入想和 AI 讨论的问题" }, 400);
  }
  if (!applyRateLimit(`${provider}:device:${clientId}`, MAX_REQUESTS_PER_DAY)
    || !applyRateLimit(`${provider}:network:${remoteAddress}`, MAX_REQUESTS_PER_IP_PER_DAY)) {
    return json({ error: "今天的 AI 问答次数已用完，明天再继续", code: "daily_limit" }, 429);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  const startedAt = Date.now();
  try {
    const reply = provider === "openai"
      ? await askOpenAI(messages, context, clientId, controller.signal)
      : await askDeepSeek(messages, context, clientId, controller.signal);
    if (!reply) throw new Error("empty_response");
    console.info(`[ai-assistant] provider=${provider} model=${selectedProvider.model} duration_ms=${Date.now() - startedAt} status=ok`);
    return json({ reply: reply.slice(0, 5000), provider, model: selectedProvider.model });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown_error";
    console.warn(`[ai-assistant] provider=${provider} model=${selectedProvider.model} duration_ms=${Date.now() - startedAt} status=error reason=${reason}`);
    if (error instanceof Error && error.name === "AbortError") {
      return json({ error: "AI 思考时间有点久，请稍后再试", code: "timeout" }, 504);
    }
    return json({ error: "AI 暂时没有连上，请稍后再试", code: reason }, 502);
  } finally {
    clearTimeout(timeout);
  }
}
