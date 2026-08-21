# 小满的小世界

![小满的小世界](public/og.png)

面向三岁孩子的家庭语文、数学、英语启蒙产品。每天只提供三个 2–3 分钟的小任务，用恐龙、车辆、工程机械、太空等兴趣主题带动理解、数量感和英语听辨；不做排名、不制造连续打卡压力。

## 已完成能力

- 每天中文、数学、英语各一个互动任务，内置 45 个经人工编写的活动
- 点选、点数、拖拽匹配、分类、场景放置、三步排序、规律续接、情境选择 8 类玩法
- 听辨、指认、1–3 数量感、形状、长短、颜色分类和简单规律
- 45 条随站点发布的中英文活动语音，设备语音作为动态提示兜底；答错后先给温和提示，第二次再高亮答案
- 豆豆龙陪伴角色、探险宝箱和基于真实完成记录的家长观察
- 恐龙、交通工具、工程机械、太空、动物、自然六类兴趣偏好
- DeepSeek 个性化编排：AI 从审核题库中选题，并为家长解释选题理由、总结过程观察、挑选安全的线下亲子任务
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

## DeepSeek 的工作边界

服务端只把匿名设备编号、兴趣标签、最近活动 ID、尝试次数、提示等级和完成状态发给 DeepSeek。模型负责从 45 个审核活动中选择“中文 + 数学 + 英语”各一个，并为家长解释选题原因和过程观察；儿童可见的线下任务仍只能从安全白名单中选择。模型超时、输出不合规、达到当日请求上限或未配置密钥时，产品会无感回退到本地编排。

## 产品迭代文档

活动扩容、七类新增交互、难度分层和后续版本路线见 [PRD v2.1](docs/PRD-v2.1-activity-expansion.md)。

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
