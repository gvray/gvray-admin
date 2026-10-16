import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  APP_INTERCEPTOR,
  APP_FILTER,
  APP_GUARD,
  Reflector,
  DiscoveryModule,
} from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '@/modules/auth/auth.module';
import { SystemModule } from '@/modules/system/system.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { DashboardModule } from '@/modules/dashboard/dashboard.module';
import { ProfileModule } from '@/modules/profile/profile.module';
import { OperationLogsModule } from '@/modules/system/operation-logs/operation-logs.module';
import appConfig from '@/config/app.config';
import databaseConfig from '@/config/database.config';
import jwtConfig from '@/config/jwt.config';
import corsConfig from '@/config/cors.config';
import redisConfig from '@/config/redis.config';
import { validate } from '@/config/env.validation';
import { RedisModule } from '@/redis/redis.module';
import { ResponseInterceptor } from '@/core/interceptors/response.interceptor';
import { HttpExceptionFilter } from '@/core/filters/http-exception.filter';
import { OperationLogInterceptor } from '@/core/interceptors/operation-log.interceptor';
// import { SessionHeartbeatInterceptor } from '@/core/interceptors/session-heartbeat.interceptor';
import { FeatureFlagGuard } from '@/core/guards/feature-flag.guard';
import { JwtAuthGuard } from '@/core/guards/jwt-auth.guard';
import { GuestWriteGuard } from '@/core/guards/guest-write.guard';
import { RolesGuard } from '@/core/guards/roles.guard';
import { PermissionsGuard } from '@/core/guards/permissions.guard';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
      load: [appConfig, databaseConfig, jwtConfig, corsConfig, redisConfig],
      validate,
      expandVariables: true,
      cache: true,
      ignoreEnvFile: false,
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    SystemModule,
    DashboardModule,
    ProfileModule,
    OperationLogsModule,
    DiscoveryModule,
  ],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: SessionHeartbeatInterceptor,
    // },
    {
      provide: APP_INTERCEPTOR,
      useClass: OperationLogInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: FeatureFlagGuard,
    },
    // 默认拒绝（deny-by-default）：守卫全局挂载，所有路由默认鉴权 + 授权。
    // 匿名路由用 @Public() 显式豁免登录校验。
    // 顺序：认证（Jwt）→ 授权（GuestWrite/Roles/Permissions）
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: GuestWriteGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    Reflector,
  ],
})
export class AppModule {}
