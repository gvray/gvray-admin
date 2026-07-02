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

## 修改部署相关内容时

- 修改 `.env.example` 时，同步部署文档的环境变量说明。
- 修改 Docker Compose、Nginx、端口、健康检查或部署脚本时，同步 [../../DOCKER_DEPLOYMENT.md](../../DOCKER_DEPLOYMENT.md)。
- 修改运行时配置前，确认 `src/config/configuration.ts` 和环境变量读取逻辑。