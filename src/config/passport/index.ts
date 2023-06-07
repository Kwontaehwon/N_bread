import passport from 'passport';
import { passportLocal } from './localStrategy';
import { passportKakao } from './kakaoStrategy';
import { passportApple } from './appleStrategy';

import { userRepository } from '../../repository';

const passportIndex = () => {
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    await userRepository
      .findUserById(+id)
      .then((user) => done(null, user))
      .catch((error) => done(error));
  });

  passportLocal();
  passportKakao();
  passportApple();
};
export { passportIndex };
