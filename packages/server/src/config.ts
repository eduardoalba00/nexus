import crypto from "node:crypto";

export interface Config {
  port: number;
  host: string;
  databasePath: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
  rtcMinPort: number;
  rtcMaxPort: number;
  rtcAnnouncedIp: string | undefined;
}

export function loadConfig(): Config {
  return {
    port: parseInt(process.env.PORT || "8080", 10),
    host: process.env.HOST || "0.0.0.0",
    databasePath: process.env.DATABASE_PATH || "./nexus.db",
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET || crypto.randomBytes(32).toString("hex"),
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || crypto.randomBytes(32).toString("hex"),
    accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || "15m",
    refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || "7d",
    rtcMinPort: parseInt(process.env.RTC_MIN_PORT || "10000", 10),
    rtcMaxPort: parseInt(process.env.RTC_MAX_PORT || "10100", 10),
    rtcAnnouncedIp: process.env.RTC_ANNOUNCED_IP || undefined,
  };
}
