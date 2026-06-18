import { SetMetadata } from '@nestjs/common';

export const ALLOW_GUEST_WRITE_KEY = 'allowGuestWrite';

/**
 * 标记允许游客执行的写操作端点
 * 用于排除在 GuestWriteGuard 的拦截范围外
 */
export const AllowGuestWrite = () => SetMetadata(ALLOW_GUEST_WRITE_KEY, true);
