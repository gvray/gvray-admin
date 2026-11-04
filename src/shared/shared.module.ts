import { Global, Module } from '@nestjs/common';
import { PasswordService } from './services/password.service';
import { GeoIpService } from './services/geo-ip.service';
import { AuthCacheService } from './services/auth-cache.service';

@Global()
@Module({
  providers: [PasswordService, GeoIpService, AuthCacheService],
  exports: [PasswordService, GeoIpService, AuthCacheService],
})
export class SharedModule {}
