import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * 标记路由为公开访问（无需登录）
 * 用于登录、注册、刷新令牌、健康检查等匿名接口
 * JwtAuthGuard 检测到此标记会直接放行
 *
 * @example @Public()
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
