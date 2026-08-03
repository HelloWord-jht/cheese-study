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
docker compose ps

port=$(sed -n 's/^APP_PORT=//p' .env | tail -n 1)
port=${port:-3000}
echo "部署完成：http://localhost:${port}"
