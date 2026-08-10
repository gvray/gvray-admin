export type JwtPayload = {
  sub: string; // userId
  jti: string; // token unique id，用于登出时定位 RT
  username: string;
  nickname: string;
  email?: string | null;
  avatar?: string | null;
  status: string;
  roleKeys: string[]; // IUser.roles[].roleKey 数组，用于守卫判断
  iat: number;
  exp: number;
};
