import { Module } from '@nestjs/common';
import { RoleTemplatesService } from './role-templates.service';
import { RoleTemplatesController } from './role-templates.controller';

@Module({
  controllers: [RoleTemplatesController],
  providers: [RoleTemplatesService],
  exports: [RoleTemplatesService],
})
export class RoleTemplatesModule {}
