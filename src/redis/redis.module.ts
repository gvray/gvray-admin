import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { CacheService } from './cache.service';
import { LockService } from './lock.service';
import { RateLimiterService } from './rate-limiter.service';
import { CacheableExplorer } from './cacheable.explorer';
import { PermissionCacheService } from './permission-cache.service';

@Global()
@Module({
  providers: [
    RedisService,
    CacheService,
    LockService,
    RateLimiterService,
    CacheableExplorer,
    PermissionCacheService,
  ],
  exports: [
    RedisService,
    CacheService,
    LockService,
    RateLimiterService,
    PermissionCacheService,
  ],
})
export class RedisModule {}
