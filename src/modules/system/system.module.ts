import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { MenuModule } from './menu/menu.module';
import { DepartmentsModule } from './departments/departments.module';
import { PositionsModule } from './positions/positions.module';
import { DictionariesModule } from './dictionaries/dictionaries.module';
import { ConfigsModule } from './configs/configs.module';
import { LoginLogsModule } from './login-logs/login-logs.module';

@Module({
  imports: [
    UsersModule,
    RolesModule,
    PermissionsModule,
    MenuModule,
    DepartmentsModule,
    PositionsModule,
    DictionariesModule,
    ConfigsModule,
    LoginLogsModule,
  ],
  exports: [
    UsersModule,
    RolesModule,
    PermissionsModule,
    MenuModule,
    DepartmentsModule,
    PositionsModule,
    DictionariesModule,
    ConfigsModule,
    LoginLogsModule,
  ],
})
export class SystemModule {}
