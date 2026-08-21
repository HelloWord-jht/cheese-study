import { M1_ACTIVITY_LIBRARY } from "./learning-content-m1";

export type LearningDomain = "chinese" | "math" | "english";
export type ActivityKind =
  | "listen_choose"
  | "count_choose"
  | "look_choose"
  | "pattern_choose"
  | "tap_count"
  | "drag_match"
  | "drag_sort"
  | "place_in_scene"
  | "sequence_3"
  | "pattern_extend"
  | "story_choice";
export type ActivityTemplate =
  | "tap_choose"
  | "tap_count"
  | "drag_match"
  | "drag_sort"
  | "place_in_scene"
  | "sequence_3"
  | "pattern_extend"
  | "story_choice";
export type InterestKey = "dinosaurs" | "vehicles" | "construction" | "space" | "animals" | "nature";

export const INTEREST_LABELS: Record<InterestKey, string> = {
  dinosaurs: "恐龙",
  vehicles: "交通工具",
  construction: "工程机械",
  space: "太空",
  animals: "动物",
  nature: "自然",
};

export const DOMAIN_META: Record<LearningDomain, { title: string; shortTitle: string; english: string }> = {
  chinese: { title: "中文小耳朵", shortTitle: "中文", english: "Listen & Talk" },
  math: { title: "数学小侦探", shortTitle: "数学", english: "Count & Think" },
  english: { title: "English Time", shortTitle: "英语", english: "Listen & Say" },
};

export const ICON_KEYS = [
  "excavator",
  "waves",
  "moon",
  "dinosaur",
  "leaf",
  "apple",
  "ball",
  "train",
  "bus",
  "rocket",
  "toothbrush",
  "shoe",
  "sun",
  "sad",
  "happy",
  "angry",
  "bird",
  "car",
  "fish",
  "egg",
  "circle",
  "square",
  "triangle",
  "long",
  "short",
  "red",
  "blue",
  "yellow",
  "green",
  "cat",
  "dog",
  "nose",
  "hand",
  "foot",
  "jump",
  "run",
  "sleep",
  "hello",
  "bye",
  "thanks",
  "house",
  "tree",
  "umbrella",
  "cloud",
  "wrench",
  "hammer",
  "stone",
  "star",
  "box",
  "bridge",
  "bed",
  "cup",
  "rabbit",
  "helmet",
  "banana",
  "ship",
  "flower",
  "book",
] as const;

export type IconKey = (typeof ICON_KEYS)[number];

export interface ActivityChoice {
  id: string;
  label: string;
  helper?: string;
  icon: IconKey;
  color: "coral" | "blue" | "yellow" | "green" | "purple" | "cream";
  visualScale?: "small" | "medium" | "large";
}

export interface ActivityTarget {
  id: string;
  label: string;
  helper?: string;
  icon?: IconKey;
  color: ActivityChoice["color"];
}

export interface ActivityInteraction {
  targets?: ActivityTarget[];
  correctTargets?: Record<string, string>;
  countGoal?: number;
  storyText?: string[];
}

export interface LearningActivity {
  id: string;
  domain: LearningDomain;
  kind: ActivityKind;
  skillId?: string;
  difficulty?: 1 | 2 | 3;
  ageBand?: "30-36m" | "36-42m" | "42-48m";
  variantCount?: number;
  title: string;
  skill: string;
  instruction: string;
  spokenInstruction: string;
  speechLang: "zh-CN" | "en-US";
  choices: ActivityChoice[];
  answerId: string;
  hint: string;
  successText: string;
  parentTip: string;
  interests: InterestKey[];
  sceneIcons?: IconKey[];
  sceneLabel?: string;
  interaction?: ActivityInteraction;
}

export interface DailyPlan {
  date: string;
  theme: string;
  greeting: string;
  parentTip: string;
  activities: LearningActivity[];
  source: "curated" | "deepseek";
}

export interface ActivityResult {
  activityId: string;
  domain: LearningDomain;
  date: string;
  correct: boolean;
  attempts: number;
  durationSeconds: number;
  template?: ActivityTemplate;
  firstTryCorrect?: boolean;
  hintLevelUsed?: 0 | 1 | 2;
  audioReplayCount?: number;
  completed?: boolean;
  abandoned?: boolean;
}

