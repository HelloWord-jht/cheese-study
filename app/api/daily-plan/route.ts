import {
  ACTIVITY_LIBRARY,
  activityTemplate,
  createCuratedPlan,
  isInterestKey,
  localDateKey,
  type ActivityResult,
  type InterestKey,
} from "../../../lib/learning";

type RequestPayload = {
  date?: string;
  interests?: unknown[];
  recentResults?: Partial<ActivityResult>[];
  clientId?: string;
};

type DeepSeekSelection = {
  activityIds?: unknown;
  parentTip?: unknown;
  selectionReason?: unknown;
  parentInsight?: unknown;
  offlineMissionId?: unknown;
};

const OFFLINE_MISSIONS = [
  { id: "find-three-wheels", text: "一起找三辆有轮子的玩具车，慢慢数一、二、三。", interests: ["vehicles", "construction"] },
  { id: "build-dino-home", text: "用积木给小恐龙搭一个家，说说哪里是里面和外面。", interests: ["dinosaurs", "construction"] },
  { id: "rocket-countdown", text: "一起做三次火箭倒计时，再轻轻跳起来。", interests: ["space"] },
  { id: "animal-moves", text: "轮流模仿两种小动物的动作，请对方猜一猜。", interests: ["animals", "nature"] },
  { id: "color-hunt", text: "在家找一个红色和一个蓝色物品，放到一起看看。", interests: ["nature", "vehicles"] },
  { id: "big-small-pair", text: "找一大一小两个安全物品，说说哪个大、哪个小。", interests: ["construction", "animals"] },
] as const;

const requestBuckets = new Map<string, { date: string; count: number }>();
const responseCache = new Map<string, { expiresAt: number; response: object }>();
const MAX_REQUESTS_PER_DAY = 20;
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
const BASE_URL = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/$/, "");

