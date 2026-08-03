"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Bird,
  BookOpen,
  Check,
  ChevronLeft,
  Clock3,
  Dog,
  Footprints,
  Gift,
  Heart,
  Home,
  Leaf,
  LockKeyhole,
  Music2,
  Palette,
  Pause,
  PersonStanding,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  SunMedium,
  Volume2,
  VolumeX,
  X,
  Cat,
} from "lucide-react";

type View = "today" | "treasure" | "parent";
type ActivityId = "colors" | "sounds" | "move";
type Theme = "cream" | "ocean" | "forest";

const activities = [
  {
    id: "colors" as ActivityId,
    eyebrow: "颜色认知",
    title: "彩虹搬家",
    description: "帮颜色宝宝找到自己的家",
    time: "3 分钟",
    className: "activity-yellow",
    Icon: Palette,
  },
  {
    id: "sounds" as ActivityId,
    eyebrow: "听觉表达",
    title: "谁在叫呀",
    description: "听一听，找到藏起来的小动物",
    time: "2 分钟",
    className: "activity-blue",
    Icon: Music2,
  },
  {
    id: "move" as ActivityId,
    eyebrow: "身体探索",
    title: "长成小树",
    description: "跟着米米伸伸手、踮踮脚",
    time: "3 分钟",
    className: "activity-green",
    Icon: PersonStanding,
  },
];

const stickerNames = ["太阳花", "小橘猫", "蒲公英", "雨靴", "纸飞机", "小鲸鱼"];

function Buddy({ small = false }: { small?: boolean }) {
  return (
    <div className={`buddy ${small ? "buddy-small" : ""}`} aria-label="陪伴角色米米">
      <span className="buddy-ear buddy-ear-left" />
      <span className="buddy-ear buddy-ear-right" />
      <span className="buddy-head">
        <span className="buddy-brow buddy-brow-left" />
        <span className="buddy-brow buddy-brow-right" />
        <span className="buddy-eye buddy-eye-left" />
        <span className="buddy-eye buddy-eye-right" />
        <span className="buddy-nose" />
        <span className="buddy-cheek buddy-cheek-left" />
        <span className="buddy-cheek buddy-cheek-right" />
      </span>
      <span className="buddy-body" />
      <span className="buddy-arm buddy-arm-left" />
      <span className="buddy-arm buddy-arm-right" />
    </div>
  );
}

