---
name: deploying-production
description: Use when releasing, deploying, updating, or rolling back the production server (aidraw365.com / 上线 / 部署 / 发布新版本 / 回滚). Also use when a deploy goes wrong — image won't switch, migration errors, or the site is down after an update.
---

# 生产发布：aidraw365.com

按 [docs/运维.md](../../../docs/运维.md) 的「生产发布」一节执行，本 skill 是其操作摘要。**逐步执行，每步向用户展示输出并确认成功后再进行下一步。**

## 环境速查

| 项 | 值 |
|----|----|
| 主机 | 海外 VPS（4C/4G + 7G swap）。SSH IP/端口/用户不入库：让用户提供，或查本地部署记忆 |
| 部署目录 | `/data/new-api`（compose），代码 `/data/new-api/data/nexora` |
| 镜像命名 | `nexora-new-api:<git短commit>` |
| 入口 | Cloudflare → Caddy → `127.0.0.1:3000` |
| 代码来源 | 只拉 `origin`（First-Lucky-Dog/nexora），勿拉 `upstream` |

## 发布步骤

1. **本地**：合并到 `main` → 更新 `VERSION`（semver：同步上游/新功能升 minor，纯修复升 patch）→ commit → `git push origin main`。**禁止打 tag**（触发上游遗留 CI 外推镜像）。镜像 tag = `git rev-parse --short HEAD`。
2. **备份**（服务器，缺一不可）：目录 `/data/new-api/backups/release-before-update-$(date +%Y%m%d-%H%M%S)/`，内放 `.env.bak`、`docker-compose.yml.bak`、`Caddyfile.bak`（源：`/etc/caddy/Caddyfile`，需 sudo）、`current-image.txt`（旧 NEW_API_IMAGE 行）、`postgres-full.sql.gz`。完整可粘贴命令块见 docs/运维.md「发布步骤」。pg_dump 读 .env 变量必须用子 shell：`(set -a; . .env; set +a; docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB") | gzip`。用 `ls -lah` 核对（`.env.bak` 是隐藏文件），dump 大小须正常非零。
3. **构建**：`cd /data/new-api/data/nexora && git pull --ff-only origin main`，核对 `git log -1`；`docker build -t nexora-new-api:<新短commit> .`（5–15 分钟，靠 swap 属正常）。
4. **切换**：`sed -i 's|^NEW_API_IMAGE=.*|NEW_API_IMAGE=nexora-new-api:<新短commit>|' /data/new-api/.env` → `docker compose up -d --force-recreate new-api`。
5. **验证**：`docker compose ps new-api`（新 tag + healthy）→ `docker compose logs new-api | grep -icE 'error|fatal|panic'`（关注计数应为 0；计数为 0 时 grep 退出码非零属正常，勿误判为命令失败；有命中先人工看具体行再判定）→ `curl -s 127.0.0.1:3000/api/status | grep -o '"version":"[^"]*"'`（新版本号）→ 核对 `.env` 中 `SERVER_ADDRESS` 与 `FRONTEND_BASE_URL` 仍一致（成本极低，每次都查）→ 浏览器验收：首页品牌、登录、管理后台各页、渠道页、测试对话计费。
6. **收尾**：在 docs/运维.md 的发布记录表追加一行。

## 回滚

改回 `current-image.txt` 里的旧 tag → `docker compose up -d --force-recreate new-api`。数据库损坏才需要恢复 dump：`gunzip -c postgres-full.sql.gz | docker compose exec -T postgres psql -U <POSTGRES_USER> <POSTGRES_DB>`（两值取自 `.env`，同样用子 shell 读取）。

## 已踩过的坑（违反必出事故）

| 坑 | 后果与对策 |
|----|----|
| 在操作 compose 的 shell 里 `set -a; . .env` | shell env 优先级高于 .env 文件 → 改 .env 切不动镜像。读变量用子 shell；已污染则 `unset NEW_API_IMAGE` 或换会话 |
| 打 git tag | 触发上游 CI 往外部 DockerHub 推镜像 |
| `SERVER_ADDRESS` ≠ `FRONTEND_BASE_URL` | 注册验证 / 登录跳转 / 钱包页异常 |
| 用 `ls -lh` 确认备份 | 看不到点开头的 `.env.bak`，误以为漏备份或误判完整 |
| 迁移未看日志就验收 | 版本升级常带 AutoMigrate 新表，必须确认日志无 error/fatal |