const BASE_ACTIVITY_LIBRARY: LearningActivity[] = [
  {
    id: "cn-excavator-action",
    domain: "chinese",
    kind: "listen_choose",
    title: "挖掘机在忙什么",
    skill: "听懂动作词",
    instruction: "听一听，谁在“挖土”？",
    spokenInstruction: "谁在挖土？请找到正在工作的挖掘机。",
    speechLang: "zh-CN",
    choices: [
      { id: "dig", label: "挖土", icon: "excavator", color: "yellow" },
      { id: "swim", label: "游泳", icon: "waves", color: "blue" },
      { id: "sleep", label: "睡觉", icon: "moon", color: "purple" },
    ],
    answerId: "dig",
    hint: "它有一只长长的大铲子。",
    successText: "找到啦！挖掘机正在挖土。",
    parentTip: "看到工程车时，可以重复说“挖、推、装”。",
    interests: ["construction", "vehicles"],
  },
  {
    id: "cn-dinosaur-food",
    domain: "chinese",
    kind: "look_choose",
    title: "小恐龙饿了",
    skill: "理解生活词汇",
    instruction: "小恐龙想吃一片什么？",
    spokenInstruction: "小恐龙饿了，它想吃一片绿绿的叶子。",
    speechLang: "zh-CN",
    choices: [
      { id: "leaf", label: "叶子", icon: "leaf", color: "green" },
      { id: "apple", label: "苹果", icon: "apple", color: "coral" },
      { id: "ball", label: "皮球", icon: "ball", color: "blue" },
    ],
    answerId: "leaf",
    hint: "它绿绿的，长在树上。",
    successText: "对啦，恐龙吃到绿叶子啦！",
    parentTip: "吃饭时请宝宝说出一种食物的名字。",
    interests: ["dinosaurs", "nature"],
  },
  {
    id: "cn-vehicle-sound",
    domain: "chinese",
    kind: "listen_choose",
    title: "嘟嘟，谁来啦",
    skill: "声音与物体对应",
    instruction: "听到“呜——呜——”，谁开来了？",
    spokenInstruction: "呜，呜，长长的火车开来了。请找到火车。",
    speechLang: "zh-CN",
    choices: [
      { id: "train", label: "火车", icon: "train", color: "green" },
      { id: "bus", label: "公交车", icon: "bus", color: "yellow" },
      { id: "rocket", label: "火箭", icon: "rocket", color: "coral" },
    ],
    answerId: "train",
    hint: "它有好多节车厢。",
    successText: "呜——火车进站啦！",
    parentTip: "和宝宝模仿不同交通工具的声音。",
    interests: ["vehicles"],
  },
  {
    id: "cn-morning-order",
    domain: "chinese",
    kind: "look_choose",
    title: "勇敢起床啦",
    skill: "理解生活顺序",
    instruction: "早上起床后，我们先做什么？",
    spokenInstruction: "早上起床啦，我们先刷刷牙。",
    speechLang: "zh-CN",
    choices: [
      { id: "brush", label: "刷牙", icon: "toothbrush", color: "blue" },
      { id: "shoes", label: "穿鞋", icon: "shoe", color: "yellow" },
      { id: "sleep", label: "睡觉", icon: "moon", color: "purple" },
    ],
    answerId: "brush",
    hint: "牙刷会把小牙齿刷干净。",
    successText: "刷刷刷，小牙齿亮晶晶！",
    parentTip: "刷牙时一起说“上面、下面、里面、外面”。",
    interests: ["nature", "animals"],
  },
  {
    id: "cn-feeling-blocks",
    domain: "chinese",
    kind: "look_choose",
    title: "积木倒下以后",
    skill: "认识情绪词",
    instruction: "积木倒了，小伙伴可能是什么心情？",
    spokenInstruction: "积木倒下了，他有一点难过。哪一个是难过的表情？",
    speechLang: "zh-CN",
    choices: [
      { id: "sad", label: "难过", icon: "sad", color: "blue" },
      { id: "happy", label: "开心", icon: "happy", color: "yellow" },
      { id: "angry", label: "生气", icon: "angry", color: "coral" },
    ],
    answerId: "sad",
    hint: "嘴角向下，眼睛也没有笑。",
    successText: "你看懂了他的心情，可以陪他再搭一次。",
    parentTip: "遇到情绪时，先帮宝宝说出“我有点难过”。",
    interests: ["construction", "animals"],
  },
  {
    id: "cn-who-can-fly",
    domain: "chinese",
    kind: "look_choose",
    title: "谁飞上天空",
    skill: "理解动物特征",
    instruction: "谁有翅膀，可以飞起来？",
    spokenInstruction: "谁有一双翅膀，可以飞到天空里？",
    speechLang: "zh-CN",
    choices: [
      { id: "bird", label: "小鸟", icon: "bird", color: "yellow" },
      { id: "car", label: "汽车", icon: "car", color: "coral" },
      { id: "fish", label: "小鱼", icon: "fish", color: "blue" },
    ],
    answerId: "bird",
    hint: "看看谁的身体旁边有翅膀。",
    successText: "小鸟拍拍翅膀，飞起来啦！",
    parentTip: "散步时观察小鸟怎样飞、停和走。",
    interests: ["animals", "nature"],
  },
  {
    id: "math-dino-eggs-3",
    domain: "math",
    kind: "count_choose",
    title: "数数恐龙蛋",
    skill: "1–3 数量感",
    instruction: "数一数，有几颗恐龙蛋？",
    spokenInstruction: "我们一起慢慢数，一，二，三。有几颗恐龙蛋？",
    speechLang: "zh-CN",
    sceneIcons: ["egg", "egg", "egg"],
    sceneLabel: "一、二、三",
    choices: [
      { id: "2", label: "2", helper: "两颗", icon: "egg", color: "blue" },
      { id: "3", label: "3", helper: "三颗", icon: "egg", color: "yellow" },
      { id: "4", label: "4", helper: "四颗", icon: "egg", color: "green" },
    ],
    answerId: "3",
    hint: "用小手指着，一颗一颗数。",
    successText: "一、二、三，正好三颗！",
    parentTip: "吃水果时请宝宝拿三颗葡萄。",
    interests: ["dinosaurs"],
  },
  {
    id: "math-round-wheel",
    domain: "math",
    kind: "look_choose",
    title: "给赛车装轮子",
    skill: "认识圆形",
    instruction: "哪一个形状可以当轮子？",
    spokenInstruction: "赛车需要圆圆的轮子。请找到圆形。",
    speechLang: "zh-CN",
    choices: [
      { id: "circle", label: "圆形", icon: "circle", color: "blue" },
      { id: "square", label: "方形", icon: "square", color: "yellow" },
      { id: "triangle", label: "三角形", icon: "triangle", color: "green" },
    ],
    answerId: "circle",
    hint: "圆形没有尖尖的角，可以滚起来。",
    successText: "圆圆的轮子，赛车出发！",
    parentTip: "一起找找家里圆形的轮子和盘子。",
    interests: ["vehicles"],
  },
  {
    id: "math-long-short",
    domain: "math",
    kind: "look_choose",
    title: "谁的身体更长",
    skill: "比较长短",
    instruction: "火车和汽车，谁更长？",
    spokenInstruction: "长长的火车和小汽车，谁的身体更长？",
    speechLang: "zh-CN",
    sceneIcons: ["train", "car"],
    choices: [
      { id: "train", label: "火车", helper: "长长的", icon: "train", color: "green" },
      { id: "car", label: "汽车", helper: "短短的", icon: "car", color: "coral" },
      { id: "same", label: "一样长", icon: "long", color: "cream" },
    ],
    answerId: "train",
    hint: "火车有一节、两节、好多节车厢。",
    successText: "火车有好多节，所以它更长！",
    parentTip: "用两支不同长度的笔让宝宝比较长短。",
    interests: ["vehicles"],
  },
  {
    id: "math-blue-rockets",
    domain: "math",
    kind: "look_choose",
    title: "火箭排好队",
    skill: "按颜色分类",
    instruction: "哪一张卡片和蓝色火箭是一队？",
    spokenInstruction: "蓝色火箭要和蓝色卡片站在一起。",
    speechLang: "zh-CN",
    sceneIcons: ["rocket", "blue"],
    choices: [
      { id: "blue", label: "蓝色", icon: "blue", color: "blue" },
      { id: "red", label: "红色", icon: "red", color: "coral" },
      { id: "yellow", label: "黄色", icon: "yellow", color: "yellow" },
    ],
    answerId: "blue",
    hint: "找一找，和天空颜色很像的是哪一个？",
    successText: "蓝色火箭找到自己的队伍啦！",
    parentTip: "收玩具时按颜色分成两个小盒子。",
    interests: ["space"],
  },
  {
    id: "math-pattern-colors",
    domain: "math",
    kind: "pattern_choose",
    title: "修好彩色轨道",
    skill: "发现简单规律",
    instruction: "红、蓝、红，接下来是什么颜色？",
    spokenInstruction: "红色，蓝色，红色。接下来轮到什么颜色？",
    speechLang: "zh-CN",
    sceneIcons: ["red", "blue", "red"],
    choices: [
      { id: "blue", label: "蓝色", icon: "blue", color: "blue" },
      { id: "yellow", label: "黄色", icon: "yellow", color: "yellow" },
      { id: "green", label: "绿色", icon: "green", color: "green" },
    ],
    answerId: "blue",
    hint: "它们在轮流出现：红、蓝、红……",
    successText: "红蓝红蓝，轨道修好啦！",
    parentTip: "用两种颜色的积木排一个轮流规律。",
    interests: ["construction", "vehicles"],
  },
  {
    id: "math-space-count-2",
    domain: "math",
    kind: "count_choose",
    title: "两艘飞船出发",
    skill: "1–3 数量匹配",
    instruction: "天空中有几艘小火箭？",
    spokenInstruction: "一艘，两艘。天空里有几艘小火箭？",
    speechLang: "zh-CN",
    sceneIcons: ["rocket", "rocket"],
    sceneLabel: "一、二",
    choices: [
      { id: "1", label: "1", helper: "一艘", icon: "rocket", color: "green" },
      { id: "2", label: "2", helper: "两艘", icon: "rocket", color: "blue" },
      { id: "3", label: "3", helper: "三艘", icon: "rocket", color: "purple" },
    ],
    answerId: "2",
    hint: "用手指一艘一艘地点。",
    successText: "一、二，两艘火箭升空啦！",
    parentTip: "请宝宝帮忙拿两个小汽车玩具。",
    interests: ["space", "vehicles"],
  },
  {
    id: "en-find-car",
    domain: "english",
    kind: "listen_choose",
    title: "Find the car",
    skill: "听懂交通工具单词",
    instruction: "听一听：Which one is a car?",
    spokenInstruction: "Which one is a car? Car.",
    speechLang: "en-US",
    choices: [
      { id: "car", label: "car", helper: "汽车", icon: "car", color: "coral" },
      { id: "cat", label: "cat", helper: "小猫", icon: "cat", color: "yellow" },
      { id: "rocket", label: "rocket", helper: "火箭", icon: "rocket", color: "blue" },
    ],
    answerId: "car",
    hint: "Car, car，四个轮子跑得快。",
    successText: "Yes! Car. 汽车找到了！",
    parentTip: "看到汽车时，自然地重复一次“car”。",
    interests: ["vehicles"],
  },
  {
    id: "en-blue-truck",
    domain: "english",
    kind: "listen_choose",
    title: "A blue truck",
    skill: "听懂颜色词",
    instruction: "Which one is blue?",
    spokenInstruction: "Blue. Blue. Which one is blue?",
    speechLang: "en-US",
    choices: [
      { id: "blue", label: "blue", helper: "蓝色", icon: "blue", color: "blue" },
      { id: "red", label: "red", helper: "红色", icon: "red", color: "coral" },
      { id: "yellow", label: "yellow", helper: "黄色", icon: "yellow", color: "yellow" },
    ],
    answerId: "blue",
    hint: "Blue，像晴朗的天空。",
    successText: "Great! Blue, blue, blue!",
    parentTip: "今天只重复一个颜色词“blue”，不用考宝宝。",
    interests: ["construction", "vehicles"],
  },
  {
    id: "en-touch-nose",
    domain: "english",
    kind: "listen_choose",
    title: "Touch your nose",
    skill: "听懂身体指令",
    instruction: "Touch your nose. 点一点鼻子。",
    spokenInstruction: "Touch your nose. Nose.",
    speechLang: "en-US",
    choices: [
      { id: "nose", label: "nose", helper: "鼻子", icon: "nose", color: "yellow" },
      { id: "hand", label: "hand", helper: "手", icon: "hand", color: "blue" },
      { id: "foot", label: "foot", helper: "脚", icon: "foot", color: "green" },
    ],
    answerId: "nose",
    hint: "Nose，就在两只眼睛的下面。",
    successText: "You got it! Nose!",
    parentTip: "洗脸时玩一次 nose、hand、foot 的指认游戏。",
    interests: ["animals", "nature"],
  },
  {
    id: "en-find-dog",
    domain: "english",
    kind: "listen_choose",
    title: "Where is the dog?",
    skill: "听懂动物单词",
    instruction: "Where is the dog?",
    spokenInstruction: "Dog. Woof woof. Where is the dog?",
    speechLang: "en-US",
    choices: [
      { id: "dog", label: "dog", helper: "小狗", icon: "dog", color: "yellow" },
      { id: "cat", label: "cat", helper: "小猫", icon: "cat", color: "coral" },
      { id: "bird", label: "bird", helper: "小鸟", icon: "bird", color: "blue" },
    ],
    answerId: "dog",
    hint: "Dog says woof, woof!",
    successText: "Yes! Dog. Woof woof!",
    parentTip: "不用要求跟读，听到并指出来就已经很好。",
    interests: ["animals"],
  },
  {
    id: "en-jump-action",
    domain: "english",
    kind: "listen_choose",
    title: "Jump like a dino",
    skill: "听懂动作词",
    instruction: "Jump! 哪一个动作是跳起来？",
    spokenInstruction: "Jump, jump, jump like a little dinosaur!",
    speechLang: "en-US",
    choices: [
      { id: "jump", label: "jump", helper: "跳", icon: "jump", color: "green" },
      { id: "run", label: "run", helper: "跑", icon: "run", color: "coral" },
      { id: "sleep", label: "sleep", helper: "睡觉", icon: "sleep", color: "purple" },
    ],
    answerId: "jump",
    hint: "Jump，双脚一起离开地面。",
    successText: "Jump! 小恐龙跳得真高！",
    parentTip: "离开屏幕后一起做两次 jump。",
    interests: ["dinosaurs"],
  },
  {
    id: "en-hello-robot",
    domain: "english",
    kind: "listen_choose",
    title: "Hello, robot!",
    skill: "理解简单问候",
    instruction: "小机器人来了，我们说什么？",
    spokenInstruction: "Hello! Hello, little robot!",
    speechLang: "en-US",
    choices: [
      { id: "hello", label: "Hello!", helper: "你好", icon: "hello", color: "yellow" },
      { id: "bye", label: "Bye-bye!", helper: "再见", icon: "bye", color: "blue" },
      { id: "thanks", label: "Thank you!", helper: "谢谢", icon: "thanks", color: "green" },
    ],
    answerId: "hello",
    hint: "第一次见面，我们说 Hello。",
    successText: "Hello! 小机器人也向你挥手啦！",
    parentTip: "早上见面时自然地说一次 Hello。",
    interests: ["space", "construction"],
  },
];

