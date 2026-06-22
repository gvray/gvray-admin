import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigsService } from '@/modules/system/configs/configs.service';
import {
  FEATURE_FLAG_KEY,
  FeatureFlagOptions,
} from '../decorators/feature-flag.decorator';

/**
 * 功能开关守卫
 * 根据运行时配置的功能开关决定是否放行请求
 *
 * 使用方式：在 Controller 方法上添加 @FeatureFlag('featureKey', '提示信息')
 * 未添加装饰器的路由直接放行，不查配置库
 */
@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private configsService: ConfigsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const flag = this.reflector.getAllAndOverride<FeatureFlagOptions>(
      FEATURE_FLAG_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 没有标记功能开关装饰器，直接放行
    if (!flag) {
      return true;
    }

    const enabled = await this.configsService.isFeatureEnabled(flag.key);

    if (!enabled) {
      throw new ForbiddenException(flag.message || '该功能已关闭');
    }

    return true;
  }
}
