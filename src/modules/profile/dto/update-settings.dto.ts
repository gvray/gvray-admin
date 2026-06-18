import { ApiProperty } from '@nestjs/swagger';

export class UpdateSettingsDto {
  @ApiProperty({
    description: '用户偏好设置',
    type: 'object',
    additionalProperties: true,
    example: { theme: 'light', language: 'zh-CN', sidebarCollapsed: false },
  })
  settings: Record<string, unknown>;
}
