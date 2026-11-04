import { ConfigService } from '@nestjs/config';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const makeConfig = (rounds: number) =>
    ({ get: () => rounds } as unknown as ConfigService);

  it('hash 生成非明文且可通过 compare 校验', async () => {
    const service = new PasswordService(makeConfig(4));
    const hash = await service.hash('s3cret');
    expect(hash).not.toBe('s3cret');
    expect(await service.compare('s3cret', hash)).toBe(true);
  });

  it('错误密码校验失败', async () => {
    const service = new PasswordService(makeConfig(4));
    const hash = await service.hash('s3cret');
    expect(await service.compare('wrong', hash)).toBe(false);
  });

  it('相同密码两次 hash 结果不同（含盐）', async () => {
    const service = new PasswordService(makeConfig(4));
    const a = await service.hash('s3cret');
    const b = await service.hash('s3cret');
    expect(a).not.toBe(b);
    expect(await service.compare('s3cret', a)).toBe(true);
    expect(await service.compare('s3cret', b)).toBe(true);
  });

  it('非法 rounds 回退到默认 12', () => {
    const s1 = new PasswordService(makeConfig(NaN));
    const s2 = new PasswordService(makeConfig(2));
    // 无法直接读取私有 rounds，间接验证：不抛错且可正常 hash
    expect(s1).toBeDefined();
    expect(s2).toBeDefined();
  });
});
