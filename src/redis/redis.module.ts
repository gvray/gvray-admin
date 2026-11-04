import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { CacheService } from './cache.service';
import { RateLimiterService } from './rate-limiter.service';
import { CacheableExplorer } from './cacheable.explorer';
import { PermissionCacheService } from './permission-cache.service';
import { LockService } from './lock.service';

@Global()
@Module({
  providers: [
    RedisService,
    CacheService,
    RateLimiterService,
    CacheableExplorer,
    PermissionCacheService,
    LockService,
  ],
  exports: [
    RedisService,
    CacheService,
    RateLimiterService,
    PermissionCacheService,
    LockService,
  ],
})
export class RedisModule {}
