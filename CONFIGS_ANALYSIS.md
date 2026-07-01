# 系统配置项前后端关联分析

> 数据来源：`prisma/seeds/configs.ts`（共 43 项）
>
> 列说明：> - **前端**：前端是否需要读取该配置来渲染 UI 或控制交互
> - **后端**：后端业务逻辑是否需要该配置
> - **后端实装**：后端代码中**是否已编写读取该配置的逻辑**（❌ 表示仅有配置项，对应模块尚未实现）

---

## 一、全部配置对比表

| # | key | 名称 | 前端 | 后端 | 后端实装 | 备注 |
|---|-----|------|:---:|:---:|:---:|:---|
| 1 | `system.name` | 系统名称 | ✅ | ✅ | ❌ | 后端未读取，邮件模板中硬编码 |
| 2 | `system.logo` | 系统 Logo | ✅ | ❌ | — | 纯前端展示 |
| 3 | `system.favicon` | 浏览器图标 | ✅ | ❌ | — | 纯前端展示 |
| 4 | `system.copyright` | 版权信息 | ✅ | ❌ | — | 纯前端展示 |
| 5 | `system.icp` | ICP 备案号 | ✅ | ❌ | — | 纯前端展示 |
| 6 | `system.timezone` | 系统时区 | ✅ | ✅ | ❌ | 后端未读取，使用系统默认时区 |
| 7 | `security.watermarkEnabled` | 全局水印 | ✅ | ✅ | ❌ | 前端有水印组件，后端审计拦截器存在但未读取该配置 |
| 8 | `security.passwordPolicy` | 密码策略 | ❌ | ✅ | ❌ | 注册/改密码时未校验复杂度，直接 bcrypt |
| 9 | `security.passwordExpiryDays` | 密码有效期(天) | ❌ | ✅ | ❌ | 登录时未检查密码是否过期 |
| 10 | `security.mustChangePassword` | 首次登录强制改密 | ❌ | ✅ | ❌ | 登录后未判断该标记 |
| 11 | `security.loginFailureLockCount` | 登录失败锁定次数 | ❌ | ✅ | ❌ | 登录失败未计数锁定 |
| 12 | `security.loginFailureLockDuration` | 账号锁定时长(分钟) | ❌ | ✅ | ❌ | 无锁定逻辑 |
| 13 | `security.sessionConcurrentLimit` | 单用户最大会话数 | ❌ | ✅ | ❌ | JWT 未做并发会话限制 |
| 14 | `user.defaultAvatar` | 默认头像地址 | ✅ | ✅ | ❌ | 创建用户时未从配置读取，前端展示默认头像 |
| 15 | `ui.defaultTheme` | 默认主题 | ✅ | ❌ | — | 纯前端，用户可覆盖 |
| 16 | `ui.defaultLanguage` | 默认语言 | ✅ | ✅ | ❌ | 后端未读取，邮件模板未国际化 |
| 17 | `ui.defaultPageSize` | 表格默认分页 | ✅ | ✅ | ❌ | 后端分页未读取该配置，使用 DTO 默认值 |
| 18 | `ui.defaultSidebarCollapsed` | 侧边栏默认折叠 | ✅ | ❌ | — | 纯前端 |
| 19 | `ui.defaultColorPrimary` | 主题主色 | ✅ | ❌ | — | 纯前端 |
| 20 | `ui.defaultEnableNotification` | 默认启用通知 | ✅ | ✅ | ✅ | 创建用户时初始化 `userSettings` 已写入 |
| 21 | `ui.grayMode` | 全站灰度模式 | ✅ | ❌ | — | 纯前端 CSS filter |
| 22 | `feature.register` | 开放注册 | ✅ | ✅ | ❌ | 注册接口存在但未读取该配置做准入控制 |
| 23 | `feature.auditLog` | 操作审计日志 | ✅ | ✅ | ❌ | 操作日志拦截器存在但未读取该配置开关 |
| 24 | `feature.emailNotification` | 邮件通知 | ✅ | ✅ | ❌ | 邮件模块未实现 |
| 25 | `feature.smsNotification` | 短信通知 | ✅ | ✅ | ❌ | 短信模块未实现 |
| 26 | `feature.mfa` | 双因子认证(MFA) | ✅ | ✅ | ❌ | MFA/TOTP 模块未实现 |
| 27 | `feature.registerDefaultRole` | 注册用户默认角色编码 | ❌ | ✅ | ❌ | 注册时未读取该配置分配角色 |
| 28 | `feature.guestAccount` | 游客演示账号 | ✅ | ❌ | — | 纯前端展示 |
| 29 | `storage.provider` | 存储驱动 | ❌ | ✅ | ❌ | 文件上传模块未实现 |
| 30 | `storage.maxFileSize` | 最大上传大小(字节) | ✅ | ✅ | ❌ | 上传模块未实现 |
| 31 | `storage.allowedTypes` | 允许上传的文件类型 | ✅ | ✅ | ❌ | 上传模块未实现 |
| 32 | `storage.baseUrl` | 文件访问基础 URL | ❌ | ✅ | ❌ | 上传模块未实现 |
| 33 | `oauth.githubEnabled` | GitHub 登录 | ✅ | ✅ | ❌ | OAuth 回调未实现 |
| 34 | `oauth.googleEnabled` | Google 登录 | ✅ | ✅ | ❌ | OAuth 回调未实现 |
| 35 | `oauth.wechatEnabled` | 微信登录 | ✅ | ✅ | ❌ | OAuth 回调未实现 |
| 36 | `mail.enabled` | 邮件功能开关 | ❌ | ✅ | ❌ | 邮件模块未实现 |
| 37 | `mail.host` | SMTP 主机 | ❌ | ✅ | ❌ | 邮件模块未实现 |
| 38 | `mail.port` | SMTP 端口 | ❌ | ✅ | ❌ | 邮件模块未实现 |
| 39 | `mail.from` | 发件人地址 | ❌ | ✅ | ❌ | 邮件模块未实现 |
| 40 | `mail.ssl` | SSL/TLS 加密 | ❌ | ✅ | ❌ | 邮件模块未实现 |
| 41 | `sms.enabled` | 短信功能开关 | ❌ | ✅ | ❌ | 短信模块未实现 |
| 42 | `sms.provider` | 短信服务商 | ❌ | ✅ | ❌ | 短信模块未实现 |
| 43 | `sms.signature` | 短信签名 | ❌ | ✅ | ❌ | 短信模块未实现 |

