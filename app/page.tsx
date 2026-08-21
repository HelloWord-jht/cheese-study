"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Accessibility,
  Angry,
  Apple,
  ArrowRight,
  Banana,
  Bed,
  Bird,
  Bone,
  BookOpen,
  BusFront,
  CarFront,
  Cat,
  Check,
  ChevronLeft,
  Circle,
  CircleDot,
  Clock3,
  CloudRain,
  Construction,
  CupSoda,
  Dog,
  Egg,
  Fish,
  Footprints,
  Frown,
  Gem,
  Gift,
  Hammer,
  Hand,
  HardHat,
  Heart,
  HeartHandshake,
  Home,
  Languages,
  Leaf,
  Landmark,
  LockKeyhole,
  Medal,
  Moon,
  MoveHorizontal,
  MoveRight,
  Paintbrush,
  Package,
  Pause,
  Play,
  RefreshCw,
  Rabbit,
  Rocket,
  ScanFace,
  ShieldCheck,
  Smile,
  Sparkles,
  Square,
  Star,
  Sun,
  Ship,
  TrainFront,
  TreePine,
  Triangle,
  Umbrella,
  Volume2,
  VolumeX,
  Waves,
  Wrench,
  X,
} from "lucide-react";
import {
  ACTIVITY_LIBRARY,
  DOMAIN_META,
  INTEREST_LABELS,
  activityTemplate,
  createCuratedPlan,
  isDailyPlan,
  localDateKey,
  type ActivityChoice,
  type ActivityResult,
  type ActivityTemplate,
  type DailyPlan,
  type IconKey,
  type InterestKey,
  type LearningActivity,
  type LearningDomain,
} from "../lib/learning";

type View = "today" | "treasure" | "parent";
type AiInfo = {
  configured: boolean;
  used: boolean;
  model: string;
  reason?: string;
  selectionReason?: string;
  parentInsight?: string;
  offlineMission?: string;
};
type DragVisual = { id: string; x: number; y: number; moved: boolean };
type NarrationState = "idle" | "playing" | "error";

const DRAG_TEMPLATES = new Set<ActivityTemplate>([
  "drag_match",
  "drag_sort",
  "place_in_scene",
  "sequence_3",
  "pattern_extend",
]);

function withSessionVariant(activity: LearningActivity): LearningActivity {
  const choices = [...activity.choices];
  for (let index = choices.length - 1; index > 0; index -= 1) {
    const targetIndex = Math.floor(Math.random() * (index + 1));
    [choices[index], choices[targetIndex]] = [choices[targetIndex], choices[index]];
  }
  return { ...activity, choices };
}

type ChildProfile = {
  name: string;
  age: number;
  gender: "boy";
  interests: InterestKey[];
  soundOn: boolean;
  reduceMotion: boolean;
  sessionMinutes: number;
};

const DEFAULT_PROFILE: ChildProfile = {
  name: "小满",
  age: 3,
  gender: "boy",
  interests: ["dinosaurs", "vehicles", "construction", "space"],
  soundOn: true,
  reduceMotion: false,
  sessionMinutes: 10,
};

const ICON_MAP: Record<IconKey, LucideIcon> = {
  excavator: Construction,
  waves: Waves,
  moon: Moon,
  dinosaur: Bone,
  leaf: Leaf,
  apple: Apple,
  ball: CircleDot,
  train: TrainFront,
  bus: BusFront,
  rocket: Rocket,
  toothbrush: Paintbrush,
  shoe: Footprints,
  sun: Sun,
  sad: Frown,
  happy: Smile,
  angry: Angry,
  bird: Bird,
  car: CarFront,
  fish: Fish,
  egg: Egg,
  circle: Circle,
  square: Square,
  triangle: Triangle,
  long: MoveHorizontal,
  short: MoveRight,
  red: Circle,
  blue: Circle,
  yellow: Circle,
  green: Circle,
  cat: Cat,
  dog: Dog,
  nose: ScanFace,
  hand: Hand,
  foot: Footprints,
  jump: Accessibility,
  run: Footprints,
  sleep: Moon,
  hello: Hand,
  bye: MoveRight,
  thanks: HeartHandshake,
  house: Home,
  tree: TreePine,
  umbrella: Umbrella,
  cloud: CloudRain,
  wrench: Wrench,
  hammer: Hammer,
  stone: Gem,
  star: Star,
  box: Package,
  bridge: Landmark,
  bed: Bed,
  cup: CupSoda,
  rabbit: Rabbit,
  helmet: HardHat,
  banana: Banana,
  ship: Ship,
  flower: Leaf,
  book: BookOpen,
};

const DOMAIN_ICONS: Record<LearningDomain, LucideIcon> = {
  chinese: BookOpen,
  math: CircleDot,
  english: Languages,
};