export const ACTIVITY_LIBRARY: LearningActivity[] = [
  ...BASE_ACTIVITY_LIBRARY,
  ...M1_ACTIVITY_LIBRARY,
];

export function activityTemplate(activity: Pick<LearningActivity, "kind">): ActivityTemplate {
  if (
    activity.kind === "listen_choose" ||
    activity.kind === "count_choose" ||
    activity.kind === "look_choose" ||
    activity.kind === "pattern_choose"
  ) {
    return "tap_choose";
  }
  return activity.kind;
}

export function validateActivityLibrary(activities: LearningActivity[] = ACTIVITY_LIBRARY) {
  const errors: string[] = [];
  const ids = new Set<string>();

  for (const activity of activities) {
    if (ids.has(activity.id)) errors.push(`${activity.id}: 活动 ID 重复`);
    ids.add(activity.id);

    const choiceIds = new Set(activity.choices.map((choice) => choice.id));
    if (choiceIds.size !== activity.choices.length) errors.push(`${activity.id}: 选项 ID 重复`);
    if (!choiceIds.has(activity.answerId)) errors.push(`${activity.id}: answerId 不在选项中`);

    if (activity.id.endsWith("-m1")) {
      if (!activity.skillId || !activity.ageBand || !activity.difficulty) {
        errors.push(`${activity.id}: 缺少 M1 分层字段`);
      }
      if ((activity.variantCount ?? 0) < 2) errors.push(`${activity.id}: 至少需要两个变量版本`);
    }

    const template = activityTemplate(activity);
    const targets = activity.interaction?.targets ?? [];
    const targetIds = new Set(targets.map((target) => target.id));
    const correctTargets = activity.interaction?.correctTargets ?? {};

    if (template === "tap_count") {
      const countGoal = activity.interaction?.countGoal ?? 0;
      if (!Number.isInteger(countGoal) || countGoal < 1 || countGoal > activity.choices.length) {
        errors.push(`${activity.id}: countGoal 超出可点数对象范围`);
      }
    }

    if (["drag_match", "drag_sort", "place_in_scene", "sequence_3", "pattern_extend"].includes(template)) {
      if (targets.length === 0) errors.push(`${activity.id}: 拖拽活动缺少目标区域`);
      for (const [choiceId, targetId] of Object.entries(correctTargets)) {
        if (!choiceIds.has(choiceId)) errors.push(`${activity.id}: 映射包含未知选项 ${choiceId}`);
        if (!targetIds.has(targetId)) errors.push(`${activity.id}: 映射包含未知目标 ${targetId}`);
      }
      if (!correctTargets[activity.answerId]) errors.push(`${activity.id}: 正确选项缺少目标映射`);
      if (["drag_match", "drag_sort", "sequence_3"].includes(template)) {
        for (const choiceId of choiceIds) {
          if (!correctTargets[choiceId]) errors.push(`${activity.id}: ${choiceId} 缺少目标映射`);
        }
      }
    }
  }

  return errors;
}