---

## 二、统计

| 范围 | 数量 |
|------|:---:|
| 前端需要 | 31 |
| 后端需要 | 32 |
| **后端已实装** | **1** |
| 后端未实装（预留配置） | 31 |

### 已实装的配置（仅 1 项）

| key | 实装位置 |
|-----|---------|
| `ui.defaultEnableNotification` | `users.service.ts` 创建用户时初始化 `userSettings` |

### 后端已预留但尚未实装的功能模块

| 模块 | 涉及配置数 | 状态 |
|------|:---:|:---|
| 邮件发送 (Mail) | 5 | ❌ 未实现 |
| 短信发送 (SMS) | 3 | ❌ 未实现 |
| 文件上传 (File) | 4 | ❌ 未实现 |
| OAuth 第三方登录 | 3 | ❌ 未实现 |
| MFA / TOTP | 1 | ❌ 未实现 |
| 密码策略校验 | 1 | ❌ 未实现 |
| 密码过期检查 | 1 | ❌ 未实现 |
| 登录失败锁定 | 2 | ❌ 未实现 |
| 并发会话限制 | 1 | ❌ 未实现 |
| 注册准入控制 | 1 | ❌ 未实现 |
| 审计日志开关 | 1 | ❌ 未实现 |
| 默认头像配置化 | 1 | ❌ 未实现 |
| 系统名称配置化 | 1 | ❌ 未实现 |
| 时区配置化 | 1 | ❌ 未实现 |
| 语言配置化 | 1 | ❌ 未实现 |
| 分页默认值配置化 | 1 | ❌ 未实现 |
| 水印开关配置化 | 1 | ❌ 未实现 |

---

## 三、`isPublic` 分布

| isPublic | 数量 | 说明 |
|---------|:---:|:---|
| `true` | 26 | 前端可读，其中多数后端需要但未实装读取逻辑 |
| `false` | 17 | 前端不可见，全部后端需要但未实装 |
