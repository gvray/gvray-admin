export type JwtPayload = {
  sub: string; // userId
  sid: string; // sessionId
  username: string;
  nickname: string;
  email?: string | null;
  avatar?: string | null;
  status: string;
  roleKeys: string[]; // IUser.roles[].roleKey 数组，用于守卫判断
  iat: number;
  exp: number;
};
