// import dotenv from "dotenv";
const dotenv = require('dotenv');

const envFound = dotenv.config();

if (envFound.error) {
  throw new Error(`⚠️  Couldn't find .env file  ⚠️`);
}
const env = process.env.NODE_ENV;
const port = process.env.PORT as string;

/**
 * KAKAO
 */
const kakaoId = process.env.KAKAO_ID;
const kakaoAdminKey = process.env.KAKAO_ADMIN_KEY;

/**
 * NAVER
 */
const naverId = process.env.NAVER_ID;
const naverSecret = process.env.NAVER_SECRET;
const naverAccessKey = process.env.NAVER_ACCESSLEY;
const naverSecretKey = process.env.NAVER_SECRETKEY;
const naverClientId = process.env.NAVER_CLIENT_ID;
const NaverClientSecret = process.env.NAVER_CLIENT_SECRET;

/**
 * APPLE
 */
const appleClientId = process.env.APPLE_CLIENT_ID as string;
const appleTeamId = process.env.APPLE_TEAM_ID;
const appleKeyId = process.env.APPLE_KEY_ID;

/**
 * S3
 */
const s3AccessKeyID = process.env.S3_ACCESS_KEY_ID;
const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

/**
 * JWT
 */
const jwtSecret = process.env.JWT_SECRET;

/**
 * COOKIE
 */
const cookieSecret = process.env.COOKIE_SECRET;

/**
 * CSRF
 */
const csrfToken = process.env.CSRF_TOKEN;

export {
  env,
  port,
  kakaoId,
  kakaoAdminKey,
  naverId,
  naverSecret,
  naverAccessKey,
  naverSecretKey,
  naverClientId,
  NaverClientSecret,
  appleClientId,
  appleTeamId,
  appleKeyId,
  s3AccessKeyID,
  s3SecretAccessKey,
  jwtSecret,
  cookieSecret,
  csrfToken,
};
