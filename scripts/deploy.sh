#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$script_dir/.."

if ! command -v docker >/dev/null 2>&1; then
  echo "未找到 Docker，请先安装 Docker Engine。"
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "未找到 Docker Compose 插件，请先安装 docker-compose-plugin。"
  exit 1
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo "已根据 .env.example 创建 .env。"
fi

docker compose up -d --build --remove-orphans

container_name=cheese-study
waited=0
health=starting
while [ "$waited" -lt 90 ]; do
  health=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_name" 2>/dev/null || echo missing)
  if [ "$health" = "healthy" ]; then
    break
  fi
  if [ "$health" = "unhealthy" ] || [ "$health" = "exited" ] || [ "$health" = "dead" ] || [ "$health" = "missing" ]; then
    echo "容器启动失败，当前状态：$health"
    docker compose logs --tail=80 web || true
    exit 1
  fi
  sleep 3
  waited=$((waited + 3))
done

if [ "$health" != "healthy" ]; then
  echo "等待健康检查超时，当前状态：$health"
  docker compose logs --tail=80 web || true
  exit 1
fi

docker compose ps

port=$(sed -n 's/^APP_PORT=//p' .env | tail -n 1)
port=${port:-3000}
echo "应用已就绪：http://127.0.0.1:${port}（仅供本机/Nginx 访问）"
