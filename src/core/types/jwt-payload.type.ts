export type JwtPayload = {
  sub: string; // userId
  sid: string; // sessionId
  iat: number;
  exp: number;
};
