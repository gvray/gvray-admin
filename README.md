# GVRAY Admin

[简体中文](README.zh-CN.md) | **English**

🚀 An enterprise-grade admin backend scaffold built on **NestJS 11**, **TypeScript**, **Prisma**, **MySQL**, and **Redis**, with built-in **RBAC permissions**, **JWT authentication**, **Swagger/OpenAPI**, **Docker deployment**, and **AI-assisted development** support — ready to use as a **Starter Template** for enterprise backend projects.


<p align="center">
  <img src="./docs/screenshots/20260808/light.webp" width="49%" alt="Light Theme" />
  
  <img src="./docs/screenshots/20260808/dark.webp" width="49%" alt="Dark Theme" />
</p>

## ✨ Highlights

- 🔐 **RBAC Permission System** — dynamic permission scanning, menu permissions, API permissions, and permission caching out of the box
- 🛡️ **JWT Dual-Token Auth** — Access Token / Refresh Token, Passport, bcrypt password hashing
- ⚡ **Deep Redis Integration** — session management, online users, rate limiting, distributed locks, Pub/Sub, declarative caching
- 🏗️ **NestJS 11 + TypeScript** — modular architecture, dependency injection, strict type checking
- 📝 **Prisma 6 ORM** — type-safe queries, full support for migrations / seeds / transactions
- 📄 **Swagger / OpenAPI** — auto-generated docs, online debugging with Bearer Token
- 🏢 **Organization Structure** — complete system for users / roles / departments / positions
- 🔑 **Multi-Method Login** — username, email, phone number, User ID
- 🛡️ **Security Hardening** — CORS, unified exception handling, parameter validation, log redaction, password hashing
- 🐳 **Docker First** — dev / test / production configurations with rolling updates
- 🤖 **AI Ready** — built-in `CLAUDE.md` and modular knowledge base, works directly with Claude Code / Cursor / Copilot
- 🎯 **Standardized Engineering** — ESLint, Prettier, unified response format, complete seed data

## 🛠️ Tech Stack

NestJS 11 · Prisma 6 · TypeScript 5 · MySQL 8 · Redis 6 · Swagger · Docker

## 🚀 Quick Start

### Requirements

- Node.js >= 20
- pnpm >= 9 (built into Corepack, run `corepack enable`)
- MySQL >= 8.0
- Redis >= 6.0
- Docker (optional)

```bash
git clone https://github.com/gvray/gvray-admin.git && cd gvray-admin

pnpm install
cp .env.example .env

# Option 1: Start MySQL + Redis via Docker
docker compose -f docker-compose.dev.yml up -d mysql redis

# Option 2: Use an existing local MySQL + Redis, configure .env and skip the previous step

pnpm prisma migrate dev
pnpm prisma db seed
pnpm start:dev
```

- App: `http://localhost:3000`
- Swagger: `http://localhost:3000/api` (click Authorize and enter `Bearer <accessToken>`)

## 👤 Default Accounts

> ⚠️ For local development only — do not use in production.

| Role             | Username       | Email                | Password |
| :--------------- | :------------- | :------------------- | :------- |
| Super Admin      | `super_admin`  | `super@example.com`  | `123456` |
| Admin            | `admin`        | `admin@example.com`   | `123456` |
| Guest            | `guest`        | `guest@example.com`   | `123456` |

## 📁 Project Structure

```
src/
├── core/       # Infrastructure (decorators / guards / interceptors / filters / pipes)
├── modules/    # Business modules (auth / system / dashboard / profile)
├── prisma/     # Prisma Module / PrismaService
├── redis/      # Redis infrastructure (cache / rate limiting / distributed locks)
├── shared/     # Shared layer (constants / DTOs / utils / BaseService)
└── main.ts

prisma/         # Schema + migrations + seed
docs/           # Project documentation
docker/         # Docker deployment config
.claude/        # AI knowledge base
```

> 📖 [Full project structure →](docs/project-structure.md)

## ❓ Why GVRAY Admin

Typical NestJS starters only give you a skeleton — the parts an enterprise project actually needs, you still have to build yourself.

|                                  | Typical Starter | **GVRAY Admin** |
|:---------------------------------|:---:|:---:|
| RBAC permissions + dynamic scanning | ✗ | ✅ |
| JWT dual-token + refresh           | ✗ | ✅ |
| Redis rate limiting / distributed locks | ✗ | ✅ |
| Full org structure (departments/positions) | ✗ | ✅ |
| Swagger auto-docs                 | Basic | ✅ with online debugging |
| Docker three-environment setup    | ✗ | ✅ |
| AI assistant context              | ✗ | ✅ |
| Standardized structure + seed data | ✗ | ✅ |

## 🗺️ Roadmap

- [x] JWT dual-token authentication
- [x] RBAC permission system + dynamic scanning
- [x] Prisma ORM + complete seed
- [x] Deep Redis integration
- [x] Swagger / OpenAPI
- [x] Docker three-environment deployment
- [x] User / role / department / position management
- [x] Menu management
- [x] System configuration items
- [x] Dictionary management
- [x] Announcements & notifications
- [x] Operation logs / login logs
- [x] Online users
- [x] System monitoring (server / cache)
- [ ] WebSocket real-time notifications
- [ ] Scheduled tasks
- [ ] File storage
- [ ] Multi-tenancy
- [ ] OpenTelemetry
- [ ] Kubernetes deployment

## 🤖 AI Programming Support

- [`CLAUDE.md`](./CLAUDE.md) — Claude Code auto-loaded entry point
- [`.claude/project/`](./.claude/project/) — on-demand knowledge base (architecture / DTO / permissions / response format)

> 📖 [AI Development Guide →](docs/ai-development.md)

## 📚 Documentation

| Document | Description |
|:---|:---|
| [📖 Feature List](docs/features.md) | Complete feature modules and progress |
| [🐳 Docker Deployment Guide](docs/deployment.md) | Dev / test / production deployment, rolling updates |
| [📋 Unified Response Format](docs/response-format.md) | API response specification |
| [⚙️ System Configuration](docs/configs.md) | Frontend/backend config mapping |
| [🏗️ Project Structure Details](docs/project-structure.md) | Directory structure and module descriptions |
| [🧪 API Testing Guide](docs/api-testing.md) | Swagger debugging and auth flow |

## 🌐 Companion Frontend

- [gvray-react](https://github.com/gvray/gvray-react) — React + Umi
- **gvray-vue** (in development) — Vue 3 + Vite + Pinia + Element Plus
- **gvray-vite** (in development) — React + Vite
- **gvray-next** (planning) — Next.js

## 🤝 Contributing

Issues, PRs, and feature suggestions are all welcome. If this project helps you, a **⭐ Star** is the best support!

This project is open-sourced under the [MIT License](LICENSE).
