# 小满的小世界

![小满的小世界](public/og.png)

面向三岁孩子的家庭语文、数学、英语启蒙产品。每天只提供三个 2–3 分钟的小任务，用恐龙、车辆、工程机械、太空等兴趣主题带动理解、数量感和英语听辨；不做排名、不制造连续打卡压力。

## 已完成能力

- 每天中文、数学、英语各一个互动任务，内置 18 个经人工编写的活动
- 听辨、指认、1–3 数量感、形状、长短、颜色分类和简单规律
- 中文与英文浏览器语音，答错后先给温和提示，第二次再高亮答案
- 豆豆龙陪伴角色、探险宝箱和基于真实完成记录的家长观察
- 恐龙、交通工具、工程机械、太空、动物、自然六类兴趣偏好
- DeepSeek 可选编排：AI 只能从审核题库中选题，不能直接生成儿童题目
- 昵称、兴趣和学习记录保存在当前浏览器；不会向 AI 发送姓名、照片或录音
- 手机、平板和桌面响应式界面，支持添加到主屏幕及基础离线访问
- 家长中心需要长按进入，支持语音和减少动画设置

## Docker Compose 一键部署

服务器需要安装 Docker Engine、Docker Compose 插件和 Git。

```bash
git clone https://github.com/HelloWord-jht/cheese-study.git
cd cheese-study
cp .env.example .env
./scripts/deploy.sh
```

默认访问地址是 `http://服务器IP:3000`。编辑 `.env` 可以配置端口、域名和 DeepSeek：

```dotenv
SITE_URL=https://study.example.com
APP_PORT=3000

# 可选；留空时自动使用本地审核题库
DEEPSEEK_API_KEY=sk-your-key
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

密钥只存在于服务器环境变量，不会进入前端构建产物。修改配置后重新构建并启动：

```bash
docker compose up -d --build
docker compose ps
```

要在 iPhone、iPad 或 Android 上添加到主屏幕，需要为域名配置 HTTPS。可以在当前容器前使用 Caddy、Nginx 或 Cloudflare Tunnel 做 HTTPS 反向代理。

### 常用维护命令

```bash
# 查看日志
docker compose logs -f web

# 拉取并部署最新版
git pull --ff-only
./scripts/deploy.sh

# 停止服务
docker compose down
```

容器带有 `/api/health` 健康检查、自动重启、非 root 用户和最小权限配置。

## DeepSeek 的工作边界

服务端只把匿名设备编号、兴趣标签、最近活动 ID、尝试次数和完成状态发给 DeepSeek。模型只负责从 18 个审核活动中选择“中文 + 数学 + 英语”各一个，并给家长写一条简短的线下建议。模型超时、输出不合规、达到当日请求上限或未配置密钥时，产品会无感回退到本地编排。

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
