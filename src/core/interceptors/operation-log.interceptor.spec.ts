import { maskSensitive } from './operation-log.interceptor';

const FIELDS = [
  'password',
  'oldPassword',
  'newPassword',
  'token',
  'authorization',
  'secret',
  'captcha',
  'email',
  'phone',
  'mobile',
  'idCard',
  'idCardNo',
  'idNumber',
];

describe('maskSensitive', () => {
  it('脱敏密码类字段', () => {
    const out = maskSensitive(
      { username: 'gavin', password: 'p@ss', oldPassword: 'old' },
      FIELDS,
    ) as Record<string, unknown>;
    expect(out.password).toBe('***');
    expect(out.oldPassword).toBe('***');
    expect(out.username).toBe('gavin');
  });

  it('脱敏 PII：email / phone / idCard', () => {
    const out = maskSensitive(
      {
        email: 'a@b.com',
        phone: '13800000000',
        idCard: '11010119900307001X',
        nickname: 'gavin',
      },
      FIELDS,
    ) as Record<string, unknown>;
    expect(out.email).toBe('***');
    expect(out.phone).toBe('***');
    expect(out.idCard).toBe('***');
    expect(out.nickname).toBe('gavin');
  });

  it('字段名大小写不敏感', () => {
    const out = maskSensitive({ Password: 'x', EMAIL: 'y@z.com' }, FIELDS) as Record<
      string,
      unknown
    >;
    expect(out.Password).toBe('***');
    expect(out.EMAIL).toBe('***');
  });

  it('递归脱敏嵌套对象', () => {
    const out = maskSensitive(
      { user: { email: 'a@b.com', name: 'gavin' }, password: 'p' },
      FIELDS,
    ) as { user: Record<string, unknown>; password: unknown };
    expect(out.user.email).toBe('***');
    expect(out.user.name).toBe('gavin');
    expect(out.password).toBe('***');
  });

  it('递归脱敏数组元素', () => {
    const out = maskSensitive(
      [{ email: 'a@b.com' }, { password: 'p' }],
      FIELDS,
    ) as Array<Record<string, unknown>>;
    expect(out[0].email).toBe('***');
    expect(out[1].password).toBe('***');
  });

  it('长字符串被截断', () => {
    const long = 'x'.repeat(2000);
    const out = maskSensitive({ bio: long }, FIELDS) as Record<string, unknown>;
    const bio = out.bio as string;
    expect(bio.length).toBeLessThanOrEqual(2000);
    expect(bio).toContain('[TRUNCATED]');
  });

  it('非对象输入不抛错', () => {
    expect(maskSensitive(null, FIELDS)).toBeNull();
    expect(maskSensitive('text', FIELDS)).toBe('text');
  });
});
