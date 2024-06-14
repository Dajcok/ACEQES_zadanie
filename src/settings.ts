import { MissingConfigError } from "./errors/general.errors";
import dotEnv from "dotenv";

dotEnv.config();

if (!process.env.SECRET_KEY) {
  throw new MissingConfigError("SECRET_KEY is not set");
}

interface Config {
  PORT: number;
  SECRET_KEY: string;
  PASSWORD_SALT_ROUNDS: number;
  JWT_COOKIE_NAME: string;
  JWT_COOKIE_SAME_SITE: "strict" | "lax" | "none";
  JWT_COOKIE_SECURE: boolean;
  JWT_COOKIE_HTTP_ONLY: boolean;
  JWT_COOKIE_EXPIRY_HOURS: number;
  JWT_TOKEN_EXPIRY: string;
  TEST_USER_NAME: string;
  TEST_USER_PASSWORD: string;
}

export default {
  PORT: 3000,
  SECRET_KEY: process.env.SECRET_KEY,
  PASSWORD_SALT_ROUNDS: 10,
  JWT_COOKIE_NAME: "jwt_access_token",
  JWT_COOKIE_SAME_SITE: "none",
  JWT_COOKIE_SECURE: process.env.NODE_ENV === "production",
  JWT_COOKIE_HTTP_ONLY: true,
  JWT_COOKIE_EXPIRY_HOURS: 1,
  JWT_TOKEN_EXPIRY: "1h",
  TEST_USER_NAME: "TestUser123",
  TEST_USER_PASSWORD: "StrongPWD1",
} as Config;
