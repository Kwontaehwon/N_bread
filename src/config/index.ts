import dotenv from "dotenv";

const envFound = dotenv.config();

if (envFound.error) {
  throw new Error(`⚠️  Couldn't find .env file  ⚠️`);
}

export default {
  /**
   * env
   */
  env: process.env.NODE_ENV,
  port: process.env.PORT,

  /**
   * KAKAO
   */
  kakaoId: process.env.KAKAO_ID,
  kakaoAdminKey: process.env.KAKAO_ADMIN_KEY,

  /**
   * NAVER
   */
  naverId: process.env.NAVER_ID,
  naverSecret: process.env.NAVER_SECRET,
  naverAccessKey: process.env.NAVER_ACCESSLEY,
  naverSecretKey: process.env.NAVER_SECRETKEY,
  naverClientId: process.env.NAVER_CLIENT_ID,
  NaverClientSecret: process.env.NAVER_CLIENT_SECRET,

  /**
   * APPLE
   */
  appleClientId: process.env.APPLE_CLIENT_ID,
  appleTeamId: process.env.APPLE_KEY_ID,

  /**
   * S3
   */
  s3AccessKeyID: process.env.S3_ACCESS_KEY_ID,
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY,

  /**
   * JWT
   */
  jwtSecret: process.env.JWT_SECRET,

  /**
   * COOKIE
   */
  cookieSecret: process.env.COOKIE_SECRET,

  /**
   * CSRF
   */
  csrfToken: process.env.CSRF_TOKEN,
};