const activityLibraryErrors = validateActivityLibrary();
if (activityLibraryErrors.length > 0) {
  throw new Error(`活动题库校验失败：\n${activityLibraryErrors.join("\n")}`);
}

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateSeed(dateKey: string) {
  return Array.from(dateKey).reduce((sum, character) => sum + character.charCodeAt(0), 0);
}

export function selectCuratedActivities(
  dateKey: string,
  interests: InterestKey[],
  preferredIds: string[] = [],
) {
  const chosen: LearningActivity[] = [];
  const seed = dateSeed(dateKey);
  const usedTemplates = new Set<ActivityTemplate>();

  for (const domain of ["chinese", "math", "english"] as const) {
    const domainActivities = ACTIVITY_LIBRARY.filter((activity) => activity.domain === domain);
    const preferred = preferredIds
      .map((id) => domainActivities.find((activity) => activity.id === id))
      .find((activity) => activity && !usedTemplates.has(activityTemplate(activity)));
    if (preferred) {
      chosen.push(preferred);
      usedTemplates.add(activityTemplate(preferred));
      continue;
    }

    const ranked = domainActivities
      .map((activity, index) => ({
        activity,
        score:
          activity.interests.filter((interest) => interests.includes(interest)).length * 10 +
          (usedTemplates.has(activityTemplate(activity)) ? -50 : 25) +
          ((seed + index * 7) % domainActivities.length),
      }))
      .sort((a, b) => b.score - a.score);
    const selection = ranked[seed % Math.min(3, ranked.length)].activity;
    chosen.push(selection);
    usedTemplates.add(activityTemplate(selection));
  }

  return chosen;
}

