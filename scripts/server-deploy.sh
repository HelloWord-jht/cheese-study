#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
project_dir=$(CDPATH= cd -- "$script_dir/.." && pwd)
cd "$project_dir"

domain=""
app_port="3000"
site_url=""
install_nginx=0
skip_nginx=0
tls_cert=""
tls_key=""
nginx_conf_path=""

usage() {
  cat <<'EOF'
用法：
  sudo ./scripts/server-deploy.sh --domain study.example.com --install-nginx

选项：
  --domain DOMAIN          对外访问域名
  --port PORT              宿主机回环端口，默认 3000
  --site-url URL           覆盖对外地址（适合已有网关/CDN）
  --install-nginx          安装、校验并重载 Nginx 配置
  --skip-nginx             只部署 Docker，不生成 Nginx 配置
  --tls-cert PATH          自定义 TLS 证书路径，须和 --tls-key 一起使用
  --tls-key PATH           自定义 TLS 私钥路径
  --nginx-conf PATH        Nginx 目标配置，默认 /etc/nginx/conf.d/cheese-study.conf
  -h, --help               显示帮助

DeepSeek 密钥请预先写入项目根目录 .env；脚本不会打印密钥。
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --domain)
      [ "$#" -ge 2 ] || { echo "--domain 缺少参数"; exit 2; }
      domain=$2
      shift 2
      ;;
    --port)
      [ "$#" -ge 2 ] || { echo "--port 缺少参数"; exit 2; }
      app_port=$2
      shift 2
      ;;
    --site-url)
      [ "$#" -ge 2 ] || { echo "--site-url 缺少参数"; exit 2; }
      site_url=$2
      shift 2
      ;;
    --install-nginx)
      install_nginx=1
      shift
      ;;
    --skip-nginx)
      skip_nginx=1
      shift
      ;;
    --tls-cert)
      [ "$#" -ge 2 ] || { echo "--tls-cert 缺少参数"; exit 2; }
      tls_cert=$2
      shift 2
      ;;
    --tls-key)
      [ "$#" -ge 2 ] || { echo "--tls-key 缺少参数"; exit 2; }
      tls_key=$2
      shift 2
      ;;
    --nginx-conf)
      [ "$#" -ge 2 ] || { echo "--nginx-conf 缺少参数"; exit 2; }
      nginx_conf_path=$2
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "未知参数：$1"
      usage
      exit 2
      ;;
  esac
done

case "$app_port" in
  ''|*[!0-9]*) echo "端口必须是 1–65535 的数字"; exit 2 ;;
esac
if [ "$app_port" -lt 1 ] || [ "$app_port" -gt 65535 ]; then
  echo "端口必须是 1–65535 的数字"
  exit 2
fi

if [ "$skip_nginx" -eq 0 ]; then
  if [ -z "$domain" ]; then
    echo "生成 Nginx 配置需要 --domain；若已有反向代理，请使用 --skip-nginx。"
    exit 2
  fi
  case "$domain" in
    *[!A-Za-z0-9.-]*|.*|*.) echo "域名格式不正确：$domain"; exit 2 ;;
  esac
fi

if { [ -n "$tls_cert" ] && [ -z "$tls_key" ]; } || { [ -z "$tls_cert" ] && [ -n "$tls_key" ]; }; then
  echo "--tls-cert 与 --tls-key 必须同时提供"
  exit 2
fi

if [ ! -f .env ]; then
  cp .env.example .env
  chmod 600 .env
  echo "已创建 .env；DeepSeek 密钥留空时会使用内置审核题库。"
fi

upsert_env() {
  env_key=$1
  env_value=$2
  env_temp=$(mktemp "${TMPDIR:-/tmp}/cheese-study-env.XXXXXX")
  awk -v wanted="$env_key" -v replacement="$env_key=$env_value" '
    BEGIN { replaced = 0 }
    index($0, wanted "=") == 1 {
      if (!replaced) print replacement
      replaced = 1
      next
    }
    { print }
    END { if (!replaced) print replacement }
  ' .env > "$env_temp"
  mv "$env_temp" .env
  chmod 600 .env
}