const REWARD_ICONS: IconKey[] = ["dinosaur", "rocket", "excavator", "train", "dog", "leaf"];

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function createClientId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `family_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
  }
  return `family_${Math.random().toString(36).slice(2, 18)}`;
}

function todayLabel() {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());
}

function ActivityIcon({ icon, size = 36, strokeWidth = 2.2 }: { icon: IconKey; size?: number; strokeWidth?: number }) {
  const Icon = ICON_MAP[icon];
  return <Icon size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
}

function LittleExplorer({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`little-explorer ${compact ? "little-explorer-compact" : ""}`} aria-label="陪伴角色豆豆龙">
      <span className="dino-tail" />
      <span className="dino-body"><i className="dino-belly" /></span>
      <span className="dino-leg dino-leg-one" />
      <span className="dino-leg dino-leg-two" />
      <span className="dino-head">
        <i className="dino-eye" />
        <i className="dino-cheek" />
        <i className="dino-nose" />
        <i className="dino-smile" />
      </span>
      <span className="dino-spikes"><i /><i /><i /></span>
      <span className="dino-arm dino-arm-one" />
      <span className="dino-arm dino-arm-two" />
      <span className="dino-backpack" />
    </div>
  );
}

function ChoiceCard({
  choice,
  state,
  onClick,
}: {
  choice: ActivityChoice;
  state: "idle" | "wrong" | "correct" | "revealed";
  onClick: () => void;
}) {
  return (
    <button className={`choice-card choice-${choice.color} choice-${state} scale-${choice.visualScale ?? "medium"}`} onClick={onClick}>
      <span className="choice-illustration"><ActivityIcon icon={choice.icon} size={62} strokeWidth={1.9} /></span>
      <strong>{choice.label}</strong>
      {choice.helper && <small>{choice.helper}</small>}
      {state === "correct" && <span className="choice-check"><Check size={18} strokeWidth={3} /></span>}
    </button>
  );
}

export default function HomePage() {
  const [view, setView] = useState<View>("today");
  const [profile, setProfile] = useState<ChildProfile>(DEFAULT_PROFILE);
  const [draftName, setDraftName] = useState(DEFAULT_PROFILE.name);
  const [results, setResults] = useState<ActivityResult[]>([]);
  const [dateKey, setDateKey] = useState(localDateKey());
  const [plan, setPlan] = useState<DailyPlan>(() =>
    createCuratedPlan(localDateKey(), DEFAULT_PROFILE.interests),
  );
  const [aiInfo, setAiInfo] = useState<AiInfo>({
    configured: false,
    used: false,
    model: "deepseek-v4-flash",
    reason: "loading",
  });
  const [planLoading, setPlanLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [activeActivity, setActiveActivity] = useState<LearningActivity | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [wrongChoiceId, setWrongChoiceId] = useState<string | null>(null);
  const [revealedAnswer, setRevealedAnswer] = useState(false);
  const [activityComplete, setActivityComplete] = useState(false);
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [countedIds, setCountedIds] = useState<string[]>([]);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [dragVisual, setDragVisual] = useState<DragVisual | null>(null);
  const [audioReplayCount, setAudioReplayCount] = useState(0);
  const [narrationState, setNarrationState] = useState<NarrationState>("idle");
  const [gateOpen, setGateOpen] = useState(false);
  const [gateHolding, setGateHolding] = useState(false);
  const [toast, setToast] = useState("");
  const [clientId, setClientId] = useState("family_device");
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAt = useRef(Date.now());
  const dragStart = useRef<{ id: string; x: number; y: number; pointerId: number; moved: boolean } | null>(null);
  const instructionAudio = useRef<HTMLAudioElement | null>(null);
  const availableVoices = useRef<SpeechSynthesisVoice[]>([]);

  const todayResults = useMemo(
    () => results.filter((result) => result.date === dateKey),
    [results, dateKey],
  );
  const completedIds = useMemo(
    () => new Set(todayResults.filter((result) => result.correct).map((result) => result.activityId)),
    [todayResults],
  );
  const completedCount = plan.activities.filter((activity) => completedIds.has(activity.id)).length;
  const recentResults = results.slice(-12);
  const totalMinutes = Math.max(
    0,
    Math.round(results.slice(-21).reduce((sum, result) => sum + result.durationSeconds, 0) / 60),
  );
  const averageAttempts = results.length
    ? (results.slice(-21).reduce((sum, result) => sum + result.attempts, 0) / Math.min(results.length, 21)).toFixed(1)
    : "—";

  useEffect(() => {
    const storedProfile = safeParse<ChildProfile | null>(localStorage.getItem("cheese-profile-v2"), null);
    const nextProfile = storedProfile
      ? {
          ...DEFAULT_PROFILE,
          ...storedProfile,
          gender: "boy" as const,
          interests: storedProfile.interests?.length ? storedProfile.interests : DEFAULT_PROFILE.interests,
        }
      : DEFAULT_PROFILE;
    const storedResults = safeParse<ActivityResult[]>(localStorage.getItem("cheese-results-v2"), []);
    const storedClientId = localStorage.getItem("cheese-client-id") || createClientId();
    const currentDate = localDateKey();
    const cachedPlan = safeParse<DailyPlan | null>(localStorage.getItem(`cheese-plan-${currentDate}`), null);

    localStorage.setItem("cheese-client-id", storedClientId);
    const hydrationTimer = window.setTimeout(() => {
      setClientId(storedClientId);
      setProfile(nextProfile);
      setDraftName(nextProfile.name);
      setResults(Array.isArray(storedResults) ? storedResults.slice(-180) : []);
      setDateKey(currentDate);
      setPlan(cachedPlan && isDailyPlan(cachedPlan) ? cachedPlan : createCuratedPlan(currentDate, nextProfile.interests));
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("cheese-profile-v2", JSON.stringify(profile));
  }, [profile, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("cheese-results-v2", JSON.stringify(results.slice(-180)));
  }, [results, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    void requestDailyPlan();
    // The plan is intentionally refreshed only when the profile is hydrated or interests change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, profile.interests.join(",")]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const loadVoices = () => {
      availableVoices.current = window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);

  async function requestDailyPlan(force = false) {
    setPlanLoading(true);
    const fallback = createCuratedPlan(dateKey, profile.interests);
    if (force) setPlan(fallback);
    try {
      const response = await fetch("/api/daily-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateKey,
          interests: profile.interests,
          recentResults,
          clientId,
        }),
      });
      if (!response.ok) throw new Error("daily plan unavailable");
      const data = (await response.json()) as { plan?: unknown; ai?: AiInfo };
      if (isDailyPlan(data.plan)) {
        setPlan(data.plan);
        localStorage.setItem(`cheese-plan-${dateKey}`, JSON.stringify(data.plan));
      }
      if (data.ai) setAiInfo(data.ai);
      if (force) setToast("今天的任务已经重新编排");
    } catch {
      setPlan(fallback);
      setAiInfo({ configured: false, used: false, model: "deepseek-v4-flash", reason: "offline" });
      if (force) setToast("网络休息中，已换成本地任务");
    } finally {
      setPlanLoading(false);
    }
  }

  function stopNarration(updateState = true) {
    const audio = instructionAudio.current;
    if (audio) {
      audio.onplaying = null;
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.currentTime = 0;
      instructionAudio.current = null;
    }
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    if (updateState) setNarrationState("idle");
  }

  function speak(
    text: string,
    lang: "zh-CN" | "en-US" = "zh-CN",
    interrupt = true,
    force = false,
  ) {
    if ((!profile.soundOn && !force) || !("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      if (force) {
        setNarrationState("error");
        setToast("当前浏览器没有可用语音，请检查媒体音量");
      }
      return;
    }
    if (interrupt) stopNarration(false);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = lang === "en-US" ? 0.76 : 0.84;
    utterance.pitch = 1.05;
    const wantedLanguage = lang.toLowerCase();
    utterance.voice = availableVoices.current.find((voice) => voice.lang.toLowerCase() === wantedLanguage)
      ?? availableVoices.current.find((voice) => voice.lang.toLowerCase().startsWith(wantedLanguage.split("-")[0]))
      ?? null;
    utterance.onstart = () => setNarrationState("playing");
    utterance.onend = () => setNarrationState("idle");
    utterance.onerror = (event) => {
      if (event.error === "canceled" || event.error === "interrupted") return;
      setNarrationState("error");
      setToast("语音启动失败，请确认手机没有静音");
    };
    window.speechSynthesis.resume();
    window.speechSynthesis.speak(utterance);
  }

  function playInstruction(activity: LearningActivity, force = false) {
    if (!profile.soundOn && !force) return;
    stopNarration(false);
    setNarrationState("playing");

    const audio = new Audio(`/audio/instructions/${activity.id}.mp3`);
    audio.preload = "auto";
    audio.volume = 1;
    instructionAudio.current = audio;
    let fallbackStarted = false;
    const fallbackToDeviceVoice = () => {
      if (fallbackStarted) return;
      fallbackStarted = true;
      instructionAudio.current = null;
      speak(activity.spokenInstruction, activity.speechLang, true, true);
    };
    audio.onplaying = () => setNarrationState("playing");
    audio.onended = () => {
      instructionAudio.current = null;
      setNarrationState("idle");
    };
    audio.onerror = fallbackToDeviceVoice;
    const playback = audio.play();
    if (playback) void playback.catch(fallbackToDeviceVoice);
  }

  function toggleSound() {
    if (profile.soundOn) {
      stopNarration();
      setProfile((current) => ({ ...current, soundOn: false }));
      setToast("语音已关闭");
      return;
    }
    setProfile((current) => ({ ...current, soundOn: true }));
    setToast("语音已打开");
    if (activeActivity && !activityComplete) playInstruction(activeActivity, true);
  }

  function saveActivityResult(record: ActivityResult) {
    setResults((items) => {
      const existing = items.find(
        (item) => item.date === record.date && item.activityId === record.activityId,
      );
      if (existing?.correct && !record.correct) return items;
      return [
        ...items.filter(
          (item) => !(item.date === record.date && item.activityId === record.activityId),
        ),
        record,
      ];
    });
  }

  function finishActivity(finalAttempts: number, spokenLabel?: string) {
    if (!activeActivity || activityComplete) return;
    const durationSeconds = Math.max(5, Math.round((Date.now() - startedAt.current) / 1000));
    saveActivityResult({
      activityId: activeActivity.id,
      domain: activeActivity.domain,
      date: dateKey,
      correct: true,
      attempts: Math.max(1, finalAttempts),
      durationSeconds,
      template: activityTemplate(activeActivity),
      firstTryCorrect: finalAttempts <= 1,
      hintLevelUsed: attempts >= 2 ? 2 : attempts >= 1 ? 1 : 0,
      audioReplayCount,
      completed: true,
      abandoned: false,
    });
    setWrongChoiceId(null);
    setSelectedPieceId(null);
    setAttempts(Math.max(1, finalAttempts));
    setActivityComplete(true);
    if (activeActivity.domain === "english" && spokenLabel) {
      speak(spokenLabel, "en-US");
      window.setTimeout(() => speak(activeActivity.successText, "zh-CN", false), 750);
    } else {
      speak(activeActivity.successText, activeActivity.domain === "english" ? "en-US" : "zh-CN");
    }
  }

  function startActivity(activity: LearningActivity) {
    const preparedActivity = withSessionVariant(activity);
    setActiveActivity(preparedActivity);
    setAttempts(0);
    setWrongChoiceId(null);
    setRevealedAnswer(false);
    setActivityComplete(false);
    setPlacements({});
    setCountedIds([]);
    setSelectedPieceId(null);
    setDragVisual(null);
    setAudioReplayCount(0);
    startedAt.current = Date.now();
    playInstruction(preparedActivity);
  }

  function replayInstruction() {
    if (!activeActivity) return;
    setAudioReplayCount((count) => count + 1);
    if (!profile.soundOn) {
      setProfile((current) => ({ ...current, soundOn: true }));
      setToast("语音已打开");
    }
    playInstruction(activeActivity, true);
  }

  function chooseAnswer(choice: ActivityChoice) {
    if (!activeActivity || activityComplete) return;
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    if (choice.id === activeActivity.answerId) {
      finishActivity(nextAttempts, choice.label);
      return;
    }

    setWrongChoiceId(choice.id);
    if (nextAttempts >= 2) setRevealedAnswer(true);
    speak(nextAttempts >= 2 ? `${activeActivity.hint} 看看亮起来的那一个。` : activeActivity.hint, "zh-CN");
  }

  function markInteractionWrong() {
    if (!activeActivity) return;
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    speak(nextAttempts >= 2 ? `${activeActivity.hint} 再试一次。` : activeActivity.hint, "zh-CN");
  }

  function placePiece(pieceId: string, targetId: string) {
    if (!activeActivity || activityComplete || placements[pieceId]) return;
    const correctTargets = activeActivity.interaction?.correctTargets;
    if (!correctTargets || correctTargets[pieceId] !== targetId) {
      setSelectedPieceId(null);
      markInteractionWrong();
      return;
    }

    const nextPlacements = { ...placements, [pieceId]: targetId };
    setPlacements(nextPlacements);
    setSelectedPieceId(null);
    const requiredIds = Object.keys(correctTargets);
    if (requiredIds.every((id) => nextPlacements[id])) {
      window.setTimeout(() => finishActivity(Math.max(1, attempts + 1)), 280);
    } else {
      const choice = activeActivity.choices.find((item) => item.id === pieceId);
      if (choice) speak(choice.label, activeActivity.speechLang, false);
    }
  }

  function tapCountItem(pieceId: string) {
    if (!activeActivity || countedIds.includes(pieceId) || activityComplete) return;
    const goal = activeActivity.interaction?.countGoal ?? activeActivity.choices.length;
    const nextIds = [...countedIds, pieceId];
    setCountedIds(nextIds);
    speak(String(nextIds.length), "zh-CN", false);
    if (nextIds.length >= goal) {
      window.setTimeout(() => finishActivity(1), 420);
    }
  }

  function startPieceDrag(event: ReactPointerEvent<HTMLButtonElement>, pieceId: string) {
    if (placements[pieceId]) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = {
      id: pieceId,
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
      moved: false,
    };
    setDragVisual({ id: pieceId, x: 0, y: 0, moved: false });
  }

  function movePieceDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const current = dragStart.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const x = event.clientX - current.x;
    const y = event.clientY - current.y;
    const moved = current.moved || Math.hypot(x, y) > 8;
    current.moved = moved;
    setDragVisual({ id: current.id, x, y, moved });
  }

  function endPieceDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const current = dragStart.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (current.moved) {
      const target = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLElement>("[data-drop-target]");
      const targetId = target?.dataset.dropTarget;
      if (targetId) placePiece(current.id, targetId);
    } else {
      setSelectedPieceId((selected) => (selected === current.id ? null : current.id));
    }
    dragStart.current = null;
    setDragVisual(null);
  }

  function closeActivity() {
    stopNarration();
    if (activeActivity && !activityComplete && Date.now() - startedAt.current > 2500) {
      saveActivityResult({
        activityId: activeActivity.id,
        domain: activeActivity.domain,
        date: dateKey,
        correct: false,
        attempts,
        durationSeconds: Math.max(3, Math.round((Date.now() - startedAt.current) / 1000)),
        template: activityTemplate(activeActivity),
        firstTryCorrect: false,
        hintLevelUsed: attempts >= 2 ? 2 : attempts >= 1 ? 1 : 0,
        audioReplayCount,
        completed: false,
        abandoned: true,
      });
    }
    setActiveActivity(null);
    setActivityComplete(false);
    setWrongChoiceId(null);
    setRevealedAnswer(false);
    setPlacements({});
    setCountedIds([]);
    setSelectedPieceId(null);
    setDragVisual(null);
  }

  function nextActivity() {
    const remaining = plan.activities.find(
      (activity) => activity.id !== activeActivity?.id && !completedIds.has(activity.id),
    );
    if (remaining) startActivity(remaining);
    else closeActivity();
  }

  function saveName() {
    const name = draftName.trim().slice(0, 8) || "宝宝";
    setProfile((current) => ({ ...current, name }));
    setDraftName(name);
    setToast("昵称已经保存");
  }

  function toggleInterest(interest: InterestKey) {
    setProfile((current) => {
      const exists = current.interests.includes(interest);
      if (exists && current.interests.length === 1) return current;
      return {
        ...current,
        interests: exists
          ? current.interests.filter((item) => item !== interest)
          : [...current.interests, interest],
      };
    });
  }

  function openParentGate() {
    if (view === "parent") return;
    setGateOpen(true);
  }

  function startHold() {
    setGateHolding(true);
    holdTimer.current = setTimeout(() => {
      setGateOpen(false);
      setGateHolding(false);
      setView("parent");
    }, 1400);
  }

  function stopHold() {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
    setGateHolding(false);
  }

  const firstUnfinished = plan.activities.find((activity) => !completedIds.has(activity.id)) ?? plan.activities[0];
  const activeTemplate = activeActivity ? activityTemplate(activeActivity) : null;
  const offlineMission = aiInfo.used && aiInfo.offlineMission ? aiInfo.offlineMission : plan.parentTip;

  return (
    <main className={`product-shell ${profile.reduceMotion ? "reduce-motion" : ""}`}>
      <aside className="desktop-sidebar">
        <button className="product-brand" onClick={() => setView("today")}>
          <span className="product-brand-mark"><Bone size={24} /></span>
          <span><b>{profile.name}的小世界</b><small>Little Explorer</small></span>
        </button>

        <div className="sidebar-buddy-card">
          <div className="sidebar-buddy-visual"><LittleExplorer compact /></div>
          <div><small>探险搭档</small><strong>豆豆龙</strong></div>
        </div>

        <nav className="desktop-nav" aria-label="主导航">
          <button className={view === "today" ? "active" : ""} onClick={() => setView("today")}>
            <Home size={22} /><span>今天</span>{completedCount > 0 && <i>{completedCount}</i>}
          </button>
          <button className={view === "treasure" ? "active" : ""} onClick={() => setView("treasure")}>
            <Gift size={22} /><span>探险宝箱</span>
          </button>
          <button className={view === "parent" ? "active" : ""} onClick={openParentGate}>
            <LockKeyhole size={21} /><span>家长中心</span>
          </button>
        </nav>

        <div className="screen-time-card">
          <span><Pause size={17} /></span>
          <div><strong>轻松玩，按时停</strong><small>每次约 {profile.sessionMinutes} 分钟</small></div>
        </div>
        <p className="local-privacy"><ShieldCheck size={15} /> 学习记录保存在本机</p>
      </aside>

      <section className="product-main">
        <header className="mobile-topbar">
          <button className="mobile-brand" onClick={() => setView("today")}><Bone size={21} /></button>
          <div><small>{todayLabel()}</small><strong>{profile.name}的小世界</strong></div>
          <button className="header-sound" onClick={toggleSound} aria-label={profile.soundOn ? "关闭声音" : "打开声音"}>
            {profile.soundOn ? <Volume2 size={21} /> : <VolumeX size={21} />}
          </button>
        </header>

        <header className="desktop-topbar">
          <div><span>{todayLabel()}</span><h1>{view === "today" ? "今天的探险任务" : view === "treasure" ? "探险宝箱" : "家长中心"}</h1></div>
          <div className="desktop-top-actions">
            <span className="today-time"><Clock3 size={16} /> 约 {profile.sessionMinutes} 分钟</span>
            <button className="header-sound" onClick={toggleSound} aria-label={profile.soundOn ? "关闭声音" : "打开声音"}>
              {profile.soundOn ? <Volume2 size={21} /> : <VolumeX size={21} />}
            </button>
          </div>
        </header>

        {view === "today" && (
          <div className="view-page today-view">
            <section className="adventure-hero">
              <div className="hero-copy">
                <span className="hero-kicker"><Sparkles size={15} /> 今日主题 · {plan.theme}</span>
                <h2>出发吧，{profile.name}！</h2>
                <p>{plan.greeting}</p>
                <button className="hero-start" onClick={() => startActivity(firstUnfinished)}>
                  <Play size={20} fill="currentColor" />
                  {completedCount === 0 ? "开始第一个任务" : completedCount === 3 ? "再玩一次" : "继续今天的探险"}
                </button>
                <div className="mission-progress" aria-label={`已完成 ${completedCount} 个，共 3 个任务`}>
                  {[0, 1, 2].map((index) => (
                    <span key={index} className={index < completedCount ? "done" : ""}>
                      {index < completedCount ? <Check size={14} strokeWidth={3} /> : index + 1}
                    </span>
                  ))}
                  <small>{completedCount === 3 ? "今天完成啦" : `还剩 ${3 - completedCount} 个小任务`}</small>
                </div>
              </div>
              <div className="hero-world" aria-hidden="true">
                <span className="hero-sun" />
                <span className="hero-cloud cloud-a" />
                <span className="hero-cloud cloud-b" />
                <span className="hero-mountain mountain-a" />
                <span className="hero-mountain mountain-b" />
                <LittleExplorer />
                <span className="hero-rocket"><Rocket size={33} /></span>
                <span className="hero-bone"><Bone size={28} /></span>
              </div>
            </section>

            <div className="section-title-row">
              <div><span>每天三个小发现</span><h2>今天玩这些</h2></div>
              <p>{planLoading ? "豆豆龙正在准备…" : "不分先后，想玩哪个就点哪个"}</p>
            </div>

            <section className="domain-card-grid">
              {plan.activities.map((activity, index) => {
                const done = completedIds.has(activity.id);
                const DomainIcon = DOMAIN_ICONS[activity.domain];
                const featureIcon = activity.choices.find((choice) => choice.id === activity.answerId)?.icon ?? "dinosaur";
                return (
                  <button
                    key={activity.id}
                    className={`domain-card domain-${activity.domain} ${done ? "domain-done" : ""}`}
                    onClick={() => startActivity(activity)}
                  >
                    <div className="domain-card-heading">
                      <span className="domain-badge"><DomainIcon size={19} />{DOMAIN_META[activity.domain].shortTitle}</span>
                      {done ? <span className="done-label"><Check size={15} />完成啦</span> : <span className="mission-number">0{index + 1}</span>}
                    </div>
                    <div className="domain-feature-icon"><ActivityIcon icon={featureIcon} size={66} strokeWidth={1.7} /></div>
                    <div className="domain-copy"><small>{activity.skill}</small><h3>{activity.title}</h3><p>{activity.instruction}</p></div>
                    <div className="domain-card-footer"><span><Clock3 size={14} /> 2–3 分钟</span><i><ArrowRight size={19} /></i></div>
                  </button>
                );
              })}
            </section>

            <section className="offscreen-mission">
              <span className="offscreen-icon"><Footprints size={25} /></span>
              <div><small>{aiInfo.used && aiInfo.offlineMission ? "AI 挑选的亲子挑战" : "离开屏幕的小挑战"}</small><strong>{offlineMission}</strong></div>
              <button onClick={() => { setToast("已经帮你记住啦"); speak(offlineMission); }}>记住啦 <Check size={16} /></button>
            </section>
          </div>
        )}

        {view === "treasure" && (
          <div className="view-page treasure-view">
            <section className="treasure-header">
              <div><span className="hero-kicker"><Medal size={15} /> 每次尝试都值得收藏</span><h2>{profile.name}的探险图鉴</h2><p>这里不比快慢，只收藏认真听、仔细看和勇敢尝试。</p></div>
              <div className="treasure-score"><Star size={42} fill="currentColor" /><strong>{results.filter((result) => result.correct).length}</strong><span>发现</span></div>
            </section>

            <div className="section-title-row"><div><span>本周收藏</span><h2>我的探险伙伴</h2></div><p>点一点已经亮起来的伙伴</p></div>
            <section className="reward-grid">
              {REWARD_ICONS.map((icon, index) => {
                const unlocked = index < Math.max(1, Math.min(results.length, REWARD_ICONS.length));
                const names = ["勇敢小恐龙", "星星火箭", "挖土高手", "长长火车", "汪汪伙伴", "森林新芽"];
                return (
                  <button
                    key={icon}
                    className={`reward-card ${unlocked ? "unlocked" : "locked"}`}
                    disabled={!unlocked}
                    onClick={() => speak(`${names[index]}说，${profile.name}，谢谢你发现我`)}
                  >
                    <span><ActivityIcon icon={icon} size={58} strokeWidth={1.8} /></span>
                    <strong>{unlocked ? names[index] : "等待发现"}</strong>
                    <small>{unlocked ? "点我听一听" : "完成任务后出现"}</small>
                  </button>
                );
              })}
            </section>
          </div>
        )}

        {view === "parent" && (
          <div className="view-page parent-view">
            <section className="parent-hero">
              <div><span className="parent-kicker"><ShieldCheck size={15} /> 家长视图</span><h2>今天不是考试，<br />只是又认识了一点世界。</h2><p>所有数据都用于安排合适的下一步，不给孩子排名，也不制造打卡压力。</p></div>
              <div className="parent-stats">
                <div><strong>{completedCount}<i>/3</i></strong><span>今日完成</span></div>
                <div><strong>{totalMinutes || 0}<i>分钟</i></strong><span>近期专注</span></div>
                <div><strong>{averageAttempts}<i>次</i></strong><span>平均尝试</span></div>
              </div>
            </section>

            <section className="parent-panel-grid">
              <article className="parent-panel profile-panel">
                <div className="panel-heading"><div><span>宝宝档案</span><h3>为他选择熟悉的世界</h3></div><LittleExplorer compact /></div>
                <label htmlFor="child-name">宝宝昵称</label>
                <div className="name-control"><input id="child-name" value={draftName} maxLength={8} onChange={(event) => setDraftName(event.target.value)} /><button onClick={saveName}>保存</button></div>
                <label>最近喜欢什么</label>
                <div className="interest-grid">
                  {(Object.keys(INTEREST_LABELS) as InterestKey[]).map((interest) => (
                    <button key={interest} className={profile.interests.includes(interest) ? "selected" : ""} onClick={() => toggleInterest(interest)}>
                      {profile.interests.includes(interest) && <Check size={14} />}{INTEREST_LABELS[interest]}
                    </button>
                  ))}
                </div>
              </article>

              <article className="parent-panel ai-panel">
                <div className="panel-heading"><div><span>智能编排</span><h3>DeepSeek 每日计划</h3></div><Sparkles size={24} /></div>
                <div className={`ai-state ${aiInfo.used ? "online" : "fallback"}`}>
                  <span><i />{aiInfo.used ? "智能编排已启用" : aiInfo.configured ? "正在使用安全兜底" : "尚未配置 API Key"}</span>
                  <small>{aiInfo.used ? `${aiInfo.model} 只从审核内容中选课` : "不影响使用，当前由本地课程库编排"}</small>
                </div>
                {aiInfo.used && (aiInfo.selectionReason || aiInfo.parentInsight) && (
                  <div className="ai-coach-notes">
                    {aiInfo.selectionReason && <div><small>为什么这样安排</small><p>{aiInfo.selectionReason}</p></div>}
                    {aiInfo.parentInsight && <div><small>给家长的观察</small><p>{aiInfo.parentInsight}</p></div>}
                  </div>
                )}
                <p>模型不会直接与孩子聊天，也不会生成未经审核的题目；它只根据兴趣和近期表现，从人工课程库中选择今天的三个任务。</p>
                <button className="refresh-plan" disabled={planLoading} onClick={() => void requestDailyPlan(true)}><RefreshCw size={17} className={planLoading ? "spinning" : ""} />重新编排今天</button>
              </article>

              <article className="parent-panel observation-panel">
                <div className="panel-heading"><div><span>今日观察</span><h3>看见过程，不只看对错</h3></div><BookOpen size={23} /></div>
                {todayResults.length ? todayResults.map((result) => {
                  const activity = ACTIVITY_LIBRARY.find((item) => item.id === result.activityId);
                  return (
                    <div className="observation-row" key={result.activityId}>
                      <span className={`result-domain result-${result.domain}`}>{DOMAIN_META[result.domain].shortTitle}</span>
                      <div><strong>{activity?.skill || "新的发现"}</strong><p>{result.abandoned ? "玩到一半先休息了，没有关系。" : (result.firstTryCorrect ?? result.attempts === 1) ? "独立完成了这次发现。" : `尝试了 ${result.attempts} 次，在提示后完成。`} 用时约 {result.durationSeconds} 秒。</p></div>
                    </div>
                  );
                }) : <div className="empty-observation"><Moon size={27} /><p>今天还没有开始。等玩过以后，这里会出现真实观察。</p></div>}
              </article>

              <article className="parent-panel control-panel">
                <div className="panel-heading"><div><span>体验控制</span><h3>温和地玩，按时停下来</h3></div><Clock3 size={23} /></div>
                <div className="control-row"><div><strong>每次使用时长</strong><small>三个任务结束后自然收尾</small></div><span>{profile.sessionMinutes} 分钟</span></div>
                <div className="control-row"><div><strong>语音陪伴</strong><small>中英文指令和鼓励</small></div><button className={`toggle ${profile.soundOn ? "on" : ""}`} onClick={toggleSound} aria-label="切换语音陪伴"><i /></button></div>
                <div className="control-row"><div><strong>减少动画</strong><small>降低运动和庆祝效果</small></div><button className={`toggle ${profile.reduceMotion ? "on" : ""}`} onClick={() => setProfile((current) => ({ ...current, reduceMotion: !current.reduceMotion }))} aria-label="切换减少动画"><i /></button></div>
              </article>
            </section>

            <section className="privacy-banner"><span><ShieldCheck size={28} /></span><div><strong>孩子的数据只属于家庭</strong><p>昵称、兴趣和完成记录保存在当前设备；发送给 DeepSeek 的只有匿名设备编号、兴趣标签和活动结果，不包含姓名、照片或录音。</p></div></section>
            <button className="back-to-child" onClick={() => setView("today")}><ChevronLeft size={19} />返回孩子的探险乐园</button>
          </div>
        )}
      </section>

      <nav className="touch-nav" aria-label="触控设备主导航">
        <button className={view === "today" ? "active" : ""} onClick={() => setView("today")}><Home size={23} /><span>今天</span></button>
        <button className={view === "treasure" ? "active" : ""} onClick={() => setView("treasure")}><Gift size={23} /><span>宝箱</span></button>
        <button className={view === "parent" ? "active" : ""} onClick={openParentGate}><LockKeyhole size={22} /><span>家长</span></button>
      </nav>

      {gateOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="parent-gate-title">
          <section className="parent-gate">
            <button className="modal-close" onClick={() => setGateOpen(false)} aria-label="关闭"><X size={22} /></button>
            <span className="gate-lock"><LockKeyhole size={28} /></span>
            <small>这是给大人的小门</small>
            <h2 id="parent-gate-title">请家长长按进入</h2>
            <p>一直按住，直到进度走完。</p>
            <button className={`hold-button ${gateHolding ? "holding" : ""}`} onPointerDown={startHold} onPointerUp={stopHold} onPointerLeave={stopHold} onPointerCancel={stopHold}>
              <i /><ShieldCheck size={21} /><strong>{gateHolding ? "继续按住…" : "长按进入家长中心"}</strong>
            </button>
          </section>
        </div>
      )}

      {activeActivity && (
        <div className={`learning-overlay learning-${activeActivity.domain}`} role="dialog" aria-modal="true" aria-labelledby="learning-title">
          <header className="learning-topbar">
            <button onClick={closeActivity} aria-label="退出活动"><ChevronLeft size={25} /><span>先不玩了</span></button>
            <div className="learning-progress">
              {plan.activities.map((activity) => <i key={activity.id} className={completedIds.has(activity.id) || activity.id === activeActivity.id ? "active" : ""} />)}
            </div>
            <button onClick={toggleSound} aria-label="切换声音">{profile.soundOn ? <Volume2 size={23} /> : <VolumeX size={23} />}</button>
          </header>

          {!activityComplete ? (
            <section className="learning-stage">
              <div className="learning-prompt">
                <span className="learning-domain-label">{DOMAIN_META[activeActivity.domain].title}</span>
                <small>{activeActivity.skill}</small>
                <h2 id="learning-title">{activeActivity.instruction}</h2>
                <button className={`listen-again ${narrationState === "playing" ? "playing" : ""}`} onClick={replayInstruction} aria-live="polite"><Volume2 size={21} />{narrationState === "playing" ? "正在播放…" : "再听一次"}</button>

                {activeActivity.interaction?.storyText && (
                  <div className="story-board">
                    <BookOpen size={22} />
                    <div>{activeActivity.interaction.storyText.map((line, index) => <span key={`${line}-${index}`}>{line}</span>)}</div>
                  </div>
                )}

                {activeActivity.sceneIcons && (
                  <div className={`scene-board scene-${activeActivity.kind}`}>
                    <div>{activeActivity.sceneIcons.map((icon, index) => <span key={`${icon}-${index}`}><ActivityIcon icon={icon} size={58} strokeWidth={1.8} /></span>)}</div>
                    {activeActivity.sceneLabel && <small>{activeActivity.sceneLabel}</small>}
                  </div>
                )}
                {!activeActivity.sceneIcons && !activeActivity.interaction?.storyText && <div className="prompt-mascot"><LittleExplorer compact /><span>慢慢看，不着急</span></div>}
              </div>

              <div className="choice-area">
                {(activeTemplate === "tap_choose" || activeTemplate === "story_choice") && (
                  <div className="choice-grid">
                    {activeActivity.choices.map((choice) => {
                      let state: "idle" | "wrong" | "correct" | "revealed" = "idle";
                      if (wrongChoiceId === choice.id) state = "wrong";
                      if (revealedAnswer && choice.id === activeActivity.answerId) state = "revealed";
                      return <ChoiceCard key={choice.id} choice={choice} state={state} onClick={() => chooseAnswer(choice)} />;
                    })}
                  </div>
                )}

                {activeTemplate === "tap_count" && (
                  <div className="count-workspace">
                    <div className="count-status"><strong>{countedIds.length}</strong><span>/ {activeActivity.interaction?.countGoal ?? activeActivity.choices.length}</span><small>已经点亮</small></div>
                    <div className="count-piece-grid">
                      {activeActivity.choices.map((choice) => {
                        const counted = countedIds.includes(choice.id);
                        return (
                          <button key={choice.id} className={`count-piece choice-${choice.color} ${counted ? "counted" : ""}`} disabled={counted} onClick={() => tapCountItem(choice.id)} aria-label={`${counted ? "已经数过" : "点数"}${choice.label}`}>
                            <ActivityIcon icon={choice.icon} size={54} strokeWidth={1.9} />
                            {counted && <span><Check size={17} strokeWidth={3} /></span>}
                          </button>
                        );
                      })}
                    </div>
                    <p>点一个，数一个</p>
                  </div>
                )}

                {activeTemplate && DRAG_TEMPLATES.has(activeTemplate) && (
                  <div className={`drag-workspace drag-${activeTemplate}`}>
                    <div className="drop-target-grid">
                      {activeActivity.interaction?.targets?.map((target) => {
                        const placedChoices = activeActivity.choices.filter((choice) => placements[choice.id] === target.id);
                        return (
                          <button
                            type="button"
                            key={target.id}
                            data-drop-target={target.id}
                            className={`drop-target target-${target.color} ${selectedPieceId ? "ready" : ""}`}
                            onClick={() => selectedPieceId && placePiece(selectedPieceId, target.id)}
                          >
                            <span className="target-heading">{target.icon && <ActivityIcon icon={target.icon} size={31} strokeWidth={1.9} />}<strong>{target.label}</strong></span>
                            {target.helper && <small>{target.helper}</small>}
                            <span className="placed-pieces">
                              {placedChoices.map((choice) => <i key={choice.id} className={`scale-${choice.visualScale ?? "medium"}`}><ActivityIcon icon={choice.icon} size={32} strokeWidth={2} /></i>)}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="drag-piece-tray">
                      {activeActivity.choices.filter((choice) => !placements[choice.id]).map((choice) => {
                        const dragging = dragVisual?.id === choice.id;
                        return (
                          <button
                            type="button"
                            key={choice.id}
                            className={`drag-piece choice-${choice.color} scale-${choice.visualScale ?? "medium"} ${selectedPieceId === choice.id ? "selected" : ""} ${dragging ? "is-dragging" : ""}`}
                            style={dragging ? { transform: `translate3d(${dragVisual?.x ?? 0}px, ${dragVisual?.y ?? 0}px, 0)` } : undefined}
                            aria-pressed={selectedPieceId === choice.id}
                            onPointerDown={(event) => startPieceDrag(event, choice.id)}
                            onPointerMove={movePieceDrag}
                            onPointerUp={endPieceDrag}
                            onPointerCancel={() => { dragStart.current = null; setDragVisual(null); }}
                            onClick={(event) => { if (event.detail === 0) setSelectedPieceId((selected) => selected === choice.id ? null : choice.id); }}
                          >
                            <span><ActivityIcon icon={choice.icon} size={45} strokeWidth={1.9} /></span>
                            <strong>{choice.label}</strong>
                            {choice.helper && <small>{choice.helper}</small>}
                          </button>
                        );
                      })}
                    </div>
                    <p className="drag-help">拖到上面，也可以先点一个，再点目标</p>
                  </div>
                )}
                <div className={`gentle-hint ${attempts > 0 ? "visible" : ""}`}><Heart size={17} fill="currentColor" /><span>{attempts > 0 ? activeActivity.hint : "可以用小手慢慢找"}</span></div>
              </div>
            </section>
          ) : (
            <section className="success-stage">
              <div className="success-sparkles"><i /><i /><i /><i /></div>
              <span className="success-medal"><Star size={75} fill="currentColor" /></span>
              <small>认真完成啦</small>
              <h2 id="learning-title">{activeActivity.successText}</h2>
              <p>{attempts === 1 ? "你认真听完，一次就发现了答案。" : "你没有着急，在提示后找到了答案。"}</p>
              <button className="success-next" onClick={nextActivity}>{completedCount >= 2 ? "今天玩好啦" : "去下一个任务"}<ArrowRight size={20} /></button>
              <button className="success-home" onClick={closeActivity}>回到今天</button>
            </section>
          )}
        </div>
      )}

      {toast && <div className="toast"><Check size={18} />{toast}</div>}
    </main>
  );
}