function json(data: object, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function cleanClientId(value: unknown) {
  if (typeof value !== "string") return "family_device";
  const safe = value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  return safe || "family_device";
}

function applyRateLimit(key: string, date: string) {
  const current = requestBuckets.get(key);
  if (!current || current.date !== date) {
    requestBuckets.set(key, { date, count: 1 });
    return true;
  }
  if (current.count >= MAX_REQUESTS_PER_DAY) return false;
  current.count += 1;
  return true;
}

function validDate(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : localDateKey();
}

function sanitizeInterests(values: unknown): InterestKey[] {
  if (!Array.isArray(values)) return ["dinosaurs", "vehicles", "construction", "space"];
  const interests = values.filter(isInterestKey).slice(0, 6);
  return interests.length ? interests : ["dinosaurs", "vehicles", "construction", "space"];
}

function sanitizeRecentResults(values: unknown) {
  if (!Array.isArray(values)) return [];
  return values
    .slice(-12)
    .map((result) => {
      if (!result || typeof result !== "object") return null;
      const item = result as Partial<ActivityResult>;
      const activity = ACTIVITY_LIBRARY.find((candidate) => candidate.id === item.activityId);
      if (!activity) return null;
      return {
        id: activity.id,
        domain: activity.domain,
        attempts: Math.min(Math.max(Number(item.attempts) || 1, 1), 5),
        correct: Boolean(item.correct),
        template: activityTemplate(activity),
        firstTryCorrect: Boolean(item.firstTryCorrect),
        hintLevel: Math.min(Math.max(Number(item.hintLevelUsed) || 0, 0), 2),
        audioReplayCount: Math.min(Math.max(Number(item.audioReplayCount) || 0, 0), 8),
      };
    })
    .filter(Boolean);
}

function validateSelection(value: DeepSeekSelection) {
  if (!Array.isArray(value.activityIds) || value.activityIds.length !== 3) return null;
  const ids = value.activityIds.filter((id): id is string => typeof id === "string");
  if (ids.length !== 3 || new Set(ids).size !== 3) return null;
  const activities = ids.map((id) => ACTIVITY_LIBRARY.find((activity) => activity.id === id));
  if (activities.some((activity) => !activity)) return null;
  const domains = new Set(activities.map((activity) => activity?.domain));
  if (domains.size !== 3) return null;
  const cleanText = (text: unknown, maxLength: number) => typeof text === "string"
    ? text.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
  const offlineMission = typeof value.offlineMissionId === "string"
    ? OFFLINE_MISSIONS.find((mission) => mission.id === value.offlineMissionId)
    : undefined;
  return {
    ids,
    parentTip: cleanText(value.parentTip, 100),
    selectionReason: cleanText(value.selectionReason, 90),
    parentInsight: cleanText(value.parentInsight, 120),
    offlineMission: offlineMission?.text,
  };
}

function buildPrompt(interests: InterestKey[], recentResults: ReturnType<typeof sanitizeRecentResults>) {
  const candidates = ACTIVITY_LIBRARY.map((activity) => ({
    id: activity.id,
    domain: activity.domain,
    skill: activity.skill,
    template: activityTemplate(activity),
    difficulty: activity.difficulty ?? 1,
    interests: activity.interests,
  }));

  return [
    {
      role: "system",
      content:
        "你是一名谨慎的三岁幼儿启蒙课程编排助手。只从给定的人工审核活动中选择，不得生成新题目。输出必须是 json。每天恰好选择中文、数学、英语各一个活动，并保证三个活动的 template 各不相同。优先匹配兴趣，同时避免连续重复和难度突增。selectionReason 和 parentInsight 只写给家长，必须基于给定记录，不诊断、不贴标签、不评价聪明与否。线下任务只能返回给定的 offlineMissionId，不能自行编写儿童指令。parentTip 不超过45个汉字。",
    },
    {
      role: "user",
      content: JSON.stringify({
        task: "为一名3岁男孩选择今天的三个启蒙活动",
        interests,
        recentResults,
        candidates,
        offlineMissions: OFFLINE_MISSIONS,
        jsonExample: {
          activityIds: ["cn-dinosaur-food", "math-dino-eggs-3", "en-find-car"],
          parentTip: "散步时一起找三辆车，并自然说一次 car。",
          selectionReason: "今天用恐龙和车辆保持兴趣，同时换成三种不同操作。",
          parentInsight: "近期听辨较稳定，数学活动可继续用实物点数，不必追求速度。",
          offlineMissionId: "find-three-wheels",
        },
      }),
    },
  ];
}

export async function POST(request: Request) {
  let payload: RequestPayload;
  try {
    payload = (await request.json()) as RequestPayload;
  } catch {
    return json({ error: "请求格式不正确" }, 400);
  }

  const date = validDate(payload.date);
  const interests = sanitizeInterests(payload.interests);
  const recentResults = sanitizeRecentResults(payload.recentResults);
  const clientId = cleanClientId(payload.clientId);
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  const fallback = createCuratedPlan(date, interests);

  if (!apiKey) {
    return json({
      plan: fallback,
      ai: { configured: false, used: false, model: MODEL, reason: "missing_key" },
    });
  }

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const rateKey = `${forwardedFor || "local"}:${clientId}`;
  if (!applyRateLimit(rateKey, date)) {
    return json({
      plan: fallback,
      ai: { configured: true, used: false, model: MODEL, reason: "daily_limit" },
    });
  }

  const cacheKey = `${date}:${interests.slice().sort().join(",")}:${JSON.stringify(recentResults)}`;
  const cached = responseCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return json(cached.response);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const upstream = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: buildPrompt(interests, recentResults),
        response_format: { type: "json_object" },
        thinking: { type: "disabled" },
        temperature: 0.25,
        max_tokens: 700,
        stream: false,
        user_id: clientId,
      }),
      signal: controller.signal,
    });

    if (!upstream.ok) throw new Error(`DeepSeek returned ${upstream.status}`);
    const completion = (await upstream.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    const content = completion.choices?.[0]?.message?.content;
    if (!content) throw new Error("DeepSeek returned empty content");

    const parsedSelection = JSON.parse(content) as DeepSeekSelection;
    const selection = validateSelection(parsedSelection);
    if (!selection) {
      const returnedIds = Array.isArray(parsedSelection.activityIds)
        ? parsedSelection.activityIds.filter((id) => typeof id === "string").slice(0, 6)
        : [];
      console.warn(`[daily-plan] invalid activity IDs: ${JSON.stringify(returnedIds)}`);
      throw new Error("DeepSeek selection did not pass validation");
    }

    const plan = createCuratedPlan(
      date,
      interests,
      selection.ids,
      selection.parentTip,
      "deepseek",
    );
    const response = {
      plan,
      ai: {
        configured: true,
        used: true,
        model: MODEL,
        selectionReason: selection.selectionReason,
        parentInsight: recentResults.length
          ? selection.parentInsight
          : "今天还没有足够的活动记录，完成几次后会给出更具体的过程观察。",
        offlineMission: selection.offlineMission,
      },
    };
    responseCache.set(cacheKey, { expiresAt: Date.now() + 6 * 60 * 60 * 1000, response });
    return json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.warn(`[daily-plan] DeepSeek fallback: ${message}`);
    const reason = error instanceof Error && error.name === "AbortError"
      ? "timeout"
      : message.includes("selection did not pass")
        ? "invalid_selection"
        : message.startsWith("DeepSeek returned ")
          ? "upstream_error"
          : "fallback";
    return json({
      plan: fallback,
      ai: { configured: true, used: false, model: MODEL, reason },
    });
  } finally {
    clearTimeout(timeout);
  }
}
