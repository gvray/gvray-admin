import { ApiProperty } from '@nestjs/swagger';

export class LoginStatsResponse {
  @ApiProperty({ description: '总登录次数', type: 'integer' })
  totalLogins: number;

  @ApiProperty({ description: '成功登录次数', type: 'integer' })
  successLogins: number;

  @ApiProperty({ description: '失败登录次数', type: 'integer' })
  failedLogins: number;

  @ApiProperty({ description: '独立账号数', type: 'integer' })
  uniqueAccounts: number;

  @ApiProperty({ description: '成功率', type: 'number' })
  successRate: number;
}
