# 小满的小世界

![小满的小世界](public/og.png)

面向 2–3 岁儿童的专属亲子早教网站。孩子端每天只呈现三个轻量活动，家长端负责内容控制、使用时长和成长观察。

## 功能

- 三个可互动的每日活动：颜色认知、听觉表达和身体探索
- 温和反馈机制，没有扣分、排行榜和连续打卡压力
- 贴纸宝箱与活动完成记录
- 家长长按验证入口
- 可修改宝宝昵称、视觉主题、语音和动画设置
- 设置和进度仅保存在浏览器本机
- 桌面、平板和手机响应式布局

## Docker Compose 一键部署

服务器只需安装 Docker Engine 和 Docker Compose 插件。

```bash
git clone https://github.com/HelloWord-jht/cheese-study.git
cd cheese-study
cp .env.example .env
./scripts/deploy.sh
```

默认访问地址为 `http://服务器IP:3000`。

如需修改端口或配置正式域名，编辑 `.env`：

```dotenv
SITE_URL=https://study.example.com
APP_PORT=3000
```

修改 `SITE_URL` 后需要重新构建镜像：

```bash
docker compose up -d --build
```

### 常用维护命令

```bash
# 查看状态
docker compose ps

# 查看日志
docker compose logs -f web

# 更新到最新版本
git pull --ff-only
./scripts/deploy.sh

# 停止服务
docker compose down
```

容器内置健康检查、自动重启、非 root 用户运行和最小权限配置。儿童档案保存在访问者浏览器的 `localStorage`，服务器不存储儿童数据。

## 本地开发

需要 Node.js 22.13 或更高版本。

```bash
npm ci
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

正式构建：

```bash
npm run build
```
