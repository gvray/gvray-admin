import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { OnlineUsersController } from './online-users.controller';
import { OnlineUsersService } from './online-users.service';

@Module({
  imports: [AuthModule],
  controllers: [OnlineUsersController],
  providers: [OnlineUsersService],
})
export class OnlineUsersModule {}