export function createCuratedPlan(
  dateKey: string,
  interests: InterestKey[],
  preferredIds: string[] = [],
  parentTip?: string,
  source: DailyPlan["source"] = "curated",
): DailyPlan {
  const activities = selectCuratedActivities(dateKey, interests, preferredIds);
  const themes = ["恐龙救援队", "工程车出发", "小小宇航员", "动物探险日"];
  const seed = dateSeed(dateKey);
  const primaryInterest = interests[seed % Math.max(interests.length, 1)];
  const themeByInterest: Partial<Record<InterestKey, string>> = {
    dinosaurs: "恐龙救援队",
    vehicles: "交通工具大集合",
    construction: "工程车出发",
    space: "小小宇航员",
    animals: "动物探险日",
    nature: "森林发现日",
  };

  return {
    date: dateKey,
    theme: themeByInterest[primaryInterest] ?? themes[seed % themes.length],
    greeting: "准备好了吗？今天有三个小任务等你出发。",
    parentTip: parentTip?.slice(0, 100) || activities[seed % activities.length].parentTip,
    activities,
    source,
  };
}

export function isInterestKey(value: unknown): value is InterestKey {
  return typeof value === "string" && value in INTEREST_LABELS;
}

export function isDailyPlan(value: unknown): value is DailyPlan {
  if (!value || typeof value !== "object") return false;
  const plan = value as Partial<DailyPlan>;
  return (
    typeof plan.date === "string" &&
    typeof plan.theme === "string" &&
    typeof plan.greeting === "string" &&
    typeof plan.parentTip === "string" &&
    (plan.source === "curated" || plan.source === "deepseek") &&
    Array.isArray(plan.activities) &&
    plan.activities.length === 3 &&
    plan.activities.every((activity) =>
      ACTIVITY_LIBRARY.some((curated) => curated.id === activity.id && curated.domain === activity.domain),
    )
  );
}
