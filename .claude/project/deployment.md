# 部署摘要

详细说明见 [../../DOCKER_DEPLOYMENT.md](../../DOCKER_DEPLOYMENT.md)。

## 常用命令

```bash
pnpm build
pnpm start:prod
pnpm docker:dev:up
pnpm docker:up
pnpm docker:deploy
```

## 两套 Docker 工作流

- **开发**：`docker-compose.dev.yml`，挂载 `./src`，build 目标 `dev`，端口 `3000`。
- **测试 / 生产**：`docker-compose.yml`，pull 镜像 + `.env` 注入，端口 `3000`。

## 环境变量注意点

- `docker-compose.yml` 中 `DATABASE_URL` 由 `MYSQL_ROOT_PASSWORD` + `MYSQL_DATABASE` 自动组装，直接修改 `.env` 中的 `DATABASE_URL` 对 compose 模式不生效。
- `CORS_ORIGINS` 在生产环境（`NODE_ENV !== development`）下必须配置，否则 CORS origin 为 `undefined`。
- `JWT_ACCESS_TOKEN_EXPIRES_IN` / `JWT_REFRESH_TOKEN_EXPIRES_IN` 控制 token 过期，默认 `2h` / `7d`。
- `BCRYPT_ROUNDS`（默认 `12`）密码哈希强度；`GEOIP_TIMEOUT_MS` / `GEOIP_CACHE_TTL_SECONDS`（默认 `8000` / `604800`）控制登录地点解析的超时与本地缓存；`AUTH_CTX_CACHE_TTL`（默认 `600`）控制 `/me`、菜单树的 Redis 缓存 TTL。
- `OPLOG_MASK_FIELDS` 默认掩码字段已扩展至包含 `email,phone,mobile,idCard,idCardNo,idNumber` 等 PII，可通过环境变量覆盖。
- `docker-compose.yml` 的 app healthcheck 使用 `node -e "fetch(...)"`，不依赖 wget/curl。

## 数据库迁移策略

- `docker/entrypoint.sh` 在无迁移文件时会 fallback 到 `prisma db push --accept-data-loss`。
- 生产环境建议补齐 migration 后使用 `prisma migrate deploy`。

## 修改部署相关内容时

- 修改 `.env.example` 时，同步部署文档的环境变量说明。
- 修改 Docker Compose、Nginx、端口、健康检查或部署脚本时，同步 [../../DOCKER_DEPLOYMENT.md](../../DOCKER_DEPLOYMENT.md)。
- 修改运行时配置前，确认 `src/config/*.ts` 和环境变量读取逻辑。
