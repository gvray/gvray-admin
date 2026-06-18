import { SetMetadata } from '@nestjs/common';

export const FEATURE_FLAG_KEY = 'featureFlag';

export interface FeatureFlagOptions {
  key: string;
  message?: string;
}

/**
 * 功能开关装饰器
 * 用于标记需要检查运行时功能开关的接口
 *
 * @example
 * @FeatureFlag('register', '注册功能已关闭')
 * @Post('register')
 * async register(...) {}
 */
export const FeatureFlag = (
  key: string,
  message?: string,
): MethodDecorator & ClassDecorator =>
  SetMetadata(FEATURE_FLAG_KEY, { key, message } as FeatureFlagOptions);
