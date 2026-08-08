import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType | null = null;
  private _isAvailable = false;
  private keyPrefix = '';

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const host = this.configService.get<string>('redis.host', 'localhost');
    const port = this.configService.get<number>('redis.port', 6379);
    const password = this.configService.get<string>('redis.password');
    const db = this.configService.get<number>('redis.db', 0);
    this.keyPrefix = this.configService.get<string>('redis.keyPrefix', '');

    try {
      this.client = createClient({
        socket: {
          host,
          port,
          reconnectStrategy: (retries) => Math.min(retries * 50, 500),
        },
        password: password || undefined,
        database: db,
      });

      this.client.on('error', (err) => {
        this.logger.error('Redis client error', err.message);
        this._isAvailable = false;
      });

      this.client.on('connect', () => {
        this.logger.log('Redis connected');
        this._isAvailable = true;
      });

      this.client.on('end', () => {
        this.logger.warn('Redis connection closed');
        this._isAvailable = false;
      });

      await this.client.connect();
    } catch (error) {
      this.logger.error('Redis init failed, running in fallback mode', error);
      this._isAvailable = false;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client?.isOpen) {
      await this.client.quit();
    }
  }

  /** Redis 是否可用（用于业务层降级判断） */
  isAvailable(): boolean {
    return this._isAvailable && this.client?.isOpen === true;
  }

  /** 健康检查 */
  async ping(): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      const result = await this.client!.ping();
      return result === 'PONG';
    } catch {
      this._isAvailable = false;
      return false;
    }
  }

  // ===== String =====
  async get(key: string): Promise<string | null> {
    return this.safeRun(() => this.client!.get(this.prefixKey(key)));
  }

  async set(
    key: string,
    value: string,
    options?: { ttlSeconds?: number; nx?: boolean },
  ): Promise<string | null> {
    const setOptions: Record<string, unknown> = {};
    if (options?.ttlSeconds) setOptions.EX = options.ttlSeconds;
    if (options?.nx) setOptions.NX = true;
    return this.safeRun(() =>
      this.client!.set(
        this.prefixKey(key),
        value,
        Object.keys(setOptions).length > 0 ? setOptions : undefined,
      ),
    );
  }

  async del(...keys: string[]): Promise<number> {
    return this.safeRun(() =>
      this.client!.del(keys.map((k) => this.prefixKey(k))),
    );
  }

  async ttl(key: string): Promise<number> {
    return this.safeRun(() => this.client!.ttl(this.prefixKey(key)));
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.safeRun(() =>
      this.client!.expire(this.prefixKey(key), seconds),
    );
  }

  async exists(key: string): Promise<number> {
    return this.safeRun(() => this.client!.exists(this.prefixKey(key)));
  }

  async incr(key: string): Promise<number> {
    return this.safeRun(() => this.client!.incr(this.prefixKey(key)));
  }

  async incrBy(key: string, increment: number): Promise<number> {
    return this.safeRun(() =>
      this.client!.incrBy(this.prefixKey(key), increment),
    );
  }

  async decr(key: string): Promise<number> {
    return this.safeRun(() => this.client!.decr(this.prefixKey(key)));
  }

  async decrBy(key: string, decrement: number): Promise<number> {
    return this.safeRun(() =>
      this.client!.decrBy(this.prefixKey(key), decrement),
    );
  }

  // ===== Hash =====
  async hGet(key: string, field: string): Promise<string | null> {
    return this.safeRun(() => this.client!.hGet(this.prefixKey(key), field));
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    return this.safeRun(() => this.client!.hGetAll(this.prefixKey(key)));
  }

  async hSet(key: string, field: string, value: string): Promise<number> {
    return this.safeRun(() =>
      this.client!.hSet(this.prefixKey(key), field, value),
    );
  }

  async hDel(key: string, ...fields: string[]): Promise<number> {
    return this.safeRun(() => this.client!.hDel(this.prefixKey(key), fields));
  }

  // ===== Set =====
  async sAdd(key: string, ...members: string[]): Promise<number> {
    return this.safeRun(() => this.client!.sAdd(this.prefixKey(key), members));
  }

  async sRem(key: string, ...members: string[]): Promise<number> {
    return this.safeRun(() => this.client!.sRem(this.prefixKey(key), members));
  }

  async sMembers(key: string): Promise<string[]> {
    return this.safeRun(() => this.client!.sMembers(this.prefixKey(key)));
  }

  // ===== Sorted Set =====
  async zAdd(key: string, score: number, member: string): Promise<number> {
    return this.safeRun(() =>
      this.client!.zAdd(this.prefixKey(key), { score, value: member }),
    );
  }

  async zRange(key: string, start: number, stop: number): Promise<string[]> {
    return this.safeRun(() =>
      this.client!.zRange(this.prefixKey(key), start, stop),
    );
  }

  // ===== mGet（批量获取） =====
  async mGet(keys: string[]): Promise<(string | null)[]> {
    return this.safeRun(() =>
      this.client!.mGet(keys.map((k) => this.prefixKey(k))),
    );
  }

  // ===== eval（Lua 脚本） =====
  async eval(
    script: string,
    options: { keys: string[]; arguments: string[] },
  ): Promise<unknown> {
    return this.safeRun(() =>
      this.client!.eval(script, {
        keys: options.keys.map((k) => this.prefixKey(k)),
        arguments: options.arguments,
      } as { keys: string[]; arguments: string[] }),
    );
  }

  // ===== Scan（用于 pattern 删除等） =====
  async *scanIterator(match: string, count = 100): AsyncGenerator<string[]> {
    if (!this.isAvailable()) return;
    for await (const keys of this.client!.scanIterator({
      MATCH: this.prefixKey(match),
      COUNT: count,
    })) {
      yield keys.map((k) => this.stripPrefix(k));
    }
  }

  // ===== 监控相关 =====
  async dbSize(): Promise<number> {
    return this.safeRun(() => this.client!.dbSize());
  }

  async info(section?: string): Promise<string> {
    return this.safeRun(() =>
      this.client!.info(section as 'memory' | undefined),
    );
  }

  async type(key: string): Promise<string> {
    return this.safeRun(() => this.client!.type(this.prefixKey(key)));
  }

  /** 安全执行：Redis 不可用时抛出 RedisUnavailableError，业务层 catch 后降级 */
  private async safeRun<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.isAvailable()) {
      throw new RedisUnavailableError('Redis is not available');
    }
    try {
      return await fn();
    } catch (error) {
      this._isAvailable = false;
      throw error;
    }
  }

  /** 给 key 加前缀 */
  private prefixKey(key: string): string {
    if (!this.keyPrefix) return key;
    return `${this.keyPrefix}:${key}`;
  }

  /** 去掉 key 前缀（用于 scan 返回） */
  private stripPrefix(key: string): string {
    if (!this.keyPrefix) return key;
    const prefix = `${this.keyPrefix}:`;
    return key.startsWith(prefix) ? key.slice(prefix.length) : key;
  }
}

/** Redis 不可用时的专用错误类型 */
export class RedisUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RedisUnavailableError';
  }
}
