import passport from 'passport';
import { Strategy as NaverStrategy } from 'passport-naver-v2';
import config from '../';
import { userRepository } from '../../repository';
const passportNaver = () => {
  passport.use(
    new NaverStrategy(
      {
        clientID: config.naverId,
        clientSecret: config.naverSecret,
        callbackURL: '/auth/naver/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        console.log('naver profile : ', profile);
        try {
          const exUser = await userRepository.findUserBySnsId(
            profile.id,
            'naver',
          );

          // 이미 가입된 네이버 프로필이면 성공
          if (exUser) {
            console.log('이미 가입된 유저입니다.');
            await userRepository.saveRefresh(exUser.id, refreshToken);
            done(null, exUser);
          } else {
            // 가입되지 않는 유저면 회원가입 시키고 로그인을 시킨다
            const newUser = await userRepository.createSocialUser(
              profile.email,
              profile.id,
              refreshToken,
              'naver',
            );
            done(null, newUser);
          }
        } catch (error) {
          console.error(error);
          done(error);
        }
      },
    ),
  );
};
export { passportNaver };
