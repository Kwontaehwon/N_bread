import passport from 'passport';
const KakaoStrategy = require('passport-kakao').Strategy;
import config from '../';
import { userRepository } from '../../repository';

const passportKakao = () => {
  passport.use(
    new KakaoStrategy(
      {
        clientID: config.kakaoId,
        callbackURL: '/auth/kakao/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        console.log('kakao profile', profile);
        try {
          const exUser = await userRepository.findUserBySnsId(
            profile.id,
            'kakao',
          );

          console.log('profile.id : ' + profile._json.id);
          console.log('profile.email : ' + profile._json.kakao_account.email);

          if (exUser) {
            await userRepository.updateRefreshToken(null, exUser.id);
            done(null, exUser);
          } else {
            const newUser = await userRepository.createSocialUser(
              profile._json && profile._json.kakao_account.email,
              profile.id,
              null,
              'kakao',
            );
            await userRepository.changeUserNick(
              newUser.id,
              profile.displayName,
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
export { passportKakao };
