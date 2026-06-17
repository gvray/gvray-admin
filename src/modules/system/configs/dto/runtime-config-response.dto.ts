import { ApiProperty } from '@nestjs/swagger';

// ==================== 系统基础信息 ====================

export class RuntimeSystemDto {
  @ApiProperty({ description: '系统名称', example: 'GVRAY Admin' })
  name: string;

  @ApiProperty({ description: '系统 Logo', example: '/logo.svg' })
  logo: string;

  @ApiProperty({ description: '浏览器图标', example: '/favicon.ico' })
  favicon: string;

  @ApiProperty({ description: '系统欢迎语', example: '欢迎使用 GVRAY Admin' })
  welcomeMessage: string;

  @ApiProperty({ description: '版权信息', example: '© 2025 GVRAY Admin. All rights reserved.' })
  copyright: string;

  @ApiProperty({ description: 'ICP 备案号', example: '京ICP备XXXXXXXX号' })
  icp: string;

  @ApiProperty({ description: '默认时区', example: 'Asia/Shanghai' })
  timezone: string;
}

// ==================== 环境信息 ====================

export class RuntimeEnvDto {
  @ApiProperty({ description: '运行环境', example: 'development' })
  mode: string;

  @ApiProperty({ description: 'API 基础路径', example: '/api/v1' })
  apiPrefix: string;
}

// ==================== 界面配置 ====================

export class RuntimeUiDto {
  @ApiProperty({ description: '默认主题', example: 'light' })
  theme: string;

  @ApiProperty({ description: '默认语言', example: 'zh-CN' })
  language: string;

  @ApiProperty({ description: '表格默认分页大小', example: 10 })
  pageSize: number;

  @ApiProperty({ description: '是否显示面包屑', example: true })
  showBreadcrumb: boolean;

  @ApiProperty({ description: '侧边栏默认折叠', example: false })
  sidebarCollapsed: boolean;

  @ApiProperty({ description: '日期格式', example: 'YYYY-MM-DD' })
  dateFormat: string;

  @ApiProperty({ description: '时间格式', example: 'HH:mm:ss' })
  timeFormat: string;
}

// ==================== 安全配置 ====================

export class RuntimeSecurityDto {
  @ApiProperty({ description: '全局水印开关', example: true })
  watermarkEnabled: boolean;

  @ApiProperty({ description: '密码最小长度', example: 8 })
  passwordMinLength: number;

  @ApiProperty({ description: '密码最大长度', example: 32 })
  passwordMaxLength: number;

  @ApiProperty({ description: '密码复杂度要求', example: true })
  passwordRequireComplexity: boolean;

  @ApiProperty({ description: '密码有效期(天)，0 表示永不过期', example: 0 })
  passwordExpiryDays: number;

  @ApiProperty({ description: '首次登录强制修改密码', example: true })
  mustChangePassword: boolean;

  @ApiProperty({ description: '登录失败锁定次数', example: 5 })
  loginFailureLockCount: number;

  @ApiProperty({ description: '账号锁定时长(分钟)', example: 30 })
  loginFailureLockDuration: number;

  @ApiProperty({ description: '单用户最大会话数', example: 3 })
  sessionConcurrentLimit: number;
}

// ==================== 用户配置 ====================

export class RuntimeUserDto {
  @ApiProperty({ description: '默认角色编码', example: 'user' })
  defaultRole: string;

  @ApiProperty({ description: '默认头像地址', example: 'https://api.dicebear.com/9.x/bottts/svg?seed=GVRAY' })
  defaultAvatar: string;
}

// ==================== 功能开关 ====================

export class RuntimeFeatureDto {
  @ApiProperty({ description: '开放注册', example: true })
  register: boolean;

  @ApiProperty({ description: '操作审计日志', example: true })
  auditLog: boolean;

  @ApiProperty({ description: '邮件通知', example: true })
  emailNotification: boolean;

  @ApiProperty({ description: '短信通知', example: false })
  smsNotification: boolean;

  @ApiProperty({ description: '双因子认证(MFA)', example: false })
  mfa: boolean;
}

// ==================== 存储配置 ====================

export class RuntimeStorageDto {
  @ApiProperty({ description: '存储驱动', example: 'local' })
  provider: string;

  @ApiProperty({ description: '最大上传大小(字节)', example: 10485760 })
  maxFileSize: number;

  @ApiProperty({ description: '允许上传的文件类型', example: 'jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx' })
  allowedTypes: string;

  @ApiProperty({ description: '文件访问基础 URL', example: '' })
  baseUrl: string;
}

// ==================== 第三方登录 ====================

export class RuntimeOauthDto {
  @ApiProperty({ description: 'GitHub 登录', example: false })
  githubEnabled: boolean;

  @ApiProperty({ description: 'Google 登录', example: false })
  googleEnabled: boolean;

  @ApiProperty({ description: '微信登录', example: false })
  wechatEnabled: boolean;
}

// ==================== 邮件配置 ====================

export class RuntimeMailDto {
  @ApiProperty({ description: '邮件功能开关', example: false })
  enabled: boolean;

  @ApiProperty({ description: 'SMTP 主机', example: 'smtp.qq.com' })
  host: string;

  @ApiProperty({ description: 'SMTP 端口', example: 465 })
  port: number;

  @ApiProperty({ description: '发件人地址', example: 'noreply@gvray.com' })
  from: string;

  @ApiProperty({ description: 'SSL/TLS 加密', example: true })
  ssl: boolean;
}

// ==================== 短信配置 ====================

export class RuntimeSmsDto {
  @ApiProperty({ description: '短信功能开关', example: false })
  enabled: boolean;

  @ApiProperty({ description: '短信服务商', example: 'aliyun' })
  provider: string;

  @ApiProperty({ description: '短信签名', example: '【GVRAY】' })
  signature: string;
}

// ==================== 动态计算：系统能力 ====================

export class RuntimeCapabilitiesDto {
  @ApiProperty({ description: '已注册用户总数', example: 22 })
  totalUsers: number;

  @ApiProperty({ description: '可用角色数', example: 3 })
  totalRoles: number;

  @ApiProperty({ description: '权限总数', example: 56 })
  totalPermissions: number;
}

// ==================== 顶层响应 ====================

export class RuntimeConfigResponseDto {
  @ApiProperty({ description: '系统基础信息', type: RuntimeSystemDto })
  system: RuntimeSystemDto;

  @ApiProperty({ description: '环境信息', type: RuntimeEnvDto })
  env: RuntimeEnvDto;

  @ApiProperty({ description: '界面配置', type: RuntimeUiDto })
  ui: RuntimeUiDto;

  @ApiProperty({ description: '安全配置', type: RuntimeSecurityDto })
  security: RuntimeSecurityDto;

  @ApiProperty({ description: '用户配置', type: RuntimeUserDto })
  user: RuntimeUserDto;

  @ApiProperty({ description: '功能开关', type: RuntimeFeatureDto })
  feature: RuntimeFeatureDto;

  @ApiProperty({ description: '存储配置', type: RuntimeStorageDto })
  storage: RuntimeStorageDto;

  @ApiProperty({ description: '第三方登录', type: RuntimeOauthDto })
  oauth: RuntimeOauthDto;

  @ApiProperty({ description: '邮件配置', type: RuntimeMailDto })
  mail: RuntimeMailDto;

  @ApiProperty({ description: '短信配置', type: RuntimeSmsDto })
  sms: RuntimeSmsDto;

  @ApiProperty({ description: '系统能力（动态计算）', type: RuntimeCapabilitiesDto })
  capabilities: RuntimeCapabilitiesDto;
}
