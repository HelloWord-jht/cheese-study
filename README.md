# 小满的小世界

![小满的小世界](public/og.png)

面向三岁孩子的家庭语文、数学、英语启蒙产品。每天提供三个 2–3 分钟的个性化任务，也可以随时进入游戏岛自由探索；用恐龙、车辆、工程机械、太空等兴趣主题带动理解、数量感和英语听辨，不做排名、不制造连续打卡压力。

## 已完成能力

- 游戏岛内置 90 个原创、人工审核的语数英活动，每科 30 个；支持学科筛选、随机惊喜和连续游玩
- 点选、点数、拖拽匹配、分类、场景放置、三步排序、规律续接、情境选择、翻牌配对 9 类玩法
- 中文覆盖听指令、表达、韵律、分类、情节预测和生活顺序；数学覆盖 1–5 数量、比较、配对、形状、空间和规律；英语覆盖主题词汇、TPR 动作、方位、故事和日常表达
- 豆豆龙 AI 自然声支持情绪、语速、停顿和角色表演指令；不可用时依次降级到设备语音和 90 条随站点发布的离线语音
- 豆豆龙陪伴角色、探险宝箱和基于真实完成记录的家长观察
- 恐龙、交通工具、工程机械、太空、动物、自然六类兴趣偏好
- DeepSeek 个性化编排：AI 从审核题库中选题，并为家长解释选题理由、总结过程观察、挑选安全的线下亲子任务
- 家长 AI 共学助手：支持 DeepSeek/GPT 切换、连续问答、快捷问题和可关闭的匿名学习上下文
- 昵称、兴趣和学习记录保存在当前浏览器；不会向 AI 发送姓名、照片或录音
- 手机、平板和桌面响应式界面，支持添加到主屏幕及基础离线访问
- 家长中心需要长按进入，支持语音和减少动画设置

## Docker Compose + Nginx 一键部署

服务器需要安装 Docker Engine、Docker Compose 插件和 Git。

```bash
git clone https://github.com/HelloWord-jht/cheese-study.git
cd cheese-study
cp .env.example .env
# 可选：先编辑 .env 填写 DeepSeek 密钥
sudo ./scripts/server-deploy.sh --domain study.example.com --install-nginx
```

脚本会构建容器、等待健康检查、安装并校验 Nginx 配置，然后安全重载 Nginx。应用端口默认只绑定到 `127.0.0.1`，不会绕过 Nginx 暴露到公网。编辑 `.env` 可以配置端口、域名和 DeepSeek：

```dotenv
SITE_URL=https://study.example.com
BIND_ADDRESS=127.0.0.1
APP_PORT=3000

# 可选；留空时自动使用本地审核题库
DEEPSEEK_API_KEY=sk-your-key
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_BASE_URL=https://api.deepseek.com

# 家长可在 DeepSeek 与 GPT 之间切换；配置 OPENAI_API_KEY 后同时启用豆豆龙 AI 自然声
AI_DEFAULT_PROVIDER=deepseek
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini
OPENAI_BASE_URL=https://api.openai.com/v1

# 可选：AI 自然声模型与音色
OPENAI_TTS_MODEL=gpt-4o-mini-tts
OPENAI_TTS_VOICE=marin
```

密钥只存在于服务器环境变量，不会进入前端构建产物。如果 `/etc/letsencrypt/live/域名/` 已有证书，脚本会自动生成 HTTPS 配置；否则先以 HTTP 启动，并给出 Certbot 命令。自定义证书可这样部署：

```bash
sudo ./scripts/server-deploy.sh \
  --domain study.example.com \
  --tls-cert /path/to/fullchain.pem \
  --tls-key /path/to/privkey.pem \
  --install-nginx
```

已有 Nginx 面板、CDN 或其他网关时，可以只启动容器：

```bash
sudo ./scripts/server-deploy.sh --skip-nginx --site-url https://study.example.com
```

要在 iPhone、iPad 或 Android 上稳定添加到主屏幕，需要通过域名和 HTTPS 访问。

### 常用维护命令

```bash
# 查看日志
docker compose logs -f web

# 拉取并部署最新版
git pull --ff-only
sudo ./scripts/server-deploy.sh --domain study.example.com --install-nginx

# 停止服务
docker compose down
```

容器带有 `/api/health` 健康检查、自动重启、非 root 用户和最小权限配置。

### 清空试玩进度

当前版本没有服务器数据库，学习进度在每台手机或平板的浏览器本地保存。进入家长中心，在“体验控制”里连续点击两次“重置”，即可清空当前设备的学习结果、每日计划和 AI 对话，同时保留昵称、兴趣、声音与动画设置。

也可以在该设备浏览器开发者控制台执行下面的一行命令：

```javascript
localStorage.removeItem("cheese-results-v2"); localStorage.removeItem("cheese-ai-chat-v1"); localStorage.removeItem("cheese-ai-provider-v1"); localStorage.removeItem("cheese-ai-context-v1"); Object.keys(localStorage).filter((key) => key.startsWith("cheese-plan-")).forEach((key) => localStorage.removeItem(key)); location.reload();
```

## AI 的工作边界

儿童侧每日任务仍由 DeepSeek 从 90 个审核活动中选择“中文 + 数学 + 英语”各一个，模型不能临时修改题目答案。家长中心另有开放式 AI 共学助手，可在 DeepSeek 与 GPT 之间切换，用于讨论教育观点、生成故事和设计家庭活动；它不增加本地内容白名单，但模型供应商自身政策仍然有效。活动语音接口只接受题库内活动 ID 和固定文案类型，不接受浏览器提交任意文本，避免公开服务被滥用。自然声由 AI 生成，并在家长中心明确标注。

只有家长打开“携带近期学习摘要”时，服务端才会发送匿名设备编号、兴趣标签、最近活动 ID、尝试次数、提示等级和完成状态。无论哪种模式都不发送孩子昵称、照片或录音。OpenAI 请求通过 Responses API 发出，并设置 `store: false`。

## 产品迭代文档

活动扩容、七类新增交互和难度路线见 [PRD v2.1](docs/PRD-v2.1-activity-expansion.md)；多模型家长助手、学习上下文和后续 AI 路线见 [AI 赋能 PRD v2.2](docs/PRD-v2.2-ai-family-copilot.md)；AI 自然声、90 个活动和游戏岛见 [PRD v2.3](docs/PRD-v2.3-voice-and-game-island.md)。

## 本地开发与验证

需要 Node.js 22.13 或更高版本。

```bash
npm ci
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。完整检查：

```bash
npm run lint
npm test
```

活动主指令已生成到 `public/audio/instructions/`。修改活动语音文案后，可在安装了 macOS `say` 和 FFmpeg 的开发机上重新生成：

```bash
npm run audio:generate -- --force
```
