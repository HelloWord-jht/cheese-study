import { ACTIVITY_LIBRARY } from "../../../lib/learning";

type VoiceLine = "instruction" | "hint" | "success";

const OPENAI_BASE_URL = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
const TTS_MODEL = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts";
const TTS_VOICE = process.env.OPENAI_TTS_VOICE || "marin";
const requestBuckets = new Map<string, { hour: string; count: number }>();
const MAX_REQUESTS_PER_NETWORK_PER_HOUR = 180;

function json(data: object, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function voiceLine(value: string | null): VoiceLine {
  if (value === "hint" || value === "success") return value;
  return "instruction";
}

function remoteAddress(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  return request.headers.get("cf-connecting-ip")
    || request.headers.get("x-real-ip")
    || forwardedFor
    || "local";
}

function applyRateLimit(key: string) {
  const hour = new Date().toISOString().slice(0, 13);
  const current = requestBuckets.get(key);
  if (!current || current.hour !== hour) {
    requestBuckets.set(key, { hour, count: 1 });
    return true;
  }
  if (current.count >= MAX_REQUESTS_PER_NETWORK_PER_HOUR) return false;
  current.count += 1;
  return true;
}

function narrationText(activityId: string | null, line: VoiceLine) {
  const activity = ACTIVITY_LIBRARY.find((item) => item.id === activityId);
  if (!activity) return null;
  if (line === "hint") return { activity, text: `${activity.hint} 我们慢慢找，不着急。` };
  if (line === "success") return { activity, text: activity.successText };
  return { activity, text: activity.spokenInstruction };
}

function performanceInstructions(language: "zh-CN" | "en-US", line: VoiceLine) {
  const moment = line === "success"
    ? "这是闯关成功后的庆祝，带着真诚惊喜，结尾轻轻上扬，但不要大喊。"
    : line === "hint"
      ? "这是孩子暂时没答对后的温柔提示，慢一点，像蹲下来陪他一起发现，绝不责备。"
      : "这是游戏开场指令，要先用一点好奇感抓住注意力，再把任务讲清楚。";
  const languageDirection = language === "en-US"
    ? "Use warm, clear native English for the English words, with generous pauses so a three-year-old can follow. Chinese parts should sound natural."
    : "使用自然、清晰的普通话，短句之间留出能让三岁孩子反应的停顿。拟声词要有画面感。";
  return `你是儿童探险伙伴“豆豆龙”，不是播音员。声音温暖、活泼、有故事感，像一位很会陪玩的年轻老师。${moment}${languageDirection} 语速偏慢但不要拖字，情绪自然，不要尖叫，不要广告腔，不要机械地逐字朗读。`;
}

export function HEAD() {
  return new Response(null, {
    status: process.env.OPENAI_API_KEY?.trim() ? 204 : 503,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Voice-Model": TTS_MODEL,
      "X-Voice-Name": TTS_VOICE,
      "X-AI-Generated-Voice": "true",
    },
  });
}

export async function GET(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return json({ error: "AI 自然声尚未配置", code: "voice_not_configured" }, 503);

  const url = new URL(request.url);
  const selectedLine = voiceLine(url.searchParams.get("line"));
  const narration = narrationText(url.searchParams.get("activityId"), selectedLine);
  if (!narration) return json({ error: "活动不存在" }, 404);
  if (!applyRateLimit(remoteAddress(request))) return json({ error: "AI 语音请求过于频繁" }, 429);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    const response = await fetch(`${OPENAI_BASE_URL}/audio/speech`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: TTS_MODEL,
        voice: TTS_VOICE,
        input: narration.text,
        instructions: performanceInstructions(narration.activity.speechLang, selectedLine),
        response_format: "mp3",
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      console.warn(`[activity-voice] model=${TTS_MODEL} activity=${narration.activity.id} line=${selectedLine} status=upstream_${response.status}`);
      return json({ error: "AI 自然声暂时不可用", code: `upstream_${response.status}` }, 502);
    }
    const audio = await response.arrayBuffer();
    console.info(`[activity-voice] model=${TTS_MODEL} activity=${narration.activity.id} line=${selectedLine} bytes=${audio.byteLength} status=ok`);
    return new Response(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audio.byteLength),
        "Cache-Control": "public, max-age=2592000, immutable",
        "X-Content-Type-Options": "nosniff",
        "X-AI-Generated-Voice": "true",
      },
    });
  } catch (error) {
    const reason = error instanceof Error && error.name === "AbortError" ? "timeout" : "request_failed";
    console.warn(`[activity-voice] model=${TTS_MODEL} activity=${narration.activity.id} line=${selectedLine} status=${reason}`);
    return json({ error: "AI 自然声暂时不可用", code: reason }, reason === "timeout" ? 504 : 502);
  } finally {
    clearTimeout(timeout);
  }
}
