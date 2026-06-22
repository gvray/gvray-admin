import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { EmptyStringTransformPipe } from './core/pipes/empty-string-transform.pipe';
import { AuditInterceptor } from './core/interceptors/audit.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS 配置
  const isDev = process.env.NODE_ENV === 'development';
  const enableCors = isDev || process.env.ENABLE_CORS === 'true';

  if (enableCors) {
    const corsOrigins = process.env.CORS_ORIGINS?.split(',')
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

    console.log('🌐 CORS enabled');

    if (isDev) {
      console.log('📍 Allowed origins: *');
    } else {
      console.log('📍 Allowed origins:', corsOrigins);
    }
  } else {
    console.log('🔒 CORS disabled');
  }

  // 全局拦截器：审计拦截器
  app.useGlobalInterceptors(new AuditInterceptor(app.get(Reflector)));

  // 全局管道：先转换空字符串，再进行验证
  app.useGlobalPipes(
    new EmptyStringTransformPipe(),
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger 配置
  const config = new DocumentBuilder()
    .setTitle('NestAdmin 企业级后台管理系统')
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
    customSiteTitle: 'NestAdmin API 文档',
  });

  // 启动应用
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 应用启动成功: http://localhost:${port}`);
  console.log(`📚 API 文档地址: http://localhost:${port}/api`);
  console.log(`🔐 默认管理员账户: admin@example.com / 123456`);
}

bootstrap();
