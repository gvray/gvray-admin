import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { EmptyStringTransformPipe } from './core/pipes/empty-string-transform.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // CORS 配置
  const isDev = configService.get('app.nodeEnv') === 'development';
  const enableCors = isDev || configService.get('cors.enabled');

  if (enableCors) {
    const corsOrigins = configService
      .get<string>('cors.origins')
      ?.split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    app.enableCors({
      origin: isDev ? true : corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Access-Token',
        'Cache-Control',
        'X-Requested-With',
      ],
      maxAge: isDev ? 3600 : 86400, // 24h
    });

    Logger.log('🌐 CORS enabled');

    if (isDev) {
      Logger.log('📍 Allowed origins: *');
    } else {
      Logger.log('📍 Allowed origins: ' + (corsOrigins?.join(', ') || 'none'));
    }
  } else {
    Logger.log('🔒 CORS disabled');
  }

  // 全局管道：先转换空字符串，再进行验证
  app.useGlobalPipes(
    new EmptyStringTransformPipe(),
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // TODO: [Redis] 接入基于 Redis 的分布式限流（如 @nestjs/throttler + Redis store）
  // 当前没有任何接口限流保护，单机内存限流无法在多实例间共享计数。
  // 后续引入 ThrottlerModule 并使用 Redis Store，针对登录、注册、公开接口等做限流。

  // Swagger 配置
  const config = new DocumentBuilder()
    .setTitle('GVRAY Admin 企业级后台管理系统')
    .setDescription(
      '**默认测试账户**\n\n' +
        '| 角色 | 用户名 | 密码 |\n' +
        '|------|--------|------|\n' +
        '| 超级管理员 | `super_admin` | `123456` |\n' +
        '| 管理员 | `admin` | `123456` |\n' +
        '| 游客 | `guest` | `123456` |',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: '输入 Bearer JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      defaultModelExpandDepth: 2,
      defaultModelsExpandDepth: 1,
    },
    customSiteTitle: 'GVRAY Admin API 文档',
  });

  // 启动应用
  const port = configService.get<number>('app.port')!;
  await app.listen(port);
  Logger.log(`🚀 应用启动成功: http://localhost:${port}`);
  Logger.log(`📚 API 文档地址: http://localhost:${port}/api`);
  Logger.log(`🔐 默认管理员账户: admin@example.com / 123456`);
}

bootstrap();