export default function HomePage() {
  const [view, setView] = useState<View>("today");
  const [childName, setChildName] = useState("小满");
  const [draftName, setDraftName] = useState("小满");
  const [completed, setCompleted] = useState<ActivityId[]>([]);
  const [activeActivity, setActiveActivity] = useState<ActivityId | null>(null);
  const [activityComplete, setActivityComplete] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [moveStarted, setMoveStarted] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [theme, setTheme] = useState<Theme>("cream");
  const [gateOpen, setGateOpen] = useState(false);
  const [gateHolding, setGateHolding] = useState(false);
  const [toast, setToast] = useState("");
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileLoaded = useRef(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("little-world-profile");
    if (!saved) {
      profileLoaded.current = true;
      return;
    }
    try {
      const profile = JSON.parse(saved) as {
        childName?: string;
        completed?: ActivityId[];
        soundOn?: boolean;
        reduceMotion?: boolean;
        theme?: Theme;
      };
      window.queueMicrotask(() => {
        if (profile.childName) {
          setChildName(profile.childName);
          setDraftName(profile.childName);
        }
        if (profile.completed) setCompleted(profile.completed);
        if (typeof profile.soundOn === "boolean") setSoundOn(profile.soundOn);
        if (typeof profile.reduceMotion === "boolean") setReduceMotion(profile.reduceMotion);
        if (profile.theme) setTheme(profile.theme);
        profileLoaded.current = true;
      });
    } catch {
      // A malformed local demo preference should never block the child experience.
      profileLoaded.current = true;
    }
  }, []);

  useEffect(() => {
    if (!profileLoaded.current) return;
    window.localStorage.setItem(
      "little-world-profile",
      JSON.stringify({ childName, completed, soundOn, reduceMotion, theme }),
    );
  }, [childName, completed, soundOn, reduceMotion, theme]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function speak(text: string) {
    if (!soundOn || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.86;
    utterance.pitch = 1.08;
    window.speechSynthesis.speak(utterance);
  }

  function openActivity(id: ActivityId) {
    setActiveActivity(id);
    setActivityComplete(false);
    setMoveStarted(false);
    setFeedback("");
    const prompt =
      id === "colors"
        ? "把黄色的小太阳送回黄色的家吧"
        : id === "sounds"
          ? "听一听，是谁在叫呀"
          : "我们一起变成高高的小树吧";
    window.setTimeout(() => speak(prompt), 250);
  }

  function finishActivity(id: ActivityId) {
    if (!completed.includes(id)) setCompleted((items) => [...items, id]);
    setActivityComplete(true);
    setFeedback("");
    speak("你认真完成啦，送你一颗暖暖的小星星");
  }

  function closeActivity() {
    setActiveActivity(null);
    setActivityComplete(false);
    setMoveStarted(false);
    setFeedback("");
  }

  function chooseColor(color: string) {
    if (color === "yellow") {
      finishActivity("colors");
    } else {
      setFeedback("再看看，哪一个像暖暖的太阳？");
      speak("再看看，黄色像暖暖的太阳");
    }
  }

  function chooseAnimal(animal: string) {
    if (animal === "cat") {
      finishActivity("sounds");
    } else {
      setFeedback("听起来软软的：喵——喵——");
      speak("听起来软软的，喵，喵");
    }
  }

  function requestParent() {
    if (view === "parent") return;
    setGateOpen(true);
  }

  function startHold() {
    setGateHolding(true);
    holdTimer.current = setTimeout(() => {
      setGateOpen(false);
      setGateHolding(false);
      setView("parent");
    }, 1250);
  }

  function stopHold() {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
    setGateHolding(false);
  }

  function saveName() {
    const safeName = draftName.trim().slice(0, 8) || "宝宝";
    setChildName(safeName);
    setDraftName(safeName);
    setToast("昵称已经保存");
  }

  function switchChildView(next: View) {
    if (next === "parent") {
      requestParent();
      return;
    }
    setView(next);
  }

  return (
    <main className={`app-shell theme-${theme} ${reduceMotion ? "reduce-motion" : ""}`}>
      <div className="ambient-shape ambient-one" />
      <div className="ambient-shape ambient-two" />

      <aside className="sidebar" aria-label="主导航">
        <button className="brand" onClick={() => setView("today")} aria-label="回到首页">
          <span className="brand-mark"><Leaf size={21} strokeWidth={2.6} /></span>
          <span className="brand-copy"><b>{childName}的小世界</b><small>little wonderland</small></span>
        </button>

        <div className="sidebar-profile">
          <div className="mini-avatar"><Buddy small /></div>
          <div><small>今天也要</small><strong>好奇一点点</strong></div>
        </div>

        <nav className="nav-list">
          <button className={view === "today" ? "active" : ""} onClick={() => setView("today")}>
            <Home size={21} /><span>今天</span>{completed.length > 0 && <i>{completed.length}</i>}
          </button>
          <button className={view === "treasure" ? "active" : ""} onClick={() => setView("treasure")}>
            <Gift size={21} /><span>我的宝箱</span>
          </button>
          <button className={view === "parent" ? "active" : ""} onClick={requestParent}>
            <LockKeyhole size={20} /><span>家长中心</span>
          </button>
        </nav>

        <div className="sidebar-rest">
          <span><Pause size={16} /></span>
          <div><strong>玩一会，歇一会</strong><small>今天还剩 7 分钟</small></div>
        </div>
        <p className="privacy-note"><ShieldCheck size={15} /> 仅在这台设备保存</p>
      </aside>

      <section className="page-area">
        <header className="topbar">
          <div>
            <p className="eyebrow"><SunMedium size={16} /> 8 月 3 日 · 星期一</p>
            <h1>{view === "today" ? "今天的小小冒险" : view === "treasure" ? `${childName}的宝箱` : "家长中心"}</h1>
          </div>
          <div className="top-actions">
            {view !== "parent" && (
              <div className="session-pill"><Clock3 size={16} /><span>轻松玩</span><strong>8 分钟</strong></div>
            )}
            <button
              className="icon-button"
              onClick={() => setSoundOn((value) => !value)}
              aria-label={soundOn ? "关闭声音" : "打开声音"}
            >
              {soundOn ? <Volume2 size={21} /> : <VolumeX size={21} />}
            </button>
          </div>
        </header>

        {view === "today" && (
          <div className="page-content today-page">
            <section className="welcome-card">
              <div className="welcome-copy">
                <span className="soft-label"><Sparkles size={15} /> 米米等你好久啦</span>
                <h2>早上好，{childName}！</h2>
                <p>今天想先听一听、认颜色，还是把身体变成一棵小树？</p>
                <div className="journey-row" aria-label={`今天已完成 ${completed.length} 个，共 3 个活动`}>
                  <div className="journey-track">
                    {[0, 1, 2].map((index) => (
                      <span key={index} className={index < completed.length ? "done" : ""}>
                        {index < completed.length ? <Check size={14} strokeWidth={3} /> : index + 1}
                      </span>
                    ))}
                  </div>
                  <small>{completed.length === 3 ? "今天的小路走完啦" : `再完成 ${3 - completed.length} 个小发现`}</small>
                </div>
              </div>
              <div className="welcome-visual">
                <span className="cloud cloud-one" />
                <span className="cloud cloud-two" />
                <span className="tiny-sun" />
                <Buddy />
                <span className="ground-leaf leaf-a" />
                <span className="ground-leaf leaf-b" />
                <span className="ground-leaf leaf-c" />
              </div>
            </section>

            <div className="section-heading">
              <div><span>为 {childName} 准备</span><h2>今天玩这三个</h2></div>
              <p>没有顺序，想玩哪个就点哪个</p>
            </div>

            <section className="activity-grid">
              {activities.map(({ id, eyebrow, title, description, time, className, Icon }, index) => {
                const isDone = completed.includes(id);
                return (
                  <button key={id} className={`activity-card ${className}`} onClick={() => openActivity(id)}>
                    <div className="activity-card-top">
                      <span className="activity-icon"><Icon size={27} strokeWidth={2.2} /></span>
                      {isDone ? <span className="done-chip"><Check size={15} /> 玩过啦</span> : <span className="activity-number">0{index + 1}</span>}
                    </div>
                    <div className="activity-copy">
                      <span>{eyebrow}</span>
                      <h3>{title}</h3>
                      <p>{description}</p>
                    </div>
                    <div className="activity-footer">
                      <small><Clock3 size={14} /> {time}</small>
                      <span className="round-arrow"><ArrowRight size={19} /></span>
                    </div>
                    <span className="card-doodle doodle-one" />
                    <span className="card-doodle doodle-two" />
                  </button>
                );
              })}
            </section>

            <section className="offline-card">
              <div className="offline-icon"><Footprints size={25} /></div>
              <div><span>离开屏幕的小任务</span><h3>和爸爸妈妈找一找：家里有什么是圆圆的？</h3></div>
              <button onClick={() => { setToast("小任务已经记下来啦"); speak("等会儿一起找找家里圆圆的东西吧"); }}>记住啦 <Check size={16} /></button>
            </section>
          </div>
        )}

        {view === "treasure" && (
          <div className="page-content treasure-page">
            <section className="treasure-hero">
              <div>
                <span className="soft-label"><Star size={15} /> 每一次认真都值得收藏</span>
                <h2>{completed.length === 0 ? "第一张贴纸在等你" : `已经收藏 ${completed.length} 张贴纸`}</h2>
                <p>这里没有输赢，只有 {childName} 认真观察、勇敢尝试的小小证据。</p>
              </div>
              <div className="treasure-pot"><Gift size={43} /><span>{completed.length}</span></div>
            </section>

            <div className="section-heading">
              <div><span>成长收藏册</span><h2>我的贴纸朋友</h2></div>
              <p>点击已经点亮的贴纸听听它说什么</p>
            </div>

            <section className="sticker-grid">
              {stickerNames.map((name, index) => {
                const unlocked = index < completed.length;
                return (
                  <button
                    className={`sticker-card sticker-${index + 1} ${unlocked ? "unlocked" : "locked"}`}
                    key={name}
                    disabled={!unlocked}
                    onClick={() => speak(`${name}说，${childName}，谢谢你发现我`)}
                  >
                    <span className="sticker-art">
                      {index === 0 && <SunMedium size={54} />}
                      {index === 1 && <Cat size={54} />}
                      {index === 2 && <Leaf size={54} />}
                      {index === 3 && <Footprints size={54} />}
                      {index === 4 && <Sparkles size={54} />}
                      {index === 5 && <Heart size={54} />}
                    </span>
                    <strong>{unlocked ? name : "等你发现"}</strong>
                    <small>{unlocked ? "点一点，听听看" : "完成活动后出现"}</small>
                  </button>
                );
              })}
            </section>
          </div>
        )}

        {view === "parent" && (
          <div className="page-content parent-page">
            <section className="parent-summary">
              <div className="summary-copy">
                <span className="parent-label"><ShieldCheck size={15} /> 家长视图</span>
                <h2>今天，{childName} 对世界<br />又多了三个小发现。</h2>
                <p>不追求多做，只记录他在哪里停留、尝试和发出笑声。</p>
              </div>
              <div className="summary-stats">
                <div><strong>{completed.length}</strong><span>完成活动</span><small>/ 3 个</small></div>
                <div><strong>{completed.length * 3}</strong><span>专注时长</span><small>分钟</small></div>
                <div><strong>颜色</strong><span>最近兴趣</span><small>本周</small></div>
              </div>
            </section>

            <section className="parent-grid">
              <article className="parent-panel observation-panel">
                <div className="panel-title"><div><span>今日观察</span><h3>值得记住的小瞬间</h3></div><BookOpen size={22} /></div>
                <div className="observation-item">
                  <span className="observation-time">08:42</span>
                  <div><strong>对暖色更敏感</strong><p>在颜色活动中，首先看向了黄色区域。</p></div>
                </div>
                <div className="observation-item muted">
                  <span className="observation-time">建议</span>
                  <div><strong>把认知带回生活</strong><p>吃水果时，可以请 {childName} 找找黄色的香蕉。</p></div>
                </div>
              </article>

              <article className="parent-panel settings-panel">
                <div className="panel-title"><div><span>专属设置</span><h3>把这里变成他的世界</h3></div><Sparkles size={22} /></div>
                <label className="field-label" htmlFor="child-name">宝宝昵称</label>
                <div className="name-field">
                  <input id="child-name" value={draftName} maxLength={8} onChange={(event) => setDraftName(event.target.value)} />
                  <button onClick={saveName}>保存</button>
                </div>
                <span className="field-label">乐园颜色</span>
                <div className="theme-options" aria-label="选择乐园颜色">
                  <button className={theme === "cream" ? "selected" : ""} onClick={() => setTheme("cream")}><i className="theme-cream" />暖阳</button>
                  <button className={theme === "ocean" ? "selected" : ""} onClick={() => setTheme("ocean")}><i className="theme-ocean" />海风</button>
                  <button className={theme === "forest" ? "selected" : ""} onClick={() => setTheme("forest")}><i className="theme-forest" />森林</button>
                </div>
              </article>

              <article className="parent-panel control-panel">
                <div className="panel-title"><div><span>体验控制</span><h3>温和地玩，按时停下来</h3></div><Clock3 size={22} /></div>
                <div className="control-row"><div><strong>每次使用时长</strong><small>到时间后自然收尾</small></div><button className="value-button">8 分钟</button></div>
                <div className="control-row"><div><strong>语音陪伴</strong><small>朗读引导和鼓励</small></div><button className={`switch ${soundOn ? "on" : ""}`} onClick={() => setSoundOn((value) => !value)} aria-label="切换语音陪伴"><span /></button></div>
                <div className="control-row"><div><strong>减少动画</strong><small>降低运动和庆祝效果</small></div><button className={`switch ${reduceMotion ? "on" : ""}`} onClick={() => setReduceMotion((value) => !value)} aria-label="切换减少动画"><span /></button></div>
              </article>

              <article className="parent-panel privacy-panel">
                <span className="privacy-shield"><ShieldCheck size={30} /></span>
                <div><span>隐私保护</span><h3>孩子的数据只属于家庭</h3><p>当前演示数据仅保存在这台设备，没有公开主页、陌生人互动或广告。</p></div>
              </article>
            </section>

            <button className="return-child" onClick={() => setView("today")}><ChevronLeft size={18} /> 返回孩子的乐园</button>
          </div>
        )}
      </section>

      <nav className="mobile-nav" aria-label="移动端主导航">
        <button className={view === "today" ? "active" : ""} onClick={() => switchChildView("today")}><Home size={21} /><span>今天</span></button>
        <button className={view === "treasure" ? "active" : ""} onClick={() => switchChildView("treasure")}><Gift size={21} /><span>宝箱</span></button>
        <button className={view === "parent" ? "active" : ""} onClick={() => switchChildView("parent")}><LockKeyhole size={20} /><span>家长</span></button>
      </nav>

      {gateOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="gate-title">
          <section className="parent-gate">
            <button className="modal-close" onClick={() => setGateOpen(false)} aria-label="关闭"><X size={21} /></button>
            <div className="gate-icon"><LockKeyhole size={27} /></div>
            <span>这是给大人的小门</span>
            <h2 id="gate-title">请家长长按进入</h2>
            <p>长按下面的按钮，直到小树长大。</p>
            <button
              className={`hold-button ${gateHolding ? "holding" : ""}`}
              onPointerDown={startHold}
              onPointerUp={stopHold}
              onPointerLeave={stopHold}
              onPointerCancel={stopHold}
            >
              <span className="hold-progress" />
              <Leaf size={22} /><b>{gateHolding ? "正在长大…" : "长按 2 秒"}</b>
            </button>
          </section>
        </div>
      )}

      {activeActivity && (
        <div className="activity-overlay" role="dialog" aria-modal="true" aria-labelledby="activity-title">
          <div className="activity-overlay-top">
            <button onClick={closeActivity}><ChevronLeft size={24} />先不玩了</button>
            <div className="activity-dots"><span className="done" /><span /><span /></div>
            <button className="sound-round" onClick={() => setSoundOn((value) => !value)} aria-label="切换声音">{soundOn ? <Volume2 size={22} /> : <VolumeX size={22} />}</button>
          </div>

          {!activityComplete && activeActivity === "colors" && (
            <section className="play-stage color-stage">
              <span className="play-kicker">看一看 · 点一点</span>
              <h2 id="activity-title">哪个是暖暖的黄色？</h2>
              <button className="prompt-audio" onClick={() => speak("把黄色的小太阳送回家吧")}><Volume2 size={19} /> 再听一次</button>
              <div className="color-options">
                <button className="color-choice red-choice" onClick={() => chooseColor("red")} aria-label="红色"><span /></button>
                <button className="color-choice yellow-choice" onClick={() => chooseColor("yellow")} aria-label="黄色"><span><SunMedium size={48} /></span></button>
                <button className="color-choice blue-choice" onClick={() => chooseColor("blue")} aria-label="蓝色"><span /></button>
              </div>
              <p className={`gentle-feedback ${feedback ? "show" : ""}`}>{feedback || "慢慢看，不着急"}</p>
            </section>
          )}

          {!activityComplete && activeActivity === "sounds" && (
            <section className="play-stage sound-stage">
              <span className="play-kicker">听一听 · 猜一猜</span>
              <h2 id="activity-title">是谁在“喵喵”叫？</h2>
              <button className="big-sound-button" onClick={() => speak("喵，喵，是谁在叫呀")}><Volume2 size={37} /><span>点我听一听</span></button>
              <div className="animal-options">
                <button onClick={() => chooseAnimal("dog")}><Dog size={54} /><span>小狗</span></button>
                <button onClick={() => chooseAnimal("cat")}><Cat size={54} /><span>小猫</span></button>
                <button onClick={() => chooseAnimal("bird")}><Bird size={54} /><span>小鸟</span></button>
              </div>
              <p className={`gentle-feedback ${feedback ? "show" : ""}`}>{feedback || "可以再听一次"}</p>
            </section>
          )}

          {!activityComplete && activeActivity === "move" && (
            <section className="play-stage move-stage">
              <span className="play-kicker">站起来 · 动一动</span>
              <h2 id="activity-title">我们一起长成高高的小树</h2>
              <div className={`tree-friend ${moveStarted ? "growing" : ""}`}>
                <span className="tree-crown"><Leaf size={68} /></span>
                <span className="tree-face"><i /><i /><b /></span>
                <span className="tree-trunk" />
                <span className="tree-arm tree-left" />
                <span className="tree-arm tree-right" />
              </div>
              {!moveStarted ? (
                <button className="primary-play" onClick={() => { setMoveStarted(true); speak("双手举高高，踮起小脚，慢慢长大"); }}><Play size={21} fill="currentColor" />我准备好啦</button>
              ) : (
                <div className="move-instruction"><p>双手举高高，踮起小脚——长大啦！</p><button className="primary-play" onClick={() => finishActivity("move")}><Check size={22} />我做到了</button></div>
              )}
            </section>
          )}

          {activityComplete && (
            <section className="completion-stage">
              <div className="celebration-rings"><span /><span /><span /></div>
              <div className="earned-sticker"><Star size={69} fill="currentColor" /></div>
              <span className="play-kicker">认真完成啦</span>
              <h2 id="activity-title">送给 {childName} 一颗暖暖星</h2>
              <p>你认真看、认真听，也勇敢试了一次。</p>
              <button className="primary-play" onClick={() => { closeActivity(); setView("treasure"); }}><Gift size={21} />收进我的宝箱</button>
              <button className="quiet-link" onClick={closeActivity}>回到今天</button>
            </section>
          )}
        </div>
      )}

      {toast && <div className="toast"><Check size={17} />{toast}</div>}
    </main>
  );
}
