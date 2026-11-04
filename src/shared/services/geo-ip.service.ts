import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@/redis/redis.service';

const LOCAL_LOCATION = '本地网络';

function isPrivateIp(ip: string): boolean {
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.') ||
    ip.startsWith('fc') ||
    ip.startsWith('fd')
  );
}

@Injectable()
export class GeoIpService {
  private readonly logger = new Logger(GeoIpService.name);
  private readonly timeoutMs: number;
  private readonly cacheTtlSeconds: number;
  private readonly cachePrefix = 'geoip';

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    this.timeoutMs = this.configService.get<number>('app.geoIpTimeoutMs', 8000);
    this.cacheTtlSeconds = this.configService.get<number>(
      'app.geoIpCacheTtlSeconds',
      604800,
    );
  }

  /**
   * 根据 IP 查询地理位置。带本地缓存与超时，失败返回 undefined 不阻塞主流程。
   */
  async getLocation(ipAddress?: string): Promise<string | undefined> {
    if (!ipAddress) return undefined;
    if (isPrivateIp(ipAddress)) return LOCAL_LOCATION;

    const cached = await this.getCache(ipAddress);
    if (cached !== null) return cached === '' ? undefined : cached;

    const location = await this.fetchLocation(ipAddress);
    await this.setCache(ipAddress, location ?? '');
    return location;
  }

  private async fetchLocation(ipAddress: string): Promise<string | undefined> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(
        `http://ip-api.com/json/${ipAddress}?lang=zh-CN`,
        { signal: controller.signal },
      );
      if (!response.ok) {
        this.logger.warn(`IP 地理位置查询失败: ${response.status}`);
        return undefined;
      }
      const data = (await response.json()) as {
        status: string;
        country?: string;
        regionName?: string;
        city?: string;
        message?: string;
      };
      if (data.status !== 'success') {
        this.logger.warn(`IP 地理位置查询失败: ${data.message}`);
        return undefined;
      }
      const parts: string[] = [];
      if (data.country) parts.push(data.country);
      if (data.regionName && data.regionName !== data.country) {
        parts.push(data.regionName);
      }
      if (data.city && data.city !== data.regionName) parts.push(data.city);
      return parts.length > 0 ? parts.join('-') : undefined;
    } catch (error) {
      this.logger.warn('获取 IP 地理位置时发生错误', error);
      return undefined;
    } finally {
      clearTimeout(timer);
    }
  }

  private async getCache(ip: string): Promise<string | null> {
    if (!this.redisService.isAvailable()) return null;
    try {
      return await this.redisService.get(`${this.cachePrefix}:${ip}`);
    } catch {
      return null;
    }
  }

  private async setCache(ip: string, value: string): Promise<void> {
    if (!this.redisService.isAvailable()) return;
    try {
      await this.redisService.set(`${this.cachePrefix}:${ip}`, value, {
        ttlSeconds: this.cacheTtlSeconds,
      });
    } catch {
      // 缓存写入失败不影响业务
    }
  }
}