if [ -z "$tls_cert" ] && [ -n "$domain" ]; then
  auto_cert="/etc/letsencrypt/live/$domain/fullchain.pem"
  auto_key="/etc/letsencrypt/live/$domain/privkey.pem"
  if [ -f "$auto_cert" ] && [ -f "$auto_key" ]; then
    tls_cert=$auto_cert
    tls_key=$auto_key
  fi
fi

if [ -z "$site_url" ]; then
  if [ -n "$domain" ]; then
    if [ -n "$tls_cert" ]; then
      site_url="https://$domain"
    else
      site_url="http://$domain"
    fi
  else
    site_url="http://127.0.0.1:$app_port"
  fi
fi

upsert_env BIND_ADDRESS 127.0.0.1
upsert_env APP_PORT "$app_port"
upsert_env SITE_URL "$site_url"

echo "[1/3] 构建并启动应用"
./scripts/deploy.sh

if [ "$skip_nginx" -eq 1 ]; then
  echo "部署完成：$site_url"
  exit 0
fi

rendered_conf=$(mktemp "${TMPDIR:-/tmp}/cheese-study-nginx.XXXXXX")
cleanup() { rm -f "$rendered_conf"; }
trap cleanup EXIT HUP INT TERM

if [ -n "$tls_cert" ]; then
  template="deploy/nginx/cheese-study.https.conf.template"
  sed \
    -e "s|__DOMAIN__|$domain|g" \
    -e "s|__APP_PORT__|$app_port|g" \
    -e "s|__TLS_CERT__|$tls_cert|g" \
    -e "s|__TLS_KEY__|$tls_key|g" \
    "$template" > "$rendered_conf"
  echo "[2/3] 已生成 HTTPS Nginx 配置"
else
  template="deploy/nginx/cheese-study.http.conf.template"
  sed \
    -e "s|__DOMAIN__|$domain|g" \
    -e "s|__APP_PORT__|$app_port|g" \
    "$template" > "$rendered_conf"
  echo "[2/3] 未检测到证书，先生成 HTTP Nginx 配置"
fi

if [ "$install_nginx" -eq 0 ]; then
  preview_path="$project_dir/deploy/nginx/cheese-study.generated.conf"
  cp "$rendered_conf" "$preview_path"
  echo "配置预览已写入：$preview_path"
  echo "应用已启动；确认后使用 --install-nginx 安装配置。"
  exit 0
fi

if ! command -v nginx >/dev/null 2>&1; then
  echo "未找到 nginx 命令，请先安装 Nginx，或去掉 --install-nginx 只生成配置。"
  exit 1
fi

if [ -z "$nginx_conf_path" ]; then
  nginx_conf_path="${NGINX_CONF_DIR:-/etc/nginx/conf.d}/cheese-study.conf"
fi
nginx_conf_dir=$(dirname -- "$nginx_conf_path")
if [ ! -d "$nginx_conf_dir" ]; then
  echo "Nginx 配置目录不存在：$nginx_conf_dir"
  exit 1
fi

backup_path=""
if [ -f "$nginx_conf_path" ]; then
  backup_path="$nginx_conf_path.backup.$(date +%Y%m%d%H%M%S)"
  cp "$nginx_conf_path" "$backup_path"
fi
install -m 0644 "$rendered_conf" "$nginx_conf_path"

if ! nginx -t; then
  echo "Nginx 配置校验失败，正在恢复原配置。"
  if [ -n "$backup_path" ]; then
    cp "$backup_path" "$nginx_conf_path"
  else
    rm -f "$nginx_conf_path"
  fi
  nginx -t || true
  exit 1
fi

echo "[3/3] 重载 Nginx"
if command -v systemctl >/dev/null 2>&1 && systemctl is-active --quiet nginx; then
  systemctl reload nginx
elif command -v service >/dev/null 2>&1; then
  service nginx reload
else
  nginx -s reload
fi

echo "部署完成：$site_url"
if [ -z "$tls_cert" ]; then
  echo "建议下一步配置 HTTPS，例如：certbot --nginx -d $domain"
fi
