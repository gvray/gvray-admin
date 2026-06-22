import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsIn,
} from 'class-validator';

/**
 * 用户偏好设置 Schema
 * 前端只能传这些字段，传其他字段会被拒绝
 */
export class UpdateSettingsDto {
  // ==================== 主题与外观 ====================

  @ApiPropertyOptional({
    description: '主题模式',
    enum: ['light', 'dark', 'auto'],
    example: 'light',
  })
  @IsOptional()
  @IsString()
  @IsIn(['light', 'dark', 'auto'])
  theme?: string;

  @ApiPropertyOptional({
    description: '主题主色（Hex 颜色值或颜色名称，如 #1890ff、blue）',
    example: '#1890ff',
  })
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiPropertyOptional({
    description: '色弱模式',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  colorWeak?: boolean;

  // ==================== 布局 ====================

  @ApiPropertyOptional({
    description: '固定顶栏',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  fixedHeader?: boolean;

  @ApiPropertyOptional({
    description: '显示 Logo',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  showLogo?: boolean;

  @ApiPropertyOptional({
    description: '侧边栏深色（theme 控制全局亮暗，此字段仅控制侧边栏是否深色）',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  sidebarDark?: boolean;

  @ApiPropertyOptional({
    description: '侧边栏是否折叠',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  sidebarCollapsed?: boolean;

  @ApiPropertyOptional({
    description: '侧边栏只展开一个子菜单',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  uniqueOpened?: boolean;

  @ApiPropertyOptional({
    description: '显示面包屑',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  showBreadcrumb?: boolean;

  @ApiPropertyOptional({
    description: '显示页脚',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  showFooter?: boolean;

  // ==================== 通用偏好 ====================

  @ApiPropertyOptional({
    description: '语言',
    enum: ['zh-CN', 'en-US'],
    example: 'zh-CN',
  })
  @IsOptional()
  @IsString()
  @IsIn(['zh-CN', 'en-US'])
  language?: string;

  @ApiPropertyOptional({
    description: '默认分页大小',
    example: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(100)
  pageSize?: number;

  @ApiPropertyOptional({
    description: '时区',
    example: 'Asia/Shanghai',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    description: '是否启用通知',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  enableNotification?: boolean;
}
