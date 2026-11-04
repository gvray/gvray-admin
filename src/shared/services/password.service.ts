import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
  private readonly rounds: number;

  constructor(private readonly configService: ConfigService) {
    const rounds = this.configService.get<number>('app.bcryptRounds', 12);
    this.rounds = Number.isFinite(rounds) && rounds >= 4 ? rounds : 12;
  }

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.rounds);
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
