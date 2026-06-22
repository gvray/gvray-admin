import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { PermissionsScannerService } from './permissions-scanner.service';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule, DiscoveryModule],
  controllers: [PermissionsController],
  providers: [PermissionsService, PermissionsScannerService],
  exports: [PermissionsService, PermissionsScannerService],
})
export class PermissionsModule {}
