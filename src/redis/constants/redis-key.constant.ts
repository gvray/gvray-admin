/** Redis key 前缀由 RedisService 统一拼接，常量中不再硬编码 */
export const REDIS_KEY_PREFIX = '';

export const RedisKeys = {
  auth: {
    refreshToken: (userId: string, tokenHash: string) =>
      `auth:refresh:${userId}:${tokenHash}`,
    session: (userId: string, tokenHash: string) =>
      `auth:session:${userId}:${tokenHash}`,
    sessionsSet: (userId: string) => `auth:sessions:${userId}`,
    blacklist: (jti: string) => `auth:blacklist:${jti}`,
    kickout: (userId: string) => `auth:kickout:${userId}`,
    loginFail: (account: string) => `auth:login:fail:${account}`,
    atJtiMap: (jti: string) => `auth:at-jti:${jti}`, // AT jti → userId:tokenHash
  },
  // 预留：后续 configs/dicts 等场景复用
  system: {
    config: 'sys:config:runtime',
    feature: (key: string) => `sys:feature:${key}`,
    dict: (typeCode: string) => `sys:dict:${typeCode}`,
  },
} as const;
