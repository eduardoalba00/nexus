import * as argon2 from "argon2";
import { SignJWT, jwtVerify } from "jose";
import type { Config } from "../config.js";
import type { TokenPair } from "@migo/shared";

export interface JwtPayload {
  sub: string;
  username: string;
}

export class AuthService {
  private accessSecret: Uint8Array;
  private refreshSecret: Uint8Array;

  constructor(private config: Config) {
    this.accessSecret = new TextEncoder().encode(config.jwtAccessSecret);
    this.refreshSecret = new TextEncoder().encode(config.jwtRefreshSecret);
  }

  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password);
  }

  async verifyPassword(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }

  async generateTokenPair(userId: string, username: string): Promise<TokenPair> {
    const accessToken = await new SignJWT({ sub: userId, username })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(this.config.accessTokenExpiry)
      .sign(this.accessSecret);

    const refreshToken = await new SignJWT({ sub: userId, username })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(this.config.refreshTokenExpiry)
      .sign(this.refreshSecret);

    return { accessToken, refreshToken };
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    const { payload } = await jwtVerify(token, this.accessSecret);
    return payload as unknown as JwtPayload;
  }

  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    const { payload } = await jwtVerify(token, this.refreshSecret);
    return payload as unknown as JwtPayload;
  }
}
